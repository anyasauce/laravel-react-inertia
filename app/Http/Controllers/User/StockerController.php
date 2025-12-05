<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\StockLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; 

class StockerController extends Controller
{
    /**
     * Helper to get the total quantity and unique items stocked by the current user.
     */
    protected function getUserStockSummary()
    {
        $userId = Auth::id();
        
        $summary = StockLog::where('user_id', $userId)
            ->where('type', 'in') 
            ->select(
                DB::raw('COUNT(DISTINCT inventory_id) as unique_items_stocked'),
                DB::raw('SUM(quantity_adjusted) as total_quantity_stocked')
            )
            ->first();
            
        return [
            'uniqueItems' => $summary->unique_items_stocked ?? 0,
            'totalQuantity' => $summary->total_quantity_stocked ?? 0,
        ];
    }
    
    /**
     * Renders the Stocker Dashboard (Stocker.jsx).
     */
    public function index()
    {
        return Inertia::render('Dashboard/User/Stocker', [
            'initialItems' => $this->getData(),
            'userStockSummary' => $this->getUserStockSummary(),
        ]);
    }

    /**
     * API endpoint for fetching inventory data (used for live sync).
     */
    public function json()
    {
        return response()->json([
            'items' => $this->getData(),
            'userStockSummary' => $this->getUserStockSummary(),
        ]);
    }

    /**
     * Helper to get the latest stock history log (who, when) for each item.
     */
    protected function getLatestStockLog()
    {
        $latestLogs = StockLog::select('stock_logs.*')
            ->join(DB::raw('(SELECT inventory_id, MAX(id) as max_id FROM stock_logs GROUP BY inventory_id) as latest'), function($join) {
                $join->on('stock_logs.id', '=', 'latest.max_id');
            })
            ->with('user:id,name') 
            ->get()
            ->keyBy('inventory_id');

        return $latestLogs;
    }

    /**
     * Helper to get inventory data needed for the stocker, including last stock info.
     */
    protected function getData()
    {
        $latestLogs = $this->getLatestStockLog(); 
        
        return Inventory::with('product:id,name,sku,barcode') 
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($inventory) use ($latestLogs) {
                $lastLog = $latestLogs->get($inventory->id); 

                return [
                    'id' => $inventory->id,
                    'quantity' => $inventory->quantity,
                    'reorder_level' => $inventory->reorder_level,
                    'product' => $inventory->product,
                    
                    'is_low' => $inventory->quantity <= $inventory->reorder_level && $inventory->quantity > 0,
                    'is_out' => $inventory->quantity === 0,
                    
                    'last_stocked_by' => $lastLog?->user?->name ?? 'N/A',
                    'last_stocked_at' => $lastLog?->created_at?->diffForHumans() ?? 'N/A',
                ];
            });
    }

    /**
     * Handles the 'Stock In' action by increasing the quantity and logging the action.
     */
    public function stockIn(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);

        $request->validate([
            'quantity_added' => 'required|integer|min:1', 
        ]);

        $quantityAdjusted = (int)$request->quantity_added;
        $newQuantity = $inventory->quantity + $quantityAdjusted;

        $inventory->update([
            'quantity' => $newQuantity
        ]);
        
        StockLog::create([
            'inventory_id' => $inventory->id,
            'user_id' => Auth::id(), 
            'quantity_adjusted' => $quantityAdjusted,
            'new_quantity' => $newQuantity,
            'type' => 'in',
        ]); 

        return back()->with('success', 'Stock added successfully! New quantity: ' . $newQuantity);
    }
}