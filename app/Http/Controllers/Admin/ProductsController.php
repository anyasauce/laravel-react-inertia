<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductsController extends Controller
{
    public function index()
    {
        // Eager load 'category' so we can display the name in the table
        $products = Product::with(['inventory', 'category'])->orderBy('id', 'desc')->get();

        return Inertia::render('Dashboard/Admin/Products', [
            'products' => $products,
            'categories' => Category::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'sku' => 'required|unique:products',
            'barcode' => 'nullable|unique:products',
            'price' => 'required|numeric',
            'pack_size' => 'required|integer|min:1',
            'pack_price' => 'nullable|numeric',

            'category_id' => 'nullable|exists:categories,id',

            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ];

        $validated = $request->validate($rules);

        $data = $validated;
        $data['image_url'] = null;

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $slug = Str::slug($validated['name']);
            $filename = $slug.'-'.time().'.'.$file->extension();
            $path = $file->storeAs('assets/uploads/products', $filename, 'public');
            $data['image_url'] = '/storage/'.$path;

        } elseif (! empty($validated['image_url'])) {
            if (Str::startsWith($validated['image_url'], ['http://', 'https://'])) {
                $request->validate(['image_url' => 'url'], ['image_url.url' => 'The image URL must be a valid external URL.']);
            }
            $data['image_url'] = $validated['image_url'];
        }

        unset($data['image_file']);

        $product = Product::create($data);

        // --- START FIX: Set Initial Quantity based on Pack Size ---

        // If pack_size is 1 (single item), quantity starts at 0.
        // If pack_size > 1 (multi-pack), quantity starts at the size of ONE pack (assuming you start with one pack).
        $initialQuantity = ($validated['pack_size'] > 1)
                           ? (int) $validated['pack_size']
                           : 0;

        $product->inventory()->create([
            'quantity' => $initialQuantity, // Initial Quantity is now 0 or pack_size
            'reorder_level' => 5,
        ]);

        // --- END FIX ---

        return back()->with('success', 'Product added successfully!');
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $rules = [
            'name' => 'required|string|max:255',
            'sku' => ['required', Rule::unique('products')->ignore($id)],
            'barcode' => ['nullable', Rule::unique('products')->ignore($id)],
            'price' => 'required|numeric',
            'pack_size' => 'required|integer|min:1',
            'pack_price' => 'nullable|numeric',

            'category_id' => 'nullable|exists:categories,id',

            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ];

        $validated = $request->validate($rules);
        $data = $validated;

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $slug = Str::slug($validated['name']);
            $filename = $slug.'-'.time().'.'.$file->extension();
            $path = $file->storeAs('assets/uploads/products', $filename, 'public');
            $data['image_url'] = '/storage/'.$path;

            if ($product->image_url && ! Str::startsWith($product->image_url, ['http', 'https'])) {
                $oldFilePath = Str::after($product->image_url, '/storage/');
                Storage::disk('public')->delete($oldFilePath);
            }

        } elseif (! empty($validated['image_url'])) {
            $isExternalUrl = Str::startsWith($validated['image_url'], ['http://', 'https://']);

            if ($isExternalUrl) {
                $request->validate(['image_url' => 'url'], ['image_url.url' => 'The image URL must be a valid external URL.']);
            }
            $data['image_url'] = $validated['image_url'];

        } else {
            if (! $product->image_url && ! empty($data['image_url'])) {
                $data['image_url'] = null;
            }
            if (empty($data['image_url']) && empty($request->file('image_file'))) {
                unset($data['image_url']);
            }
        }

        unset($data['image_file']);

        $product->update($data);

        return back()->with('success', 'Product updated successfully!');
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return back()->with('success', 'Product deleted successfully!');
    }
}
