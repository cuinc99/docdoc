<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Queue */
class QueueResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var \App\Models\Queue $queue */
        $queue = $this->resource;

        return [
            'id' => $queue->id,
            'doctor_id' => $queue->doctor_id,
            'patient_id' => $queue->patient_id,
            'queue_number' => $queue->queue_number,
            'date' => $queue->date->format('Y-m-d'),
            'status' => $queue->status,
            'priority' => $queue->priority,
            'called_at' => $queue->called_at?->toISOString(),
            'started_at' => $queue->started_at?->toISOString(),
            'completed_at' => $queue->completed_at?->toISOString(),
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $queue->doctor->id,
                'name' => $queue->doctor->name,
                'specialization' => $queue->doctor->specialization,
            ]),
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $queue->patient->id,
                'name' => $queue->patient->name,
                'mr_number' => $queue->patient->mr_number,
                'gender' => $queue->patient->gender,
                'birth_date' => $queue->patient->birth_date,
                'phone' => $queue->patient->phone,
            ]),
            'created_at' => $queue->created_at?->toISOString(),
            'updated_at' => $queue->updated_at?->toISOString(),
        ];
    }
}
