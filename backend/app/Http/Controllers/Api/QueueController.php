<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQueueRequest;
use App\Http\Resources\QueueResource;
use App\Models\Queue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class QueueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Queue::class);

        $query = Queue::with(['doctor', 'patient']);

        $date = $request->query('date', now()->toDateString());
        $query->whereDate('date', $date);

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $queues = $query
            ->orderByRaw("CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END")
            ->orderBy('queue_number')
            ->get();

        return ApiResponse::success(QueueResource::collection($queues));
    }

    public function store(StoreQueueRequest $request): JsonResponse
    {
        Gate::authorize('create', Queue::class);

        $data = $request->validated();
        $data['date'] = $data['date'] ?? now()->toDateString();

        $queue = Queue::create($data);
        $queue->load(['doctor', 'patient']);

        return ApiResponse::created(new QueueResource($queue), 'Pasien berhasil ditambahkan ke antrian');
    }

    public function updateStatus(Request $request, Queue $queue): JsonResponse
    {
        Gate::authorize('updateStatus', $queue);

        $request->validate([
            'status' => ['required', 'in:waiting,vitals,in_consultation,completed,cancelled'],
        ]);

        $queue->update(['status' => $request->input('status')]);
        $queue->load(['doctor', 'patient']);

        return ApiResponse::success(new QueueResource($queue), 'Status antrian berhasil diperbarui');
    }

    public function call(Queue $queue): JsonResponse
    {
        Gate::authorize('call', $queue);

        $queue->update([
            'status' => 'in_consultation',
            'called_at' => now(),
            'started_at' => now(),
        ]);

        $queue->load(['doctor', 'patient']);

        return ApiResponse::success(new QueueResource($queue), 'Pasien berhasil dipanggil');
    }

    public function complete(Queue $queue): JsonResponse
    {
        Gate::authorize('complete', $queue);

        $queue->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $queue->load(['doctor', 'patient']);

        return ApiResponse::success(new QueueResource($queue), 'Konsultasi selesai');
    }

    public function cancel(Queue $queue): JsonResponse
    {
        Gate::authorize('cancel', $queue);

        $queue->update([
            'status' => 'cancelled',
        ]);

        $queue->load(['doctor', 'patient']);

        return ApiResponse::success(new QueueResource($queue), 'Antrian berhasil dibatalkan');
    }
}
