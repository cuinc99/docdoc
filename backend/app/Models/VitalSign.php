<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $patient_id
 * @property int $queue_id
 * @property int $recorded_by
 * @property int $systolic
 * @property int $diastolic
 * @property int $heart_rate
 * @property float $temperature
 * @property int $respiratory_rate
 * @property int|null $oxygen_saturation
 * @property float $weight
 * @property float $height
 * @property float $bmi
 * @property string $chief_complaint
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Patient $patient
 * @property-read Queue $queue
 * @property-read User $recordedBy
 */
class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'queue_id', 'recorded_by',
        'systolic', 'diastolic', 'heart_rate', 'temperature',
        'respiratory_rate', 'oxygen_saturation', 'weight', 'height', 'bmi',
        'chief_complaint', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'systolic' => 'integer',
            'diastolic' => 'integer',
            'heart_rate' => 'integer',
            'temperature' => 'decimal:1',
            'respiratory_rate' => 'integer',
            'oxygen_saturation' => 'integer',
            'weight' => 'decimal:2',
            'height' => 'decimal:2',
            'bmi' => 'decimal:1',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (VitalSign $vitalSign): void {
            if ($vitalSign->weight > 0 && $vitalSign->height > 0) {
                $heightInMeters = (float) $vitalSign->height / 100;
                $vitalSign->bmi = round((float) $vitalSign->weight / ($heightInMeters * $heightInMeters), 1);
            }
        });
    }

    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function queue(): BelongsTo { return $this->belongsTo(Queue::class); }
    public function recordedBy(): BelongsTo { return $this->belongsTo(User::class, 'recorded_by'); }
}
