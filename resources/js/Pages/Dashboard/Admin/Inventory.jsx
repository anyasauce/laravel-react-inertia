import React, { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useForm } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardFooter
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Pencil,
    Trash2,
    Plus,
    Barcode,
    Search,
    Package,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    Grid3x3,
    Filter,
    FileDown,
    MoreHorizontal,
    Box,
    Image as ImageIcon,
    Layers,
    ArrowRight
} from "lucide-react";
import Swal from "sweetalert2";

export default function Inventory({ initialItems }) {
    const [items, setItems] = useState(initialItems || []);
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [search, setSearch] = useState("");
    
    const [unitMode, setUnitMode] = useState('piece'); 

    const { data, setData, post, put, delete: destroy, reset, errors } = useForm({
        product_id: "",
        quantity: 0,
        reorder_level: 5,
    });

    const selectedProduct = items
        .map(i => i.product)
        .find(p => String(p?.id) === String(data.product_id)) 
        || (editItem ? editItem.product : null);

    const calculatedSaveQuantity = unitMode === 'pack' && selectedProduct?.pack_size > 1
        ? data.quantity * selectedProduct.pack_size
        : data.quantity;

    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleGlobalKeyDown = (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;
            lastKeyTime = currentTime;

            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
                return;
            }

            if (timeDiff > 50) buffer = "";

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
                            title: `Scanned: ${foundItem.product?.name}`,
                            text: 'Opening stock adjustment...',
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 1000
                        });
                        openEdit(foundItem);
                        buffer = "";
                    } else {
                        Swal.fire({ 
                            icon: "error", 
                            title: "Item not found!", 
                            text: "Try adding it first.",
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 2000 
                        });
                        buffer = "";
                    }
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, [items]);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch(`/admin/inventory-data?ts=${Date.now()}`);
                const json = await res.json();
                if (json.items) setItems(json.items);
            } catch (error) {
                console.error("Failed to sync inventory");
            }
        };
        fetchInventory();
        const interval = setInterval(fetchInventory, 5000);
        return () => clearInterval(interval);
    }, []);

    const openCreate = () => {
        setEditItem(null);
        reset();
        setData({ product_id: "", quantity: 0, reorder_level: 5 });
        setUnitMode('piece');
        setOpen(true);
    };

    const openEdit = (item) => {
        if (!item || !item.product) return;
        setEditItem(item);
        setData({
            product_id: String(item.product.id),
            quantity: item.quantity,
            reorder_level: item.reorder_level,
        });
        setUnitMode('piece');
        setOpen(true);
    };

    const submit = () => {
        const payload = {
            ...data,
            quantity: calculatedSaveQuantity
        };

        const options = {
            onSuccess: () => {
                setOpen(false);
                reset();

                Swal.fire({
                    icon: 'success',
                    title: editItem ? 'Inventory Updated' : 'Inventory Created',
                    text: `Total: ${calculatedSaveQuantity} pieces.`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });

                // If you have any image preview logic in inventory, clean it up here
                if (payload.image_file && imagePreviewUrl) {
                    URL.revokeObjectURL(imagePreviewUrl);
                }
            },
            onError: (err) => {
                console.error(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please check your input.'
                });
            },
        };

        if (editItem) {
            put(`/admin/inventory/${editItem.id}`, { ...payload, _method: 'put' }, options);
        } else {
            post("/admin/inventory", payload, options);
        }
    };


    const handleDelete = (id) => {
        Swal.fire({
            title: 'Delete Item?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(`/admin/inventory/${id}`, {
                    onSuccess: () => Swal.fire('Deleted!', 'Item has been deleted.', 'success')
                });
            }
        });
    };

    const filteredItems = items.filter(i => {
        if (!i.product) return false;
        return (
            i.product.name.toLowerCase().includes(search.toLowerCase()) ||
            (i.product.barcode && i.product.barcode.includes(search)) ||
            (i.product.sku && i.product.sku.includes(search))
        );
    });

    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.quantity <= i.reorder_level && i.quantity > 0).length;
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.product?.price || 0)), 0);
    const outOfStock = items.filter(i => i.quantity === 0).length;
    
    // Get unique available products for the dropdown
    // Note: In a real app with pagination, you might need an API endpoint for this
    const availableProducts = items
        .filter(i => i.product) 
        .map(i => i.product);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
                        <p className="text-muted-foreground">
                            Manage stock, track assets, and monitor availability.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="hidden md:flex gap-2">
                            <FileDown className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Items" value={totalItems} icon={Package} color="text-blue-500" bg="bg-blue-500/10" />
                    <StatCard title="Total Value" value={`₱${totalValue.toLocaleString()}`} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-500/10" />
                    <StatCard title="Low Stock" value={lowStockItems} icon={AlertTriangle} color="text-orange-500" bg="bg-orange-500/10" alert={lowStockItems > 0} />
                    <StatCard title="Out of Stock" value={outOfStock} icon={TrendingUp} color="text-red-500" bg="bg-red-500/10" alert={outOfStock > 0} />
                </div>

                <Card className="border-border shadow-xl shadow-border/40 bg-card overflow-hidden">
                    <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-card">
                        <div className="relative w-full sm:w-96 group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search products, SKU, barcode..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 bg-muted border-border focus:bg-background transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="ml-auto sm:ml-0 gap-2">
                                <Filter className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Filters</span>
                            </Button>
                        </div>
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[30%]">Product</TableHead>
                                    <TableHead>Identifiers</TableHead>
                                    <TableHead className="w-[25%]">Stock Level</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? <TableEmptyState /> : filteredItems.map(i => <InventoryRow key={i.id} item={i} onEdit={openEdit} onDelete={handleDelete} />)}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-muted/50">
                        {filteredItems.length === 0 ? <MobileEmptyState /> : filteredItems.map(i => <MobileInventoryCard key={i.id} item={i} onEdit={openEdit} onDelete={handleDelete} />)}
                    </div>

                    <CardFooter className="border-t border-border/50 p-4 bg-muted/50">
                        <div className="text-xs text-muted-foreground w-full text-center flex justify-between items-center">
                            <span>Showing {filteredItems.length} records</span>
                            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div> Live</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editItem ? <Pencil className="h-5 w-5 text-blue-500" /> : <Plus className="h-5 w-5 text-emerald-500" />}
                            {editItem ? "Edit Stock" : "Add Inventory"}
                        </DialogTitle>
                        <DialogDescription>
                            Adjust quantities. <span className="text-emerald-500 font-medium">Use 'Pack' mode</span> to add full packs.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">Product Name</Label>
                            <Select
                                value={data.product_id}
                                onValueChange={value => {
                                    setData("product_id", value);
                                    setUnitMode('piece'); // Reset unit mode on change
                                }}
                                disabled={!!editItem}
                            >
                                <SelectTrigger className="bg-muted">
                                    <SelectValue placeholder="Select a product..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProducts.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name} {p.pack_size > 1 ? `(Pack of ${p.pack_size})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* DYNAMIC UNIT SELECTOR ROW */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <div className="relative">
                                    <Input
                                        id="quantity"
                                        type="number"
                                        className="pl-9 font-mono"
                                        value={data.quantity}
                                        onChange={e => setData("quantity", e.target.value)}
                                        autoFocus
                                    />
                                    <Grid3x3 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select
                                    value={unitMode}
                                    onValueChange={setUnitMode}
                                    disabled={!selectedProduct || selectedProduct.pack_size <= 1}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="piece">Pieces (Single)</SelectItem>
                                        <SelectItem value="pack">
                                            Packs {selectedProduct?.pack_size > 1 ? `(x${selectedProduct.pack_size} pcs)` : ''}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* CALCULATION PREVIEW ALERT */}
                        {unitMode === 'pack' && selectedProduct?.pack_size > 1 && data.quantity > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-md text-sm border border-indigo-200 dark:border-indigo-800">
                                <Layers className="h-4 w-4 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="font-semibold">Conversion Preview:</span>
                                    <span>
                                        {data.quantity} Packs × {selectedProduct.pack_size} pcs = 
                                        <span className="font-bold ml-1 text-lg">{calculatedSaveQuantity} Pieces</span>
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reorder_level" className="text-orange-500">Low Stock Alert At (Pieces)</Label>
                            <div className="relative">
                                <Input
                                    id="reorder_level"
                                    type="number"
                                    className="pl-9 font-mono"
                                    value={data.reorder_level}
                                    onChange={e => setData("reorder_level", e.target.value)}
                                />
                                <AlertTriangle className="absolute left-3 top-2.5 h-4 w-4 text-orange-500" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={submit}>
                            {editItem ? "Save Changes" : "Save Stock"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

// --- Sub Components ---
const StatCard = ({ title, value, icon: Icon, color, bg, alert }) => (
    <Card className={`border-border shadow-sm ${alert ? 'ring-2 ring-red-500/20' : ''}`}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={`p-2 rounded-full ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
            </div>
        </CardContent>
    </Card>
);

const InventoryRow = ({ item, onEdit, onDelete }) => {
    if (!item.product) return null;

    const isLow = item.quantity <= item.reorder_level && item.quantity > 0;
    const isOut = item.quantity === 0;
    const percentage = Math.min((item.quantity / (item.reorder_level * 3)) * 100, 100);
    
    // Calculate Packs for display (e.g., 50 pieces = 10 packs of 5)
    const packSize = item.product.pack_size || 1;
    const packs = packSize > 1 ? Math.floor(item.quantity / packSize) : 0;
    const remainder = packSize > 1 ? item.quantity % packSize : 0;
    
    return (
        <TableRow className="group hover:bg-muted/50 transition-colors border-b border-border/50">
            {/* COLUMN 1: PRODUCT DETAILS */}
            <TableCell className="align-top py-4">
                <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {item.product.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                        ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    
                    {/* Name & Pack Info */}
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-foreground text-sm">{item.product.name}</span>
                        <div className="flex flex-wrap gap-2">
                            {/* SKU Badge */}
                            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                                {item.product.sku}
                            </span>
                            
                            {/* Pack Size Badge (Only if it's a pack) */}
                            {packSize > 1 && (
                                <span className="text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    Pack Size: {packSize}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* COLUMN 2: IDENTIFIERS (Barcode) */}
            <TableCell className="align-top py-4">
                 {item.product.barcode ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Barcode className="h-4 w-4 opacity-70" /> 
                        <span className="font-mono">{item.product.barcode}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground text-xs italic">-</span>
                )}
            </TableCell>

            {/* COLUMN 3: STOCK LEVEL (The important part) */}
            <TableCell className="align-top py-4">
                <div className="w-full max-w-[200px] space-y-2">
                    <div className="flex flex-col">
                        {/* BIG NUMBER */}
                        <div className="flex items-baseline gap-2">
                            <span className={`text-lg font-bold ${isOut ? 'text-red-500' : 'text-foreground'}`}>
                                {item.quantity}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium uppercase">Pieces</span>
                        </div>

                        {/* CONVERSION (How many packs?) */}
                        {packSize > 1 && item.quantity > 0 && (
                             <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                = {packs} Full Packs {remainder > 0 && `& ${remainder} pcs`}
                             </span>
                        )}
                    </div>

                    {/* Visual Bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                                isOut ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${isOut ? 100 : percentage}%` }}
                        />
                    </div>
                </div>
            </TableCell>

            {/* COLUMN 4: STATUS */}
            <TableCell className="align-top py-4">
                <StatusBadge isOut={isOut} isLow={isLow} />
            </TableCell>

            {/* COLUMN 5: ACTIONS */}
            <TableCell className="align-top py-4 text-right">
                <ActionMenu onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
            </TableCell>
        </TableRow>
    );
};

