<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\ClinicSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicSettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $settings = ClinicSetting::query()->pluck('value', 'key')->toArray();

        if (! empty($settings['clinic_logo'])) {
            $settings['clinic_logo'] = asset('storage/' . $settings['clinic_logo']);
        }

        return ApiResponse::success($settings);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->isAdmin()) {
            return ApiResponse::forbidden();
        }

        $validated = $request->validate([
            'clinic_name' => 'nullable|string|max:255',
            'clinic_address' => 'nullable|string|max:500',
            'clinic_phone' => 'nullable|string|max:50',
            'clinic_email' => 'nullable|string|email|max:255',
        ]);

        foreach ($validated as $key => $value) {
            ClinicSetting::set($key, $value);
        }

        $settings = ClinicSetting::query()->pluck('value', 'key')->toArray();

        if (! empty($settings['clinic_logo'])) {
            $settings['clinic_logo'] = asset('storage/' . $settings['clinic_logo']);
        }

        return ApiResponse::success($settings, 'Pengaturan klinik berhasil diperbarui');
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->isAdmin()) {
            return ApiResponse::forbidden();
        }

        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $path = $request->file('logo')->store('logos', 'public');

        ClinicSetting::set('clinic_logo', $path);

        return ApiResponse::success([
            'path' => $path,
            'url' => asset('storage/' . $path),
        ], 'Logo berhasil diupload');
    }
}
