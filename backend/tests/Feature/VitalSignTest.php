<?php

use App\Models\Patient;
use App\Models\Queue;
use App\Models\Schedule;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createQueueForVitals(array $overrides = []): Queue
{
    $doctor = $overrides['doctor'] ?? User::factory()->doctor()->create();
    $patient = $overrides['patient'] ?? Patient::factory()->create();
    Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => now()->toDateString()]);

    return Queue::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'date' => now()->toDateString(),
    ]);
}

function vitalSignData(int $queueId): array
{
    return [
        'queue_id' => $queueId,
        'systolic' => 120,
        'diastolic' => 80,
        'heart_rate' => 72,
        'temperature' => 36.5,
        'respiratory_rate' => 18,
        'oxygen_saturation' => 98,
        'weight' => 70,
        'height' => 170,
        'chief_complaint' => 'Demam dan batuk sejak 3 hari',
        'notes' => 'Pasien tampak lelah',
    ];
}

describe('vital signs list', function () {
    it('returns vital signs for authenticated user', function () {
        $user = User::factory()->create();
        $queue = createQueueForVitals();
        VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'recorded_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/vital-signs');
        $response->assertStatus(200)->assertJsonCount(1, 'data');
    });

    it('filters by patient_id', function () {
        $user = User::factory()->create();
        $patient = Patient::factory()->create();
        $queue = createQueueForVitals(['patient' => $patient]);
        VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $patient->id,
            'recorded_by' => $user->id,
        ]);

        $queue2 = createQueueForVitals();
        VitalSign::factory()->create([
            'queue_id' => $queue2->id,
            'patient_id' => $queue2->patient_id,
            'recorded_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/vital-signs?patient_id={$patient->id}");
        $response->assertStatus(200)->assertJsonCount(1, 'data');
    });

    it('filters by queue_id', function () {
        $user = User::factory()->create();
        $queue = createQueueForVitals();
        VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'recorded_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/vital-signs?queue_id={$queue->id}");
        $response->assertStatus(200)->assertJsonCount(1, 'data');
    });

    it('denies unauthenticated access', function () {
        $this->getJson('/api/vital-signs')->assertStatus(401);
    });
});

describe('vital signs show', function () {
    it('returns vital sign detail', function () {
        $user = User::factory()->create();
        $queue = createQueueForVitals();
        $vs = VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'recorded_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/vital-signs/{$vs->id}");
        $response->assertStatus(200)->assertJsonPath('data.id', $vs->id);
    });
});

describe('vital signs store', function () {
    it('creates vital signs and updates queue status to vitals', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForVitals();
        $data = vitalSignData($queue->id);

        $response = $this->actingAs($admin)->postJson('/api/vital-signs', $data);
        $response->assertStatus(201)
            ->assertJsonPath('data.systolic', 120)
            ->assertJsonPath('data.diastolic', 80)
            ->assertJsonPath('data.chief_complaint', 'Demam dan batuk sejak 3 hari');

        $this->assertDatabaseHas('queues', ['id' => $queue->id, 'status' => 'vitals']);
    });

    it('auto-calculates BMI', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForVitals();
        $data = vitalSignData($queue->id);
        $data['weight'] = 70;
        $data['height'] = 170;

        $response = $this->actingAs($admin)->postJson('/api/vital-signs', $data);
        $response->assertStatus(201);

        $expectedBmi = round(70 / ((170 / 100) ** 2), 1);
        $this->assertEquals($expectedBmi, (float) $response->json('data.bmi'));
    });

    it('prevents duplicate vital signs for same queue', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForVitals();
        VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'recorded_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->postJson('/api/vital-signs', vitalSignData($queue->id));
        $response->assertStatus(422)->assertJsonValidationErrors('queue_id');
    });

    it('validates required fields', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($admin)->postJson('/api/vital-signs', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['queue_id', 'systolic', 'diastolic', 'heart_rate', 'temperature', 'respiratory_rate', 'weight', 'height', 'chief_complaint']);
    });

    it('validates numeric ranges', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForVitals();
        $data = vitalSignData($queue->id);
        $data['systolic'] = 500;
        $data['diastolic'] = 300;

        $response = $this->actingAs($admin)->postJson('/api/vital-signs', $data);
        $response->assertStatus(422)->assertJsonValidationErrors(['systolic', 'diastolic']);
    });

    it('receptionist can create vital signs', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $queue = createQueueForVitals();

        $response = $this->actingAs($receptionist)->postJson('/api/vital-signs', vitalSignData($queue->id));
        $response->assertStatus(201);
    });

    it('doctor cannot create vital signs', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForVitals(['doctor' => $doctor]);

        $response = $this->actingAs($doctor)->postJson('/api/vital-signs', vitalSignData($queue->id));
        $response->assertStatus(403);
    });
});

describe('vital signs update', function () {
    it('updates vital signs', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForVitals();
        $vs = VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'recorded_by' => $admin->id,
        ]);

        $updateData = vitalSignData($queue->id);
        unset($updateData['queue_id']);
        $updateData['systolic'] = 130;

        $response = $this->actingAs($admin)->putJson("/api/vital-signs/{$vs->id}", $updateData);
        $response->assertStatus(200)->assertJsonPath('data.systolic', 130);
    });

    it('doctor cannot update vital signs', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForVitals(['doctor' => $doctor]);
        $vs = VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'recorded_by' => $doctor->id,
        ]);

        $updateData = vitalSignData($queue->id);
        unset($updateData['queue_id']);

        $response = $this->actingAs($doctor)->putJson("/api/vital-signs/{$vs->id}", $updateData);
        $response->assertStatus(403);
    });
});
