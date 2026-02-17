<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Icd10Controller;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\VitalSignController;
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
    Route::get('/queues/{queue}', [QueueController::class, 'show']);
    Route::post('/queues', [QueueController::class, 'store']);
    Route::patch('/queues/{queue}/status', [QueueController::class, 'updateStatus']);
    Route::patch('/queues/{queue}/call', [QueueController::class, 'call']);
    Route::patch('/queues/{queue}/complete', [QueueController::class, 'complete']);
    Route::patch('/queues/{queue}/cancel', [QueueController::class, 'cancel']);

    Route::get('/vital-signs', [VitalSignController::class, 'index']);
    Route::get('/vital-signs/{vitalSign}', [VitalSignController::class, 'show']);
    Route::post('/vital-signs', [VitalSignController::class, 'store']);
    Route::put('/vital-signs/{vitalSign}', [VitalSignController::class, 'update']);
    Route::delete('/vital-signs/{vitalSign}', [VitalSignController::class, 'destroy']);

    Route::get('/medical-records', [MedicalRecordController::class, 'index']);
    Route::get('/medical-records/{medicalRecord}', [MedicalRecordController::class, 'show']);
    Route::post('/medical-records', [MedicalRecordController::class, 'store']);
    Route::put('/medical-records/{medicalRecord}', [MedicalRecordController::class, 'update']);
    Route::post('/medical-records/{medicalRecord}/addendums', [MedicalRecordController::class, 'storeAddendum']);
    Route::put('/medical-records/{medicalRecord}/addendums/{addendum}', [MedicalRecordController::class, 'updateAddendum']);
    Route::delete('/medical-records/{medicalRecord}/addendums/{addendum}', [MedicalRecordController::class, 'destroyAddendum']);

    Route::get('/icd10', [Icd10Controller::class, 'index']);

    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::get('/prescriptions/{prescription}', [PrescriptionController::class, 'show']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update']);
    Route::patch('/prescriptions/{prescription}/dispense', [PrescriptionController::class, 'dispense']);
    Route::get('/prescriptions/{prescription}/pdf', [PrescriptionController::class, 'pdf']);

    Route::get('/services', [ServiceController::class, 'index']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
    Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'addPayment']);
    Route::patch('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf']);

    Route::get('/doctors', function (\Illuminate\Http\Request $request) {
        $doctors = \App\Models\User::where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'specialization', 'sip_number']);

        return \App\Helpers\ApiResponse::success($doctors);
    });
});
