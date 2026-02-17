<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrescriptionRequest;
use App\Http\Requests\UpdatePrescriptionRequest;
use App\Http\Resources\PrescriptionResource;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PrescriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Prescription::class);

        $query = Prescription::with(['patient', 'doctor']);

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if ($request->filled('medical_record_id')) {
            $query->where('medical_record_id', $request->integer('medical_record_id'));
        }
        if ($request->filled('is_dispensed')) {
            $query->where('is_dispensed', $request->boolean('is_dispensed'));
        }
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('prescription_number', 'ilike', "%{$search}%")
                  ->orWhereHas('patient', function ($q2) use ($search) {
                      $q2->where('name', 'ilike', "%{$search}%")
                         ->orWhere('mr_number', 'ilike', "%{$search}%");
                  });
            });
        }

        $user = $request->user();
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        $prescriptions = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 10));

        return response()->json([
            'data' => PrescriptionResource::collection($prescriptions->items()),
            'meta' => [
                'current_page' => $prescriptions->currentPage(),
                'last_page' => $prescriptions->lastPage(),
                'per_page' => $prescriptions->perPage(),
                'total' => $prescriptions->total(),
            ],
            'message' => 'Success',
            'errors' => null,
        ]);
    }

    public function show(Prescription $prescription): JsonResponse
    {
        Gate::authorize('view', $prescription);

        $prescription->load(['patient', 'doctor', 'dispensedByUser']);

        return ApiResponse::success(new PrescriptionResource($prescription));
    }

    public function store(StorePrescriptionRequest $request): JsonResponse
    {
        Gate::authorize('create', Prescription::class);

        $data = $request->validated();
        $medicalRecord = MedicalRecord::findOrFail($data['medical_record_id']);

        $prescription = Prescription::create([
            'patient_id' => $medicalRecord->patient_id,
            'doctor_id' => $request->user()->id,
            'medical_record_id' => $medicalRecord->id,
            'items' => $data['items'],
            'notes' => $data['notes'] ?? null,
        ]);

        $prescription->load(['patient', 'doctor']);

        return ApiResponse::created(new PrescriptionResource($prescription), 'Resep berhasil dibuat');
    }

    public function update(UpdatePrescriptionRequest $request, Prescription $prescription): JsonResponse
    {
        Gate::authorize('update', $prescription);

        if (!$prescription->isEditable()) {
            return ApiResponse::forbidden('Resep sudah ditebus dan tidak dapat diedit');
        }

        $prescription->update($request->validated());
        $prescription->load(['patient', 'doctor', 'dispensedByUser']);

        return ApiResponse::success(new PrescriptionResource($prescription), 'Resep berhasil diperbarui');
    }

    public function dispense(Request $request, Prescription $prescription): JsonResponse
    {
        Gate::authorize('dispense', $prescription);

        $prescription->dispense($request->user()->id);
        $prescription->load(['patient', 'doctor', 'dispensedByUser']);

        return ApiResponse::success(new PrescriptionResource($prescription), 'Resep berhasil ditebus');
    }

    public function pdf(Prescription $prescription)
    {
        Gate::authorize('view', $prescription);

        $prescription->load(['patient', 'doctor']);

        $pdf = Pdf::loadView('pdf.prescription', ['prescription' => $prescription]);
        $pdf->setPaper('a5', 'portrait');

        return $pdf->download("resep-{$prescription->prescription_number}.pdf");
    }
}
