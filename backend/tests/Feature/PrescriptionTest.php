<?php

use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Queue;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createMedicalRecordForPrescription(array $overrides = []): MedicalRecord
{
    $doctor = $overrides['doctor'] ?? User::factory()->doctor()->create();
    $patient = $overrides['patient'] ?? Patient::factory()->create();
    Schedule::factory()->create(['doctor_id' => $doctor->id, 'date' => now()->toDateString()]);

    $queue = Queue::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'date' => now()->toDateString(),
        'status' => 'in_consultation',
    ]);

    return MedicalRecord::factory()->create([
        'queue_id' => $queue->id,
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
    ]);
}

function prescriptionData(int $medicalRecordId): array
{
    return [
        'medical_record_id' => $medicalRecordId,
        'items' => [
            [
                'drug_name' => 'Paracetamol 500mg',
                'dosage' => '500mg',
                'frequency' => '3x sehari',
                'duration' => '5 hari',
                'quantity' => 15,
                'instructions' => 'Sesudah makan',
            ],
            [
                'drug_name' => 'Amoxicillin 500mg',
                'dosage' => '500mg',
                'frequency' => '3x sehari',
                'duration' => '7 hari',
                'quantity' => 21,
                'instructions' => 'Sebelum makan',
            ],
        ],
        'notes' => 'Minum obat sampai habis',
    ];
}

describe('prescriptions list', function () {
    it('returns prescriptions for authenticated user', function () {
        $doctor = User::factory()->doctor()->create();
        $record = createMedicalRecordForPrescription(['doctor' => $doctor]);
        Prescription::factory()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->getJson('/api/prescriptions');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });

    it('doctor only sees own prescriptions', function () {
        $doctor1 = User::factory()->doctor()->create();
        $doctor2 = User::factory()->doctor()->create();

        $record1 = createMedicalRecordForPrescription(['doctor' => $doctor1]);
        Prescription::factory()->create([
            'medical_record_id' => $record1->id,
            'patient_id' => $record1->patient_id,
            'doctor_id' => $doctor1->id,
        ]);

        $record2 = createMedicalRecordForPrescription(['doctor' => $doctor2]);
        Prescription::factory()->create([
            'medical_record_id' => $record2->id,
            'patient_id' => $record2->patient_id,
            'doctor_id' => $doctor2->id,
        ]);

        $response = $this->actingAs($doctor1)->getJson('/api/prescriptions');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });

    it('filters by is_dispensed', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $record1 = createMedicalRecordForPrescription();
        Prescription::factory()->create([
            'medical_record_id' => $record1->id,
            'patient_id' => $record1->patient_id,
            'doctor_id' => $record1->doctor_id,
            'is_dispensed' => false,
        ]);

        $record2 = createMedicalRecordForPrescription();
        Prescription::factory()->dispensed()->create([
            'medical_record_id' => $record2->id,
            'patient_id' => $record2->patient_id,
            'doctor_id' => $record2->doctor_id,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/prescriptions?is_dispensed=0');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });
});

describe('prescriptions store', function () {
    it('creates prescription', function () {
        $doctor = User::factory()->doctor()->create();
        $record = createMedicalRecordForPrescription(['doctor' => $doctor]);

        $response = $this->actingAs($doctor)->postJson('/api/prescriptions', prescriptionData($record->id));
        $response->assertStatus(201)
            ->assertJsonPath('data.medical_record_id', $record->id)
            ->assertJsonPath('message', 'Resep berhasil dibuat');

        expect($response->json('data.prescription_number'))->toStartWith('RX');
        expect(count($response->json('data.items')))->toBe(2);
    });

    it('prevents duplicate prescription for same medical record', function () {
        $doctor = User::factory()->doctor()->create();
        $record = createMedicalRecordForPrescription(['doctor' => $doctor]);
        Prescription::factory()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->postJson('/api/prescriptions', prescriptionData($record->id));
        $response->assertStatus(422)->assertJsonValidationErrors('medical_record_id');
    });

    it('validates required fields', function () {
        $doctor = User::factory()->doctor()->create();
        $response = $this->actingAs($doctor)->postJson('/api/prescriptions', []);
        $response->assertStatus(422)->assertJsonValidationErrors(['medical_record_id', 'items']);
    });

    it('validates item fields', function () {
        $doctor = User::factory()->doctor()->create();
        $record = createMedicalRecordForPrescription(['doctor' => $doctor]);

        $response = $this->actingAs($doctor)->postJson('/api/prescriptions', [
            'medical_record_id' => $record->id,
            'items' => [['drug_name' => '']],
        ]);
        $response->assertStatus(422);
    });

    it('receptionist cannot create prescription', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $record = createMedicalRecordForPrescription();

        $response = $this->actingAs($receptionist)->postJson('/api/prescriptions', prescriptionData($record->id));
        $response->assertStatus(403);
    });
});

describe('prescriptions update', function () {
    it('updates undispensed prescription', function () {
        $doctor = User::factory()->doctor()->create();
        $record = createMedicalRecordForPrescription(['doctor' => $doctor]);
        $prescription = Prescription::factory()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->putJson("/api/prescriptions/{$prescription->id}", [
            'items' => [['drug_name' => 'Ibuprofen', 'dosage' => '400mg', 'frequency' => '2x sehari', 'quantity' => 10]],
            'notes' => 'Updated notes',
        ]);
        $response->assertStatus(200)->assertJsonPath('data.notes', 'Updated notes');
    });

    it('cannot update dispensed prescription', function () {
        $doctor = User::factory()->doctor()->create();
        $record = createMedicalRecordForPrescription(['doctor' => $doctor]);
        $prescription = Prescription::factory()->dispensed()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->putJson("/api/prescriptions/{$prescription->id}", [
            'items' => [['drug_name' => 'Ibuprofen', 'dosage' => '400mg', 'frequency' => '2x sehari', 'quantity' => 10]],
        ]);
        $response->assertStatus(403);
    });
});

describe('prescriptions dispense', function () {
    it('receptionist can dispense prescription', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $record = createMedicalRecordForPrescription();
        $prescription = Prescription::factory()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $record->doctor_id,
        ]);

        $response = $this->actingAs($receptionist)->patchJson("/api/prescriptions/{$prescription->id}/dispense");
        $response->assertStatus(200)
            ->assertJsonPath('data.is_dispensed', true)
            ->assertJsonPath('message', 'Resep berhasil ditebus');
    });

    it('cannot dispense already dispensed prescription', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $record = createMedicalRecordForPrescription();
        $prescription = Prescription::factory()->dispensed()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $record->doctor_id,
        ]);

        $response = $this->actingAs($receptionist)->patchJson("/api/prescriptions/{$prescription->id}/dispense");
        $response->assertStatus(403);
    });

    it('doctor cannot dispense prescription', function () {
        $doctor = User::factory()->doctor()->create();
        $record = createMedicalRecordForPrescription(['doctor' => $doctor]);
        $prescription = Prescription::factory()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $doctor->id,
        ]);

        $response = $this->actingAs($doctor)->patchJson("/api/prescriptions/{$prescription->id}/dispense");
        $response->assertStatus(403);
    });
});

