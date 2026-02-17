<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $patient_id
 * @property int $doctor_id
 * @property int $queue_id
 * @property int|null $vital_sign_id
 * @property string $subjective
 * @property string $objective
 * @property string $assessment
 * @property string $plan
 * @property array<int, array{code: string, description: string, is_primary: bool}> $diagnoses
 * @property bool $is_locked
 * @property \Illuminate\Support\Carbon|null $locked_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Patient $patient
 * @property-read User $doctor
 * @property-read Queue $queue
 * @property-read VitalSign|null $vitalSign
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Addendum> $addendums
 */
class MedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'doctor_id', 'queue_id', 'vital_sign_id',
        'subjective', 'objective', 'assessment', 'plan', 'diagnoses',
        'is_locked', 'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'diagnoses' => 'array',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
        ];
    }

    public function isEditable(): bool
    {
        return !$this->is_locked;
    }

    public function lock(): void
    {
        $this->update(['is_locked' => true, 'locked_at' => now()]);
    }

    public function patient(): BelongsTo { return $this->belongsTo(Patient::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(User::class, 'doctor_id'); }
    public function queue(): BelongsTo { return $this->belongsTo(Queue::class); }
    public function vitalSign(): BelongsTo { return $this->belongsTo(VitalSign::class); }
    public function addendums(): HasMany { return $this->hasMany(Addendum::class); }
}
