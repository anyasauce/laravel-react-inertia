<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Category;
use Inertia\Inertia;

class CategoryController extends Controller
{
    //
    public function index()
    {
        return Inertia::render('Dashboard/Admin/Category', [
            // We load the count of products so we can show it in the table
            'categories' => Category::withCount('products')->latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
        ]);

        Category::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
        ]);

        $category->update($validated);

        return redirect()->back();
    }

    public function destroy(Category $category)
    {
        // Optional: Check if category has products before deleting
        if ($category->products()->count() > 0) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete category containing products.']);
        }

        $category->delete();

        return redirect()->back();
    }
}
