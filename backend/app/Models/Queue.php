<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $doctor_id
 * @property int $patient_id
 * @property int $queue_number
 * @property \Illuminate\Support\Carbon $date
 * @property string $status
 * @property string $priority
 * @property \Illuminate\Support\Carbon|null $called_at
 * @property \Illuminate\Support\Carbon|null $started_at
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read User $doctor
 * @property-read Patient $patient
 */
class Queue extends Model
{
    /** @use HasFactory<\Database\Factories\QueueFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'doctor_id',
        'patient_id',
        'queue_number',
        'date',
        'status',
        'priority',
        'called_at',
        'started_at',
        'completed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'queue_number' => 'integer',
            'called_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @var array<string, mixed> */
    protected $attributes = [
        'status' => 'waiting',
        'priority' => 'normal',
    ];

    protected static function booted(): void
    {
        static::creating(function (Queue $queue): void {
            if (empty($queue->queue_number)) {
                $queue->queue_number = self::nextQueueNumber($queue->doctor_id, $queue->date);
            }
        });
    }

    public static function nextQueueNumber(int $doctorId, mixed $date): int
    {
        $dateStr = $date instanceof \DateTimeInterface ? $date->format('Y-m-d') : (string) $date;

        $last = self::where('doctor_id', $doctorId)
            ->whereDate('date', $dateStr)
            ->max('queue_number');

        return ($last ?? 0) + 1;
    }

    /** @return BelongsTo<User, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @param \Illuminate\Database\Eloquent\Builder<self> $query */
    public function scopeToday(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereDate('date', now()->toDateString());
    }

    /** @param \Illuminate\Database\Eloquent\Builder<self> $query */
    public function scopeByDoctor(\Illuminate\Database\Eloquent\Builder $query, int $doctorId): void
    {
        $query->where('doctor_id', $doctorId);
    }

    /** @param \Illuminate\Database\Eloquent\Builder<self> $query */
    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereNotIn('status', ['completed', 'cancelled']);
    }
}
