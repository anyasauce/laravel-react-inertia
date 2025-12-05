<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    // Define the keys we expect for targets
    const TARGET_KEYS = [
        'target_daily_sales',
        'target_weekly_sales',
        'target_monthly_sales',
        'target_yearly_sales',
    ];

    /**
     * Renders the Settings page and passes the current targets.
     */
    public function index()
    {
        // Fetch all current settings
        $settings = Setting::whereIn('key', self::TARGET_KEYS)
                           ->pluck('value', 'key')
                           ->toArray();

        // Provide defaults if not set in DB
        $targets = [
            'Daily' => $settings['target_daily_sales'] ?? 1500,
            'Week' => $settings['target_weekly_sales'] ?? 10000,
            'Month' => $settings['target_monthly_sales'] ?? 50000,
            'Year' => $settings['target_yearly_sales'] ?? 120000,
        ];

        return Inertia::render('Dashboard/Admin/Settings', [
            'targets' => $targets,
        ]);
    }

    /**
     * Saves updated targets to the database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'Daily' => 'required|numeric|min:0',
            'Week' => 'required|numeric|min:0',
            'Month' => 'required|numeric|min:0',
            'Year' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            Setting::updateOrCreate(
                ['key' => 'target_daily_sales'],
                ['value' => $validated['Daily']]
            );
            Setting::updateOrCreate(
                ['key' => 'target_weekly_sales'],
                ['value' => $validated['Week']]
            );
            Setting::updateOrCreate(
                ['key' => 'target_monthly_sales'],
                ['value' => $validated['Month']]
            );
            Setting::updateOrCreate(
                ['key' => 'target_yearly_sales'],
                ['value' => $validated['Year']]
            );
        });

        return redirect()->back()->with('success', 'Sales targets updated successfully.');
    }
}