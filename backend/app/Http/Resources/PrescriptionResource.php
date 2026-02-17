<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Prescription */
class PrescriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\Prescription $prescription */
        $prescription = $this->resource;

        return [
            'id' => $prescription->id,
            'prescription_number' => $prescription->prescription_number,
            'patient_id' => $prescription->patient_id,
            'doctor_id' => $prescription->doctor_id,
            'medical_record_id' => $prescription->medical_record_id,
            'items' => $prescription->items,
            'notes' => $prescription->notes,
            'is_dispensed' => $prescription->is_dispensed,
            'dispensed_at' => $prescription->dispensed_at?->toISOString(),
            'dispensed_by' => $prescription->dispensed_by,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $prescription->patient->id,
                'name' => $prescription->patient->name,
                'mr_number' => $prescription->patient->mr_number,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $prescription->doctor->id,
                'name' => $prescription->doctor->name,
                'specialization' => $prescription->doctor->specialization,
                'sip_number' => $prescription->doctor->sip_number,
            ]),
            'dispensed_by_user' => $this->whenLoaded('dispensedByUser', fn () => $prescription->dispensedByUser ? [
                'id' => $prescription->dispensedByUser->id,
                'name' => $prescription->dispensedByUser->name,
            ] : null),
            'created_at' => $prescription->created_at?->toISOString(),
            'updated_at' => $prescription->updated_at?->toISOString(),
        ];
    }
}
