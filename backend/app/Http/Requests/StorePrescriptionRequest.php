<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'medical_record_id' => ['required', 'exists:medical_records,id', 'unique:prescriptions,medical_record_id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.drug_name' => ['required', 'string', 'max:255'],
            'items.*.dosage' => ['required', 'string', 'max:255'],
            'items.*.frequency' => ['required', 'string', 'max:255'],
            'items.*.duration' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.instructions' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'medical_record_id.required' => 'Rekam medis wajib dipilih',
            'medical_record_id.exists' => 'Rekam medis tidak ditemukan',
            'medical_record_id.unique' => 'Resep sudah dibuat untuk rekam medis ini',
            'items.required' => 'Minimal 1 item obat wajib diisi',
            'items.min' => 'Minimal 1 item obat wajib diisi',
            'items.*.drug_name.required' => 'Nama obat wajib diisi',
            'items.*.dosage.required' => 'Dosis wajib diisi',
            'items.*.frequency.required' => 'Frekuensi wajib diisi',
            'items.*.quantity.required' => 'Jumlah wajib diisi',
            'items.*.quantity.min' => 'Jumlah minimal 1',
        ];
    }
}
