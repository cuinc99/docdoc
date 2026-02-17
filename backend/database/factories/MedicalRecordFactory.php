<?php

namespace Database\Factories;

use App\Models\Patient;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicalRecordFactory extends Factory
{
    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => User::factory()->doctor(),
            'queue_id' => Queue::factory(),
            'vital_sign_id' => null,
            'subjective' => fake()->paragraph(),
            'objective' => fake()->paragraph(),
            'assessment' => fake()->paragraph(),
            'plan' => fake()->paragraph(),
            'diagnoses' => [
                ['code' => 'J06.9', 'description' => 'Infeksi Saluran Pernapasan Atas Akut', 'is_primary' => true],
            ],
            'is_locked' => false,
            'locked_at' => null,
        ];
    }

    public function locked(): static
    {
        return $this->state(fn () => ['is_locked' => true, 'locked_at' => now()]);
    }
}
