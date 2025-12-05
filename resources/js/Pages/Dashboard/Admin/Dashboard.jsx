import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Link } from "@inertiajs/react";
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
    Users, 
    ShoppingCart, 
    Package, 
    BarChart3, 
    AlertTriangle, 
    TrendingUp, 
    Clock, 
    Plus,
    Calendar as CalendarIcon, 
    Settings as SettingsIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// --- Import for Calendar/Month Filter ---
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- Default Data Structure ---
const defaultMetrics = {
    totalRevenue: 0,
    revenueChange: 0,
    revenueDescription: "Compared to last period",
    totalEmployees: 0,
    newEmployees: 0,
    totalProducts: 0,
    lowStockItems: 0,
    outOfStock: 0,
    recentTransactions: [],
    salesData: { target: 50000, current: 0 },
};

const TIME_FILTERS = [
    { key: 'Day', label: 'Day' },
    { key: 'Week', label: 'Week' },
    { key: 'Year', label: 'Year' },
];

// --- Utility function for Currency Formatting (ensures commas) ---
const formatCurrency = (amount) => {
    const options = {
        minimumFractionDigits: amount % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    };

    const formatted = Number(amount).toLocaleString('en-US', options);
    return `₱${formatted}`;
};

// --- Theme-aware color constants for Stat Cards ---
// We use utility classes (like text-green-500) that typically flip better 
// than relying on a complex mix of foreground/background for small icons.
const CARD_COLORS = {
    revenue: { iconColor: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    employees: { iconColor: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    products: { iconColor: "text-blue-500", bgColor: "bg-blue-500/10" },
    alert: { iconColor: "text-orange-500", bgColor: "bg-orange-500/10" },
};

export default function AdminDashboard({ initialMetrics }) {
    const [timeframe, setTimeframe] = useState('Month'); 
    const [selectedMonth, setSelectedMonth] = useState(new Date()); 
    const [metrics, setMetrics] = useState(initialMetrics || defaultMetrics);
    
    const [isCalendarOpen, setIsCalendarOpen] = useState(false); 

    const fetchMetrics = useCallback(async (period, month) => {
        const periodToFetch = period || timeframe;
        const monthParam = periodToFetch === 'Month' && month 
            ? `&month=${format(month, 'yyyy-MM')}` 
            : '';
        
        try {
            const res = await fetch(`/admin/dashboard/metrics?timeframe=${periodToFetch}${monthParam}&t=${Date.now()}`);
            const json = await res.json();
            setMetrics(json);
        } catch (error) {
            console.error("Failed to fetch dashboard metrics:", error);
        }
    }, [timeframe]); 

    useEffect(() => {
        const monthToFetch = timeframe === 'Month' ? selectedMonth : null;
        fetchMetrics(timeframe, monthToFetch); 

        const interval = setInterval(() => {
            const currentMonthToFetch = timeframe === 'Month' ? selectedMonth : null;
            fetchMetrics(timeframe, currentMonthToFetch);
        }, 10000); 

        return () => clearInterval(interval);
    }, [timeframe, selectedMonth, fetchMetrics]); 

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
    };

    const handleMonthSelect = (date) => {
        if (date) {
            if (timeframe !== 'Month') {
                setTimeframe('Month');
            }
            setSelectedMonth(date);
            setIsCalendarOpen(false); 
        }
    };

    const revenueProgress = Math.min((metrics.salesData.current / metrics.salesData.target) * 100, 100);
    
    const revenueTarget = formatCurrency(metrics.salesData.target);
    
    const revenueDescription = metrics.revenueDescription || "Compared to last period";

    const calendarDisplay = format(selectedMonth, 'MMM yyyy');

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">
                
                {/* Header and Filter */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b pb-4">
                    <div className="space-y-1">
                        {/* FIX 1: Use theme-aware text color */}
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Admin Dashboard
                        </h2>
                        <p className="text-muted-foreground">
                            Real-time overview of business performance and key operational health indicators.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                         {/* Timeframe Filter Buttons */}
                        {/* FIX 2: Use theme-aware background for filter container */}
                        <div className="flex bg-muted rounded-lg p-0.5 shadow-inner">
                            
                            {/* Calendar/Month Picker */}
                            <Popover 
                                open={isCalendarOpen} 
                                onOpenChange={setIsCalendarOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={timeframe === 'Month' ? "default" : "ghost"}
                                        size="sm"
                                        className={cn(
                                            "text-xs font-semibold h-8 px-3 transition-all",
                                            // FIX 3: Use semantic classes for active/inactive state
                                            timeframe === 'Month' 
                                                ? 'shadow-sm' // default variant is primary color
                                                : 'text-muted-foreground hover:bg-background'
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
                                        // FIX 4: Use semantic classes for active/inactive state
                                        timeframe === filter.key 
                                            ? 'shadow-sm' // default variant is primary color
                                            : 'text-muted-foreground hover:bg-background'
                                    }`}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                        
                        {/* FIX 5: Use default variant (primary color) */}
                        <Button asChild className="hidden sm:inline-flex">
                            <Link href="/admin/reports">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Reports
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 1. Primary KPI Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <DashboardStatCard 
                        title="Total Revenue" 
                        value={formatCurrency(metrics.totalRevenue)} 
                        icon={DollarSign} 
                        change={metrics.revenueChange}
                        description={revenueDescription}
                        color={CARD_COLORS.revenue.iconColor}
                        bg={CARD_COLORS.revenue.bgColor}
                    />
                    <DashboardStatCard 
                        title={`New Employees (${timeframe === 'Month' ? calendarDisplay : timeframe})`} 
                        value={metrics.newEmployees} 
                        icon={Users} 
                        description={`Added this ${timeframe === 'Month' ? 'month' : timeframe.toLowerCase()}`}
                        color={CARD_COLORS.employees.iconColor}
                        bg={CARD_COLORS.employees.bgColor}
                    />
                    <DashboardStatCard 
                        title="Total Products" 
                        value={metrics.totalProducts} 
                        icon={Package} 
                        description="Active items in catalog"
                        color={CARD_COLORS.products.iconColor}
                        bg={CARD_COLORS.products.bgColor}
                    />
                    <DashboardStatCard 
                        title="Low Stock Alert" 
                        value={metrics.lowStockItems} 
                        icon={AlertTriangle} 
                        description="Needs immediate reorder"
                        color={CARD_COLORS.alert.iconColor}
                        bg={CARD_COLORS.alert.bgColor}
                        alert={metrics.lowStockItems > 0}
                    />
                </div>

                {/* 2. Charts and Activities */}
                <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Sales Overview Card */}
                    {/* FIX 6: Use theme-aware card background/shadow */}
                    <Card className="lg:col-span-2 shadow-lg">
                        <CardHeader>
                            <CardTitle>{timeframe === 'Month' ? `${calendarDisplay} ` : timeframe} Sales Overview</CardTitle>
                            <CardDescription>Target vs. Actual for the current {timeframe === 'Month' ? 'month' : timeframe.toLowerCase()}.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {/* FIX 7: Use theme-aware background for chart area */}
                            <div className="h-[250px] flex flex-col items-center justify-center bg-muted rounded-xl p-6">
                                {/* Label */}
                                <p className="text-sm text-muted-foreground mb-2">Revenue Progress</p>

                                {/* Value */}
                                {/* FIX 8: Use theme-aware text color (primary as accent) */}
                                <h3 className="text-4xl font-extrabold text-primary mb-4">
                                    {revenueProgress.toFixed(1)}%
                                </h3>

                                {/* Progress Bar */}
                                {/* FIX 9: Use theme-aware colors for progress bar */}
                                <div className="w-3/4 h-8 bg-primary/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000 ease-out"
                                        style={{ width: `${revenueProgress}%` }}
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t border-border/50 pt-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Target</p>
                                    <p className="font-semibold text-lg mt-1">{revenueTarget}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Actual</p>
                                    {/* FIX 10: Use semantic color (emerald) */}
                                    <p className="font-semibold text-lg mt-1 text-emerald-500">
                                        {formatCurrency(metrics.totalRevenue)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Change</p>
                                    {/* FIX 11: Use hardcoded colors for POSITIVE/NEGATIVE feedback */}
                                    <p className={`font-semibold text-lg mt-1 ${metrics.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {metrics.revenueChange > 0 ? '+' : ''}{metrics.revenueChange.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activities Card */}
                    {/* FIX 12: Use theme-aware card background/shadow */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Transactions ({timeframe === 'Month' ? calendarDisplay : timeframe})</CardTitle>
                            <CardDescription>Latest POS activities in the current {timeframe === 'Month' ? 'month' : timeframe.toLowerCase()}.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] overflow-y-auto">
                            <div className="space-y-4">
                                {metrics.recentTransactions.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">No recent transactions this {timeframe === 'Month' ? 'month' : timeframe.toLowerCase()}.</div>
                                ) : (
                                    metrics.recentTransactions.map((activity, index) => (
                                        <div key={index} className="flex items-center justify-between border-b border-border/50 last:border-b-0 pb-2">
                                            <div className="flex items-start space-x-3">
                                                {/* FIX 13: Use primary color for accent icons */}
                                                <ShoppingCart className="h-4 w-4 mt-1 text-primary shrink-0" />
                                                <div className="flex flex-col">
                                                    {/* FIX 14: Use theme-aware foreground text */}
                                                    <p className="text-sm font-medium text-foreground">{activity.description}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* FIX 15: Use semantic color (emerald) */}
                                            <p className="text-sm font-semibold text-emerald-500">
                                                {formatCurrency(activity.amount)}
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

const DashboardStatCard = ({ title, value, icon: Icon, change, description, color, bg, alert }) => {
    const isPositive = change >= 0;
    const isRevenueCard = title === "Total Revenue";

    return (
        // FIX 16: Use theme-aware card background
        <Card className={`border-none shadow-md ${alert ? 'ring-2 ring-orange-500/30' : ''} transition-shadow hover:shadow-lg`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-full ${bg} ${alert ? 'animate-pulse' : ''}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                {/* FIX 17: Use theme-aware foreground text */}
                <div className="text-3xl font-bold text-foreground">{value}</div>
                <div className="flex items-center gap-2 mt-2">
                    {/* Only show percentage change for Revenue (or if it's explicitly a change metric) */}
                    {isRevenueCard && change !== undefined && (
                        // FIX 18: Use hardcoded colors for POSITIVE/NEGATIVE feedback
                        <p className={`text-xs font-semibold flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
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