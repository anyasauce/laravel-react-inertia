import React, { useState, useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useForm } from "@inertiajs/react";
import {
    Card, CardHeader, CardTitle, CardContent, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pencil, Trash2, Plus, Barcode, Search, Package, Tag, MoreHorizontal,
    Image as ImageIcon, Filter, FileDown, DollarSign, Box, X, Loader2, ScanBarcode, Layers
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";

const isLocalPath = (url) => url && url.startsWith('/storage/');

export default function Products({ products = [], categories = [] }) {
    const [open, setOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [search, setSearch] = useState("");
    const [isScanning, setIsScanning] = useState(false);

    const { data, setData, post, put, delete: destroy, reset, errors } = useForm({
        name: "",
        sku: "",
        barcode: "",
        price: 0,
        pack_size: 1, 
        pack_price: "",
        category_id: "", 
        description: "",
        image_url: "",
        image_file: null,
    });

    const imagePreviewUrl = useMemo(() => {
        if (data.image_file) {
            return URL.createObjectURL(data.image_file);
        }
        return data.image_url;
    }, [data.image_file, data.image_url]);

    // --- NEW: Dynamic Calculation Handlers ---

    // 1. When Price changes -> Calculate Pack Price automatically
    const handlePriceChange = (e) => {
        const newPrice = e.target.value;
        const currentPackSize = data.pack_size || 1;
        
        // Calculate: Price * Size
        const autoPackPrice = newPrice * currentPackSize;

        setData(prev => ({
            ...prev,
            price: newPrice,
            // Automatically fill the pack_price field with the real value
            pack_price: autoPackPrice
        }));
    };

    // 2. When Pack Size changes -> Calculate Pack Price automatically
    const handlePackSizeChange = (e) => {
        const newSize = e.target.value;
        const currentPrice = data.price || 0;
        
        // Calculate: Price * Size
        const autoPackPrice = currentPrice * newSize;

        setData(prev => ({
            ...prev,
            pack_size: newSize,
            // Automatically fill the pack_price field with the real value
            pack_price: autoPackPrice
        }));
    };

    // ----------------------------------------

    const openCreate = () => {
        setEditProduct(null);
        reset();
        setData(data => ({ ...data, pack_size: 1, category_id: "" })); 
        setOpen(true);
    };

    const openEdit = (product) => {
        setEditProduct(product);
        
        let initialImageUrl = product.image_url || "";
        
        if (isLocalPath(initialImageUrl)) {
            initialImageUrl = initialImageUrl;
        } else {
            initialImageUrl = product.image_url || "";
        }

        setData({
            name: product.name,
            sku: product.sku || "",
            barcode: product.barcode || "",
            price: product.price,
            pack_size: product.pack_size || 1,
            pack_price: product.pack_price || "", 
            
            category_id: product.category_id ? String(product.category_id) : "", 
            
            description: product.description || "",
            image_url: initialImageUrl,
            image_file: null,
        });
        setOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData(prevData => ({
                ...prevData,
                image_file: file,
                image_url: '',
            }));
        }
    };
    
    const handleUrlChange = (e) => {
        setData(prevData => ({
            ...prevData,
            image_url: e.target.value,
            image_file: null,
        }));
    };
    
    const clearImage = () => {
         setData(prevData => ({
            ...prevData,
            image_file: null,
            image_url: '',
        }));
    }

    const fetchProductByBarcode = async () => {
        const barcodeToScan = data.barcode;

        if (!barcodeToScan) {
            Swal.fire({
                icon: 'warning',
                title: 'Barcode Required',
                text: 'Please enter a barcode number first.',
                toast: true,
                position: 'top-end',
                timer: 3000
            });
            return;
        }

        setIsScanning(true);

        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeToScan}.json`);
            const result = await response.json();

            if (result.status === 1) {
                const product = result.product;
                
                const generatedSku = product.code || data.sku;
                
                setData(prevData => ({
                    ...prevData,
                    name: product.product_name || prevData.name,
                    sku: generatedSku,
                    image_url: product.image_url || prevData.image_url,
                    image_file: null,
                    description: product.generic_name || (product.brands ? `Brand: ${product.brands}` : '')
                }));

                Swal.fire({
                    icon: 'success',
                    title: 'Product Found!',
                    text: 'Details filled. Please select a category manually.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Product Not Found',
                    text: 'This barcode does not exist in the OpenFoodFacts database.',
                });
            }
        } catch (error) {
            console.error("API Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Scan Failed',
                text: 'Could not connect to the product database.',
            });
        } finally {
            setIsScanning(false);
        }
    };

    const submit = () => {
        const options = {
            onSuccess: () => {
                setOpen(false);
                reset();
                Swal.fire({
                    icon: 'success',
                    title: editProduct ? 'Product Updated' : 'Product Created',
                    text: 'Your catalog has been updated successfully.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
                if (data.image_file) {
                    URL.revokeObjectURL(imagePreviewUrl);
                }
            },
            onError: (err) => {
                console.error(err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Please check the form for errors.' });
            },
        };

        if (editProduct) {
            put(`/admin/products/${editProduct.id}`, {
                ...data,
                _method: 'put',
                ...options,
            });
        } else {
            post('/admin/products', options);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Delete Product?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(`/admin/products/${id}`, {
                    onSuccess: () => Swal.fire('Deleted!', 'Product has been removed.', 'success')
                });
            }
        });
    };

    const filteredProducts = products.filter(
        p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
            (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()))
    );

    const totalProducts = products.length;
    const totalCategories = [...new Set(products.map(p => p.category_id).filter(Boolean))].length;
    const averagePrice = totalProducts > 0
        ? products.reduce((acc, curr) => acc + Number(curr.price), 0) / totalProducts
        : 0;

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Products Management</h2>
                        <p className="text-muted-foreground">
                            Manage catalog, pricing, and product details.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="hidden md:flex gap-2">
                            <FileDown className="h-4 w-4" />
                            Export
                        </Button>
                        <Button onClick={openCreate} size="lg" className="gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Products"
                        value={totalProducts}
                        icon={Package}
                        color="text-indigo-500"
                        bg="bg-indigo-500/10"
                        subtext="Active items in catalog"
                    />
                    <StatCard
                        title="Categories"
                        value={totalCategories}
                        icon={Tag}
                        color="text-pink-500"
                        bg="bg-pink-500/10"
                        subtext="Distinct product types"
                    />
                    <StatCard
                        title="Avg. Price"
                        value={`₱${averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        icon={DollarSign}
                        color="text-emerald-500"
                        bg="bg-emerald-500/10"
                        subtext="Average item value"
                    />
                </div>

                <Card className="border-border shadow-xl shadow-border/40 bg-card overflow-hidden">
                    <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-card">
                        <div className="relative w-full sm:w-96 group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search products, SKU, or barcode..."
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

                    {/* VIEW A: Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-20">Image</TableHead>
                                    <TableHead className="w-[30%]">Product Info</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Codes</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <EmptyState onAction={openCreate} />
                                ) : (
                                    filteredProducts.map(p => (
                                        <ProductRow
                                            key={p.id}
                                            product={p}
                                            onEdit={openEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* VIEW B: Mobile Card Grid */}
                    <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-muted/50">
                        {filteredProducts.length === 0 ? (
                            <EmptyState onAction={openCreate} />
                        ) : (
                            filteredProducts.map(p => (
                                <MobileProductCard
                                    key={p.id}
                                    product={p}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </div>

                    <CardFooter className="border-t border-border/50 p-4 bg-muted/50">
                        <div className="text-xs text-muted-foreground w-full text-center">
                            Showing {filteredProducts.length} products
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editProduct ? <Pencil className="h-5 w-5 text-indigo-500" /> : <Plus className="h-5 w-5 text-emerald-500" />}
                            {editProduct ? "Edit Product Details" : "Add New Product"}
                        </DialogTitle>
                        <DialogDescription>Manage product identification, pricing, and display information.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Image Preview Side */}
                            <div className="shrink-0 flex justify-center md:justify-start">
                                <div className="h-32 w-32 md:h-40 md:w-40 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden relative group">
                                    {imagePreviewUrl ? (
                                        <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <ImageIcon className="h-8 w-8 mb-2" />
                                            <span className="text-xs">No Image</span>
                                        </div>
                                    )}
                                    
                                    {imagePreviewUrl && (
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/50 text-foreground hover:bg-background/80 transition-opacity opacity-0 group-hover:opacity-100"
                                            onClick={clearImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Main Inputs */}
                            <div className="grow space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                                    <Input id="name" value={data.name} onChange={e => setData("name", e.target.value)} placeholder="e.g. Wireless Mechanical Keyboard" className="font-medium" />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="category_id">Category</Label>
                                        <Select
                                            value={data.category_id}
                                            onValueChange={(value) => setData("category_id", value)}
                                        >
                                            <SelectTrigger id="category_id">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories && categories.length > 0 ? (
                                                    categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-center text-muted-foreground">
                                                        No categories found
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                                    </div>

                                    {/* UPDATED PRICE INPUT: Uses handlePriceChange */}
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price (₱) <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">₱</span>
                                            <Input 
                                                id="price" 
                                                type="number" 
                                                value={data.price} 
                                                onChange={handlePriceChange} // <--- UPDATED THIS
                                                className="pl-7 font-mono" 
                                            />
                                            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- SKU AND PACK SIZE --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU Code</Label>
                                <div className="relative">
                                    <Box className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="sku" value={data.sku} onChange={e => setData("sku", e.target.value)} className="pl-9 font-mono text-sm uppercase" placeholder="PROD-001" />
                                    {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
                                </div>
                            </div>

                            {/* UPDATED PACK SIZE INPUT: Uses handlePackSizeChange */}
                            <div className="space-y-2">
                                <Label htmlFor="pack_size">Pack Size (Pieces)</Label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="pack_size" 
                                        type="number" 
                                        min="1"
                                        value={data.pack_size} 
                                        onChange={handlePackSizeChange} // <--- UPDATED THIS
                                        className="pl-9 font-mono text-sm" 
                                        placeholder="1" 
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">e.g. 1 for Single, 50 for Bag.</p>
                                {errors.pack_size && <p className="text-sm text-red-500">{errors.pack_size}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pack_price">Pack Price (₱)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₱</span>
                                    <Input 
                                        id="pack_price" 
                                        type="number" 
                                        value={data.pack_price} 
                                        onChange={e => setData("pack_price", e.target.value)} 
                                        className="pl-7 font-mono" 
                                        placeholder={data.pack_size > 1 ? "Auto-calculated" : ""}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Price if buying whole pack</p>
                            </div>
                        </div>

                        {/* Barcode Row */}
                        <div className="space-y-2">
                            <Label htmlFor="barcode">Barcode (ISBN/EAN)</Label>
                            <div className="flex gap-2">
                                <div className="relative grow">
                                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="barcode"
                                        value={data.barcode}
                                        onChange={e => setData("barcode", e.target.value)}
                                        className="pl-9 font-mono text-sm"
                                        placeholder="Scan barcode..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                fetchProductByBarcode();
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="shrink-0"
                                    onClick={fetchProductByBarcode}
                                    disabled={isScanning}
                                    title="Scan/Fetch from OpenFoodFacts"
                                >
                                    {isScanning ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                    ) : (
                                        <ScanBarcode className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {errors.barcode && <p className="text-sm text-red-500">{errors.barcode}</p>}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="image_file">Upload Image</Label>
                            <Input id="image_file" type="file" accept="image/*" onChange={handleFileChange} />
                            <p className="text-xs text-muted-foreground">
                                Upload a new image (overrides any existing image or URL).
                            </p>
                            {errors.image_file && <p className="text-sm text-red-500">{errors.image_file}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image_url">Image URL</Label>
                            <Input
                                id="image_url"
                                value={isLocalPath(data.image_url) ? '' : data.image_url}
                                onChange={handleUrlChange}
                                placeholder="https://external.com/image.jpg"
                                className="text-xs text-muted-foreground"
                                disabled={!!data.image_file}
                            />
                            
                            {(isLocalPath(data.image_url) && !data.image_file) && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    Currently using **Local File**.
                                </p>
                            )}
                            
                            {(data.image_url && !isLocalPath(data.image_url) && !data.image_file) && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    Currently using **External URL**.
                                </p>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                                Or, use a direct image URL (disabled if a file is selected above).
                            </p>
                            {errors.image_url && <p className="text-sm text-red-500">{errors.image_url}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={e => setData("description", e.target.value)}
                                placeholder="Product details and specifications..."
                                className="h-20 resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={submit} disabled={data.processing}>
                            {editProduct ? "Save Changes" : "Create Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

// --- Sub Components ---

const StatCard = ({ title, value, icon: Icon, color, bg, subtext }) => (
    <Card className="border-border shadow-sm">
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={`p-2 rounded-full ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </div>
            <div className="mt-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            </div>
        </CardContent>
    </Card>
);

const ProductRow = ({ product, onEdit, onDelete }) => (
    <TableRow className="group hover:bg-muted/50 transition-colors border-b border-border/50">
        <TableCell>
            <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
            </div>
        </TableCell>
        <TableCell>
            <div className="flex flex-col max-w-[200px]">
                <span className="font-semibold text-foreground truncate">{product.name}</span>
                {/* Visual Indicator if it is a Pack */}
                {product.pack_size > 1 && (
                    <Badge variant="outline" className="w-fit text-[10px] px-1 py-0 border-indigo-200 bg-indigo-50 text-indigo-700 mb-1">
                        Pack of {product.pack_size}
                    </Badge>
                )}
                <span className="text-xs text-muted-foreground truncate">{product.description || "No description."}</span>
            </div>
        </TableCell>
        <TableCell>
            {/* CHANGED: Display Category Name via Relationship */}
            {product.category ? (
                <Badge variant="secondary" className="font-normal text-secondary-foreground bg-secondary border-border/50">
                    {product.category.name}
                </Badge>
            ) : (
                <span className="text-muted-foreground text-sm">-</span>
            )}
        </TableCell>
        <TableCell>
            <div className="flex flex-col gap-1">
                {product.sku && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit border border-border/50">
                        {product.sku}
                    </span>
                )}
                {product.barcode && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Barcode className="h-3 w-3" /> {product.barcode}
                    </span>
                )}
            </div>
        </TableCell>
        <TableCell>
            <span className="font-mono font-semibold text-foreground">₱{Number(product.price).toLocaleString()}</span>
        </TableCell>
        <TableCell className="text-right">
            <ActionMenu onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} />
        </TableCell>
    </TableRow>
);

const MobileProductCard = ({ product, onEdit, onDelete }) => (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
        <div className="flex p-3 gap-3">
            <div className="h-20 w-20 shrink-0 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
            </div>
            <div className="grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="pr-2">
                        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{product.name}</h3>
                        {/* CHANGED: Category name check */}
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {product.category?.name || 'Uncategorized'}
                        </p>
                        {product.pack_size > 1 && (
                            <span className="text-[10px] font-bold text-indigo-500">
                                (Pack of {product.pack_size})
                            </span>
                        )}
                    </div>
                    <ActionMenu onEdit={() => onEdit(product)} onDelete={() => onDelete(product.id)} />
                </div>
                <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-indigo-500">₱{Number(product.price).toLocaleString()}</span>
                    {product.sku && (
                        <span className="text-[10px] font-mono bg-muted px-1 rounded text-muted-foreground">
                            {product.sku}
                        </span>
                    )}
                </div>
            </div>
        </div>
    </Card>
);

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
                <Pencil className="mr-2 h-4 w-4 text-indigo-500" /> Edit Product
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const EmptyState = ({ onAction }) => (
    <TableRow>
        <TableCell colSpan={6} className="h-[400px] text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-full bg-muted animate-in fade-in zoom-in duration-500">
                    <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No products found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    Your catalog is empty or no results matched your search.
                </p>
                <Button onClick={onAction} variant="outline" className="mt-4 border-primary/20 text-primary hover:bg-primary/10">
                    Add Your First Product
                </Button>
            </div>
        </TableCell>
    </TableRow>
);