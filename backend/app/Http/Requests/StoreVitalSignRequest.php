<?php

namespace App\Http\Requests;

use App\Models\VitalSign;
use Illuminate\Foundation\Http\FormRequest;

class StoreVitalSignRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'queue_id' => ['required', 'exists:queues,id'],
            'systolic' => ['required', 'integer', 'min:60', 'max:300'],
            'diastolic' => ['required', 'integer', 'min:30', 'max:200'],
            'heart_rate' => ['required', 'integer', 'min:30', 'max:250'],
            'temperature' => ['required', 'numeric', 'min:30', 'max:45'],
            'respiratory_rate' => ['required', 'integer', 'min:5', 'max:60'],
            'oxygen_saturation' => ['nullable', 'integer', 'min:50', 'max:100'],
            'weight' => ['required', 'numeric', 'min:1', 'max:500'],
            'height' => ['required', 'numeric', 'min:30', 'max:300'],
            'chief_complaint' => ['required', 'string', 'max:5000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $queueId = (int) $this->input('queue_id');
            $exists = VitalSign::where('queue_id', $queueId)->exists();
            if ($exists) {
                $validator->errors()->add('queue_id', 'Tanda vital sudah diinput untuk antrian ini');
            }
        });
    }

    public function messages(): array
    {
        return [
            'queue_id.required' => 'Antrian wajib dipilih',
            'queue_id.exists' => 'Antrian tidak ditemukan',
            'systolic.required' => 'Tekanan sistolik wajib diisi',
            'systolic.min' => 'Tekanan sistolik minimal 60',
            'systolic.max' => 'Tekanan sistolik maksimal 300',
            'diastolic.required' => 'Tekanan diastolik wajib diisi',
            'diastolic.min' => 'Tekanan diastolik minimal 30',
            'diastolic.max' => 'Tekanan diastolik maksimal 200',
            'heart_rate.required' => 'Detak jantung wajib diisi',
            'temperature.required' => 'Suhu tubuh wajib diisi',
            'respiratory_rate.required' => 'Frekuensi napas wajib diisi',
            'weight.required' => 'Berat badan wajib diisi',
            'height.required' => 'Tinggi badan wajib diisi',
            'chief_complaint.required' => 'Keluhan utama wajib diisi',
        ];
    }
}
