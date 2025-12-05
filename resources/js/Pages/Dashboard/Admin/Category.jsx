import React, { useState } from "react";
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
import {
    Pencil,
    Trash2,
    Plus,
    Search,
    Tag,
    MoreHorizontal,
    Filter,
    FileDown,
    LayoutGrid,
    Archive
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";

export default function Category({ categories = [] }) {
    const [open, setOpen] = useState(false);
    const [editCategory, setEditCategory] = useState(null);
    const [search, setSearch] = useState("");

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        name: "",
        description: "",
    });

    const openCreate = () => {
        setEditCategory(null);
        reset();
        setOpen(true);
    };

    const openEdit = (category) => {
        setEditCategory(category);
        setData({
            name: category.name,
            description: category.description || "",
        });
        setOpen(true);
    };

    const submit = () => {
        const options = {
            onSuccess: () => {
                setOpen(false);
                reset();
                Swal.fire({
                    icon: 'success',
                    title: editCategory ? 'Category Updated' : 'Category Created',
                    text: 'Your catalog structure has been updated.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
            },
            onError: (err) => {
                console.error(err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Please check the form for errors.' });
            },
        };

        if (editCategory) {
            put(`/admin/category/${editCategory.id}`, options);
        } else {
            post('/admin/category', options);
        }
    };

    const handleDelete = (id, count) => {
        if (count > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Cannot Delete',
                text: `This category contains ${count} products. Please move or delete the products first.`
            });
            return;
        }

        Swal.fire({
            title: 'Delete Category?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(`/admin/category/${id}`, {
                    onSuccess: () => Swal.fire('Deleted!', 'Category has been removed.', 'success')
                });
            }
        });
    };

    const filteredCategories = categories.filter(
        c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    );

    const totalCategories = categories.length;
    // Calculate total products across all categories
    const totalProducts = categories.reduce((acc, curr) => acc + (curr.products_count || 0), 0);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Category Management</h2>
                        <p className="text-muted-foreground">
                            Organize your products into specific groups.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="hidden md:flex gap-2">
                            <FileDown className="h-4 w-4" />
                            Export
                        </Button>
                        <Button onClick={openCreate} size="lg" className="gap-2 shadow-sm bg-orange-600 hover:bg-orange-700">
                            <Plus className="h-4 w-4" />
                            Add Category
                        </Button>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard
                        title="Total Categories"
                        value={totalCategories}
                        icon={Tag}
                        color="text-orange-500"
                        bg="bg-orange-500/10"
                        subtext="Active product groups"
                    />
                    <StatCard
                        title="Linked Products"
                        value={totalProducts}
                        icon={Archive}
                        color="text-blue-500"
                        bg="bg-blue-500/10"
                        subtext="Total items categorized"
                    />
                </div>

                <Card className="border-border shadow-xl shadow-border/40 bg-card overflow-hidden">
                    <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-card">
                        <div className="relative w-full sm:w-96 group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search categories..."
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
                                    <TableHead className="w-[30%]">Name</TableHead>
                                    <TableHead className="w-[40%]">Description</TableHead>
                                    <TableHead>Products Count</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.length === 0 ? (
                                    <EmptyState onAction={openCreate} />
                                ) : (
                                    filteredCategories.map(c => (
                                        <CategoryRow
                                            key={c.id}
                                            category={c}
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
                        {filteredCategories.length === 0 ? (
                            <EmptyState onAction={openCreate} />
                        ) : (
                            filteredCategories.map(c => (
                                <MobileCategoryCard
                                    key={c.id}
                                    category={c}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </div>

                    <CardFooter className="border-t border-border/50 p-4 bg-muted/50">
                        <div className="text-xs text-muted-foreground w-full text-center">
                            Showing {filteredCategories.length} categories
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editCategory ? <Pencil className="h-5 w-5 text-orange-500" /> : <Plus className="h-5 w-5 text-emerald-500" />}
                            {editCategory ? "Edit Category" : "Add New Category"}
                        </DialogTitle>
                        <DialogDescription>
                            Create a classification for your products.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
                            <Input 
                                id="name" 
                                value={data.name} 
                                onChange={e => setData("name", e.target.value)} 
                                placeholder="e.g. Beverages" 
                                className="font-medium" 
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={e => setData("description", e.target.value)}
                                placeholder="Optional details about this category..."
                                className="h-24 resize-none"
                            />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={submit} disabled={processing} className="bg-orange-600 hover:bg-orange-700">
                            {editCategory ? "Save Changes" : "Create Category"}
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

const CategoryRow = ({ category, onEdit, onDelete }) => (
    <TableRow className="group hover:bg-muted/50 transition-colors border-b border-border/50">
        <TableCell>
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                    {category.name.substring(0, 1).toUpperCase()}
                </div>
                <span className="font-semibold text-foreground">{category.name}</span>
            </div>
        </TableCell>
        <TableCell>
            <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                {category.description || "No description provided."}
            </span>
        </TableCell>
        <TableCell>
            <Badge variant="secondary" className="font-normal border-border/50">
                {category.products_count || 0} Products
            </Badge>
        </TableCell>
        <TableCell>
            <span className="text-xs text-muted-foreground">
                {new Date(category.created_at).toLocaleDateString()}
            </span>
        </TableCell>
        <TableCell className="text-right">
            <ActionMenu 
                onEdit={() => onEdit(category)} 
                onDelete={() => onDelete(category.id, category.products_count || 0)} 
            />
        </TableCell>
    </TableRow>
);

const MobileCategoryCard = ({ category, onEdit, onDelete }) => (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
        <div className="p-4 flex gap-4 items-center">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl">
                {category.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="grow">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {category.description || 'No description'}
                        </p>
                    </div>
                    <ActionMenu 
                        onEdit={() => onEdit(category)} 
                        onDelete={() => onDelete(category.id, category.products_count || 0)} 
                    />
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] h-5">
                        {category.products_count || 0} Items
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(category.created_at).toLocaleDateString()}
                    </span>
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
                <Pencil className="mr-2 h-4 w-4 text-orange-500" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const EmptyState = ({ onAction }) => (
    <TableRow>
        <TableCell colSpan={5} className="h-[300px] text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-full bg-muted animate-in fade-in zoom-in duration-500">
                    <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No categories found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    Create categories to organize your products efficiently.
                </p>
                <Button onClick={onAction} variant="outline" className="mt-4 border-orange-200 text-orange-600 hover:bg-orange-50">
                    Add Category
                </Button>
            </div>
        </TableCell>
    </TableRow>
);