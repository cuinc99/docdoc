<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isAdmin()) {
            return ApiResponse::forbidden();
        }

        $query = User::query();

        if ($request->filled('search')) {
            $term = mb_strtolower((string) $request->string('search'));
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$term}%"]);
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        $users = $query->orderBy('name')->paginate($request->integer('per_page', 10));

        return ApiResponse::paginated($users);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if (! $currentUser->isAdmin()) {
            return ApiResponse::forbidden();
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:50',
            'role' => 'required|string|in:admin,doctor,receptionist',
            'specialization' => 'nullable|string|max:255',
            'sip_number' => 'nullable|string|max:255',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return ApiResponse::created($user, 'User berhasil dibuat');
    }

    public function update(Request $request, User $user): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if (! $currentUser->isAdmin()) {
            return ApiResponse::forbidden();
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:50',
            'role' => 'required|string|in:admin,doctor,receptionist',
            'specialization' => 'nullable|string|max:255',
            'sip_number' => 'nullable|string|max:255',
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return ApiResponse::success($user, 'User berhasil diperbarui');
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if (! $currentUser->isAdmin()) {
            return ApiResponse::forbidden();
        }

        if ($currentUser->id === $user->id) {
            return ApiResponse::error('Tidak dapat menonaktifkan diri sendiri', 403);
        }

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return ApiResponse::success($user, "User berhasil {$status}");
    }
}
