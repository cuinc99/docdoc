<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Schedule */
class ScheduleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var \App\Models\Schedule $schedule */
        $schedule = $this->resource;

        return [
            'id' => $schedule->id,
            'doctor_id' => $schedule->doctor_id,
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $schedule->doctor->id,
                'name' => $schedule->doctor->name,
                'specialization' => $schedule->doctor->specialization,
            ]),
            'date' => $schedule->date->format('Y-m-d'),
            'start_time' => $schedule->start_time,
            'end_time' => $schedule->end_time,
            'is_available' => $schedule->is_available,
            'notes' => $schedule->notes,
            'created_at' => $schedule->created_at?->toISOString(),
            'updated_at' => $schedule->updated_at?->toISOString(),
        ];
    }
}
