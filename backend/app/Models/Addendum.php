<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $medical_record_id
 * @property int $doctor_id
 * @property string $content
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read MedicalRecord $medicalRecord
 * @property-read User $doctor
 */
class Addendum extends Model
{
    use HasFactory;

    protected $fillable = ['medical_record_id', 'doctor_id', 'content'];

    public function medicalRecord(): BelongsTo { return $this->belongsTo(MedicalRecord::class); }
    public function doctor(): BelongsTo { return $this->belongsTo(User::class, 'doctor_id'); }
}
