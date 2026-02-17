<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Service::class);

        $services = Service::where('is_active', true)->orderBy('name')->get();

        return ApiResponse::success($services);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Service::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
        ], [
            'name.required' => 'Nama layanan wajib diisi',
            'price.required' => 'Harga wajib diisi',
            'price.min' => 'Harga tidak boleh negatif',
        ]);

        $service = Service::create($data);

        return ApiResponse::created($service, 'Layanan berhasil ditambahkan');
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        Gate::authorize('update', Service::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ], [
            'name.required' => 'Nama layanan wajib diisi',
            'price.required' => 'Harga wajib diisi',
        ]);

        $service->update($data);

        return ApiResponse::success($service, 'Layanan berhasil diperbarui');
    }

    public function destroy(Service $service): JsonResponse
    {
        Gate::authorize('delete', Service::class);

        $service->delete();

        return ApiResponse::success(null, 'Layanan berhasil dihapus');
    }
}
