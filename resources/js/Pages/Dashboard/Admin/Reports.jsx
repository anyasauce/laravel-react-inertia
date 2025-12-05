import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Link } from "@inertiajs/react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    DollarSign,
    ArrowLeft,
    BarChart3,
    ShoppingCart,
    Truck,
    Package,
    UserCheck,
    FileText
} from "lucide-react"; // 💡 ADDED: FileText icon for export button
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TIME_FILTERS = [
    { key: 'Day', label: 'Daily' },
    { key: 'Week', label: 'Weekly' },
    { key: 'Month', label: 'Monthly' },
    { key: 'Year', label: 'Yearly' },
];

// --- Theme-aware color map for Stat Cards ---
const STAT_CARD_THEME = {
    // Sales Report Colors
    sales: [
        { iconColor: "text-emerald-500", bgColor: "bg-emerald-500/10" }, // Total Sales
        { iconColor: "text-indigo-500", bgColor: "bg-indigo-500/10" }, // Total Transactions
        { iconColor: "text-blue-500", bgColor: "bg-blue-500/10" },    // Cashiers
    ],
    // Stock Report Colors
    stock: [
        { iconColor: "text-purple-500", bgColor: "bg-purple-500/10" }, // Total Units Stocked
        { iconColor: "text-amber-500", bgColor: "bg-amber-500/10" },  // Unique Items
        { iconColor: "text-teal-500", bgColor: "bg-teal-500/10" },    // Active Stockers
    ],
};

