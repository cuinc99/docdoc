<?php

use App\Models\Addendum;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Queue;
use App\Models\Schedule;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createQueueForMedical(array $overrides = []): Queue
{
    $doctor = $overrides['doctor'] ?? User::factory()->doctor()->create();
    $patient = $overrides['patient'] ?? Patient::factory()->create();
    Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => now()->toDateString()]);

    return Queue::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'date' => now()->toDateString(),
        'status' => 'in_consultation',
    ]);
}

function medicalRecordData(int $queueId): array
{
    return [
        'queue_id' => $queueId,
        'subjective' => 'Pasien mengeluh demam 3 hari',
        'objective' => 'Suhu 38.5C, tenggorokan merah',
        'assessment' => 'ISPA',
        'plan' => 'Istirahat, minum obat, kontrol 3 hari',
        'diagnoses' => [
            ['code' => 'J06.9', 'description' => 'ISPA', 'is_primary' => true],
            ['code' => 'R50.9', 'description' => 'Demam', 'is_primary' => false],
        ],
    ];
}

describe('medical records list', function () {
    it('returns medical records for admin', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForMedical();
        MedicalRecord::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $queue->doctor_id,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/medical-records');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });

    it('doctor only sees own medical records', function () {
        $doctor1 = User::factory()->doctor()->create();
        $doctor2 = User::factory()->doctor()->create();

        $queue1 = createQueueForMedical(['doctor' => $doctor1]);
        MedicalRecord::factory()->create([
            'queue_id' => $queue1->id,
            'patient_id' => $queue1->patient_id,
            'doctor_id' => $doctor1->id,
        ]);

        $queue2 = createQueueForMedical(['doctor' => $doctor2]);
        MedicalRecord::factory()->create([
            'queue_id' => $queue2->id,
            'patient_id' => $queue2->patient_id,
            'doctor_id' => $doctor2->id,
        ]);

        $response = $this->actingAs($doctor1)->getJson('/api/medical-records');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });

    it('receptionist cannot access medical records', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $response = $this->actingAs($receptionist)->getJson('/api/medical-records');
        $response->assertStatus(403);
    });

    it('denies unauthenticated access', function () {
        $this->getJson('/api/medical-records')->assertStatus(401);
    });
});

describe('medical records show', function () {
    it('returns medical record detail with relations', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForMedical();
        $record = MedicalRecord::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $queue->doctor_id,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/medical-records/{$record->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.id', $record->id)
            ->assertJsonStructure(['data' => ['patient', 'doctor', 'queue', 'addendums']]);
    });
});

describe('medical records store', function () {
    it('creates medical record', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        $data = medicalRecordData($queue->id);

        $response = $this->actingAs($doctor)->postJson('/api/medical-records', $data);
        $response->assertStatus(201)
            ->assertJsonPath('data.subjective', 'Pasien mengeluh demam 3 hari')
            ->assertJsonPath('data.diagnoses.0.code', 'J06.9');
    });

    it('links vital sign if exists', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        $vs = VitalSign::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'recorded_by' => User::factory()->create()->id,
        ]);

        $response = $this->actingAs($doctor)->postJson('/api/medical-records', medicalRecordData($queue->id));
        $response->assertStatus(201)->assertJsonPath('data.vital_sign_id', $vs->id);
    });

    it('prevents duplicate medical record for same queue', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        MedicalRecord::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->postJson('/api/medical-records', medicalRecordData($queue->id));
        $response->assertStatus(422)->assertJsonValidationErrors('queue_id');
    });

    it('validates required SOAP fields', function () {
        $doctor = User::factory()->doctor()->create();
        $response = $this->actingAs($doctor)->postJson('/api/medical-records', []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['queue_id', 'subjective', 'objective', 'assessment', 'plan', 'diagnoses']);
    });

    it('validates diagnoses array', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        $data = medicalRecordData($queue->id);
        $data['diagnoses'] = [];

        $response = $this->actingAs($doctor)->postJson('/api/medical-records', $data);
        $response->assertStatus(422)->assertJsonValidationErrors('diagnoses');
    });

    it('receptionist cannot create medical records', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $queue = createQueueForMedical();

        $response = $this->actingAs($receptionist)->postJson('/api/medical-records', medicalRecordData($queue->id));
        $response->assertStatus(403);
    });
});

