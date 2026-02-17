<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['required', 'in:cash,transfer'],
            'reference' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Jumlah pembayaran wajib diisi',
            'amount.min' => 'Jumlah pembayaran minimal 1',
            'method.required' => 'Metode pembayaran wajib dipilih',
            'method.in' => 'Metode pembayaran harus cash atau transfer',
        ];
    }
}
