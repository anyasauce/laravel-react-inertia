<?php

namespace App\Http\Controllers\Global;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    public function index()
    {
        // Fetch products with inventory to check stock
        $products = Product::with('inventory')->get();
        return Inertia::render('Pos', ['products' => $products]);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:products,id',
            'cart.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $cart = $request->cart;
            $total = 0;

            // 1. Create Transaction (Cashier ID is automatically captured here)
            $transaction = Transaction::create([
                'total' => 0, // Will update later
                'cashier_id' => Auth::id(), // <--- THIS CAPTURES THE LOGGED IN USER
            ]);

            foreach ($cart as $item) {
                // Lock for update ensures no one else buys this item at the exact same millisecond
                $product = Product::with('inventory')->lockForUpdate()->find($item['id']);

                if (!$product || $product->inventory->quantity < $item['quantity']) {
                    DB::rollBack();
                    return redirect()->back()->with('error', "Not enough stock for {$product->name}");
                }

                // Decrement Stock
                $product->inventory->decrement('quantity', $item['quantity']);

                // Create Item Record
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                ]);

                $total += $product->price * $item['quantity'];
            }

            // Update final total
            $transaction->update(['total' => $total]);

            DB::commit();

            // USE REDIRECT, NOT RENDER
            return redirect()->back()->with('success', 'Transaction completed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Checkout failed: ' . $e->getMessage());
        }
    }
}