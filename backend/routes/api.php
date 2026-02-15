<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ScheduleController;
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

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::apiResource('patients', PatientController::class);

    Route::apiResource('schedules', ScheduleController::class)->except(['show']);
    Route::get('/schedules/{schedule}', [ScheduleController::class, 'show']);
    Route::patch('/schedules/{schedule}/toggle', [ScheduleController::class, 'toggle']);

    Route::get('/queues', [QueueController::class, 'index']);
    Route::post('/queues', [QueueController::class, 'store']);
    Route::patch('/queues/{queue}/status', [QueueController::class, 'updateStatus']);
    Route::patch('/queues/{queue}/call', [QueueController::class, 'call']);
    Route::patch('/queues/{queue}/complete', [QueueController::class, 'complete']);
    Route::patch('/queues/{queue}/cancel', [QueueController::class, 'cancel']);

    Route::get('/doctors', function (\Illuminate\Http\Request $request) {
        $doctors = \App\Models\User::where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'specialization', 'sip_number']);

        return \App\Helpers\ApiResponse::success($doctors);
    });
});
