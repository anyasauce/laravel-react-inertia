import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Link, usePage } from "@inertiajs/react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    DollarSign, 
    ShoppingCart, 
    TrendingUp, 
    Clock, 
    BarChart3,
    Calendar as CalendarIcon,
    Plus,
    Target
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- Default Data Structure for User Metrics ---
const defaultMetrics = {
    totalRevenue: 0,
    revenueChange: 0,
    revenueDescription: "Compared to last period",
    recentTransactions: [],
    salesData: { target: 1500, current: 0 }, // Default to Daily Target
};

const TIME_FILTERS = [
    { key: 'Day', label: 'Day' },
    { key: 'Week', label: 'Week' },
    { key: 'Month', label: 'Month' },
    { key: 'Year', label: 'Year' },
];

export default function UserDashboard({ initialMetrics }) {
    // Get user data for personalization
    const { auth } = usePage().props;
    const userName = auth.user.name.split(' ')[0] || 'Cashier';

    const [timeframe, setTimeframe] = useState('Day'); // Default to Daily for employees
    const [selectedMonth, setSelectedMonth] = useState(new Date()); 
    const [metrics, setMetrics] = useState(initialMetrics || defaultMetrics);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false); 

    // --- Data Fetching Logic (User-Specific) ---
    const fetchMetrics = useCallback(async (period, month) => {
        const periodToFetch = period || timeframe;
        const monthParam = periodToFetch === 'Month' || periodToFetch === 'Year' && month 
            ? `&month=${format(month, 'yyyy-MM')}` 
            : '';
        
        try {
            // 💡 Use the new user dashboard API endpoint
            const res = await fetch(`/dashboard/metrics?timeframe=${periodToFetch}${monthParam}&t=${Date.now()}`);
            const json = await res.json();
            setMetrics(json);
        } catch (error) {
            console.error("Failed to fetch dashboard metrics:", error);
        }
    }, [timeframe]); 

    useEffect(() => {
        const monthToFetch = timeframe === 'Month' ? selectedMonth : null;
        fetchMetrics(timeframe, monthToFetch); 

        // Set interval for real-time updates
        const interval = setInterval(() => {
            const currentMonthToFetch = timeframe === 'Month' ? selectedMonth : null;
            fetchMetrics(timeframe, currentMonthToFetch);
        }, 15000); // Check slightly less frequently

        return () => clearInterval(interval);
    }, [timeframe, selectedMonth, fetchMetrics]); 

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
    };

    const handleMonthSelect = (date) => {
        if (date) {
            setTimeframe('Month');
            setSelectedMonth(date);
            setIsCalendarOpen(false); 
        }
    };

    // Derived Sales Metrics
    const currentRevenue = metrics.totalRevenue;
    const revenueTarget = metrics.salesData.target;
    const revenueProgress = revenueTarget > 0 ? Math.min((currentRevenue / revenueTarget) * 100, 100) : 0;
    const revenueDescription = metrics.revenueDescription || "Compared to last period";

    const calendarDisplay = format(selectedMonth, 'MMM yyyy');

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
                
                {/* Header and Filter */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b pb-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            👋 Welcome back, {userName}!
                        </h2>
                        <p className="text-muted-foreground">
                            Your personal sales performance and activity feed.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                         {/* Timeframe Filter Buttons */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shadow-inner">
                            {/* Calendar/Month Picker - Simplified for user */}
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={timeframe === 'Month' ? "default" : "ghost"}
                                        size="sm"
                                        className={cn(
                                            "text-xs font-semibold h-8 px-3 transition-all",
                                            timeframe === 'Month' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {calendarDisplay}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single" 
                                        captionLayout="dropdown-buttons"
                                        selected={selectedMonth}
                                        onSelect={handleMonthSelect}
                                        initialFocus
                                        maxDate={new Date()} 
                                        defaultMonth={selectedMonth}
                                    />
                                </PopoverContent>
                            </Popover>
                            
                            {/* Day, Week, Year buttons */}
                            {TIME_FILTERS.map(filter => (
                                <Button
                                    key={filter.key}
                                    variant={timeframe === filter.key ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleTimeframeChange(filter.key)}
                                    className={`text-xs font-semibold h-8 px-3 transition-all ${
                                        timeframe === filter.key ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                        
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20">
                            <Link href="/pos">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Start POS
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 1. Primary Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <UserStatCard 
                        title={`Total Sales (${timeframe})`} 
                        value={`₱${currentRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                        icon={DollarSign} 
                        change={metrics.revenueChange}
                        description={revenueDescription}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                     <UserStatCard 
                        title={`Transactions (${timeframe})`} 
                        value={metrics.recentTransactions.length} 
                        icon={ShoppingCart} 
                        description={`Total completed transactions ${timeframe.toLowerCase()}`}
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                    <UserStatCard 
                        title={`Sales Target (${timeframe})`} 
                        value={revenueProgress.toFixed(1) + '%'} 
                        icon={Target} 
                        description={`Goal: ₱${revenueTarget.toLocaleString()}`}
                        color="text-orange-600"
                        bg="bg-orange-50"
                    />
                </div>

                {/* 2. Target Overview and Activities */}
                <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Sales Overview Card - Progress Bar Focused */}
                    <Card className="lg:col-span-2 shadow-lg dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle>{timeframe} Sales Goal</CardTitle>
                            <CardDescription>Your personal sales progress for the current {timeframe.toLowerCase()}.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="h-[250px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl p-6 relative">
                                {/* Simulated Progress Bar */}
                                <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                                    <div className="w-3/4 h-8 bg-indigo-200/50 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
                                            style={{ width: `${revenueProgress}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="relative z-10 text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">Revenue Progress</p>
                                    <h3 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400">
                                        {revenueProgress.toFixed(1)}%
                                    </h3>
                                </div>
                            </div>
                            
                            <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t pt-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Target</p>
                                    <p className="font-semibold text-lg mt-1">₱{revenueTarget.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Actual Sales</p>
                                    <p className="font-semibold text-lg mt-1 text-emerald-600">
                                        ₱{currentRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Needed</p>
                                    <p className="font-semibold text-lg mt-1 text-red-600">
                                        ₱{Math.max(0, revenueTarget - currentRevenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activities Card */}
                    <Card className="shadow-lg dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Transactions ({timeframe})</CardTitle>
                            <CardDescription>Latest POS activities handled by you.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] overflow-y-auto">
                            <div className="space-y-4">
                                {metrics.recentTransactions.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">No recent transactions this {timeframe.toLowerCase()}.</div>
                                ) : (
                                    metrics.recentTransactions.map((activity, index) => (
                                        <div key={index} className="flex items-center justify-between border-b last:border-b-0 pb-2">
                                            <div className="flex items-start space-x-3">
                                                <BarChart3 className="h-4 w-4 mt-1 text-indigo-500 shrink-0" />
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{activity.description}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                ₱{Number(activity.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

// --- Reusable StatCard Component ---
const UserStatCard = ({ title, value, icon: Icon, change, description, color, bg }) => {
    const isPositive = change >= 0;
    const showChange = change !== undefined;

    return (
        <Card className={`border-none shadow-md dark:bg-slate-900 transition-shadow hover:shadow-lg`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-full ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
                <div className="flex items-center gap-2 mt-2">
                    {showChange && (
                        <p className={`text-xs font-semibold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            <TrendingUp 
                                className={`h-3 w-3 mr-1 transform ${isPositive ? 'rotate-0' : 'rotate-180'}`} 
                            />
                            {change > 0 ? '+' : ''}{change.toFixed(2)}%
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};