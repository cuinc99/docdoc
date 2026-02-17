<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return ApiResponse::success($request->user());
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->update($validated);

        return ApiResponse::success($user, 'Profil berhasil diperbarui');
    }

    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return ApiResponse::error('Password lama tidak sesuai', 422);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
        ]);

        return ApiResponse::success(null, 'Password berhasil diubah');
    }
}
