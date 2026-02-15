<?php

use App\Models\Patient;
use App\Models\Queue;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('queue list', function () {
    it('returns queues for today', function () {
        $user = User::factory()->create();
        $doctor = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/queues');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.patient.name', $patient->name);
    });

    it('filters queues by doctor_id', function () {
        $user = User::factory()->create();
        $doctor1 = User::factory()->doctor()->create();
        $doctor2 = User::factory()->doctor()->create();

        Queue::factory()->create(['doctor_id' => $doctor1->id, 'date' => now()->toDateString()]);
        Queue::factory()->create(['doctor_id' => $doctor2->id, 'date' => now()->toDateString()]);

        $response = $this->actingAs($user)->getJson("/api/queues?doctor_id={$doctor1->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });

    it('filters queues by status', function () {
        $user = User::factory()->create();
        $doctor = User::factory()->doctor()->create();

        Queue::factory()->create(['doctor_id' => $doctor->id, 'date' => now()->toDateString(), 'status' => 'waiting']);
        Queue::factory()->create(['doctor_id' => $doctor->id, 'date' => now()->toDateString(), 'status' => 'completed']);

        $response = $this->actingAs($user)->getJson('/api/queues?status=waiting');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });

    it('sorts urgent patients first', function () {
        $user = User::factory()->create();
        $doctor = User::factory()->doctor()->create();

        $normalPatient = Patient::factory()->create();
        $urgentPatient = Patient::factory()->create();

        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $normalPatient->id,
            'date' => now()->toDateString(),
            'priority' => 'normal',
        ]);

        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $urgentPatient->id,
            'date' => now()->toDateString(),
            'priority' => 'urgent',
        ]);

        $response = $this->actingAs($user)->getJson('/api/queues');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.priority', 'urgent');
    });

    it('doctor only sees own queues', function () {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();

        Queue::factory()->create(['doctor_id' => $doctor->id, 'date' => now()->toDateString()]);
        Queue::factory()->create(['doctor_id' => $otherDoctor->id, 'date' => now()->toDateString()]);

        $response = $this->actingAs($doctor)->getJson('/api/queues');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    });

    it('denies access for unauthenticated user', function () {
        $this->getJson('/api/queues')->assertStatus(401);
    });
});

describe('queue create', function () {
    it('receptionist can add patient to queue', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $doctor = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'is_available' => true,
        ]);

        $response = $this->actingAs($receptionist)->postJson('/api/queues', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'priority' => 'normal',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.queue_number', 1)
            ->assertJsonPath('data.status', 'waiting')
            ->assertJsonPath('message', 'Pasien berhasil ditambahkan ke antrian');
    });

    it('auto-increments queue number per doctor per day', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $patient1 = Patient::factory()->create();
        $patient2 = Patient::factory()->create();

        Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'is_available' => true,
        ]);

        $this->actingAs($admin)->postJson('/api/queues', [
            'patient_id' => $patient1->id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($admin)->postJson('/api/queues', [
            'patient_id' => $patient2->id,
            'doctor_id' => $doctor->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.queue_number', 2);
    });

    it('fails when doctor has no schedule today', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $doctor = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        $response = $this->actingAs($receptionist)->postJson('/api/queues', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ]);

        $response->assertStatus(422);
    });

    it('fails when patient already in active queue', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $doctor = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'is_available' => true,
        ]);

        Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        $response = $this->actingAs($receptionist)->postJson('/api/queues', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ]);

        $response->assertStatus(422);
    });

    it('doctor cannot add patient to queue', function () {
        $doctor = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        Schedule::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'is_available' => true,
        ]);

        $response = $this->actingAs($doctor)->postJson('/api/queues', [
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ]);

        $response->assertStatus(403);
    });
});

describe('queue call', function () {
    it('doctor can call patient from own queue', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        $response = $this->actingAs($doctor)->patchJson("/api/queues/{$queue->id}/call");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'in_consultation')
            ->assertJsonPath('message', 'Pasien berhasil dipanggil');

        expect($response->json('data.called_at'))->not->toBeNull();
    });

    it('doctor cannot call patient from other doctor queue', function () {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();
        $queue = Queue::factory()->create([
            'doctor_id' => $otherDoctor->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($doctor)->patchJson("/api/queues/{$queue->id}/call");

        $response->assertStatus(403);
    });

    it('admin can call patient from any queue', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $queue = Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/queues/{$queue->id}/call");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'in_consultation');
    });
});

describe('queue complete', function () {
    it('doctor can complete own consultation', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
            'status' => 'in_consultation',
        ]);

        $response = $this->actingAs($doctor)->patchJson("/api/queues/{$queue->id}/complete");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('message', 'Konsultasi selesai');

        expect($response->json('data.completed_at'))->not->toBeNull();
    });

    it('doctor cannot complete other doctor consultation', function () {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();
        $queue = Queue::factory()->create([
            'doctor_id' => $otherDoctor->id,
            'date' => now()->toDateString(),
            'status' => 'in_consultation',
        ]);

        $response = $this->actingAs($doctor)->patchJson("/api/queues/{$queue->id}/complete");

        $response->assertStatus(403);
    });
});

describe('queue cancel', function () {
    it('receptionist can cancel queue', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $queue = Queue::factory()->create([
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        $response = $this->actingAs($receptionist)->patchJson("/api/queues/{$queue->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('message', 'Antrian berhasil dibatalkan');
    });

    it('admin can cancel queue', function () {
        $admin = User::factory()->admin()->create();
        $queue = Queue::factory()->create([
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/queues/{$queue->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');
    });

    it('doctor cannot cancel queue', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($doctor)->patchJson("/api/queues/{$queue->id}/cancel");

        $response->assertStatus(403);
    });
});

describe('queue status update', function () {
    it('receptionist can update queue status', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $queue = Queue::factory()->create([
            'date' => now()->toDateString(),
            'status' => 'waiting',
        ]);

        $response = $this->actingAs($receptionist)->patchJson("/api/queues/{$queue->id}/status", [
            'status' => 'vitals',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'vitals')
            ->assertJsonPath('message', 'Status antrian berhasil diperbarui');
    });

    it('doctor cannot update queue status directly', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = Queue::factory()->create([
            'doctor_id' => $doctor->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($doctor)->patchJson("/api/queues/{$queue->id}/status", [
            'status' => 'vitals',
        ]);

        $response->assertStatus(403);
    });
});
