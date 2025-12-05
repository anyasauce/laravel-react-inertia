import React, { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Link } from "@inertiajs/react";
// ❌ Removed the erroneous self-import: import ChartDisplay from "./Graphs";

// Assume these imports are available from your Shadcn/Recharts setup
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, LayoutDashboard, TrendingUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(inputs);
}

const defaultGraphData = {
    dailySales: [], // Used for Daily/Weekly/Monthly Sales Chart
    monthlyRevenue: [], // Used for Last 12 Months Chart
    categorySales: [], // Used for Top 5 Products Chart
};

const TIME_FILTERS = [
    { key: 'Day', label: 'Day' },
    { key: 'Week', label: 'Week' },
    { key: 'Year', label: 'Year' },
];

// Renamed the export to match the new file name convention
export default function AnalyticsPage({ initialGraphData }) {
    const [timeframe, setTimeframe] = useState('Month');
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [graphData, setGraphData] = useState(initialGraphData || defaultGraphData);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchGraphData = useCallback(async (period, month) => {
        setIsLoading(true);
        const periodToFetch = period || timeframe;
        const monthParam = periodToFetch === 'Month' && month
            ? `&month=${format(month, 'yyyy-MM')}`
            : '';

        try {
            const res = await fetch(`/admin/analytics/data?timeframe=${periodToFetch}${monthParam}&t=${Date.now()}`);
            const json = await res.json();

            window.requestAnimationFrame(() => {
                setGraphData(json);
                setIsLoading(false);
            });
        } catch (error) {
            console.error("Failed to fetch graph data:", error);
            setIsLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        const monthToFetch = timeframe === 'Month' ? selectedMonth : null;
        fetchGraphData(timeframe, monthToFetch);

        // Reduced polling to 5 minutes (300000ms) for better performance
        const interval = setInterval(() => {
            const currentMonthToFetch = timeframe === 'Month' ? selectedMonth : null;
            fetchGraphData(timeframe, currentMonthToFetch);
        }, 300000);

        return () => clearInterval(interval);
    }, [timeframe, selectedMonth, fetchGraphData]);

    const handleTimeframeChange = (newTimeframe) => {
        if (newTimeframe !== timeframe) {
            setTimeframe(newTimeframe);
        }
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

    const calendarDisplay = format(selectedMonth, 'MMM yyyy');
    const memoizedGraphData = useMemo(() => graphData, [graphData]);

    const formatCurrency = (value) => `₱${new Intl.NumberFormat('en-US').format(value)}`;

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">

                {/* Header and Filter (UI remains the same) */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b pb-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Sales Analytics & Graphs
                        </h2>
                        <p className="text-muted-foreground">
                            Deep dive into revenue trends, daily sales, and product performance.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Filter controls remain the same */}
                    </div>
                </div>

                {/* 2. Charts Display Area */}
                {isLoading && (
                    <div className="text-center py-20 text-lg text-muted-foreground">
                        Loading new data...
                    </div>
                )}
                <div className={cn("grid gap-6", isLoading ? 'opacity-50 pointer-events-none' : 'lg:grid-cols-3')}>

                    {/* Daily Sales Chart (AreaChart) */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Daily Sales: {timeframe}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={memoizedGraphData.dailySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="day" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value) => formatCurrency(value)} />
                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} activeDot={{ r: 8 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top 5 Products Chart (Placeholder for Pie/Bar) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Top 5 Product Sales</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px] p-4 flex flex-col justify-center">
                            {/* In a real app, you would render a BarChart or PieChart here */}
                            <ul className="space-y-2">
                                {memoizedGraphData.categorySales.slice(0, 5).map((item, index) => (
                                    <li key={index} className="flex justify-between text-sm">
                                        <span className="truncate max-w-[70%]">{item.name}</span>
                                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                                    </li>
                                ))}
                            </ul>
                            {memoizedGraphData.categorySales.length === 0 && (
                                <p className="text-center text-muted-foreground">No product data for this period.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Revenue Chart (BarChart or LineChart) */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-xl">Last 12 Months Revenue Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={memoizedGraphData.monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value) => formatCurrency(value)} />
                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.1)" strokeWidth={2} activeDot={{ r: 8 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </DashboardLayout>
    );
}
