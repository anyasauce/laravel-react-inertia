<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
// 💡 NEW: Import necessary classes for Laravel Excel
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesReportsExport; 
use App\Exports\StockerReportsExport; 

use App\Models\Transaction;
use App\Models\StockLog;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Render the main Reports page.
     * 💡 THIS IS THE MISSING METHOD YOU NEEDED TO RESTORE.
     */
    public function index()
    {
        // Default to 'Month' timeframe for initial load
        $timeframe = 'Month';
        return Inertia::render('Dashboard/Admin/Reports', [
            'initialReports' => [
                'sales' => $this->getEmployeeSalesReports($timeframe),
                'stock' => $this->getStockerReports($timeframe), 
            ],
        ]);
    }

    /**
     * API endpoint to fetch reports based on timeframe.
     */
    public function jsonReports(Request $request)
    {
        $timeframe = $request->get('timeframe', 'Month');
        
        // Return both report types
        return response()->json([
            'sales' => $this->getEmployeeSalesReports($timeframe),
            'stock' => $this->getStockerReports($timeframe),
        ]);
    }
    
     private function resolveStartDate(string $timeframe)
    {
        $now = Carbon::now();

        return match(strtolower($timeframe)) {
            'day' => $now->copy()->startOfDay(),
            'week' => $now->copy()->startOfWeek(),
            'month' => $now->copy()->startOfMonth(),
            'year' => $now->copy()->startOfYear(),
            default => $now->copy()->startOfMonth(),
        };
    }
    // 💡 NEW: Export endpoint to download the report as Excel
   // --- Export report to Excel
    public function exportReport(Request $request, $reportType)
    {
        $timeframe = $request->query('timeframe', 'Month'); // fallback to Month
        $startDate = $this->resolveStartDate($timeframe);
        $endDate = Carbon::now();

        if ($reportType === 'sales') {
           $salesData = Transaction::with('user') // eager load user
    ->whereBetween('created_at', [$startDate, $endDate])
    ->get()
    ->groupBy('user_id')
    ->map(function($transactions, $userId) {
        $user = $transactions->first()->user;
        
        // Skip if no user
        if (!$user) {
            return null;
        }

        return [
            'rank' => 0, // temp, will assign after sorting
            'name' => $user->name,
            'email' => $user->email,
            'sales' => $transactions->sum('total_amount'),
            'transactions' => $transactions->count(),
        ];
    })
    ->filter() // remove null entries
    ->sortByDesc('sales')
    ->values()
    ->map(function($item, $index) {
        $item['rank'] = $index + 1;
        return $item;
    });


            return Excel::download(new SalesReportsExport(collect($salesData), $timeframe), "sales_report_{$timeframe}.xlsx");
        }

        if ($reportType === 'stock') {
            // Fetch stock logs filtered by timeframe
            $stockData = StockLog::with('user')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->groupBy('user_id')
                ->map(function($logs, $userId) {
                    $user = $logs->first()->user;
                    return [
                        'rank' => 0,
                        'name' => $user->name,
                        'email' => $user->email,
                        'quantity_stocked' => $logs->sum('quantity'),
                        'items_stocked' => $logs->groupBy('item_id')->count(),
                    ];
                })
                ->sortByDesc('quantity_stocked')
                ->values()
                ->map(function($item, $index) {
                    $item['rank'] = $index + 1;
                    return $item;
                });

            return Excel::download(new StockerReportsExport(collect($stockData), $timeframe), "stock_report_{$timeframe}.xlsx");
        }

        return back()->with('error', 'Invalid report type.');
    }


    /**
     * Core logic to fetch and calculate employee SALES reports.
     */
    protected function getEmployeeSalesReports($timeframe)
    {
        // 1. Calculate Timeframe Dates
        list($current_start, $description) = $this->calculateTimeframeDates($timeframe);

        // 2. Fetch Aggregated Transactions
        $employeeSales = Transaction::select(
                DB::raw('cashier_id as user_id'),
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total) as total_sales')
            )
            ->where('created_at', '>=', $current_start)
            ->groupBy('cashier_id')
            ->orderBy('total_sales', 'desc')
            ->get();

        // 3. Get Employee Details (only for those who have sales)
        $userIds = $employeeSales->pluck('user_id')->filter()->unique()->toArray();
        $employees = User::whereIn('id', $userIds)
                         ->select('id', 'name', 'email')
                         ->get()
                         ->keyBy('id');

        // 4. Map and Combine Data
        $rankedReports = $employeeSales->map(function ($sale) use ($employees) {
            $user = $employees->get($sale->user_id);
            $name = $user ? $user->name : 'Unknown Cashier';
            $email = $user ? $user->email : '';

            return [
                'rank' => 0, 
                'name' => $name,
                'email' => $email,
                'sales' => round($sale->total_sales, 2),
                'transactions' => $sale->total_transactions,
            ];
        })->sortByDesc('sales')->values(); 

        // 5. Assign Rank
        $rankedReports = $rankedReports->map(function ($report, $index) {
            $report['rank'] = $index + 1;
            return $report;
        });
        
        // 6. Calculate Top Level Summary
        $totalSales = $rankedReports->sum('sales');
        $totalTransactions = $rankedReports->sum('transactions');

        return [
            'timeframe' => $timeframe,
            'description' => $description,
            'summary' => [
                'totalSales' => $totalSales,
                'totalEmployees' => $rankedReports->count(),
                'totalTransactions' => $totalTransactions,
            ],
            'employeeRankings' => $rankedReports,
        ];
    }
    
    // --- CORRECTED CORE LOGIC FOR STOCKER REPORTS ---
    
    protected function getStockerReports($timeframe)
    {
        // 1. Calculate Timeframe Dates
        list($current_start, $description) = $this->calculateTimeframeDates($timeframe);

        // 2. Fetch Aggregated Stock Logs
        $stockerPerformance = StockLog::select(
                'user_id',
                // Count unique items stocked
                DB::raw('COUNT(DISTINCT inventory_id) as total_items_stocked'), 
                // CRITICAL FIX: Use COALESCE to ensure SUM returns 0, not NULL, when no logs exist.
                DB::raw('COALESCE(SUM(quantity_adjusted), 0) as total_quantity_stocked')     
            )
            ->where('created_at', '>=', $current_start)
            ->where('type', 'in') // Only count stock IN movements
            ->groupBy('user_id')
            ->orderBy('total_quantity_stocked', 'desc') // Rank by total units stocked
            ->get();

        // 3. Get Employee Details (only for those who have stocked items)
        $userIds = $stockerPerformance->pluck('user_id')->filter()->unique()->toArray();
        $employees = User::whereIn('id', $userIds)
                         ->select('id', 'name', 'email')
                         ->get()
                         ->keyBy('id');

        // 4. Map and Combine Data
        $rankedReports = $stockerPerformance->map(function ($performance) use ($employees) {
            $user = $employees->get($performance->user_id);
            $name = $user ? $user->name : 'Unknown Stocker';
            $email = $user ? $user->email : '';

            return [
                'rank' => 0, 
                'name' => $name,
                'email' => $email,
                // Ensure explicit casting to integer
                'items_stocked' => (int)$performance->total_items_stocked, 
                'quantity_stocked' => (int)$performance->total_quantity_stocked, // Cast is safe due to COALESCE
            ];
        })->sortByDesc('quantity_stocked')->values(); 

        // 5. Assign Rank
        $rankedReports = $rankedReports->map(function ($report, $index) {
            $report['rank'] = $index + 1;
            return $report;
        });
        
        // 6. Calculate Top Level Summary
        $totalQuantity = $rankedReports->sum('quantity_stocked');
        $totalItems = $rankedReports->sum('items_stocked');

        return [
            'timeframe' => $timeframe,
            'description' => $description,
            'summary' => [
                'totalQuantity' => $totalQuantity,
                'totalStockers' => $rankedReports->count(),
                'totalItems' => $totalItems,
            ],
            'stockerRankings' => $rankedReports,
        ];
    }

    /**
     * Helper to determine Carbon start date based on timeframe.
     */
    protected function calculateTimeframeDates($timeframe)
    {
        $current_start = Carbon::now();
        $description = "This " . strtolower($timeframe);

        switch ($timeframe) {
            case 'Day':
                $current_start->startOfDay();
                break;
            case 'Week':
                $current_start->startOfWeek(Carbon::MONDAY);
                break;
            case 'Year':
                $current_start->startOfYear();
                break;
            case 'Month':
            default:
                $current_start->startOfMonth();
                break;
        }

        return [$current_start, $description];
    }
}