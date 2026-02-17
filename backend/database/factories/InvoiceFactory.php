<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    public function definition(): array
    {
        $items = [
            ['description' => 'Konsultasi Dokter', 'quantity' => 1, 'unit_price' => '100000.00', 'total' => '100000.00'],
        ];
        $subtotal = 100000;

        return [
            'patient_id' => Patient::factory(),
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => 0,
            'tax' => 0,
            'total' => $subtotal,
            'paid_amount' => 0,
            'status' => 'pending',
        ];
    }
}
