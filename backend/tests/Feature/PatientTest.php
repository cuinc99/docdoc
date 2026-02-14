<?php

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('patient list', function () {
    it('returns paginated patients for authenticated user', function () {
        $user = User::factory()->create();
        Patient::factory()->count(15)->create();

        $response = $this->actingAs($user)->getJson('/api/patients');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'mr_number', 'nik', 'name', 'gender', 'birth_date', 'phone']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 15);
    });

    it('searches patients by name', function () {
        $user = User::factory()->create();
        Patient::factory()->create(['name' => 'Budi Santoso']);
        Patient::factory()->create(['name' => 'Ani Wijaya']);

        $response = $this->actingAs($user)->getJson('/api/patients?search=Budi');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Budi Santoso');
    });

    it('searches patients by mr_number', function () {
        $user = User::factory()->create();
        $patient = Patient::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/patients?search=' . $patient->mr_number);

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    });

    it('searches patients by nik', function () {
        $user = User::factory()->create();
        Patient::factory()->create(['nik' => '1234567890123456']);

        $response = $this->actingAs($user)->getJson('/api/patients?search=1234567890123456');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    });

    it('denies access for unauthenticated user', function () {
        $this->getJson('/api/patients')->assertStatus(401);
    });
});

describe('patient create', function () {
    it('creates a patient with auto-generated mr_number', function () {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->postJson('/api/patients', [
            'nik' => '1234567890123456',
            'name' => 'Budi Santoso',
            'gender' => 'male',
            'birth_date' => '1990-05-15',
            'phone' => '081234567890',
            'address' => 'Jl. Merdeka No. 1',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Budi Santoso')
            ->assertJsonPath('message', 'Pasien berhasil ditambahkan');

        expect($response->json('data.mr_number'))->toStartWith('MR');
    });

    it('allows receptionist to create patient', function () {
        $user = User::factory()->create(['role' => 'receptionist']);

        $response = $this->actingAs($user)->postJson('/api/patients', [
            'nik' => '1234567890123456',
            'name' => 'Ani Wijaya',
            'gender' => 'female',
            'birth_date' => '1985-03-20',
            'phone' => '081234567891',
            'address' => 'Jl. Sudirman No. 2',
        ]);

        $response->assertStatus(201);
    });

    it('denies doctor from creating patient', function () {
        $user = User::factory()->doctor()->create();

        $response = $this->actingAs($user)->postJson('/api/patients', [
            'nik' => '1234567890123456',
            'name' => 'Test',
            'gender' => 'male',
            'birth_date' => '1990-01-01',
            'phone' => '081234567890',
            'address' => 'Test address',
        ]);

        $response->assertStatus(403);
    });

    it('fails validation with invalid data', function () {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->postJson('/api/patients', [
            'nik' => '123',
            'name' => '',
            'gender' => 'other',
            'birth_date' => 'invalid',
        ]);

        $response->assertStatus(422);
    });

    it('fails with duplicate nik', function () {
        $user = User::factory()->admin()->create();
        Patient::factory()->create(['nik' => '1234567890123456']);

        $response = $this->actingAs($user)->postJson('/api/patients', [
            'nik' => '1234567890123456',
            'name' => 'Duplicate NIK',
            'gender' => 'male',
            'birth_date' => '1990-01-01',
            'phone' => '081234567890',
            'address' => 'Test address',
        ]);

        $response->assertStatus(422);
    });
});

describe('patient show', function () {
    it('returns patient detail', function () {
        $user = User::factory()->create();
        $patient = Patient::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/patients/{$patient->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $patient->id)
            ->assertJsonPath('data.mr_number', $patient->mr_number);
    });

    it('returns 404 for non-existent patient', function () {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/patients/99999')->assertStatus(404);
    });
});

describe('patient update', function () {
    it('updates patient data', function () {
        $user = User::factory()->admin()->create();
        $patient = Patient::factory()->create();

        $response = $this->actingAs($user)->putJson("/api/patients/{$patient->id}", [
            'nik' => $patient->nik,
            'name' => 'Updated Name',
            'gender' => $patient->gender,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'phone' => '081999999999',
            'address' => 'Updated Address',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.phone', '081999999999')
            ->assertJsonPath('message', 'Data pasien berhasil diperbarui');
    });

    it('allows receptionist to update patient', function () {
        $user = User::factory()->create(['role' => 'receptionist']);
        $patient = Patient::factory()->create();

        $response = $this->actingAs($user)->putJson("/api/patients/{$patient->id}", [
            'nik' => $patient->nik,
            'name' => 'Updated by Receptionist',
            'gender' => $patient->gender,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'phone' => $patient->phone,
            'address' => $patient->address,
        ]);

        $response->assertStatus(200);
    });

    it('denies doctor from updating patient', function () {
        $user = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        $response = $this->actingAs($user)->putJson("/api/patients/{$patient->id}", [
            'nik' => $patient->nik,
            'name' => 'Hacked',
            'gender' => $patient->gender,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'phone' => $patient->phone,
            'address' => $patient->address,
        ]);

        $response->assertStatus(403);
    });
});

describe('patient delete', function () {
    it('soft deletes patient (admin only)', function () {
        $user = User::factory()->admin()->create();
        $patient = Patient::factory()->create();

        $response = $this->actingAs($user)->deleteJson("/api/patients/{$patient->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Pasien berhasil dihapus');

        $this->assertSoftDeleted('patients', ['id' => $patient->id]);
    });

    it('denies receptionist from deleting patient', function () {
        $user = User::factory()->create(['role' => 'receptionist']);
        $patient = Patient::factory()->create();

        $this->actingAs($user)->deleteJson("/api/patients/{$patient->id}")->assertStatus(403);
    });

    it('denies doctor from deleting patient', function () {
        $user = User::factory()->doctor()->create();
        $patient = Patient::factory()->create();

        $this->actingAs($user)->deleteJson("/api/patients/{$patient->id}")->assertStatus(403);
    });

    it('does not show soft deleted patient in list', function () {
        $user = User::factory()->admin()->create();
        $patient = Patient::factory()->create();
        $patient->delete();

        $response = $this->actingAs($user)->getJson('/api/patients');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 0);
    });
});
