<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    /** @use HasFactory<\Database\Factories\PatientFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'mr_number',
        'nik',
        'name',
        'gender',
        'birth_date',
        'phone',
        'email',
        'address',
        'blood_type',
        'allergies',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Patient $patient): void {
            if (empty($patient->mr_number)) {
                $patient->mr_number = self::generateMrNumber();
            }
        });
    }

    public static function generateMrNumber(): string
    {
        $prefix = 'MR' . now()->format('ym');
        $lastPatient = self::withTrashed()
            ->where('mr_number', 'like', $prefix . '%')
            ->orderByDesc('mr_number')
            ->first();

        if ($lastPatient) {
            $lastCount = (int) substr($lastPatient->mr_number, -4);
            $nextCount = $lastCount + 1;
        } else {
            $nextCount = 1;
        }

        return $prefix . str_pad((string) $nextCount, 4, '0', STR_PAD_LEFT);
    }

    /** @param \Illuminate\Database\Eloquent\Builder<self> $query */
    public function scopeSearch(\Illuminate\Database\Eloquent\Builder $query, ?string $search): void
    {
        if ($search) {
            $term = mb_strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(mr_number) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(nik) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(phone) LIKE ?', ["%{$term}%"]);
            });
        }
    }
}
