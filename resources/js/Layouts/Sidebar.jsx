import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart,
    User,
    Users,
    Settings,
    ClipboardList,
    Box,
    ChevronLeft,
    LogOut,
    X,
    Store
} from "lucide-react";


function SidebarLink({ href, icon: Icon, active, children, collapsed, badge, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 group ${active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
        >
            <Icon className={`h-5 w-5 shrink-0 transition-colors ${active 
                ? "text-primary-foreground" 
                : "text-muted-foreground group-hover:text-primary"}`} 
            />

            <div className={`flex-1 flex items-center justify-between overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                <span className="truncate">{children}</span>
                {badge && (
                    <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold ${active
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}>{badge}</span>
                )}
            </div>
        </Link>
    );
}

export default function Sidebar({ isOpen, onClose }) {
    const { props, url } = usePage();
    
    const currentUrl = url || window.location.pathname;
    
    const role = props.auth?.user?.role || "guest";
    const userName = props.auth?.user?.name || "Guest User";

    const [collapsed, setCollapsed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);

    const settingsRoute = role === "admin" ? "/admin/settings" : "/user/settings";

    const isActive = (href) => {
        const normalizedCurrent = currentUrl.replace(/\/$/, '');
        const normalizedHref = href.replace(/\/$/, '');

        if (normalizedCurrent === '' || normalizedCurrent === '/') {
            return normalizedHref === '/admin/dashboard' || normalizedHref === '/user/dashboard';
        }

        if (normalizedCurrent === normalizedHref) {
            return true;
        }

        if (normalizedCurrent.startsWith(normalizedHref + '/')) {
            return true;
        }

        return false;
    };

    const adminGroups = [
        {
            title: "Overview",
            items: [
                { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", badge: props.dashboardCount },
                { href: "/admin/analytics", icon: BarChart, label: "Analytics", badge: props.dashboardCount },

            ]
        },
        {
            title: "Business",
            items: [
                { href: "/pos", icon: ShoppingCart, label: "Point of Sale", badge: props.pendingOrdersCount },
                { href: "/admin/inventory", icon: Package, label: "Inventory", badge: props.inventoryCount }, 
                { href: "/admin/products", icon: Box, label: "Products", badge: props.productsCount },
                { href: "/admin/category", icon: Box, label: "Category", badge: props.categoriesCount },
            ]
        },
        {
            title: "Management",
            items: [
                { href: "/admin/employee", icon: Users, label: "Employees", badge: props.newEmployeesCount },
                { href: "/admin/reports", icon: BarChart, label: "Reports", badge: null },
            ]
        }
    ];

    const userGroups = [
        {
            title: "Overview",
            items: [
                { href: "/user/dashboard", icon: LayoutDashboard, label: "Dashboard", badge: props.dashboardCount },
            ]
        },
        {
            title: "Operations",
            items: [
                { href: "/pos", icon: ShoppingCart, label: "Point of Sale", badge: props.pendingOrdersCount },
                { href: "/user/daily-report", icon: ClipboardList, label: "Daily Report", badge: null },
                { href: "/user/stocker", icon: Package, label: "Inventory", badge: props.inventoryCount },
            ]
        },
    ];

    const groupsToShow = role === "admin" ? adminGroups : userGroups;

    const handleLinkClick = () => {
        if (window.innerWidth < 768 && onClose) {
            onClose();
        }
    };

    return (
        <>
            {/* 1. MOBILE: Overlay with Fade Animation */}
            {isOpen && (
                <div
                    // Add conditional class for fade-out to ensure animation on close
                    className={`fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm 
                        transition-opacity duration-300 ease-in-out
                        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                    `}
                    onClick={onClose}
                />
            )}

            {/* 2. SIDEBAR CONTAINER with all Transitions */}
            <aside
                className={`
                    fixed md:sticky top-0 z-50 h-screen border-r border-border/50
                    bg-background
                    transition-[width,transform] duration-300 ease-in-out
                    
                    // Mobile Open/Close Animation (via transform)
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
                    
                    // Desktop Collapse/Expand Animation (via width)
                    ${collapsed ? "md:w-20" : "md:w-64"} w-64
                    
                    flex flex-col shadow-xl md:shadow-none
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0 md:hidden" : "w-auto opacity-100"}`}>
                        
                        {/* BRAND LOGO */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                            <Store className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col whitespace-nowrap">
                            <span className="text-sm font-bold text-foreground">Nexus POS</span>
                            <span className="text-xs text-muted-foreground">v2.0.1</span>
                        </div>
                    </div>

                    {collapsed && (
                        <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mx-auto">
                            <Store className="h-6 w-6" />
                        </div>
                    )}

                    {/* Collapse Button */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted 
                            transition-all duration-200 ${collapsed ? "rotate-180 mx-auto" : "ml-auto"
                            }`}
                    >
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {/* Close Button (Mobile) */}
                    <button
                        onClick={onClose}
                        className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted ml-auto"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                

                {/* Navigation (Grouped) */}
                <div className="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-hide py-2">
                    {groupsToShow.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-1">

                            {/* Group Title Logic */}
                            {collapsed ? (
                                groupIndex > 0 && <div className="border-t border-border/50 my-2 mx-2" />
                            ) : (
                                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">
                                    {group.title}
                                </h3>
                            )}
                            
                            {/* Group Items */}
                            {group.items.map(({ href, icon: Icon, label, badge }, itemIndex) => {
                                const active = isActive(href);
                                
                                return (
                                    <div
                                        key={href}
                                        className="relative"
                                        onMouseEnter={() => setHoveredItem(`${groupIndex}-${itemIndex}`)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                    >
                                        <SidebarLink
                                            href={href}
                                            icon={Icon}
                                            active={active} 
                                            collapsed={collapsed}
                                            badge={badge}
                                            onClick={handleLinkClick}
                                        >
                                            {label}
                                        </SidebarLink>

                                        {/* Tooltip */}
                                        {collapsed && hoveredItem === `${groupIndex}-${itemIndex}` && (
                                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-card text-card-foreground text-sm rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200">
                                                {label}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-card" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* User Info */}
                <div className={`p-4 shrink-0 transition-all duration-300 ${collapsed ? "px-2" : "px-4"}`}>
                    <div className={`flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm border border-border/50 overflow-hidden ${collapsed ? "justify-center" : ""}`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 shrink-0">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className={`flex-1 min-w-0 transition-all duration-300 ${collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                            <p className="text-sm font-semibold truncate text-foreground">{userName}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                                    {role === 'user' ? 'Employee' : role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}