<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $patient = $this->route('patient');
        $patientId = $patient instanceof \App\Models\Patient ? $patient->id : $patient;

        return [
            'nik' => ['required', 'string', 'size:16', Rule::unique('patients', 'nik')->ignore($patientId)],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'gender' => ['required', 'in:male,female'],
            'birth_date' => ['required', 'date', 'before:today'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['required', 'string'],
            'blood_type' => ['nullable', 'in:A,B,AB,O'],
            'allergies' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'nik.required' => 'NIK wajib diisi',
            'nik.size' => 'NIK harus 16 digit',
            'nik.unique' => 'NIK sudah terdaftar',
            'name.required' => 'Nama wajib diisi',
            'name.min' => 'Nama minimal 2 karakter',
            'gender.required' => 'Jenis kelamin wajib dipilih',
            'gender.in' => 'Jenis kelamin tidak valid',
            'birth_date.required' => 'Tanggal lahir wajib diisi',
            'birth_date.date' => 'Format tanggal lahir tidak valid',
            'birth_date.before' => 'Tanggal lahir harus sebelum hari ini',
            'phone.required' => 'Nomor telepon wajib diisi',
            'email.email' => 'Format email tidak valid',
            'address.required' => 'Alamat wajib diisi',
            'blood_type.in' => 'Golongan darah tidak valid',
        ];
    }
}
