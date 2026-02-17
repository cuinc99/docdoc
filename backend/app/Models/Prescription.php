<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $prescription_number
 * @property int $patient_id
 * @property int $doctor_id
 * @property int $medical_record_id
 * @property array<int, array{drug_name: string, dosage: string, frequency: string, duration: string|null, quantity: int, instructions: string|null}> $items
 * @property string|null $notes
 * @property bool $is_dispensed
 * @property \Illuminate\Support\Carbon|null $dispensed_at
 * @property int|null $dispensed_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Patient $patient
 * @property-read User $doctor
 * @property-read MedicalRecord $medicalRecord
 * @property-read User|null $dispensedByUser
 */
class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_number', 'patient_id', 'doctor_id', 'medical_record_id',
        'items', 'notes', 'is_dispensed', 'dispensed_at', 'dispensed_by',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'is_dispensed' => 'boolean',
            'dispensed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Prescription $prescription): void {
            if (empty($prescription->prescription_number)) {
                $prescription->prescription_number = self::generateNumber();
            }
        });
    }

    public static function generateNumber(): string
    {
        $prefix = 'RX' . now()->format('ymd');
        $last = self::where('prescription_number', 'like', $prefix . '%')
            ->orderByDesc('prescription_number')
            ->value('prescription_number');

        $count = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }

    public function isEditable(): bool
    {
        return !$this->is_dispensed;
    }

    public function dispense(int $userId): void
    {
        $this->update([
            'is_dispensed' => true,
            'dispensed_at' => now(),
            'dispensed_by' => $userId,
        ]);
    }

    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(User::class, 'doctor_id'); }
    public function medicalRecord(): BelongsTo { return $this->belongsTo(MedicalRecord::class); }
    public function dispensedByUser(): BelongsTo { return $this->belongsTo(User::class, 'dispensed_by'); }
}
