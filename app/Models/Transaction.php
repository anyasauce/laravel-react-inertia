<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model {
    protected $fillable = ['total','cashier_id'];

    public function items(){ return $this->hasMany(TransactionItem::class); }
    public function cashier(){ return $this->belongsTo(User::class,'cashier_id'); }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // adjust column if needed
    }
}
