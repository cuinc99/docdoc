<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\Queue;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private const TIMEZONE = 'Asia/Makassar';

    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $data = match ($user->role) {
            'admin' => $this->adminStats(),
            'doctor' => $this->doctorStats($user->id),
            default => $this->receptionistStats(),
        };

        return ApiResponse::success($data);
    }

    /** @return array<string, mixed> */
    private function adminStats(): array
    {
        $today = Carbon::now(self::TIMEZONE)->toDateString();
        $monthStart = Carbon::now(self::TIMEZONE)->startOfMonth()->toDateString();
        $monthEnd = Carbon::now(self::TIMEZONE)->endOfMonth()->toDateString();

        $visitChart = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now(self::TIMEZONE)->subDays($i)->toDateString();
            $count = Queue::whereDate('date', $date)
                ->where('status', 'completed')
                ->count();
            $visitChart[] = ['date' => $date, 'count' => $count];
        }

        return [
            'total_patients' => Patient::count(),
            'today_visits' => Queue::whereDate('date', $today)
                ->where('status', 'completed')
                ->count(),
            'monthly_revenue' => (float) Invoice::where('status', 'paid')
                ->whereDate('created_at', '>=', $monthStart)
                ->whereDate('created_at', '<=', $monthEnd)
                ->sum('total'),
            'active_queues' => Queue::whereDate('date', $today)
                ->whereIn('status', ['waiting', 'vitals', 'in_consultation'])
                ->count(),
            'visit_chart' => $visitChart,
        ];
    }

    /** @return array<string, mixed> */
    private function doctorStats(int $doctorId): array
    {
        $today = Carbon::now(self::TIMEZONE)->toDateString();

        return [
            'my_patients_today' => Queue::where('doctor_id', $doctorId)
                ->whereDate('date', $today)
                ->count(),
            'my_active_queues' => Queue::where('doctor_id', $doctorId)
                ->whereDate('date', $today)
                ->whereIn('status', ['waiting', 'vitals'])
                ->count(),
            'recent_records' => MedicalRecord::where('doctor_id', $doctorId)
                ->with('patient')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(),
            'undispensed_prescriptions' => Prescription::where('doctor_id', $doctorId)
                ->where('is_dispensed', false)
                ->count(),
        ];
    }

    /** @return array<string, mixed> */
    private function receptionistStats(): array
    {
        $today = Carbon::now(self::TIMEZONE)->toDateString();

        return [
            'today_queues' => Queue::whereDate('date', $today)->count(),
            'pending_invoices' => Invoice::whereIn('status', ['pending', 'partial'])->count(),
            'new_patients_today' => Patient::whereDate('created_at', $today)->count(),
            'today_payments' => (float) Payment::whereDate('created_at', $today)->sum('amount'),
        ];
    }
}
