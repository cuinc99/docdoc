<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVitalSignRequest;
use App\Http\Requests\UpdateVitalSignRequest;
use App\Http\Resources\VitalSignResource;
use App\Models\Queue;
use App\Models\VitalSign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class VitalSignController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', VitalSign::class);

        $query = VitalSign::with(['patient', 'queue', 'recordedBy']);

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if ($request->filled('queue_id')) {
            $query->where('queue_id', $request->integer('queue_id'));
        }

        $vitalSigns = $query->orderByDesc('created_at')->get();

        return ApiResponse::success(VitalSignResource::collection($vitalSigns));
    }

    public function show(VitalSign $vitalSign): JsonResponse
    {
        Gate::authorize('view', $vitalSign);

        $vitalSign->load(['patient', 'queue', 'recordedBy']);

        return ApiResponse::success(new VitalSignResource($vitalSign));
    }

    public function store(StoreVitalSignRequest $request): JsonResponse
    {
        Gate::authorize('create', VitalSign::class);

        $data = $request->validated();
        $queue = Queue::findOrFail($data['queue_id']);
        $data['patient_id'] = $queue->patient_id;
        $data['recorded_by'] = $request->user()->id;

        $vitalSign = VitalSign::create($data);

        $queue->update(['status' => 'vitals']);

        $vitalSign->load(['patient', 'queue', 'recordedBy']);

        return ApiResponse::created(new VitalSignResource($vitalSign), 'Tanda vital berhasil disimpan');
    }

    public function update(UpdateVitalSignRequest $request, VitalSign $vitalSign): JsonResponse
    {
        Gate::authorize('update', $vitalSign);

        $vitalSign->update($request->validated());
        $vitalSign->load(['patient', 'queue', 'recordedBy']);

        return ApiResponse::success(new VitalSignResource($vitalSign), 'Tanda vital berhasil diperbarui');
    }

    public function destroy(VitalSign $vitalSign): JsonResponse
    {
        Gate::authorize('delete', $vitalSign);

        $queue = $vitalSign->queue;
        $vitalSign->delete();

        if ($queue->status === 'vitals') {
            $queue->update(['status' => 'waiting']);
        }

        return ApiResponse::success(null, 'Tanda vital berhasil dihapus');
    }
}
