<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Admin/Inventory', [
            'items' => $this->getData(),
        ]);
    }

    public function json()
    {
        return response()->json([
            'items' => $this->getData(),
        ]);
    }

    protected function getData()
    {
        return Inventory::with('product')
            ->orderBy('id', 'desc')
            ->get();
    }

    // Create new inventory item
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer',
            'reorder_level' => 'nullable|integer',
        ]);

        Inventory::create([
            'product_id' => $request->product_id,
            'quantity' => $request->quantity,
            'reorder_level' => $request->reorder_level,
        ]);

        return back()->with('success', 'Inventory added successfully!');
    }

    // Update inventory item
    public function update(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);

        $request->validate([
            'quantity' => 'required|integer',
            'reorder_level' => 'nullable|integer',
            'price' => 'nullable|numeric',
        ]);

        $inventory->update($request->only('quantity', 'reorder_level'));

        if ($request->price !== null) {
            $inventory->product->update(['price' => $request->price]);
        }

        return back()->with('success', 'Inventory updated successfully!');
    }

    // Delete inventory item
    public function destroy($id)
    {
        $inventory = Inventory::findOrFail($id);
        $inventory->delete();

        return back()->with('success', 'Inventory deleted successfully!');
    }
}
