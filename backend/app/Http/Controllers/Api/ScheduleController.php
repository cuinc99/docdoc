<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleRequest;
use App\Http\Requests\UpdateScheduleRequest;
use App\Http\Resources\ScheduleResource;
use App\Models\Queue;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Schedule::class);

        $query = Schedule::with('doctor');

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->query('date_to'));
        }

        $schedules = $query->orderBy('date')->orderBy('start_time')->get();

        return ApiResponse::success(ScheduleResource::collection($schedules));
    }

    public function store(StoreScheduleRequest $request): JsonResponse
    {
        Gate::authorize('create', Schedule::class);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $data = $request->validated();

        if ($user->isDoctor()) {
            $data['doctor_id'] = $user->id;
        }

        $schedule = Schedule::create($data);
        $schedule->load('doctor');

        return ApiResponse::created(new ScheduleResource($schedule), 'Jadwal berhasil ditambahkan');
    }

    public function show(Schedule $schedule): JsonResponse
    {
        Gate::authorize('view', $schedule);

        $schedule->load('doctor');

        return ApiResponse::success(new ScheduleResource($schedule));
    }

    public function update(UpdateScheduleRequest $request, Schedule $schedule): JsonResponse
    {
        Gate::authorize('update', $schedule);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $data = $request->validated();

        if ($user->isDoctor()) {
            $data['doctor_id'] = $user->id;
        }

        $queues = Queue::where('doctor_id', $schedule->doctor_id)
            ->whereDate('date', $schedule->date->format('Y-m-d'))
            ->get();

        if ($queues->isNotEmpty()) {
            $hasNonWaiting = $queues->contains(fn (Queue $q) => $q->status !== 'waiting');

            if ($hasNonWaiting) {
                return ApiResponse::error('Jadwal tidak dapat diedit karena sudah ada antrian yang sedang diproses', 422);
            }

            $oldDate = $schedule->date->format('Y-m-d');
            $newDate = $data['date'] ?? $oldDate;

            if ($oldDate !== $newDate) {
                DB::transaction(function () use ($schedule, $data, $queues, $newDate): void {
                    $schedule->update($data);
                    foreach ($queues as $q) {
                        $q->update(['date' => $newDate]);
                    }
                });
            } else {
                $schedule->update($data);
            }
        } else {
            $schedule->update($data);
        }

        $schedule->load('doctor');

        return ApiResponse::success(new ScheduleResource($schedule), 'Jadwal berhasil diperbarui');
    }

    public function toggle(Schedule $schedule): JsonResponse
    {
        Gate::authorize('update', $schedule);

        $hasQueues = Queue::where('doctor_id', $schedule->doctor_id)
            ->whereDate('date', $schedule->date->format('Y-m-d'))
            ->exists();

        if ($hasQueues) {
            return ApiResponse::error('Jadwal tidak dapat dinonaktifkan karena sudah ada antrian terdaftar', 422);
        }

        $schedule->update(['is_available' => ! $schedule->is_available]);
        $schedule->load('doctor');

        $status = $schedule->is_available ? 'tersedia' : 'tidak tersedia';

        return ApiResponse::success(new ScheduleResource($schedule), "Jadwal berhasil diubah menjadi {$status}");
    }

    public function destroy(Schedule $schedule): JsonResponse
    {
        Gate::authorize('delete', $schedule);

        $schedule->delete();

        return ApiResponse::success(null, 'Jadwal berhasil dihapus');
    }
}
