<?php

use App\Models\Queue;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('schedule list', function () {
    it('returns schedules for authenticated user', function () {
        $user = User::factory()->create();
        $doctor = User::factory()->doctor()->create();
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-01']);
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-02']);
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-03']);

        $response = $this->actingAs($user)->getJson('/api/schedules');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    });

    it('filters schedules by doctor_id', function () {
        $user = User::factory()->create();
        $doctor1 = User::factory()->doctor()->create();
        $doctor2 = User::factory()->doctor()->create();
        Schedule::factory()->create(['doctor_id' => $doctor1->id, 'date' => '2026-03-01']);
        Schedule::factory()->create(['doctor_id' => $doctor2->id, 'date' => '2026-03-02']);

        $response = $this->actingAs($user)->getJson("/api/schedules?doctor_id={$doctor1->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.doctor_id', $doctor1->id);
    });

    it('filters schedules by date range', function () {
        $user = User::factory()->create();
        $doctor = User::factory()->doctor()->create();
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-01']);
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-15']);
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-04-01']);

        $response = $this->actingAs($user)->getJson('/api/schedules?date_from=2026-03-01&date_to=2026-03-31');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    });

    it('doctor only sees own schedules', function () {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-01']);
        Schedule::factory()->create(['doctor_id' => $otherDoctor->id, 'date' => '2026-03-02']);

        $response = $this->actingAs($doctor)->getJson('/api/schedules');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.doctor_id', $doctor->id);
    });

    it('denies access for unauthenticated user', function () {
        $this->getJson('/api/schedules')->assertStatus(401);
    });
});

describe('schedule create', function () {
    it('admin can create schedule for any doctor', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();

        $response = $this->actingAs($admin)->postJson('/api/schedules', [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-10',
            'start_time' => '08:00',
            'end_time' => '12:00',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.doctor_id', $doctor->id)
            ->assertJsonPath('data.date', '2026-03-10')
            ->assertJsonPath('message', 'Jadwal berhasil ditambahkan');
    });

    it('doctor can create own schedule', function () {
        $doctor = User::factory()->doctor()->create();

        $response = $this->actingAs($doctor)->postJson('/api/schedules', [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-10',
            'start_time' => '09:00',
            'end_time' => '15:00',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.doctor_id', $doctor->id);
    });

    it('receptionist cannot create schedule', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $doctor = User::factory()->doctor()->create();

        $response = $this->actingAs($receptionist)->postJson('/api/schedules', [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-10',
            'start_time' => '08:00',
            'end_time' => '12:00',
        ]);

        $response->assertStatus(403);
    });

    it('fails with duplicate doctor+date', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10']);

        $response = $this->actingAs($admin)->postJson('/api/schedules', [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-10',
            'start_time' => '08:00',
            'end_time' => '12:00',
        ]);

        $response->assertStatus(422);
    });

    it('fails when end_time is before start_time', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();

        $response = $this->actingAs($admin)->postJson('/api/schedules', [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-10',
            'start_time' => '14:00',
            'end_time' => '08:00',
        ]);

        $response->assertStatus(422);
    });
});

describe('schedule update', function () {
    it('admin can update any schedule', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10']);

        $response = $this->actingAs($admin)->putJson("/api/schedules/{$schedule->id}", [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-11',
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.date', '2026-03-11')
            ->assertJsonPath('message', 'Jadwal berhasil diperbarui');
    });

    it('doctor can update own schedule', function () {
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10']);

        $response = $this->actingAs($doctor)->putJson("/api/schedules/{$schedule->id}", [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-10',
            'start_time' => '10:00',
            'end_time' => '14:00',
        ]);

        $response->assertStatus(200);
    });

    it('doctor cannot update other doctor schedule', function () {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $otherDoctor->id, 'date' => '2026-03-10']);

        $response = $this->actingAs($doctor)->putJson("/api/schedules/{$schedule->id}", [
            'doctor_id' => $otherDoctor->id,
            'date' => '2026-03-10',
            'start_time' => '10:00',
            'end_time' => '14:00',
        ]);

        $response->assertStatus(403);
    });

    it('cannot update schedule when queue has non-waiting status', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10']);
        Queue::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10', 'status' => 'in_consultation']);

        $response = $this->actingAs($admin)->putJson("/api/schedules/{$schedule->id}", [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-11',
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Jadwal tidak dapat diedit karena sudah ada antrian yang sedang diproses');
    });

    it('can update schedule date and cascades to waiting queues', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10']);
        $queue1 = Queue::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10', 'status' => 'waiting']);
        $queue2 = Queue::factory()->create(['doctor_id' => $doctor->id, 'date' => '2026-03-10', 'status' => 'waiting']);

        $response = $this->actingAs($admin)->putJson("/api/schedules/{$schedule->id}", [
            'doctor_id' => $doctor->id,
            'date' => '2026-03-12',
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.date', '2026-03-12');

        $this->assertDatabaseHas('queues', ['id' => $queue1->id, 'date' => '2026-03-12 00:00:00']);
        $this->assertDatabaseHas('queues', ['id' => $queue2->id, 'date' => '2026-03-12 00:00:00']);
    });
});

describe('schedule toggle', function () {
    it('admin can toggle schedule availability', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id, 'is_available' => true]);

        $response = $this->actingAs($admin)->patchJson("/api/schedules/{$schedule->id}/toggle");

        $response->assertStatus(200)
            ->assertJsonPath('data.is_available', false);
    });

    it('doctor can toggle own schedule availability', function () {
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id, 'is_available' => false]);

        $response = $this->actingAs($doctor)->patchJson("/api/schedules/{$schedule->id}/toggle");

        $response->assertStatus(200)
            ->assertJsonPath('data.is_available', true);
    });

    it('doctor cannot toggle other doctor schedule', function () {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $otherDoctor->id]);

        $response = $this->actingAs($doctor)->patchJson("/api/schedules/{$schedule->id}/toggle");

        $response->assertStatus(403);
    });

    it('cannot toggle schedule when queues exist', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id, 'is_available' => true]);
        Queue::factory()->create(['doctor_id' => $doctor->id, 'date' => $schedule->date->format('Y-m-d'), 'status' => 'waiting']);

        $response = $this->actingAs($admin)->patchJson("/api/schedules/{$schedule->id}/toggle");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Jadwal tidak dapat dinonaktifkan karena sudah ada antrian terdaftar');
    });
});

describe('schedule delete', function () {
    it('admin can delete any schedule', function () {
        $admin = User::factory()->admin()->create();
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/schedules/{$schedule->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Jadwal berhasil dihapus');

        $this->assertDatabaseMissing('schedules', ['id' => $schedule->id]);
    });

    it('doctor can delete own schedule', function () {
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id]);

        $response = $this->actingAs($doctor)->deleteJson("/api/schedules/{$schedule->id}");

        $response->assertStatus(200);
    });

    it('doctor cannot delete other doctor schedule', function () {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $otherDoctor->id]);

        $response = $this->actingAs($doctor)->deleteJson("/api/schedules/{$schedule->id}");

        $response->assertStatus(403);
    });

    it('receptionist cannot delete schedule', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $doctor = User::factory()->doctor()->create();
        $schedule = Schedule::factory()->create(['doctor_id' => $doctor->id]);

        $response = $this->actingAs($receptionist)->deleteJson("/api/schedules/{$schedule->id}");

        $response->assertStatus(403);
    });
});
