<?php

namespace App\Http\Requests;

use App\Models\Schedule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'doctor_id' => ['required', 'exists:users,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'is_available' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $schedule = $this->route('schedule');
            $scheduleId = $schedule instanceof \App\Models\Schedule ? $schedule->id : $schedule;

            $exists = Schedule::where('doctor_id', $this->input('doctor_id'))
                ->whereDate('date', $this->input('date'))
                ->where('id', '!=', $scheduleId)
                ->exists();

            if ($exists) {
                $validator->errors()->add('date', 'Dokter sudah memiliki jadwal pada tanggal ini');
            }
        });
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'doctor_id.required' => 'Dokter wajib dipilih',
            'doctor_id.exists' => 'Dokter tidak ditemukan',
            'date.required' => 'Tanggal wajib diisi',
            'date.date' => 'Format tanggal tidak valid',
            'start_time.required' => 'Jam mulai wajib diisi',
            'start_time.date_format' => 'Format jam mulai tidak valid (HH:mm)',
            'end_time.required' => 'Jam selesai wajib diisi',
            'end_time.date_format' => 'Format jam selesai tidak valid (HH:mm)',
            'end_time.after' => 'Jam selesai harus setelah jam mulai',
        ];
    }
}
