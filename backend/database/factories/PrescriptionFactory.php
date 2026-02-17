<?php

namespace Database\Factories;

use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PrescriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => User::factory()->doctor(),
            'medical_record_id' => MedicalRecord::factory(),
            'items' => [
                [
                    'drug_name' => 'Paracetamol 500mg',
                    'dosage' => '500mg',
                    'frequency' => '3x sehari',
                    'duration' => '5 hari',
                    'quantity' => 15,
                    'instructions' => 'Sesudah makan',
                ],
            ],
            'notes' => null,
            'is_dispensed' => false,
            'dispensed_at' => null,
            'dispensed_by' => null,
        ];
    }

    public function dispensed(): static
    {
        return $this->state(fn () => [
            'is_dispensed' => true,
            'dispensed_at' => now(),
            'dispensed_by' => User::factory()->create(['role' => 'receptionist'])->id,
        ]);
    }
}
