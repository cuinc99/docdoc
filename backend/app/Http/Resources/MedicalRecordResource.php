<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MedicalRecord */
class MedicalRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\MedicalRecord $record */
        $record = $this->resource;

        return [
            'id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $record->doctor_id,
            'queue_id' => $record->queue_id,
            'vital_sign_id' => $record->vital_sign_id,
            'subjective' => $record->subjective,
            'objective' => $record->objective,
            'assessment' => $record->assessment,
            'plan' => $record->plan,
            'diagnoses' => $record->diagnoses,
            'is_locked' => $record->is_locked,
            'locked_at' => $record->locked_at?->toISOString(),
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $record->patient->id,
                'name' => $record->patient->name,
                'mr_number' => $record->patient->mr_number,
                'gender' => $record->patient->gender,
                'birth_date' => $record->patient->birth_date,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $record->doctor->id,
                'name' => $record->doctor->name,
                'specialization' => $record->doctor->specialization,
            ]),
            'queue' => $this->whenLoaded('queue', fn () => [
                'id' => $record->queue->id,
                'queue_number' => $record->queue->queue_number,
                'date' => $record->queue->date->format('Y-m-d'),
            ]),
            'vital_sign' => $this->whenLoaded('vitalSign', fn () => $record->vitalSign ? new VitalSignResource($record->vitalSign) : null),
            'addendums' => $this->whenLoaded('addendums', function () use ($record): array {
                $items = [];
                foreach ($record->addendums as $addendum) {
                    $items[] = [
                        'id' => $addendum->id,
                        'doctor_id' => $addendum->doctor_id,
                        'content' => $addendum->content,
                        'doctor' => $addendum->relationLoaded('doctor') ? [
                            'id' => $addendum->doctor->id,
                            'name' => $addendum->doctor->name,
                        ] : null,
                        'created_at' => $addendum->created_at?->toISOString(),
                    ];
                }
                return $items;
            }),
            'created_at' => $record->created_at?->toISOString(),
            'updated_at' => $record->updated_at?->toISOString(),
        ];
    }
}
