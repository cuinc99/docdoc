<?php

namespace Database\Factories;

use App\Models\MedicalRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AddendumFactory extends Factory
{
    public function definition(): array
    {
        return [
            'medical_record_id' => MedicalRecord::factory(),
            'doctor_id' => User::factory()->doctor(),
            'content' => fake()->paragraph(),
        ];
    }
}
