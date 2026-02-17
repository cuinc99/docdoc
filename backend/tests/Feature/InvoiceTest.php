<?php

use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function invoiceData(?int $patientId = null): array
{
    $patientId = $patientId ?? Patient::factory()->create()->id;

    return [
        'patient_id' => $patientId,
        'items' => [
            ['description' => 'Konsultasi Dokter', 'quantity' => 1, 'unit_price' => 100000],
            ['description' => 'Pemeriksaan Lab', 'quantity' => 2, 'unit_price' => 50000],
        ],
        'discount' => 10000,
        'tax_percent' => 10,
    ];
}

describe('services', function () {
    it('lists active services', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        Service::factory()->create(['name' => 'Konsultasi', 'is_active' => true]);
        Service::factory()->create(['name' => 'Inactive', 'is_active' => false]);

        $response = $this->actingAs($admin)->getJson('/api/services');
        $response->assertStatus(200);
        expect(count($response->json('data')))->toBe(1);
    });

    it('admin can create service', function () {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->postJson('/api/services', [
            'name' => 'Konsultasi Dokter',
            'price' => 100000,
        ]);
        $response->assertStatus(201)->assertJsonPath('data.name', 'Konsultasi Dokter');
    });

    it('admin can update service', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $service = Service::factory()->create();

        $response = $this->actingAs($admin)->putJson("/api/services/{$service->id}", [
            'name' => 'Updated',
            'price' => 200000,
        ]);
        $response->assertStatus(200)->assertJsonPath('data.name', 'Updated');
    });

    it('admin can delete service', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $service = Service::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/services/{$service->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    });

    it('doctor cannot create service', function () {
        $doctor = User::factory()->doctor()->create();
        $response = $this->actingAs($doctor)->postJson('/api/services', [
            'name' => 'Test',
            'price' => 100000,
        ]);
        $response->assertStatus(403);
    });

    it('receptionist cannot create service', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        $response = $this->actingAs($receptionist)->postJson('/api/services', [
            'name' => 'Test',
            'price' => 100000,
        ]);
        $response->assertStatus(403);
    });
});

describe('invoices list', function () {
    it('admin can list invoices', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        Invoice::factory()->create();

        $response = $this->actingAs($admin)->getJson('/api/invoices');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });

    it('receptionist can list invoices', function () {
        $receptionist = User::factory()->create(['role' => 'receptionist']);
        Invoice::factory()->create();

        $response = $this->actingAs($receptionist)->getJson('/api/invoices');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });

    it('doctor cannot list invoices', function () {
        $doctor = User::factory()->doctor()->create();
        $response = $this->actingAs($doctor)->getJson('/api/invoices');
        $response->assertStatus(403);
    });

    it('filters by status', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        Invoice::factory()->create(['status' => 'pending']);
        Invoice::factory()->create(['status' => 'paid']);

        $response = $this->actingAs($admin)->getJson('/api/invoices?status=pending');
        $response->assertStatus(200)->assertJsonPath('meta.total', 1);
    });
});

describe('invoices store', function () {
    it('creates invoice with calculated totals', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $data = invoiceData();

        $response = $this->actingAs($admin)->postJson('/api/invoices', $data);
        $response->assertStatus(201);

        $invoice = $response->json('data');
        expect((float) $invoice['subtotal'])->toBe(200000.00);
        expect((float) $invoice['discount'])->toBe(10000.00);
        expect((float) $invoice['tax'])->toBe(19000.00);
        expect((float) $invoice['total'])->toBe(209000.00);
        expect($invoice['status'])->toBe('pending');
        expect($invoice['invoice_number'])->toStartWith('INV');
    });

    it('validates required fields', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($admin)->postJson('/api/invoices', []);
        $response->assertStatus(422)->assertJsonValidationErrors(['patient_id', 'items']);
    });

    it('doctor cannot create invoice', function () {
        $doctor = User::factory()->doctor()->create();
        $response = $this->actingAs($doctor)->postJson('/api/invoices', invoiceData());
        $response->assertStatus(403);
    });
});