describe('medical records update', function () {
    it('updates unlocked medical record', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        $record = MedicalRecord::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $doctor->id,
            'is_locked' => false,
        ]);

        $updateData = medicalRecordData($queue->id);
        unset($updateData['queue_id']);
        $updateData['subjective'] = 'Updated subjective';

        $response = $this->actingAs($doctor)->putJson("/api/medical-records/{$record->id}", $updateData);
        $response->assertStatus(200)->assertJsonPath('data.subjective', 'Updated subjective');
    });

    it('cannot update locked medical record', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        $record = MedicalRecord::factory()->locked()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $updateData = medicalRecordData($queue->id);
        unset($updateData['queue_id']);

        $response = $this->actingAs($doctor)->putJson("/api/medical-records/{$record->id}", $updateData);
        $response->assertStatus(403);
    });
});

describe('addendums', function () {
    it('adds addendum to medical record', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        $record = MedicalRecord::factory()->locked()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->postJson("/api/medical-records/{$record->id}/addendums", [
            'content' => 'Hasil lab menunjukkan nilai normal',
        ]);
        $response->assertStatus(201)
            ->assertJsonPath('data.content', 'Hasil lab menunjukkan nilai normal')
            ->assertJsonPath('data.doctor.name', $doctor->name);
    });

    it('admin can add addendum', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $queue = createQueueForMedical();
        $record = MedicalRecord::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $queue->doctor_id,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/medical-records/{$record->id}/addendums", [
            'content' => 'Addendum dari admin',
        ]);
        $response->assertStatus(201);
    });

    it('receptionist cannot add addendum', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $queue = createQueueForMedical();
        $record = MedicalRecord::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $queue->doctor_id,
        ]);

        $response = $this->actingAs($receptionist)->postJson("/api/medical-records/{$record->id}/addendums", [
            'content' => 'Test',
        ]);
        $response->assertStatus(403);
    });

    it('validates addendum content required', function () {
        $doctor = User::factory()->doctor()->create();
        $queue = createQueueForMedical(['doctor' => $doctor]);
        $record = MedicalRecord::factory()->create([
            'queue_id' => $queue->id,
            'patient_id' => $queue->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->postJson("/api/medical-records/{$record->id}/addendums", []);
        $response->assertStatus(422)->assertJsonValidationErrors('content');
    });
});

describe('auto-lock medical records', function () {
    it('locks records older than 24 hours', function () {
        $queue1 = createQueueForMedical();
        $record1 = MedicalRecord::factory()->create([
            'queue_id' => $queue1->id,
            'patient_id' => $queue1->patient_id,
            'doctor_id' => $queue1->doctor_id,
            'is_locked' => false,
            'created_at' => now()->subHours(25),
        ]);

        $queue2 = createQueueForMedical();
        $record2 = MedicalRecord::factory()->create([
            'queue_id' => $queue2->id,
            'patient_id' => $queue2->patient_id,
            'doctor_id' => $queue2->doctor_id,
            'is_locked' => false,
            'created_at' => now()->subHours(1),
        ]);

        $this->artisan('medical-records:lock')->assertSuccessful();

        $this->assertDatabaseHas('medical_records', ['id' => $record1->id, 'is_locked' => true]);
        $this->assertDatabaseHas('medical_records', ['id' => $record2->id, 'is_locked' => false]);
    });
});

describe('icd10 search', function () {
    it('returns icd10 data', function () {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/icd10');
        $response->assertStatus(200);
        expect(count($response->json('data')))->toBeGreaterThan(0);
    });

    it('searches icd10 by code', function () {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/icd10?search=J06');
        $response->assertStatus(200);
        $data = $response->json('data');
        expect(count($data))->toBeGreaterThan(0);
        expect($data[0]['code'])->toContain('J06');
    });

    it('searches icd10 by description', function () {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/icd10?search=demam');
        $response->assertStatus(200);
        expect(count($response->json('data')))->toBeGreaterThan(0);
    });
});
