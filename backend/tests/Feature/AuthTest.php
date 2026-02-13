<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('register', function () {
    it('registers a new user with default role receptionist', function () {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@docdoc.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '081234567890',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.role', 'receptionist')
            ->assertJsonPath('data.name', 'Test User')
            ->assertJsonPath('data.email', 'test@docdoc.test');

        $this->assertDatabaseHas('users', [
            'email' => 'test@docdoc.test',
            'role' => 'receptionist',
        ]);
    });

    it('fails with invalid data', function () {
        $response = $this->postJson('/api/register', [
            'name' => '',
            'email' => 'invalid',
            'password' => 'short',
        ]);

        $response->assertStatus(422);
    });

    it('fails with duplicate email', function () {
        User::factory()->create(['email' => 'taken@docdoc.test']);

        $response = $this->postJson('/api/register', [
            'name' => 'Another User',
            'email' => 'taken@docdoc.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
    });
});

describe('login', function () {
    it('logs in with valid credentials', function () {
        User::factory()->create([
            'email' => 'login@docdoc.test',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@docdoc.test',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'login@docdoc.test')
            ->assertJsonPath('message', 'Login berhasil');
    });

    it('fails with wrong password', function () {
        User::factory()->create([
            'email' => 'login@docdoc.test',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login@docdoc.test',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Email atau password salah');
    });

    it('fails when account is inactive', function () {
        User::factory()->create([
            'email' => 'inactive@docdoc.test',
            'password' => bcrypt('password123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'inactive@docdoc.test',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Akun Anda dinonaktifkan');
    });
});

describe('logout', function () {
    it('logs out authenticated user', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Logout berhasil');
    });

    it('fails for unauthenticated user', function () {
        $response = $this->postJson('/api/logout');

        $response->assertStatus(401);
    });
});

describe('user', function () {
    it('returns current authenticated user', function () {
        $user = User::factory()->create([
            'role' => 'doctor',
            'specialization' => 'Umum',
        ]);

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'doctor');
    });

    it('fails for unauthenticated user', function () {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    });
});

describe('check role middleware', function () {
    it('allows user with correct role', function () {
        Route::middleware(['auth:sanctum', 'role:admin'])->get('/api/test-role', fn () => response()->json(['ok' => true]));

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->getJson('/api/test-role')->assertStatus(200);
    });

    it('denies user with wrong role', function () {
        Route::middleware(['auth:sanctum', 'role:admin'])->get('/api/test-role-deny', fn () => response()->json(['ok' => true]));

        $receptionist = User::factory()->create(['role' => 'receptionist']);

        $this->actingAs($receptionist)->getJson('/api/test-role-deny')->assertStatus(403);
    });
});