describe('invoices update', function () {
    it('updates pending invoice', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->putJson("/api/invoices/{$invoice->id}", [
            'patient_id' => $invoice->patient_id,
            'items' => [['description' => 'Updated', 'quantity' => 1, 'unit_price' => 500000]],
        ]);
        $response->assertStatus(200);
        expect((float) $response->json('data.total'))->toBe(500000.00);
    });

    it('cannot update non-pending invoice', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['status' => 'partial']);

        $response = $this->actingAs($admin)->putJson("/api/invoices/{$invoice->id}", [
            'patient_id' => $invoice->patient_id,
            'items' => [['description' => 'Updated', 'quantity' => 1, 'unit_price' => 500000]],
        ]);
        $response->assertStatus(403);
    });
});

describe('invoices payments', function () {
    it('adds partial payment', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['total' => 200000, 'status' => 'pending']);

        $response = $this->actingAs($admin)->postJson("/api/invoices/{$invoice->id}/payments", [
            'amount' => 100000,
            'method' => 'cash',
        ]);
        $response->assertStatus(201);
        expect($response->json('data.status'))->toBe('partial');
        expect((float) $response->json('data.paid_amount'))->toBe(100000.00);
    });

    it('full payment marks invoice as paid', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['total' => 100000, 'status' => 'pending']);

        $response = $this->actingAs($admin)->postJson("/api/invoices/{$invoice->id}/payments", [
            'amount' => 100000,
            'method' => 'transfer',
            'reference' => 'TRF-12345',
        ]);
        $response->assertStatus(201);
        expect($response->json('data.status'))->toBe('paid');
        expect($response->json('message'))->toBe('Pembayaran berhasil, invoice lunas');
    });

    it('prevents overpayment', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['total' => 100000, 'status' => 'pending']);

        $response = $this->actingAs($admin)->postJson("/api/invoices/{$invoice->id}/payments", [
            'amount' => 200000,
            'method' => 'cash',
        ]);
        $response->assertStatus(422);
    });

    it('cannot pay cancelled invoice', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['total' => 100000, 'status' => 'cancelled']);

        $response = $this->actingAs($admin)->postJson("/api/invoices/{$invoice->id}/payments", [
            'amount' => 50000,
            'method' => 'cash',
        ]);
        $response->assertStatus(403);
    });

    it('validates payment fields', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['total' => 100000, 'status' => 'pending']);

        $response = $this->actingAs($admin)->postJson("/api/invoices/{$invoice->id}/payments", []);
        $response->assertStatus(422)->assertJsonValidationErrors(['amount', 'method']);
    });
});

describe('invoices cancel', function () {
    it('cancels pending invoice', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->patchJson("/api/invoices/{$invoice->id}/cancel");
        $response->assertStatus(200)->assertJsonPath('data.status', 'cancelled');
    });

    it('cannot cancel non-pending invoice', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create(['status' => 'partial']);

        $response = $this->actingAs($admin)->patchJson("/api/invoices/{$invoice->id}/cancel");
        $response->assertStatus(403);
    });
});

describe('invoices show', function () {
    it('returns invoice detail with payments', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create();

        $response = $this->actingAs($admin)->getJson("/api/invoices/{$invoice->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.id', $invoice->id)
            ->assertJsonStructure(['data' => ['patient', 'payments', 'invoice_number']]);
    });
});

describe('invoices pdf', function () {
    it('downloads invoice pdf', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        $invoice = Invoice::factory()->create();

        $response = $this->actingAs($admin)->get("/api/invoices/{$invoice->id}/pdf");
        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    });
});

describe('invoice number auto-generation', function () {
    it('generates unique invoice numbers', function () {
        $i1 = Invoice::factory()->create();
        $i2 = Invoice::factory()->create();

        expect($i1->invoice_number)->not->toBe($i2->invoice_number);
        expect($i1->invoice_number)->toStartWith('INV');
    });
});
