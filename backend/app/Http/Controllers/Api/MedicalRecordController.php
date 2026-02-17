<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddendumRequest;
use App\Http\Requests\StoreMedicalRecordRequest;
use App\Http\Requests\UpdateMedicalRecordRequest;
use App\Http\Resources\MedicalRecordResource;
use App\Models\MedicalRecord;
use App\Models\Queue;
use App\Models\VitalSign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MedicalRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', MedicalRecord::class);

        $query = MedicalRecord::with(['patient', 'doctor', 'queue']);

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }
        if ($request->filled('search')) {
            $term = mb_strtolower((string) $request->string('search'));
            $query->whereHas('patient', function ($q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(mr_number) LIKE ?', ["%{$term}%"]);
            });
        }

        $user = $request->user();
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        $records = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 10));

        return ApiResponse::paginated($records);
    }

    public function show(MedicalRecord $medicalRecord): JsonResponse
    {
        Gate::authorize('view', $medicalRecord);

        $medicalRecord->load(['patient', 'doctor', 'queue', 'vitalSign', 'addendums.doctor']);

        return ApiResponse::success(new MedicalRecordResource($medicalRecord));
    }

    public function store(StoreMedicalRecordRequest $request): JsonResponse
    {
        Gate::authorize('create', MedicalRecord::class);

        $data = $request->validated();
        $queue = Queue::findOrFail($data['queue_id']);
        $data['patient_id'] = $queue->patient_id;
        $data['doctor_id'] = $request->user()->id;

        $vitalSign = VitalSign::where('queue_id', $queue->id)->first();
        if ($vitalSign) {
            $data['vital_sign_id'] = $vitalSign->id;
        }

        $record = MedicalRecord::create($data);
        $record->load(['patient', 'doctor', 'queue', 'vitalSign', 'addendums']);

        return ApiResponse::created(new MedicalRecordResource($record), 'Rekam medis berhasil disimpan');
    }

    public function update(UpdateMedicalRecordRequest $request, MedicalRecord $medicalRecord): JsonResponse
    {
        Gate::authorize('update', $medicalRecord);

        if (!$medicalRecord->isEditable()) {
            return ApiResponse::forbidden('Rekam medis sudah terkunci dan tidak dapat diedit');
        }

        $medicalRecord->update($request->validated());
        $medicalRecord->load(['patient', 'doctor', 'queue', 'vitalSign', 'addendums.doctor']);

        return ApiResponse::success(new MedicalRecordResource($medicalRecord), 'Rekam medis berhasil diperbarui');
    }

    public function storeAddendum(StoreAddendumRequest $request, MedicalRecord $medicalRecord): JsonResponse
    {
        Gate::authorize('addAddendum', $medicalRecord);

        $addendum = new \App\Models\Addendum();
        $addendum->medical_record_id = $medicalRecord->id;
        $addendum->doctor_id = $request->user()->id;
        $addendum->content = $request->validated('content');
        $addendum->save();

        $addendum->load('doctor');

        return ApiResponse::created([
            'id' => $addendum->id,
            'doctor_id' => $addendum->doctor_id,
            'content' => $addendum->content,
            'doctor' => [
                'id' => $addendum->doctor->id,
                'name' => $addendum->doctor->name,
            ],
            'created_at' => $addendum->created_at?->toISOString(),
        ], 'Addendum berhasil ditambahkan');
    }

    public function updateAddendum(StoreAddendumRequest $request, MedicalRecord $medicalRecord, \App\Models\Addendum $addendum): JsonResponse
    {
        Gate::authorize('updateAddendum', [$medicalRecord, $addendum]);

        $addendum->update(['content' => $request->validated('content')]);
        $addendum->load('doctor');

        return ApiResponse::success([
            'id' => $addendum->id,
            'doctor_id' => $addendum->doctor_id,
            'content' => $addendum->content,
            'doctor' => [
                'id' => $addendum->doctor->id,
                'name' => $addendum->doctor->name,
            ],
            'created_at' => $addendum->created_at?->toISOString(),
        ], 'Addendum berhasil diperbarui');
    }

    public function destroyAddendum(MedicalRecord $medicalRecord, \App\Models\Addendum $addendum): JsonResponse
    {
        Gate::authorize('deleteAddendum', [$medicalRecord, $addendum]);

        $addendum->delete();

        return ApiResponse::success(null, 'Addendum berhasil dihapus');
    }
}
