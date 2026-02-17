<?php

use App\Models\ClinicSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

describe('clinic settings', function () {
    it('gets clinic settings', function () {
        $user = User::factory()->create(['role' => 'admin']);
        ClinicSetting::set('clinic_name', 'Klinik Sehat');

        $response = $this->actingAs($user)->getJson('/api/settings/clinic');
        $response->assertStatus(200);
        expect($response->json('data.clinic_name'))->toBe('Klinik Sehat');
    });

    it('admin can update clinic settings', function () {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->putJson('/api/settings/clinic', [
            'clinic_name' => 'Klinik Baru',
            'clinic_address' => 'Jl. Baru No. 1',
            'clinic_phone' => '08123456789',
            'clinic_email' => 'klinik@test.com',
        ]);
        $response->assertStatus(200);
        expect(ClinicSetting::get('clinic_name'))->toBe('Klinik Baru');
        expect(ClinicSetting::get('clinic_address'))->toBe('Jl. Baru No. 1');
    });

    it('non-admin cannot update clinic settings', function () {
        $doctor = User::factory()->doctor()->create();

        $response = $this->actingAs($doctor)->putJson('/api/settings/clinic', [
            'clinic_name' => 'Klinik Baru',
        ]);
        $response->assertStatus(403);
    });

    it('admin can upload logo', function () {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $file = UploadedFile::fake()->image('logo.png', 200, 200);

        $response = $this->actingAs($admin)->postJson('/api/settings/clinic/logo', [
            'logo' => $file,
        ]);
        $response->assertStatus(200);
        expect($response->json('data.path'))->not->toBeNull();
        expect(ClinicSetting::get('clinic_logo'))->not->toBeNull();
    });
});

describe('user management', function () {
    it('admin can list users', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/users');
        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBeGreaterThanOrEqual(4);
    });

    it('admin can search users', function () {
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'Admin Utama']);
        User::factory()->create(['name' => 'Dokter Spesialis']);

        $response = $this->actingAs($admin)->getJson('/api/users?search=Spesialis');
        $response->assertStatus(200);
        expect($response->json('meta.total'))->toBe(1);
    });

    it('admin can create user', function () {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->postJson('/api/users', [
            'name' => 'Dokter Baru',
            'email' => 'dokterbaru@test.com',
            'password' => 'password123',
            'role' => 'doctor',
            'specialization' => 'Umum',
            'sip_number' => 'SIP-1234/5678',
        ]);
        $response->assertStatus(201);
        expect($response->json('data.name'))->toBe('Dokter Baru');
        $this->assertDatabaseHas('users', ['email' => 'dokterbaru@test.com']);
    });

    it('admin can update user', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'receptionist']);

        $response = $this->actingAs($admin)->putJson("/api/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => $user->email,
            'role' => 'receptionist',
        ]);
        $response->assertStatus(200);
        expect($response->json('data.name'))->toBe('Updated Name');
    });

    it('admin can toggle user active', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin)->patchJson("/api/users/{$user->id}/toggle-active");
        $response->assertStatus(200);
        expect($response->json('data.is_active'))->toBeFalse();
    });

    it('admin cannot deactivate self', function () {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->patchJson("/api/users/{$admin->id}/toggle-active");
        $response->assertStatus(403);
    });

    it('non-admin cannot access user management', function () {
        $doctor = User::factory()->doctor()->create();

        $response = $this->actingAs($doctor)->getJson('/api/users');
        $response->assertStatus(403);

        $response = $this->actingAs($doctor)->postJson('/api/users', [
            'name' => 'Test',
            'email' => 'test@test.com',
            'password' => 'password123',
            'role' => 'receptionist',
        ]);
        $response->assertStatus(403);
    });
});

describe('profile', function () {
    it('gets current user profile', function () {
        $user = User::factory()->create(['name' => 'Test User']);

        $response = $this->actingAs($user)->getJson('/api/profile');
        $response->assertStatus(200);
        expect($response->json('data.name'))->toBe('Test User');
    });

    it('updates profile', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson('/api/profile', [
            'name' => 'Nama Baru',
            'phone' => '08111222333',
        ]);
        $response->assertStatus(200);
        expect($response->json('data.name'))->toBe('Nama Baru');
        expect($response->json('data.phone'))->toBe('08111222333');
    });

    it('changes password', function () {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->putJson('/api/profile/password', [
            'current_password' => 'oldpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);
        $response->assertStatus(200);

        $user->refresh();
        expect(Hash::check('newpassword123', $user->password))->toBeTrue();
    });

    it('change password fails with wrong current password', function () {
        $user = User::factory()->create([
            'password' => Hash::make('correctpassword'),
        ]);

        $response = $this->actingAs($user)->putJson('/api/profile/password', [
            'current_password' => 'wrongpassword',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);
        $response->assertStatus(422);
    });
});
