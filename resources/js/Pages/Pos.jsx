import React, { useState, useEffect, useRef, useCallback } from "react";
// Assuming DashboardLayout handles its own fixed headers/sidebars, etc.
import DashboardLayout from "@/Layouts/DashboardLayout"; 
import { router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import {
    Trash,
    ShoppingCart,
    Plus,
    Minus,
    Search,
    ScanBarcode,
    Receipt,
    PackageOpen,
    Store,
    AlertCircle,
    Maximize,
    Minimize
} from "lucide-react";
import Swal from "sweetalert2";

export default function Pos({ products, flash }) {
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");
    const barcodeInputRef = useRef(null);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

    // State and ref for full-screen functionality
    const [isFullScreen, setIsFullScreen] = useState(false);
    const posContainerRef = useRef(null); 

    // --- FULL SCREEN LOGIC ---

    const toggleFullScreen = useCallback(() => {
        const element = posContainerRef.current;
        
        if (!document.fullscreenElement) {
            if (element && element.requestFullscreen) {
                element.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
                });
            }
        }
    }, []);

    useEffect(() => {
        const handleFullScreenChange = () => {
            const newFullScreenState = !!document.fullscreenElement;
            setIsFullScreen(newFullScreenState);
            
            if (!newFullScreenState && barcodeInputRef.current) {
                barcodeInputRef.current.focus();
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []); 

    useEffect(() => {
        if (window.innerWidth > 768 && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []); 
    
    // --- END FULL SCREEN LOGIC ---


    const filteredProducts = search.trim().length > 0
        ? products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search)) ||
            (p.sku && p.sku.includes(search))
        )
        : [];

    const addToCart = (product, qty = 1) => {
        const getSwalOptions = () => (isFullScreen && posContainerRef.current ? { target: posContainerRef.current, customContainerClass: 'full-screen-swal' } : {});
        
        if (product.inventory.quantity === 0) {
            Swal.fire({ 
                icon: "error", 
                title: "Out of stock", 
                timer: 1000, 
                showConfirmButton: false,
                ...getSwalOptions()
            });
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity + qty > product.inventory.quantity) {
                    Swal.fire({ 
                        icon: "warning", 
                        title: "Max stock reached", 
                        timer: 1000, 
                        showConfirmButton: false,
                        ...getSwalOptions()
                    });
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = productId => setCart(prev => prev.filter(item => item.id !== productId));

    const updateQuantity = (productId, qty) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, Math.min(qty, item.inventory.quantity));
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();
        
        const getSwalOptions = () => (isFullScreen && posContainerRef.current ? { target: posContainerRef.current, customContainerClass: 'full-screen-swal' } : {});

        const handleGlobalKeyDown = (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;
            lastKeyTime = currentTime;

            if (e.target.tagName === "INPUT" && e.target !== barcodeInputRef.current) {
                return;
            }

            if (timeDiff > 50) { 
                buffer = "";
            }

            if (e.key === "Enter") {
                e.preventDefault(); 

                if (buffer.length > 2) {
                    const product = products.find(p => p.barcode === buffer || p.sku === buffer);
                    
                    if (product) {
                        addToCart(product);
                        
                        Swal.fire({
                            icon: 'success',
                            title: `Scanned: ${product.name}`,
                            toast: true,
                            position: 'bottom-start',
                            showConfirmButton: false,
                            timer: 1000,
                            ...getSwalOptions()
                        });

                        setBarcodeInput(""); 
                        buffer = "";
                    } else {
                        Swal.fire({ 
                            icon: "error", 
                            title: "Product not found!", 
                            timer: 1000, 
                            showConfirmButton: false,
                            ...getSwalOptions()
                        });
                        setBarcodeInput("");
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
    }, [products, cart, isFullScreen]);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const checkout = async () => {
        const getSwalOptions = () => (isFullScreen && posContainerRef.current ? { target: posContainerRef.current, customContainerClass: 'full-screen-swal' } : {});
        
        if (cart.length === 0) {
            Swal.fire({ icon: "warning", title: "Cart is empty!", ...getSwalOptions() });
            return;
        }

        setIsMobileCartOpen(false);
        
        const swalTargetOptions = getSwalOptions();

        const { value: cash } = await Swal.fire({
            title: "Enter Cash Amount",
            input: "number",
            inputLabel: `Total due: ₱${total.toLocaleString()}`,
            inputValue: total,
            showCancelButton: true,
            confirmButtonColor: '#10b981', 
            confirmButtonText: "Next",
            preConfirm: (value) => {
                if (value < total) Swal.showValidationMessage(`Insufficient cash! Need ₱${total.toLocaleString()}`);
                return value;
            },
            ...swalTargetOptions
        });

        if (!cash) return;

        const change = parseFloat(cash) - total;

        const { isConfirmed } = await Swal.fire({
            title: "Confirm Payment",
            html: `
                <p>Total: <b>₱${total.toLocaleString()}</b></p>
                <p>Cash received: <b>₱${parseFloat(cash).toLocaleString()}</b></p>
                <p>Change: <b class="text-emerald-500">₱${change.toLocaleString()}</b></p>
            `,
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: '#10b981', 
            confirmButtonText: "Complete Transaction",
            cancelButtonText: "Cancel",
            ...swalTargetOptions
        });

        if (!isConfirmed) return;

        router.post("/pos/checkout", { cart }, {
            onSuccess: () => {
                setCart([]);
                Swal.fire({
                    icon: "success",
                    title: "Paid Successfully",
                    html: `<div class="text-xl mt-2">Change: <b class="text-emerald-500">₱${change.toLocaleString()}</b></div>`,
                    timer: 3000,
                    showConfirmButton: false,
                    ...swalTargetOptions
                });
            },
            onError: (errors) => {
                Swal.fire({ 
                    icon: "error", 
                    title: "Checkout Failed", 
                    text: errors?.cart,
                    ...swalTargetOptions
                });
            }
        });
    };

    const CartItem = ({ item }) => (
        <div className="flex gap-3 p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">{item.name}</h4>
                <div className="text-sm text-muted-foreground flex justify-between items-center mt-1">
                    <span>₱{item.price.toLocaleString()} × {item.quantity}</span>
                    <span className="font-bold text-foreground">₱{(item.price * item.quantity).toLocaleString()}</span>
                </div>
            </div>
            <div className="flex flex-col justify-between items-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => removeFromCart(item.id)}
                >
                    <Trash className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-secondary"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-secondary"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const CartSummary = () => (
        <div className="space-y-3 pt-3">
            <Separator />
            <div className="space-y-1.5 text-xs xl:text-sm">
                <div className="flex justify-between text-foreground/80">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="font-medium">₱{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-foreground/80">
                    <span>Tax (0%)</span>
                    <span className="font-medium">₱0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl xl:text-2xl font-bold pt-2 text-emerald-500">
                    <span>Total</span>
                    <span>₱{total.toLocaleString()}</span>
                </div>
            </div>
            <Button
                size="lg"
                className="w-full font-bold text-white text-base xl:text-lg h-12 xl:h-14 bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                onClick={checkout}
                disabled={cart.length === 0}
            >
                <Receipt className="mr-2 h-4 w-4 xl:h-5 xl:w-5" />
                Charge ₱{total.toLocaleString()}
            </Button>
        </div>
    );

    const posInterface = (
        <div 
            className={`
                ${isFullScreen 
                    ? 'fixed inset-0 z-100 p-2 bg-background'
                    : 'flex-1 p-0'
                } 
                flex flex-col h-full w-full max-w-[1800px] mx-auto
            `}
        >
            <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
                {/* LEFT SIDE: Products */}
                <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden">
                    {/* Search Header */}
                    <Card className="border-border shadow-md shrink-0 bg-card">
                        <div className="p-3 lg:p-4 xl:p-5 flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, barcode, or SKU..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-10 h-11 lg:h-12 text-sm lg:text-base border-border focus:border-primary/50 focus:ring-primary/50"
                                />
                            </div>
                            <div className="relative w-full md:w-56 lg:w-64">
                                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    ref={barcodeInputRef}
                                    placeholder="Scan Barcode (Auto-detect)"
                                    value={barcodeInput}
                                    onChange={e => setBarcodeInput(e.target.value)}
                                    className="pl-9 h-12 border-border focus:border-primary/50 focus:ring-primary/50"
                                />
                            </div>
                            {/* Full-Screen Button */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-12 h-12 shrink-0 border-border hover:bg-secondary transition-colors duration-150"
                                onClick={toggleFullScreen}
                                title={isFullScreen ? "Exit Full Screen (Esc)" : "Enter Full Screen"}
                            >
                                {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                            </Button>
                        </div>
                    </Card>

                    {/* Products Grid */}
                    <div className="flex-1 rounded-xl border border-border bg-card shadow-md overflow-hidden">
                        <ScrollArea className="h-full">
                            {filteredProducts.length === 0 && search.trim().length === 0 ? (
                                <div className="h-[400px] lg:h-[500px] flex flex-col items-center justify-center text-muted-foreground/50">
                                    <Store className="h-16 lg:h-20 w-16 lg:w-20 mb-3 lg:mb-4 opacity-70" />
                                    <p className="text-base lg:text-lg font-medium">Start typing to search products</p>
                                    <p className="text-xs lg:text-sm mt-2">Or scan a barcode to add items</p>
                                </div>
                            ) : filteredProducts.length === 0 && search.trim().length > 0 ? (
                                <div className="h-[400px] lg:h-[500px] flex flex-col items-center justify-center text-muted-foreground/50">
                                    <AlertCircle className="h-16 lg:h-20 w-16 lg:w-20 mb-3 lg:mb-4 opacity-70" />
                                    <p className="text-base lg:text-lg font-medium">No products found</p>
                                    <p className="text-xs lg:text-sm mt-2">Try a different search term</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 p-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 lg:gap-3">
                                    {filteredProducts.map(product => {
                                        const isOutOfStock = product.inventory.quantity === 0;
                                        const isLowStock = product.inventory.quantity > 0 && product.inventory.quantity < 10;

                                        return (
                                            <Card
                                                key={product.id}
                                                onClick={() => !isOutOfStock && addToCart(product)}
                                                className={`
                                                    group relative cursor-pointer overflow-hidden transition-all duration-200 border-border
                                                    ${isOutOfStock
                                                        ? 'opacity-50 bg-muted cursor-not-allowed'
                                                        : 'hover:shadow-lg hover:border-emerald-500 hover:-translate-y-1 active:scale-95'
                                                    }
                                                `}
                                            >
                                                <div className="aspect-square bg-muted relative p-3 lg:p-4 flex items-center justify-center">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="h-40 w-40 object-contain"
                                                        />
                                                    ) : (
                                                        <PackageOpen className="h-12 lg:h-16 w-12 lg:w-16 text-muted-foreground/50" />
                                                    )}

                                                    {isOutOfStock && (
                                                        <div className="absolute inset-0 bg-background/90 flex items-center justify-center backdrop-blur-[2px]">
                                                            <span className="bg-red-500 text-white px-2 lg:px-3 py-1 lg:py-1.5 text-[10px] lg:text-xs font-bold rounded-md transform -rotate-12 shadow-lg">
                                                                OUT OF STOCK
                                                            </span>
                                                        </div>
                                                    )}

                                                    {!isOutOfStock && (
                                                        <Badge className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 hover:bg-emerald-600 text-[10px] lg:text-xs">
                                                            Add +
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="p-2 lg:p-3 bg-card">
                                                    <h3 className="font-semibold text-xs lg:text-sm line-clamp-2 min-h-9 lg:min-h-10 leading-tight mb-1.5 lg:mb-2 text-foreground">
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-bold text-sm lg:text-base text-emerald-500">
                                                            ₱{product.price.toLocaleString()}
                                                        </span>
                                                        <span className={`
                                                            text-[9px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full font-medium
                                                            ${isLowStock
                                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                                                                : 'bg-muted text-muted-foreground'
                                                            }
                                                        `}>
                                                            {product.inventory.quantity} left
                                                        </span>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                {/* RIGHT SIDE: DESKTOP CART */}
                <ScrollArea>
                    <div className="hidden lg:flex lg:w-[360px] xl:w-[400px] 2xl:w-[440px] flex-col h-full shrink-0">
                        <Card className="flex-1 flex flex-col shadow-xl border-border h-full overflow-hidden">
                            <CardHeader className="bg-secondary pb-4 border-b border-border/50 shrink-0">
                                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                                    <Receipt className="h-5 w-5 text-primary" />
                                    Current Order
                                </CardTitle>
                            </CardHeader>

                            <ScrollArea className="flex-1 p-3 xl:p-4 bg-background">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 py-12">
                                        <ShoppingCart className="h-16 w-16 mb-3 opacity-70" />
                                        <p className="text-base font-medium">Cart is empty</p>
                                        <p className="text-xs mt-1">Add products to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {cart.map(item => <CartItem key={item.id} item={item} />)}
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="p-4 xl:p-5 bg-secondary border-t border-border/50 shrink-0">
                                <CartSummary />
                            </div>
                        </Card>
                    </div>
                </ScrollArea>

                {/* MOBILE/TABLET FLOATING FOOTER */}
                {/* FIX: Increased z-index from z-50 to z-[101] to ensure it's above the posInterface z-100 */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border lg:hidden z-101 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between gap-4 max-w-[1800px] mx-auto">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium">{totalItems} Items</span>
                            <span className="text-2xl font-bold text-emerald-500">₱{total.toLocaleString()}</span>
                        </div>

                        <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
                            <SheetTrigger asChild>
                                <Button size="lg" className="rounded-full shadow-lg gap-2 px-8 h-14 bg-emerald-500 hover:bg-emerald-600 relative">
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="font-bold">View Cart</span>
                                    {totalItems > 0 && (
                                        <Badge className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 flex items-center justify-center bg-red-500">
                                            {totalItems}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>

                            <SheetContent
                                side="bottom"
                                className="h-[90vh] flex flex-col p-0 rounded-t-3xl border-t-4 border-emerald-500 bg-background"
                                // Potential Fix: Add a high z-index to the sheet content itself
                                // Since this is a utility/UI component, we'll trust that higher z-index helps
                                style={{ zIndex: 9999999 }} 
                            >
                                <SheetHeader className="p-5 border-b border-border/50 bg-secondary shrink-0">
                                    <SheetTitle className="flex items-center gap-2 text-lg text-foreground">
                                        <Receipt className="h-6 w-6 text-primary" />
                                        Current Order
                                    </SheetTitle>
                                </SheetHeader>

                                <ScrollArea className="flex-1 p-4 bg-background">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 py-20">
                                            <ShoppingCart className="h-20 w-20 mb-4 opacity-70" />
                                            <p className="text-lg font-medium">Your cart is empty</p>
                                            <p className="text-sm mt-2">Add some products to continue</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {cart.map(item => <CartItem key={item.id} item={item} />)}
                                        </div>
                                    )}
                                </ScrollArea>

                                <div className="p-5 border-t border-border/50 bg-secondary pb-8 shrink-0">
                                    <CartSummary />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </div>
    );


    return (
        <DashboardLayout>
            <div 
                ref={posContainerRef}
                className={`
                    w-full h-full 
                    ${isFullScreen 
                        ? 'min-h-screen' 
                        : 'h-[calc(100vh-65px)] md:h-[calc(100vh-100px)] p-3 md:p-1' 
                    }
                `}
            >
                {posInterface}
            </div>
        </DashboardLayout>
    );
}