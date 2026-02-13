<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'data' => [
            'status' => 'ok',
            'timestamp' => now()->toISOString(),
        ],
        'message' => 'DocDoc API is running',
        'errors' => null,
    ]);
});
