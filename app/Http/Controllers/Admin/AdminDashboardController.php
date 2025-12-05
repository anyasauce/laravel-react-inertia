<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Transaction; 
use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache; // Added Cache for optimization

class AdminDashboardController extends Controller
{
    // --- INERTIA RENDER METHODS ---

    public function index()
    {
        // 1. Main Dashboard: Fetch KPIs only (no graph data, flag set to false)
        return Inertia::render('Dashboard/Admin/Dashboard', [
            'initialMetrics' => $this->getMetrics('Month', null, false), 
        ]);
    }

    public function graphsIndex()
    {
        // 2. Graphs Page: Fetch graph data only (flag set to true)
        $data = $this->getMetrics('Month', null, true); 
        
        // Render the Graphs component
        return Inertia::render('Dashboard/Admin/Analytics', [
            'initialGraphData' => $data['graphData']
        ]);
    }

    // --- JSON API METHODS ---

    public function jsonMetrics(Request $request)
    {
        $timeframe = $request->get('timeframe', 'Month');
        $month = $request->get('month'); 
        
        // 3. Dashboard API: Returns KPIs only
        return response()->json($this->getMetrics($timeframe, $month, false)); 
    }
    
    public function jsonGraphMetrics(Request $request)
    {
        $timeframe = $request->get('timeframe', 'Month');
        $month = $request->get('month'); 
        
        // 4. Graphs API: Returns graphData only
        return response()->json($this->getMetrics($timeframe, $month, true)['graphData']); 
    }

    // --- UTILITY METHODS ---

    protected function calculateTimeframeDates($timeframe, $month = null)
    {
        $now = Carbon::now(); 
        $current_start = clone $now;
        $previous_start = clone $now;
        $description = "Compared to last period";

        switch ($timeframe) {
            case 'Day':
                $current_start->startOfDay();
                $previous_start->subDay()->startOfDay();
                $description = "Compared to yesterday";
                break;
            case 'Week':
                $current_start->startOfWeek(Carbon::MONDAY); 
                $previous_start->subWeek()->startOfWeek(Carbon::MONDAY);
                $description = "Compared to last week";
                break;
            case 'Year':
                $current_start->startOfYear();
                $previous_start->subYear()->startOfYear();
                $description = "Compared to last year";
                break;
            case 'Month':
            default:
                if ($month) {
                    try {
                        $current_start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
                        $previous_start = clone $current_start;
                        $previous_start->subMonth()->startOfMonth();
                        $description = "Compared to " . $previous_start->format('M Y');
                    } catch (\Exception $e) {
                        $current_start->startOfMonth();
                        $previous_start->subMonth()->startOfMonth();
                    }
                } else {
                    $current_start->startOfMonth();
                    $previous_start->subMonth()->startOfMonth();
                }
                if (!isset($description) || $description === "Compared to last period") {
                    $description = "Compared to last month";
                }
                break;
        }
        
        $current_end = ($timeframe === 'Month' && !$month) 
                        ? (clone $now)->endOfMonth() 
                        : (clone $current_start)->endOfDay(); // Simplified end logic

        // If we are looking at a past month/year, set end to the end of that period
        if ($month) {
            $current_end = (clone $current_start)->endOfMonth();
        }
        
        return [$current_start, $previous_start, $description, $current_end];
    }
    