export default function Reports({ initialReports }) {
    const [timeframe, setTimeframe] = useState('Month');
    const [reports, setReports] = useState(initialReports);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('sales');
    const [isExporting, setIsExporting] = useState(false); // 💡 NEW: State for export loading

    const fetchReports = useCallback(async (period) => {
        setIsLoading(true);
        const periodToFetch = period || timeframe;
        try {
            const res = await fetch(`/admin/reports/metrics?timeframe=${periodToFetch}`);
            const json = await res.json();
            setReports(json);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setIsLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        fetchReports(timeframe);
    }, [timeframe, fetchReports]);

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
    };

    // 💡 NEW FUNCTION: Handle Export Button Click
    const handleExport = () => {
        setIsExporting(true);
        // 1. Determine the correct export route based on the active tab
        const exportType = activeTab === 'sales' ? 'sales' : 'stock';
        // 2. Construct the URL with the timeframe
        const url = `/admin/reports/export/${exportType}?timeframe=${timeframe}`;
        
        // 3. Navigate to the URL to trigger file download
        // NOTE: We use a simple window.location.href to trigger the download 
        // as the backend will send a file response.
        window.location.href = url;
        
        // 4. Reset the exporting state after a short delay
        // (The actual download time is variable, but this gives visual feedback)
        setTimeout(() => {
            setIsExporting(false);
        }, 1000); 
    };
    // ... rest of the component props and functions ...

    const formatCurrency = (amount) => {
        return `₱${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    // --- Data Extraction for Active Tab ---
    const salesReport = reports.sales || {};
    const stockReport = reports.stock || {};

    const activeReport = activeTab === 'sales' ? salesReport : stockReport;
    const summary = activeReport.summary || {};


    // --- SALES REPORT COMPONENTS ---
    const SalesSummary = () => (
        <div className="grid gap-4 md:grid-cols-3">
            <ReportStatCard
                title="Total Sales"
                value={formatCurrency(summary.totalSales || 0)}
                icon={DollarSign}
                color={STAT_CARD_THEME.sales[0].iconColor}
                bg={STAT_CARD_THEME.sales[0].bgColor}
                description={activeReport.description}
            />
            <ReportStatCard
                title="Total Transactions"
                value={(summary.totalTransactions || 0).toLocaleString()}
                icon={ShoppingCart}
                color={STAT_CARD_THEME.sales[1].iconColor}
                bg={STAT_CARD_THEME.sales[1].bgColor}
                description={activeReport.description}
            />
            <ReportStatCard
                title="Cashiers on Duty"
                value={(summary.totalEmployees || 0).toLocaleString()}
                icon={Users}
                color={STAT_CARD_THEME.sales[2].iconColor}
                bg={STAT_CARD_THEME.sales[2].bgColor}
                description={`Made sales ${activeReport.description}`}
            />
        </div>
    );

    const SalesRankings = () => (
        <Table>
            <TableHeader>
                {/* FIX 1: Use theme-aware secondary background for Table Header */}
                <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead className="text-center">Total Transactions</TableHead>
                    {/* FIX 2: Use theme-aware color for header metric */}
                    <TableHead className="text-right font-bold text-emerald-500">Total Sales</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {(activeReport.employeeRankings || []).map((employee) => (
                    <TableRow key={employee.email}>
                        {/* FIX 3: Use primary color for top ranks, muted for others */}
                        <TableCell className={`font-extrabold ${employee.rank <= 3 ? 'text-primary text-lg' : 'text-muted-foreground'}`}>
                            #{employee.rank}
                        </TableCell>
                        <TableCell className="font-medium">
                            <div className="font-semibold">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">{employee.email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                            {employee.transactions.toLocaleString()}
                        </TableCell>
                        {/* FIX 4: Use theme-aware color */}
                        <TableCell className="text-right font-bold text-lg text-emerald-500">
                            {formatCurrency(employee.sales)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    // --- STOCKER REPORT COMPONENTS ---
    const StockerSummary = () => (
        <div className="grid gap-4 md:grid-cols-3">
            <ReportStatCard
                title="Total Units Stocked"
                value={(summary.totalQuantity || 0).toLocaleString()}
                icon={Truck}
                color={STAT_CARD_THEME.stock[0].iconColor}
                bg={STAT_CARD_THEME.stock[0].bgColor}
                description={activeReport.description}
            />
            <ReportStatCard
                title="Total Unique Items Stocked"
                value={(summary.totalItems || 0).toLocaleString()}
                icon={Package}
                color={STAT_CARD_THEME.stock[1].iconColor}
                bg={STAT_CARD_THEME.stock[1].bgColor}
                description={activeReport.description}
            />
            <ReportStatCard
                title="Total Active Stockers"
                value={(summary.totalStockers || 0).toLocaleString()}
                icon={UserCheck}
                color={STAT_CARD_THEME.stock[2].iconColor}
                bg={STAT_CARD_THEME.stock[2].bgColor}
                description={`Made adjustments ${activeReport.description}`}
            />
        </div>
    );

    const StockerRankings = () => (
        <Table>
            <TableHeader>
                {/* FIX 5: Use theme-aware secondary background for Table Header */}
                <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Stocker</TableHead>
                    <TableHead className="text-center">Unique Items Stocked</TableHead>
                    {/* FIX 6: Use theme-aware color for header metric */}
                    <TableHead className="text-right font-bold text-purple-500">Total Units Stocked</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {(activeReport.stockerRankings || []).map((stocker) => (
                    <TableRow key={`stocker-${stocker.rank}-${stocker.email}`}>
                        {/* FIX 7: Use primary color for top ranks, muted for others */}
                        <TableCell className={`font-extrabold ${stocker.rank <= 3 ? 'text-primary text-lg' : 'text-muted-foreground'}`}>
                            #{stocker.rank}
                        </TableCell>
                        <TableCell className="font-medium">
                            <div className="font-semibold">{stocker.name}</div>
                            <div className="text-xs text-muted-foreground">{stocker.email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                            {stocker.items_stocked.toLocaleString()}
                        </TableCell>
                        {/* FIX 8: Use theme-aware color */}
                        <TableCell className="text-right font-bold text-lg text-purple-500">
                            {stocker.quantity_stocked.toLocaleString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6 p-4 md:p-8 max-w-7xl mx-auto">

                {/* Header and Filter */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b pb-4">
                    <div className="space-y-1">
                        {/* FIX 9: Use theme-aware foreground text */}
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Business Performance Reports
                        </h2>
                        <p className="text-muted-foreground">
                            Deep analysis for sales and stock management {activeReport.description}.
                        </p>
                    </div>

                    {/* Responsive Control Wrapper */}
                    <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
                        {/* Timeframe Filter Buttons Container */}
                        {/* FIX 10: Use theme-aware background for filter container */}
                        <div className="flex bg-muted/50 rounded-lg p-0.5 shadow-inner w-full sm:w-auto overflow-x-auto">
                            {TIME_FILTERS.map(filter => (
                                <Button
                                    key={filter.key}
                                    variant={timeframe === filter.key ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleTimeframeChange(filter.key)}
                                    // FIX 11: Standardize active/inactive colors to theme variables
                                    className={`text-xs font-semibold h-8 px-3 whitespace-nowrap transition-all ${
                                        timeframe === filter.key 
                                            ? 'shadow-sm' 
                                            : 'text-muted-foreground hover:bg-background'
                                    }`}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>

                        {/* 💡 NEW: Export to Excel Button */}
                        <Button 
                            variant="default" 
                            onClick={handleExport}
                            disabled={isLoading || isExporting} // Disable while loading reports or exporting
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {isExporting ? 'Preparing...' : `Export ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${timeframe})`}
                        </Button>
                        
                        {/* Back to Dashboard Button */}
                        {/* FIX 12: Use theme-aware outline/text colors */}
                        <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted w-full sm:w-auto">
                            <Link href="/admin/dashboard">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Tabs for Report Type */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sales">Sales Performance</TabsTrigger>
                        <TabsTrigger value="stock">Stocker Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sales" className="mt-6 space-y-6">
                        <SalesSummary />
                        <ReportRankingCard
                            title="Employee Sales Rankings"
                            icon={BarChart3}
                            isLoading={isLoading}
                            hasReports={salesReport.employeeRankings?.length > 0}
                            RankingsComponent={SalesRankings}
                        />
                    </TabsContent>

                    <TabsContent value="stock" className="mt-6 space-y-6">
                        <StockerSummary />
                        <ReportRankingCard
                            title="Stocker Performance Rankings"
                            icon={Truck}
                            isLoading={isLoading}
                            hasReports={stockReport.stockerRankings?.length > 0}
                            RankingsComponent={StockerRankings}
                        />
                    </TabsContent>
                </Tabs>

            </div>
        </DashboardLayout>
    );
}

// --- Reusable StatCard Component ---
const ReportStatCard = ({ title, value, icon: Icon, description, color, bg }) => {
    return (
        // FIX 13: Use theme-aware card background
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-2 rounded-full ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                {/* FIX 14: Use theme-aware foreground text */}
                <div className="text-3xl font-bold text-foreground">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
};

// --- Reusable Ranking Card Wrapper ---
const ReportRankingCard = ({ title, icon: Icon, isLoading, hasReports, RankingsComponent }) => (
    // FIX 15: Use theme-aware card background
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                {/* FIX 16: Use theme-aware primary color */}
                <Icon className="w-5 h-5 text-primary" />
                {title}
            </CardTitle>
            <CardDescription>
                Ranked by performance metric for the selected period.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading reports...</div>
            ) : hasReports ? (
                <div className="overflow-x-auto">
                    <RankingsComponent />
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    No performance records found for this period.
                </div>
            )}
        </CardContent>
    </Card>
);