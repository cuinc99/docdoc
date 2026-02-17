<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Berhasil', int $code = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
            'errors' => null,
        ], $code);
    }

    public static function paginated(\Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator, string $message = 'Berhasil'): JsonResponse
    {
        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'message' => $message,
            'errors' => null,
        ]);
    }

    public static function created(mixed $data = null, string $message = 'Berhasil dibuat'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    public static function error(string $message = 'Terjadi kesalahan', int $code = 400, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'data' => null,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }

    public static function notFound(string $message = 'Data tidak ditemukan'): JsonResponse
    {
        return self::error($message, 404);
    }

    public static function unauthorized(string $message = 'Tidak terautentikasi'): JsonResponse
    {
        return self::error($message, 401);
    }

    public static function forbidden(string $message = 'Akses ditolak'): JsonResponse
    {
        return self::error($message, 403);
    }

    public static function validationError(mixed $errors, string $message = 'Validasi gagal'): JsonResponse
    {
        return self::error($message, 422, $errors);
    }
}
