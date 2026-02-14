<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Patient>
 */
class PatientFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'nik' => fake()->unique()->numerify('################'),
            'name' => fake()->name(),
            'gender' => fake()->randomElement(['male', 'female']),
            'birth_date' => fake()->dateTimeBetween('-70 years', '-1 year')->format('Y-m-d'),
            'phone' => fake()->numerify('08##########'),
            'email' => fake()->optional(0.7)->safeEmail(),
            'address' => fake()->address(),
            'blood_type' => fake()->optional(0.5)->randomElement(['A', 'B', 'AB', 'O']),
            'allergies' => fake()->optional(0.3)->sentence(),
            'emergency_contact_name' => fake()->optional(0.5)->name(),
            'emergency_contact_phone' => fake()->optional(0.5)->numerify('08##########'),
        ];
    }
}
