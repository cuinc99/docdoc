<?php

namespace App\Http\Requests;

use App\Models\Queue;
use App\Models\Schedule;
use Illuminate\Foundation\Http\FormRequest;

class StoreQueueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'exists:patients,id'],
            'doctor_id' => ['required', 'exists:users,id'],
            'date' => ['sometimes', 'date', 'after_or_equal:' . now()->subDay()->toDateString()],
            'priority' => ['sometimes', 'in:normal,urgent'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $doctorId = (int) $this->input('doctor_id');
            $patientId = (int) $this->input('patient_id');
            $date = $this->input('date', now()->toDateString());

            $hasSchedule = Schedule::where('doctor_id', $doctorId)
                ->whereDate('date', $date)
                ->where('is_available', true)
                ->exists();

            if (! $hasSchedule) {
                $validator->errors()->add('doctor_id', 'Dokter tidak memiliki jadwal pada tanggal tersebut');
            }

            $alreadyInQueue = Queue::where('doctor_id', $doctorId)
                ->where('patient_id', $patientId)
                ->whereDate('date', $date)
                ->active()
                ->exists();

            if ($alreadyInQueue) {
                $validator->errors()->add('patient_id', 'Pasien sudah ada di antrian aktif dokter ini pada tanggal tersebut');
            }
        });
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'Pasien wajib dipilih',
            'patient_id.exists' => 'Pasien tidak ditemukan',
            'doctor_id.required' => 'Dokter wajib dipilih',
            'doctor_id.exists' => 'Dokter tidak ditemukan',
            'date.date' => 'Format tanggal tidak valid',
            'date.after_or_equal' => 'Tanggal minimal kemarin',
            'priority.in' => 'Prioritas tidak valid',
        ];
    }
}
