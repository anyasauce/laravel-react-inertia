<?php

namespace App\Http\Controllers\User;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Setting;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class UserDashboardController extends Controller
{
    // --- Dashboard Methods ---
    
    public function index()
    {
        return Inertia::render('Dashboard/User/Dashboard', [
            'initialMetrics' => $this->getMetrics('Day', null), 
        ]);
    }

    public function jsonMetrics(Request $request)
    {
        $timeframe = $request->get('timeframe', 'Day');
        $month = $request->get('month'); 
        
        return response()->json($this->getMetrics($timeframe, $month)); 
    }

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

        return [$current_start, $previous_start, $description];
    }


    protected function getMetrics($timeframe = 'Day', $month = null)
    {
        $cashierId = Auth::id();
        
        list($current_start, $previous_start, $revenueDescription) = $this->calculateTimeframeDates($timeframe, $month);
        
        $currentRevenue = Transaction::where('cashier_id', $cashierId)
            ->where('created_at', '>=', $current_start)
            ->sum('total');
        
        $lastRevenue = Transaction::where('cashier_id', $cashierId)
            ->where('created_at', '>=', $previous_start)
            ->where('created_at', '<', $current_start)
            ->sum('total');
        
        $revenueChange = $lastRevenue > 0 
            ? (($currentRevenue - $lastRevenue) / $lastRevenue) * 100
            : ($currentRevenue > 0 ? 100 : 0);
        
        $targetSettings = Setting::pluck('value', 'key')->toArray();

        $targetMultiplier = 1; 
        switch ($timeframe) {
            case 'Day':
                $targetMultiplier = $targetSettings['target_daily_sales'] ?? 1500;
                break;
            case 'Week':
                $targetMultiplier = $targetSettings['target_weekly_sales'] ?? 10000;
                break;
            case 'Year':
                $targetMultiplier = $targetSettings['target_yearly_sales'] ?? 120000;
                break;
            case 'Month':
            default:
                $targetMultiplier = $targetSettings['target_monthly_sales'] ?? 50000;
                break;
        }
        
        $recentTransactions = Transaction::where('cashier_id', $cashierId)
            ->where('created_at', '>=', $current_start)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'description' => 'Sale Transaction #' . $t->id,
                'amount' => $t->total,
                'time' => $t->created_at->diffForHumans(),
            ]);

        return [
            'totalRevenue' => $currentRevenue,
            'revenueChange' => round($revenueChange, 2),
            'revenueDescription' => $revenueDescription,
            'recentTransactions' => $recentTransactions,
            'salesData' => [
                'target' => (int)$targetMultiplier, 
                'current' => $currentRevenue,
            ]
        ];
    }

    // --- Daily Report Method ---
    
    public function dailyReport(Request $request)
    {
        $cashierId = Auth::id();
        
        $dateString = $request->get('date', Carbon::now()->toDateString());
        
        try {
            $reportDate = Carbon::parse($dateString)->startOfDay();
        } catch (\Exception $e) {
            $reportDate = Carbon::now()->startOfDay();
        }

        $nextDate = (clone $reportDate)->addDay();

        // 1. Current Day's Summary
        $salesSummary = Transaction::select(
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total) as total_sales')
            )
            ->where('cashier_id', $cashierId)
            ->where('created_at', '>=', $reportDate)
            ->where('created_at', '<', $nextDate)
            ->first();

        // 2. List of Transactions (with Eager Loading and Defensive check)
        $transactions = Transaction::with('items') 
            ->where('cashier_id', $cashierId)
            ->where('created_at', '>=', $reportDate)
            ->where('created_at', '<', $nextDate)
            ->latest()
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'amount' => $t->total,
                // FINAL DEFENSE: Check against null/missing relationship before counting.
                'products_count' => $t->items ? $t->items->count() : 0, 
                'time' => $t->created_at->format('h:i A'),
            ]);

        // 3. Previous Day Comparison
        $previousDate = (clone $reportDate)->subDay();
        $previousNextDate = (clone $previousDate)->addDay();
        
        $previousSales = Transaction::where('cashier_id', $cashierId)
            ->where('created_at', '>=', $previousDate)
            ->where('created_at', '<', $previousNextDate)
            ->sum('total');

        // DEFENSIVE SUMMARY ASSIGNMENT
        $totalSales = $salesSummary ? (float)($salesSummary->total_sales ?? 0) : 0;
        $totalTransactions = $salesSummary ? (int)($salesSummary->total_transactions ?? 0) : 0;
        
        // FIX for Undefined variable $revenueChange
        $revenueChange = 0.0; 
        
        if ($previousSales > 0) {
            $revenueChange = (($totalSales - $previousSales) / $previousSales) * 100;
        } elseif ($totalSales > 0) {
            $revenueChange = 100.0;
        }
            
        // 4. Fetch Daily Target
        $targetSettings = Setting::pluck('value', 'key')->toArray();
        $dailyTarget = $targetSettings['target_daily_sales'] ?? 1500;

        return Inertia::render('Dashboard/User/DailyReport', [
            'reportData' => [
                'date' => $reportDate->format('Y-m-d'),
                'dateFormatted' => $reportDate->format('F d, Y'),
                'totalSales' => round($totalSales, 2),
                'totalTransactions' => $totalTransactions, 
                'revenueChange' => round($revenueChange, 2),
                'dailyTarget' => (int)$dailyTarget,
                'transactions' => $transactions,
            ]
        ]);
    }
}