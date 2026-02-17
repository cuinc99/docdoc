<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'exists:patients,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' => 'Pasien wajib dipilih',
            'patient_id.exists' => 'Pasien tidak ditemukan',
            'items.required' => 'Minimal 1 item wajib diisi',
            'items.min' => 'Minimal 1 item wajib diisi',
            'items.*.description.required' => 'Deskripsi item wajib diisi',
            'items.*.quantity.required' => 'Jumlah wajib diisi',
            'items.*.quantity.min' => 'Jumlah minimal 1',
            'items.*.unit_price.required' => 'Harga satuan wajib diisi',
            'items.*.unit_price.min' => 'Harga satuan tidak boleh negatif',
        ];
    }
}