    public function getMetrics($timeframe = 'Month', $month = null, $onlyGraphData = false) 
    {
        $now = Carbon::now(); 

        list($current_start, $previous_start, $revenueDescription, $current_end) = $this->calculateTimeframeDates($timeframe, $month);
        
        // --- KPI CALCULATIONS ---
        // ... (KPI logic remains the same)
        
        $currentRevenue = 0;
        $revenueChange = 0;
        $targetMultiplier = 0;
        $totalEmployees = 0;
        $newEmployees = 0;
        $totalProducts = 0;
        $lowStockItems = 0;
        $outOfStock = 0;
        $recentTransactions = collect();

        if (!$onlyGraphData) {
            $currentRevenue = Transaction::where('created_at', '>=', $current_start)->sum('total');
            
            $lastRevenue = Transaction::where('created_at', '>=', $previous_start)
                ->where('created_at', '<', $current_start)
                ->sum('total');
            
            $revenueChange = $lastRevenue > 0 
                ? (($currentRevenue - $lastRevenue) / $lastRevenue) * 100
                : ($currentRevenue > 0 ? 100 : 0);
            
            $targetSettings = Setting::pluck('value', 'key')->toArray();

            switch ($timeframe) {
                case 'Day': $targetMultiplier = $targetSettings['target_daily_sales'] ?? 1500; break;
                case 'Week': $targetMultiplier = $targetSettings['target_weekly_sales'] ?? 10000; break;
                case 'Year': $targetMultiplier = $targetSettings['target_yearly_sales'] ?? 120000; break;
                case 'Month': default: $targetMultiplier = $targetSettings['target_monthly_sales'] ?? 50000; break;
            }
            
            $totalEmployees = User::where('role', 'user')->count();
            $newEmployees = User::where('role', 'user')->where('created_at', '>=', $current_start)->count();

            $inventory = Inventory::with('product')->get();
            $totalProducts = Product::count();
            $lowStockItems = $inventory->filter(fn($i) => $i->quantity <= $i->reorder_level && $i->quantity > 0)->count();
            $outOfStock = $inventory->filter(fn($i) => $i->quantity === 0)->count();
            
            $recentTransactions = Transaction::where('created_at', '>=', $current_start)
                ->latest()
                ->take(8)
                ->get()
                ->map(fn($t) => [
                    'id' => $t->id,
                    'description' => 'Sale Transaction #' . $t->id,
                    'amount' => $t->total,
                    'time' => $t->created_at->diffForHumans(),
                ]);
        }
        
        // ------------------------------------------
        // GRAPH DATA GENERATION
        // ------------------------------------------
        
        $graphData = [
            'dailySales' => [],
            'monthlyRevenue' => [], 
            'categorySales' => [], 
        ];

        if ($onlyGraphData) { 
            // Ensure currentRevenue is calculated if we are only fetching graph data
            if ($currentRevenue === 0) {
                 $currentRevenue = Transaction::where('created_at', '>=', $current_start)->sum('total');
            }

            // 1. Daily Sales 
            if ($timeframe === 'Month' || $timeframe === 'Week' || $timeframe === 'Day') {
                $dailySalesQuery = Transaction::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as revenue')
                )
                ->where('created_at', '>=', $current_start)
                ->where('created_at', '<=', $current_end)
                ->groupBy('date')
                ->orderBy('date')
                ->get();
                
                $start = clone $current_start;
                $end = ($timeframe === 'Month' && !$month) ? (clone $now) : $current_end; 
                if ($end->gt($now)) $end = $now;
                
                $dailyData = [];
                while ($start->lte($end)) {
                    $dateString = $start->toDateString();
                    $record = $dailySalesQuery->firstWhere('date', $dateString);
                    
                    $dailyData[] = [
                        'day' => $start->format('d'), 
                        'revenue' => (float)($record->revenue ?? 0),
                    ];
                    $start->addDay();
                }
                $graphData['dailySales'] = $dailyData;
            }

            $graphData['categorySales'] = Cache::remember("top_products_{$timeframe}_{$current_start->toDateString()}", 3600, function() use ($current_start, $current_end) {
                $topProductsQuery = DB::table('transactions')
                    ->join('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
                    ->join('products', 'transaction_items.product_id', '=', 'products.id')
                    ->select('products.name as name', DB::raw('SUM(transaction_items.quantity * transaction_items.price) as value'))
                    ->where('transactions.created_at', '>=', $current_start)
                    ->where('transactions.created_at', '<=', $current_end)
                    ->groupBy('products.name')
                    ->orderBy('value', 'desc')
                    ->limit(5)
                    ->get();
                    
                return $topProductsQuery->map(fn($p) => [
                    'name' => $p->name, 
                    'value' => (float)$p->value
                ])->toArray();
            });


            // 3. Monthly Revenue (Last 12 months) (Cached for 1 hour)
            $graphData['monthlyRevenue'] = Cache::remember('monthly_revenue_12m', 3600, function() use ($now) {
                $monthlyData = [];
                $start_of_year = (clone $now)->subYear()->startOfMonth();
                
                $monthlyRevenueQuery = Transaction::select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month_num'),
                    DB::raw('SUM(total) as revenue')
                )
                ->where('created_at', '>=', $start_of_year)
                ->groupBy('year', 'month_num')
                ->orderBy('year')
                ->orderBy('month_num')
                ->get();
                
                for ($i = 0; $i < 12; $i++) {
                    $date = (clone $start_of_year)->addMonths($i);
                    $year = $date->year;
                    $month_num = $date->month;
                    $month_name = $date->format('M Y');
                    
                    $record = $monthlyRevenueQuery->firstWhere(fn($r) => $r->year == $year && $r->month_num == $month_num);
                    
                    $monthlyData[] = [
                        'month' => $month_name,
                        'revenue' => (float)($record->revenue ?? 0),
                    ];
                }
                return $monthlyData;
            });
        }

        // --- FINAL RETURN ---

        if ($onlyGraphData) {
            return ['graphData' => $graphData];
        }

        return [
            'totalRevenue' => $currentRevenue,
            'revenueChange' => round($revenueChange, 2),
            'revenueDescription' => $revenueDescription,
            
            'totalEmployees' => $totalEmployees,
            'newEmployees' => $newEmployees,

            'totalProducts' => $totalProducts,
            'lowStockItems' => $lowStockItems,
            'outOfStock' => $outOfStock,
            
            'recentTransactions' => $recentTransactions,
            
            'salesData' => [
                'target' => (int)$targetMultiplier, 
                'current' => $currentRevenue,
            ],
        ];
    }
}