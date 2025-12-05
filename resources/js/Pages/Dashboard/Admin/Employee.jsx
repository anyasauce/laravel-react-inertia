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
    Users,
    UserPlus,
    Mail,
    Shield,
    Calendar,
    Filter,
    FileDown,
    MoreHorizontal,
    Lock
} from "lucide-react";
import Swal from "sweetalert2";

export default function Employee({ employees, stats }) {
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");

    // Inertia Form
    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        id: "",
        name: "",
        email: "",
        // password: "",
    });

    const openCreate = () => {
        setEditMode(false);
        reset();
        setOpen(true);
    };

    const openEdit = (employee) => {
        setEditMode(true);
        setData({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            // password: "", // Empty password initially for security
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
                    title: editMode ? 'Updated' : 'Created',
                    text: `Employee has been ${editMode ? 'updated' : 'added'} successfully.`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
            },
            onError: (err) => {
                // Swal.fire({ icon: 'error', title: 'Error', text: 'Please check your input.' });
            }
        };

        if (editMode) {
            put(`/admin/employee/${data.id}`, options);
        } else {
            post("/admin/employee", options);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Remove Employee?',
            text: "This user will no longer be able to login.",
            icon: 'warning',
            showCancelButton: true,
            // FIX: Use theme-aware colors for Swal buttons
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, remove user'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(`/admin/employee/${id}`, {
                    onSuccess: () => Swal.fire('Removed!', 'Employee has been removed.', 'success')
                });
            }
        });
    };

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-8 p-2 md:p-4 max-w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
                        <p className="text-muted-foreground">
                            Manage user access, accounts, and roles.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="hidden md:flex gap-2">
                            <FileDown className="h-4 w-4" />
                            Export List
                        </Button>
                         {/* FIX 1: Use default primary button style */}
                         <Button onClick={openCreate} size="lg" className="gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            Add Employee
                        </Button>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Employees"
                        value={stats.total}
                        icon={Users}
                        // FIX 2: Use theme-aware accent colors (indigo)
                        color="text-indigo-500"
                        bg="bg-indigo-500/10"
                    />
                    <StatCard
                        title="New This Month"
                        value={stats.new_this_month}
                        icon={UserPlus}
                        // FIX 2: Use theme-aware accent colors (emerald)
                        color="text-emerald-500"
                        bg="bg-emerald-500/10"
                    />
                    <StatCard
                        title="Active Role"
                        value="User"
                        icon={Shield}
                        // FIX 2: Use theme-aware accent colors (blue)
                        color="text-blue-500"
                        bg="bg-blue-500/10"
                    />
                     {/* Placeholder Stat */}
                     <StatCard
                        title="System Access"
                        value="Granted"
                        icon={Lock}
                        // FIX 2: Use theme-aware accent colors (orange)
                        color="text-orange-500"
                        bg="bg-orange-500/10"
                    />
                </div>

                {/* Main Content Wrapper */}
                {/* FIX 3: Use theme-aware card background/shadows */}
                <Card className="border-border shadow-xl shadow-border/40 bg-card overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-card">
                        <div className="relative w-full sm:w-96 group">
                            {/* FIX 4: Use primary color on focus */}
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                // FIX 5: Use theme-aware muted background/border on input
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

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            {/* FIX 6: Use theme-aware table header background */}
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40%]">Employee Info</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    filteredEmployees.map(e => (
                                        <EmployeeRow
                                            key={e.id}
                                            employee={e}
                                            onEdit={openEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card Grid */}
                    {/* FIX 7: Use theme-aware background for card grid */}
                    <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-muted/50">
                        {filteredEmployees.length === 0 ? (
                            <EmptyState />
                        ) : (
                            filteredEmployees.map(e => (
                                <MobileEmployeeCard
                                    key={e.id}
                                    employee={e}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </div>

                    {/* FIX 8: Use theme-aware footer background and border */}
                    <CardFooter className="border-t border-border/50 p-4 bg-muted/50">
                        <div className="text-xs text-muted-foreground w-full text-center flex justify-between items-center">
                            <span>Showing {filteredEmployees.length} employees</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {/* FIX 9: Use theme-aware accent colors */}
                            {editMode ? <Pencil className="h-5 w-5 text-indigo-500" /> : <Plus className="h-5 w-5 text-emerald-500" />}
                            {editMode ? "Edit Employee" : "Add New Employee"}
                        </DialogTitle>
                        <DialogDescription>
                            {editMode
                                ? "Update user details."
                                : "Create a new user account for the system."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    className="pl-9"
                                    value={data.name}
                                    onChange={e => setData("name", e.target.value)}
                                />
                            </div>
                            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    className="pl-9"
                                    value={data.email}
                                    onChange={e => setData("email", e.target.value)}
                                />
                            </div>
                            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                        </div>

                        {/*<div className="space-y-2">*/}
                        {/*    <Label htmlFor="password">*/}
                        {/*        {editMode ? "New Password (Optional)" : "Password"}*/}
                        {/*    </Label>*/}
                        {/*    <div className="relative">*/}
                        {/*        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />*/}
                        {/*        <Input*/}
                        {/*            id="password"*/}
                        {/*            type="password"*/}
                        {/*            placeholder={editMode ? "Leave blank to keep current" : "Min. 8 characters"}*/}
                        {/*            className="pl-9"*/}
                        {/*            value={data.password}*/}
                        {/*            onChange={e => setData("password", e.target.value)}*/}
                        {/*        />*/}
                        {/*    </div>*/}
                        {/*    {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}*/}
                        {/*</div>*/}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        {/* FIX 10: Use primary button style (default) */}
                        <Button onClick={submit} disabled={processing}>
                            {editMode ? "Save Changes" : "Create Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

// --- Sub Components ---

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    // FIX 11: Use theme-aware card background/shadow
    <Card className="border-border shadow-sm">
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {/* Icon container uses transparent background with colored icon */}
                <div className={`p-2 rounded-full ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                 {/* FIX 12: Use theme-aware foreground text */}
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
            </div>
        </CardContent>
    </Card>
);

const EmployeeRow = ({ employee, onEdit, onDelete }) => {
    // FIX 13: Use theme-aware badge classes
    const getBadgeClasses = (role) => {
        // We'll use Indigo as the base accent color for employees/users
        return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-normal";
    };

    return (
        // FIX 14: Use theme-aware hover color and border
        <TableRow className="group hover:bg-muted/50 transition-colors border-b border-border/50">
            <TableCell>
                <div className="flex items-center gap-4">
                    {/* FIX 15: Use theme-aware avatar background/text/border (indigo/primary accent) */}
                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-sm border-2 border-background shadow-sm">
                        {employee.initials}
                    </div>
                    <div className="flex flex-col">
                        {/* FIX 16: Use theme-aware foreground text */}
                        <span className="font-semibold text-foreground">{employee.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                 <Badge variant="outline" className={getBadgeClasses(employee.role)}>
                    {employee.role}
                 </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground/80" />
                    {employee.created_at}
                </div>
            </TableCell>
            <TableCell className="text-right">
                <ActionMenu onEdit={() => onEdit(employee)} onDelete={() => onDelete(employee.id)} />
            </TableCell>
        </TableRow>
    );
};

const MobileEmployeeCard = ({ employee, onEdit, onDelete }) => {
    // FIX 17: Use theme-aware badge classes
    const getBadgeClasses = (role) => {
        return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-normal";
    };

    return (
        // FIX 18: Use theme-aware card background/border
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {/* FIX 19: Use theme-aware avatar background/text/border (indigo/primary accent) */}
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-sm">
                            {employee.initials}
                        </div>
                        <div>
                            {/* FIX 20: Use theme-aware foreground text */}
                            <h3 className="font-semibold text-sm text-foreground">{employee.name}</h3>
                             <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Mail className="h-3 w-3" /> {employee.email}
                            </div>
                        </div>
                    </div>
                    <ActionMenu onEdit={() => onEdit(employee)} onDelete={() => onDelete(employee.id)} />
                </div>

                {/* FIX 21: Use theme-aware border */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-dashed border-border/50">
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Role</p>
                        <Badge variant="outline" className={`mt-1 ${getBadgeClasses(employee.role)}`}>
                            {employee.role}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Joined</p>
                        <div className="flex items-center gap-1 mt-1 text-sm text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
                            {employee.created_at}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const ActionMenu = ({ onEdit, onDelete }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            {/* FIX 22: Use theme-aware hover color and icon color */}
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onEdit}>
                {/* FIX 23: Use theme-aware accent color (blue) */}
                <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* FIX 24: Use theme-aware red accent color */}
            <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                <Trash2 className="mr-2 h-4 w-4" /> Remove User
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const EmptyState = () => (
    <TableRow>
        <TableCell colSpan={4} className="h-[400px] text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
                {/* FIX 25: Use theme-aware background/text */}
                <div className="p-4 rounded-full bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                {/* FIX 26: Use theme-aware foreground text */}
                <h3 className="text-lg font-medium text-foreground">No employees found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    Try adjusting your search or add a new employee to get started.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>Clear Search</Button>
            </div>
        </TableCell>
    </TableRow>
);
