import React, { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Link, router } from "@inertiajs/react";
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
    Calendar as CalendarIcon,
    ListChecks,
    Target,
    ArrowLeft
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

const DailyReportStatCard = ({ title, value, icon: Icon, change, description, color, bg }) => {
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

export default function DailyReport({ reportData }) {
    const { date, dateFormatted, totalSales, totalTransactions, revenueChange, dailyTarget, transactions } = reportData;

    const [selectedDate, setSelectedDate] = useState(parseISO(date));
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const handleDateSelect = (newDate) => {
        if (!newDate) return;

        setSelectedDate(newDate);
        setIsCalendarOpen(false);

        const options = {
            onSuccess: (page) => {
                const message = page.props.flash?.success || "Report loaded!";
                Toast.fire({
                    icon: "success",
                    title: message,
                });
            },
            onError: (errors, page) => {
                const message = page?.props?.flash?.error || "Failed to load report";
                Toast.fire({
                    icon: "error",
                    title: message,
                });
            },
            preserveScroll: true,
            preserveState: true,
        };

        // Using "get" style like your other post/put
        get("/user/daily-report", { date: format(newDate, "yyyy-MM-dd") }, options);
    };


    // Derived Metrics
    const formatCurrency = (amount) => `₱${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const revenueProgress = dailyTarget > 0 ? Math.min((totalSales / dailyTarget) * 100, 100) : 0;
    const transactionsExist = transactions && transactions.length > 0;

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6 p-4 md:p-8 max-w-7xl mx-auto">

                {/* Header and Filter */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b pb-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Daily Sales Report
                        </h2>
                        <p className="text-muted-foreground">
                            Detailed performance and transaction log for **{dateFormatted}**.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Date Picker */}
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-60 justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    maxDate={new Date()} // Cannot select future dates
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button asChild variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                            <a href="/user/dashboard">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <DailyReportStatCard
                        title="Total Sales"
                        value={formatCurrency(totalSales)}
                        icon={DollarSign}
                        change={revenueChange}
                        description={`Compared to previous day`}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                    <DailyReportStatCard
                        title="Transactions Count"
                        value={totalTransactions.toLocaleString()}
                        icon={ShoppingCart}
                        description={`Completed sales on ${dateFormatted}`}
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                    <DailyReportStatCard
                        title="Daily Target Progress"
                        value={revenueProgress.toFixed(1) + '%'}
                        icon={Target}
                        description={`Goal: ${formatCurrency(dailyTarget)}`}
                        color="text-indigo-600"
                        bg="bg-indigo-50"
                    />
                    <DailyReportStatCard
                        title="Total Items Sold"
                        value={transactions.reduce((acc, t) => acc + t.products_count, 0).toLocaleString()}
                        icon={ListChecks}
                        description={`Across all transactions`}
                        color="text-orange-600"
                        bg="bg-orange-50"
                    />
                </div>

                {/* Transaction Details Table */}
                <Card className="shadow-lg dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-lg">Transaction Log</CardTitle>
                        <CardDescription>All transactions processed by you on {dateFormatted}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactionsExist ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-800">
                                            <TableHead>Transaction ID</TableHead>
                                            <TableHead className="text-center">Time</TableHead>
                                            <TableHead className="text-center">Items</TableHead>
                                            <TableHead className="text-right font-bold text-emerald-600">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="font-semibold text-indigo-600">
                                                    #{t.id}
                                                </TableCell>
                                                <TableCell className="text-center text-muted-foreground">{t.time}</TableCell>
                                                <TableCell className="text-center">{t.products_count}</TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600">
                                                    {formatCurrency(t.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                No sales transactions recorded on this day.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}