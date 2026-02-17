<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Invoice */
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\Invoice $invoice */
        $invoice = $this->resource;

        return [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'patient_id' => $invoice->patient_id,
            'items' => $invoice->items,
            'subtotal' => $invoice->subtotal,
            'discount' => $invoice->discount,
            'tax' => $invoice->tax,
            'total' => $invoice->total,
            'paid_amount' => $invoice->paid_amount,
            'status' => $invoice->status,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $invoice->patient->id,
                'name' => $invoice->patient->name,
                'mr_number' => $invoice->patient->mr_number,
            ]),
            'payments' => $this->whenLoaded('payments', function () use ($invoice): array {
                $items = [];
                foreach ($invoice->payments as $payment) {
                    $items[] = [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'method' => $payment->method,
                        'reference' => $payment->reference,
                        'received_by' => $payment->received_by,
                        'received_by_user' => $payment->relationLoaded('receivedBy') ? [
                            'id' => $payment->receivedBy->id,
                            'name' => $payment->receivedBy->name,
                        ] : null,
                        'created_at' => $payment->created_at?->toISOString(),
                    ];
                }
                return $items;
            }),
            'created_at' => $invoice->created_at?->toISOString(),
            'updated_at' => $invoice->updated_at?->toISOString(),
        ];
    }
}
