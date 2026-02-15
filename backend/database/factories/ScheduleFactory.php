<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Schedule>
 */
class ScheduleFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = fake()->numberBetween(7, 14);

        return [
            'doctor_id' => User::factory()->doctor(),
            'date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'start_time' => sprintf('%02d:00', $start),
            'end_time' => sprintf('%02d:00', $start + fake()->numberBetween(2, 6)),
            'is_available' => true,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    public function unavailable(): static
    {
        return $this->state(fn () => ['is_available' => false]);
    }
}
