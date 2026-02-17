<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Patient */
class PatientResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var \Carbon\Carbon|null $birthDate */
        $birthDate = $this->birth_date;

        return [
            'id' => $this->id,
            'mr_number' => $this->mr_number,
            'nik' => $this->nik,
            'name' => $this->name,
            'gender' => $this->gender,
            'birth_date' => $birthDate?->format('Y-m-d'),
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'blood_type' => $this->blood_type,
            'allergies' => $this->allergies,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