const MobileInventoryCard = ({ item, onEdit, onDelete }) => {
    if (!item.product) return null;
    const isLow = item.quantity <= item.reorder_level && item.quantity > 0;
    const isOut = item.quantity === 0;

    const packs = item.product.pack_size > 1 ? Math.floor(item.quantity / item.product.pack_size) : 0;
    
    return (
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <Box className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-foreground">{item.product.name}</h3>
                            <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                        </div>
                    </div>
                    <ActionMenu onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
                </div>
                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-dashed border-border/50">
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Total Pieces</p>
                        <p className="text-lg font-bold">{item.quantity}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Pack Equivalent</p>
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-medium text-indigo-500">{packs} Packs</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const StatusBadge = ({ isOut, isLow, textOnly = false }) => {
    const getBadgeClasses = (color) => `text-${color}-500 bg-${color}-50 dark:bg-${color}-900/50 dark:text-${color}-300 border-transparent`;
    if (isOut) return <Badge variant="outline" className={getBadgeClasses('red')}>Out of Stock</Badge>;
    if (isLow) return <Badge variant="outline" className={getBadgeClasses('orange')}>Low Stock</Badge>;
    return <Badge variant="outline" className={getBadgeClasses('emerald')}>In Stock</Badge>;
};

const ActionMenu = ({ onEdit, onDelete }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const TableEmptyState = () => (
    <TableRow>
        <TableCell colSpan={5} className="h-[400px] text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-full bg-muted">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No items found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    We couldn't find any inventory items matching your search.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>Clear Search</Button>
            </div>
        </TableCell>
    </TableRow>
);

const MobileEmptyState = () => (
    <div className="h-[400px] flex flex-col items-center justify-center space-y-3 text-center p-8 border border-dashed border-border rounded-lg">
        <div className="p-4 rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No items found</h3>
        <Button variant="outline" onClick={() => window.location.reload()}>Clear Search</Button>
    </div>
);