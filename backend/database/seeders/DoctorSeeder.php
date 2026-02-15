<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $doctors = [
            [
                'name' => 'Dr. Budi Santoso',
                'email' => 'budi@docdoc.test',
                'phone' => '081234567891',
                'specialization' => 'Umum',
                'sip_number' => 'SIP-2024/0001',
            ],
            [
                'name' => 'Dr. Siti Rahayu',
                'email' => 'siti@docdoc.test',
                'phone' => '081234567892',
                'specialization' => 'Gigi',
                'sip_number' => 'SIP-2024/0002',
            ],
            [
                'name' => 'Dr. Andi Pratama',
                'email' => 'andi@docdoc.test',
                'phone' => '081234567893',
                'specialization' => 'Anak',
                'sip_number' => 'SIP-2024/0003',
            ],
        ];

        foreach ($doctors as $doctor) {
            User::updateOrCreate(
                ['email' => $doctor['email']],
                [
                    ...$doctor,
                    'password' => bcrypt('password'),
                    'role' => 'doctor',
                    'is_active' => true,
                ]
            );
        }
    }
}
