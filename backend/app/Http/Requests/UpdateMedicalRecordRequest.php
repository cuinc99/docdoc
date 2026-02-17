<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'subjective' => ['required', 'string', 'max:10000'],
            'objective' => ['required', 'string', 'max:10000'],
            'assessment' => ['required', 'string', 'max:10000'],
            'plan' => ['required', 'string', 'max:10000'],
            'diagnoses' => ['required', 'array', 'min:1'],
            'diagnoses.*.code' => ['required', 'string'],
            'diagnoses.*.description' => ['required', 'string'],
            'diagnoses.*.is_primary' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'subjective.required' => 'Subjective wajib diisi',
            'objective.required' => 'Objective wajib diisi',
            'assessment.required' => 'Assessment wajib diisi',
            'plan.required' => 'Plan wajib diisi',
            'diagnoses.required' => 'Diagnosis wajib diisi',
            'diagnoses.min' => 'Minimal 1 diagnosis',
            'diagnoses.*.code.required' => 'Kode diagnosis wajib diisi',
            'diagnoses.*.description.required' => 'Deskripsi diagnosis wajib diisi',
        ];
    }
}
