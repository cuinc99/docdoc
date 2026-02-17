<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Patient::class);

        $patients = Patient::query()
            ->search($request->query('search'))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 10));

        return ApiResponse::paginated($patients);
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        Gate::authorize('create', Patient::class);

        $patient = Patient::create($request->validated());

        return ApiResponse::created(new PatientResource($patient), 'Pasien berhasil ditambahkan');
    }

    public function show(Patient $patient): JsonResponse
    {
        Gate::authorize('view', $patient);

        return ApiResponse::success(new PatientResource($patient));
    }

    public function update(UpdatePatientRequest $request, Patient $patient): JsonResponse
    {
        Gate::authorize('update', $patient);

        $patient->update($request->validated());

        return ApiResponse::success(new PatientResource($patient), 'Data pasien berhasil diperbarui');
    }

    public function destroy(Patient $patient): JsonResponse
    {
        Gate::authorize('delete', $patient);

        $patient->delete();

        return ApiResponse::success(null, 'Pasien berhasil dihapus');
    }
}
