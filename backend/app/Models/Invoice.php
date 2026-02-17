<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $invoice_number
 * @property int $patient_id
 * @property array<int, array{description: string, quantity: int, unit_price: string, total: string}> $items
 * @property string $subtotal
 * @property string $discount
 * @property string $tax
 * @property string $total
 * @property string $paid_amount
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Patient $patient
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Payment> $payments
 */
class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number', 'patient_id', 'items',
        'subtotal', 'discount', 'tax', 'total',
        'paid_amount', 'status',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => 'pending',
        'paid_amount' => 0,
        'discount' => 0,
        'tax' => 0,
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Invoice $invoice): void {
            if (empty($invoice->invoice_number)) {
                $invoice->invoice_number = self::generateNumber();
            }
        });
    }

    public static function generateNumber(): string
    {
        $prefix = 'INV' . now()->format('ym');
        $last = self::where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        $count = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }

    public function recalculateStatus(): void
    {
        $total = (float) $this->total;
        $paid = (float) $this->paid_amount;

        if ($paid <= 0) {
            $this->status = 'pending';
        } elseif ($paid >= $total) {
            $this->status = 'paid';
        } else {
            $this->status = 'partial';
        }

        $this->save();
    }

    public function addPayment(float $amount, string $method, ?string $reference, int $userId): Payment
    {
        /** @var Payment $payment */
        $payment = $this->payments()->create([
            'amount' => $amount,
            'method' => $method,
            'reference' => $reference,
            'received_by' => $userId,
        ]);

        $this->paid_amount = number_format((float) $this->paid_amount + $amount, 2, '.', '');
        $this->save();
        $this->recalculateStatus();

        return $payment;
    }

    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }
}
