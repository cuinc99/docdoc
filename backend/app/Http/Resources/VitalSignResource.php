<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\VitalSign */
class VitalSignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\VitalSign $vitalSign */
        $vitalSign = $this->resource;

        return [
            'id' => $vitalSign->id,
            'patient_id' => $vitalSign->patient_id,
            'queue_id' => $vitalSign->queue_id,
            'recorded_by' => $vitalSign->recorded_by,
            'systolic' => $vitalSign->systolic,
            'diastolic' => $vitalSign->diastolic,
            'heart_rate' => $vitalSign->heart_rate,
            'temperature' => $vitalSign->temperature,
            'respiratory_rate' => $vitalSign->respiratory_rate,
            'oxygen_saturation' => $vitalSign->oxygen_saturation,
            'weight' => $vitalSign->weight,
            'height' => $vitalSign->height,
            'bmi' => $vitalSign->bmi,
            'chief_complaint' => $vitalSign->chief_complaint,
            'notes' => $vitalSign->notes,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $vitalSign->patient->id,
                'name' => $vitalSign->patient->name,
                'mr_number' => $vitalSign->patient->mr_number,
            ]),
            'queue' => $this->whenLoaded('queue', fn () => [
                'id' => $vitalSign->queue->id,
                'queue_number' => $vitalSign->queue->queue_number,
                'date' => $vitalSign->queue->date->format('Y-m-d'),
                'doctor_id' => $vitalSign->queue->doctor_id,
            ]),
            'recorder' => $this->whenLoaded('recordedBy', fn () => [
                'id' => $vitalSign->recordedBy->id,
                'name' => $vitalSign->recordedBy->name,
            ]),
            'created_at' => $vitalSign->created_at?->toISOString(),
            'updated_at' => $vitalSign->updated_at?->toISOString(),
        ];
    }
}
