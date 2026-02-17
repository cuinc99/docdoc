<?php

namespace Database\Factories;

use App\Models\Patient;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class VitalSignFactory extends Factory
{
    public function definition(): array
    {
        $weight = fake()->randomFloat(2, 40, 120);
        $height = fake()->randomFloat(2, 140, 190);
        $heightM = $height / 100;
        $bmi = round($weight / ($heightM * $heightM), 1);

        return [
            'patient_id' => Patient::factory(),
            'queue_id' => Queue::factory(),
            'recorded_by' => User::factory(),
            'systolic' => fake()->numberBetween(90, 180),
            'diastolic' => fake()->numberBetween(60, 120),
            'heart_rate' => fake()->numberBetween(60, 120),
            'temperature' => fake()->randomFloat(1, 35.0, 39.5),
            'respiratory_rate' => fake()->numberBetween(12, 30),
            'oxygen_saturation' => fake()->optional(0.8)->numberBetween(90, 100),
            'weight' => $weight,
            'height' => $height,
            'bmi' => $bmi,
            'chief_complaint' => fake()->sentence(),
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }
}
