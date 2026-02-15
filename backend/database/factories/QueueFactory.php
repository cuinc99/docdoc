<?php

namespace Database\Factories;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Queue>
 */
class QueueFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'doctor_id' => User::factory()->doctor(),
            'patient_id' => Patient::factory(),
            'date' => now()->toDateString(),
            'status' => 'waiting',
            'priority' => 'normal',
        ];
    }

    public function urgent(): static
    {
        return $this->state(fn () => ['priority' => 'urgent']);
    }

    public function status(string $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
