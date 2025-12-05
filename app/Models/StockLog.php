<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockLog extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'inventory_id',
        'user_id',
        'quantity_adjusted',
        'new_quantity',
        'type',
        'notes',
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // adjust if column is different
    }

}