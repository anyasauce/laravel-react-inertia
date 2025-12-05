import React, { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useForm, router } from "@inertiajs/react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Package,
    AlertTriangle,
    Warehouse, 
    Truck, // Icon for Stocked Quantity
    CheckCircle, // Icon for Items Stocked
    Box,
    Barcode
} from "lucide-react";
import Swal from "sweetalert2";

export default function Stocker({ initialItems, userStockSummary }) { 
    const [items, setItems] = useState(initialItems || []);
    const [open, setOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [search, setSearch] = useState("");
    const [userSummary, setUserSummary] = useState(userStockSummary); 
    
    // Form handling for Stock In
    const { data, setData, post, reset, errors } = useForm({
        quantity_added: 0,
    });

    // --- Data Sync Logic ---
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                // 🛑 FIX: Use explicit URL for fetching data
                const res = await fetch(`/user/stocker/data?ts=${Date.now()}`); 
                const json = await res.json();
                if (json.items) setItems(json.items);
                if (json.userStockSummary) setUserSummary(json.userStockSummary); 
            } catch (error) {
                console.error("Failed to sync inventory");
            }
        };
        fetchInventory();
        const interval = setInterval(fetchInventory, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleGlobalKeyDown = (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;
            lastKeyTime = currentTime;

            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || open) {
                return;
            }

            if (timeDiff > 50) { 
                buffer = "";
            }

            if (e.key === "Enter") {
                e.preventDefault(); 
                
                if (buffer.length > 2) {
                    const foundItem = items.find(i => 
                        (i.product?.barcode && i.product.barcode === buffer) || 
                        (i.product?.sku && i.product.sku === buffer)
                    );
                    
                    if (foundItem) {
                        Swal.fire({
                            icon: 'success',
                            title: `Scanned: ${foundItem.product.name}`,
                            text: 'Ready to stock in...',
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 1000
                        });
                        
                        openStockIn(foundItem);
                        buffer = "";
                    } else {
                        Swal.fire({ 
                            icon: "error", 
                            title: "Product not recognized!", 
                            text: "Check SKU or Barcode.",
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 2000 
                        });
                        buffer = "";
                    }
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                buffer += e.key;
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, [items, open]); 


    const openStockIn = (item) => {
        setSelectedItem(item);
        reset();
        setData('quantity_added', 1);
        setOpen(true);
    };

    const submitStockIn = () => {
        const options = {
            onSuccess: (page) => {
                setOpen(false);
                reset();
                const message = page.props.flash?.success || 'Stock updated successfully!';
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: message,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
            },
            onError: (err) => {
                console.log(err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Please check the quantity entered.' });
            }
        };
        // 🛑 FIX: Use explicit URL for submitting data
        post(`/user/stocker/${selectedItem.id}/stock-in`, options);
    };

    const filteredItems = items.filter(i =>
        i.product?.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.product?.barcode && i.product.barcode.includes(search)) ||
        (i.product?.sku && i.product.sku.includes(search))
    );

    // KPI Stats relevant to the Stocker
    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.is_low).length;
    const outOfStock = items.filter(i => i.is_out).length;
    
    // NEW USER STATS
    const stockedQuantity = userSummary.totalQuantity;
    const stockedItemsCount = userSummary.uniqueItems;


    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
                        <p className="text-muted-foreground">
                            Quickly view stock levels and record inventory intake.
                        </p>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StockerStatCard
                        title="Total Units Stocked (You)" 
                        value={stockedQuantity.toLocaleString()}
                        icon={Truck} 
                        color="text-emerald-600"
                        bg="bg-emerald-50 dark:bg-emerald-900/20"
                    />
                    <StockerStatCard 
                        title="Items Stocked (You)" 
                        value={stockedItemsCount.toLocaleString()}
                        icon={CheckCircle} 
                        color="text-indigo-600"
                        bg="bg-indigo-50 dark:bg-indigo-900/20"
                    />
                    <StockerStatCard
                        title="Total Low Stock"
                        value={lowStockItems}
                        icon={AlertTriangle}
                        color="text-orange-600"
                        bg="bg-orange-50 dark:bg-orange-900/20"
                        alert={lowStockItems > 0}
                    />
                    <StockerStatCard
                        title="Total Out of Stock"
                        value={outOfStock}
                        icon={Warehouse} 
                        color="text-red-600"
                        bg="bg-red-50 dark:bg-red-900/20"
                        alert={outOfStock > 0}
                    />
                </div>

                {/* Main Content Wrapper */}
                <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900">
                        <div className="relative w-full sm:w-96 group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Scan or search SKU, barcode..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[20%]">Product</TableHead>
                                    <TableHead>Identifiers</TableHead>
                                    <TableHead className="w-[10%]">Current Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[20%]">Last Stocked By</TableHead> 
                                    {/* <TableHead className="text-right">Action</TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    filteredItems.map(i => (
                                        <StockerRow
                                            key={i.id}
                                            item={i}
                                            onStockIn={openStockIn}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card Grid */}
                    <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-slate-50/50">
                        {filteredItems.length === 0 ? (
                            <EmptyState />
                        ) : (
                            filteredItems.map(i => (
                                <MobileStockerCard
                                    key={i.id}
                                    item={i}
                                    onStockIn={openStockIn}
                                />
                            ))
                        )}
                    </div>

                    <CardFooter className="border-t p-4 bg-slate-50 dark:bg-slate-900/50">
                        <div className="text-xs text-muted-foreground w-full text-center flex justify-between items-center">
                            <span>Showing {filteredItems.length} records</span>
                            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Stock Data</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Modal Dialog for Stock In */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5 text-indigo-500" />
                            Stock In: {selectedItem?.product?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Enter the number of units received to add to the current stock.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="current_qty">Current Stock</Label>
                            <Input
                                id="current_qty"
                                value={selectedItem?.quantity}
                                disabled
                                className="font-bold bg-slate-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity_added" className="font-semibold text-emerald-600">Quantity to Add</Label>
                            <div className="relative">
                                <Input
                                    id="quantity_added"
                                    type="number"
                                    min="1"
                                    className="pl-9 font-mono text-lg border-emerald-300"
                                    value={data.quantity_added}
                                    onChange={e => setData("quantity_added", e.target.value)}
                                    autoFocus
                                />
                                <Plus className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                            </div>
                            {errors.quantity_added && <p className="text-sm text-red-500 mt-1">{errors.quantity_added}</p>}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={submitStockIn} className="bg-emerald-600 text-white hover:bg-emerald-700">
                            Confirm Stock In
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

// --- Sub Components ---
const StockerStatCard = ({ title, value, icon: Icon, color, bg, alert }) => (
    <Card className={`border-none shadow-sm ${alert ? 'ring-2 ring-red-500/20' : ''}`}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={`p-2 rounded-full ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            </div>
        </CardContent>
    </Card>
);

const StockerRow = ({ item, onStockIn }) => {
    return (
        <TableRow className="group hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
            <TableCell>
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm transition-all">
                        <Box className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.product.name}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="font-mono text-[10px] text-slate-500 bg-slate-100 border-slate-200">
                        SKU: {item.product.sku}
                    </Badge>
                    {item.product.barcode && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Barcode className="h-3 w-3 opacity-50" /> {item.product.barcode}
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell className="font-bold text-lg">
                {item.quantity}
            </TableCell>
            <TableCell>
                <StatusBadge isOut={item.is_out} isLow={item.is_low} />
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.last_stocked_by}</span>
                    <span className="text-xs text-muted-foreground">{item.last_stocked_at}</span>
                </div>
            </TableCell>
            {/* <TableCell className="text-right">
                <Button onClick={() => onStockIn(item)} size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4" /> Stock In
                </Button>
            </TableCell> */}
        </TableRow>
    );
};

const MobileStockerCard = ({ item, onStockIn }) => {
    return (
        <Card className="bg-white border shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Box className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{item.product.name}</h3>
                            <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                        </div>
                    </div>
                    <Button onClick={() => onStockIn(item)} size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4" /> Stock In
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2 border-t border-b border-dashed">
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Current Stock</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{item.quantity}</span>
                            <StatusBadge isOut={item.is_out} isLow={item.is_low} textOnly />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Stocked By</p>
                        <p className="text-sm font-medium">{item.last_stocked_by}</p>
                        <p className="text-[10px] text-muted-foreground">{item.last_stocked_at}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Reorder At</p>
                        <p className="text-sm font-medium text-orange-600">{item.reorder_level}</p>
                    </div>
                </div>
                {item.product.barcode && <div className="flex justify-end text-xs text-muted-foreground"><Barcode className="h-3 w-3" /> {item.product.barcode}</div>}
            </CardContent>
        </Card>
    );
};

const StatusBadge = ({ isOut, isLow, textOnly = false }) => {
    if (isOut) {
        return textOnly ? (
            <span className="text-red-600 font-bold text-xs">Out of Stock</span>
        ) : (
            <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 hover:bg-red-100">Out of Stock</Badge>
        );
    }
    if (isLow) {
        return textOnly ? (
            <span className="text-orange-600 font-bold text-xs">Low Stock</span>
        ) : (
            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100">Low Stock</Badge>
        );
    }
    return textOnly ? (
        <span className="text-emerald-600 font-bold text-xs">In Stock</span>
    ) : (
        <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100">In Stock</Badge>
    );
};

const EmptyState = () => (
    <TableRow>
        <TableCell colSpan={6} className="h-[400px] text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-full bg-slate-100">
                    <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium">No items found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    Search for a product by name, SKU, or barcode to begin stocking.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>Reload Data</Button>
            </div>
        </TableCell>
    </TableRow>
);