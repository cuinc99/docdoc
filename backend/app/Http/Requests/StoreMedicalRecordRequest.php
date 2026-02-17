<?php

namespace App\Http\Requests;

use App\Models\MedicalRecord;
use Illuminate\Foundation\Http\FormRequest;

class StoreMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'queue_id' => ['required', 'exists:queues,id'],
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

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $queueId = (int) $this->input('queue_id');
            $exists = MedicalRecord::where('queue_id', $queueId)->exists();
            if ($exists) {
                $validator->errors()->add('queue_id', 'Rekam medis sudah dibuat untuk antrian ini');
            }
        });
    }

    public function messages(): array
    {
        return [
            'queue_id.required' => 'Antrian wajib dipilih',
            'queue_id.exists' => 'Antrian tidak ditemukan',
            'subjective.required' => 'Subjective wajib diisi',
            'objective.required' => 'Objective wajib diisi',
            'assessment.required' => 'Assessment wajib diisi',
            'plan.required' => 'Plan wajib diisi',
            'diagnoses.required' => 'Diagnosis wajib diisi',
            'diagnoses.min' => 'Minimal 1 diagnosis',
            'diagnoses.*.code.required' => 'Kode diagnosis wajib diisi',
            'diagnoses.*.description.required' => 'Deskripsi diagnosis wajib diisi',
            'diagnoses.*.is_primary.required' => 'Status diagnosis primer wajib diisi',
        ];
    }
}
