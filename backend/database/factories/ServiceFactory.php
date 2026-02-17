<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Konsultasi Dokter Umum',
                'Konsultasi Dokter Spesialis',
                'Pemeriksaan Laboratorium',
                'Tindakan Medis Ringan',
                'Suntik Vitamin',
            ]),
            'price' => fake()->randomElement([50000, 100000, 150000, 200000, 250000]),
            'is_active' => true,
        ];
    }
}
