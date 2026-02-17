<?php

use App\Models\Invoice;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('admin dashboard', function () {
    it('returns admin stats', function () {
        $admin = User::factory()->create(['role' => 'admin']);

        Patient::factory()->count(3)->create();

        $doctor = User::factory()->doctor()->create();
        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'status' => 'completed',
        ]);
        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        Invoice::factory()->create(['status' => 'paid', 'total' => 150000]);

        $response = $this->actingAs($admin)->getJson('/api/dashboard');
        $response->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveKeys(['total_patients', 'today_visits', 'monthly_revenue', 'active_queues', 'visit_chart']);
        expect($data['total_patients'])->toBeGreaterThanOrEqual(3);
        expect($data['today_visits'])->toBe(1);
        expect($data['active_queues'])->toBe(1);
        expect($data['visit_chart'])->toHaveCount(30);
    });

    it('visit_chart has date and count keys', function () {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->getJson('/api/dashboard');
        $response->assertStatus(200);

        $chart = $response->json('data.visit_chart');
        expect($chart[0])->toHaveKeys(['date', 'count']);
    });
});

describe('doctor dashboard', function () {
    it('returns doctor stats', function () {
        $doctor = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        MedicalRecord::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
        ]);

        Prescription::factory()->create([
            'doctor_id' => $doctor->id,
            'is_dispensed' => false,
        ]);

        $response = $this->actingAs($doctor)->getJson('/api/dashboard');
        $response->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveKeys(['my_patients_today', 'my_active_queues', 'recent_records', 'undispensed_prescriptions']);
        expect($data['my_patients_today'])->toBe(1);
        expect($data['my_active_queues'])->toBe(1);
        expect($data['undispensed_prescriptions'])->toBe(1);
    });
});

describe('receptionist dashboard', function () {
    it('returns receptionist stats', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);

        $doctor = User::factory()->doctor()->create();
        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        Invoice::factory()->create(['status' => 'pending']);

        Patient::factory()->create(['created_at' => now()]);

        $invoice = Invoice::factory()->create(['status' => 'paid', 'total' => 50000, 'paid_amount' => 50000]);
        Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => 50000,
            'method' => 'cash',
            'received_by' => $receptionist->id,
        ]);

        $response = $this->actingAs($receptionist)->getJson('/api/dashboard');
        $response->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveKeys(['today_queues', 'pending_invoices', 'new_patients_today', 'today_payments']);
        expect($data['today_queues'])->toBe(1);
        expect($data['pending_invoices'])->toBeGreaterThanOrEqual(1);
    });
});

describe('dashboard auth', function () {
    it('unauthenticated returns 401', function () {
        $response = $this->getJson('/api/dashboard');
        $response->assertStatus(401);
    });
});
