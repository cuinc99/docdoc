<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@docdoc.test'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('password'),
                'phone' => '081234567890',
                'role' => 'admin',
                'is_active' => true,
            ]
        );
    }
}
