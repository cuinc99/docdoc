<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $invoice_id
 * @property string $amount
 * @property string $method
 * @property string|null $reference
 * @property int $received_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Invoice $invoice
 * @property-read User $receivedBy
 */
class Payment extends Model
{
    protected $fillable = ['invoice_id', 'amount', 'method', 'reference', 'received_by'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
    public function receivedBy(): BelongsTo { return $this->belongsTo(User::class, 'received_by'); }
}
