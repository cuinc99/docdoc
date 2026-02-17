<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVitalSignRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
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

    public function messages(): array
    {
        return [
            'systolic.required' => 'Tekanan sistolik wajib diisi',
            'diastolic.required' => 'Tekanan diastolik wajib diisi',
            'heart_rate.required' => 'Detak jantung wajib diisi',
            'temperature.required' => 'Suhu tubuh wajib diisi',
            'respiratory_rate.required' => 'Frekuensi napas wajib diisi',
            'weight.required' => 'Berat badan wajib diisi',
            'height.required' => 'Tinggi badan wajib diisi',
            'chief_complaint.required' => 'Keluhan utama wajib diisi',
        ];
    }
}