describe('prescriptions show', function () {
    it('returns prescription detail', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $record = createMedicalRecordForPrescription();
        $prescription = Prescription::factory()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $record->doctor_id,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/prescriptions/{$prescription->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.id', $prescription->id)
            ->assertJsonStructure(['data' => ['patient', 'doctor', 'prescription_number']]);
    });
});

describe('prescriptions pdf', function () {
    it('downloads prescription pdf', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $record = createMedicalRecordForPrescription();
        $prescription = Prescription::factory()->create([
            'medical_record_id' => $record->id,
            'patient_id' => $record->patient_id,
            'doctor_id' => $record->doctor_id,
        ]);

        $response = $this->actingAs($admin)->get("/api/prescriptions/{$prescription->id}/pdf");
        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    });
});

describe('prescription number auto-generation', function () {
    it('generates unique prescription numbers', function () {
        $record1 = createMedicalRecordForPrescription();
        $p1 = Prescription::factory()->create([
            'medical_record_id' => $record1->id,
            'patient_id' => $record1->patient_id,
            'doctor_id' => $record1->doctor_id,
        ]);

        $record2 = createMedicalRecordForPrescription();
        $p2 = Prescription::factory()->create([
            'medical_record_id' => $record2->id,
            'patient_id' => $record2->patient_id,
            'doctor_id' => $record2->doctor_id,
        ]);

        expect($p1->prescription_number)->not->toBe($p2->prescription_number);
        expect($p1->prescription_number)->toStartWith('RX');
        expect($p2->prescription_number)->toStartWith('RX');
    });
});
