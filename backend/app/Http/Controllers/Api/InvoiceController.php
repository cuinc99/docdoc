<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Invoice::class);

        $query = Invoice::with(['patient']);

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('search')) {
            $term = mb_strtolower((string) $request->string('search'));
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(invoice_number) LIKE ?', ["%{$term}%"])
                  ->orWhereHas('patient', function ($q2) use ($term) {
                      $q2->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                         ->orWhereRaw('LOWER(mr_number) LIKE ?', ["%{$term}%"]);
                  });
            });
        }

        $invoices = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 10));

        return ApiResponse::paginated($invoices);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        Gate::authorize('view', $invoice);

        $invoice->load(['patient', 'payments.receivedBy']);

        return ApiResponse::success(new InvoiceResource($invoice));
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        Gate::authorize('create', Invoice::class);

        $data = $request->validated();

        $items = [];
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $total = $item['quantity'] * $item['unit_price'];
            $items[] = [
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => number_format($item['unit_price'], 2, '.', ''),
                'total' => number_format($total, 2, '.', ''),
            ];
            $subtotal += $total;
        }

        $discount = (float) ($data['discount'] ?? 0);
        $taxPercent = (float) ($data['tax_percent'] ?? 0);
        $afterDiscount = $subtotal - $discount;
        $tax = $afterDiscount > 0 ? round($afterDiscount * $taxPercent / 100, 2) : 0;
        $total = $afterDiscount + $tax;

        $invoice = Invoice::create([
            'patient_id' => $data['patient_id'],
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'total' => max(0, $total),
        ]);

        $invoice->load(['patient']);

        return ApiResponse::created(new InvoiceResource($invoice), 'Invoice berhasil dibuat');
    }

    public function update(StoreInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        Gate::authorize('update', $invoice);

        $data = $request->validated();

        $items = [];
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $total = $item['quantity'] * $item['unit_price'];
            $items[] = [
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => number_format($item['unit_price'], 2, '.', ''),
                'total' => number_format($total, 2, '.', ''),
            ];
            $subtotal += $total;
        }

        $discount = (float) ($data['discount'] ?? 0);
        $taxPercent = (float) ($data['tax_percent'] ?? 0);
        $afterDiscount = $subtotal - $discount;
        $tax = $afterDiscount > 0 ? round($afterDiscount * $taxPercent / 100, 2) : 0;
        $total = $afterDiscount + $tax;

        $invoice->update([
            'patient_id' => $data['patient_id'],
            'items' => $items,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'total' => max(0, $total),
        ]);

        $invoice->load(['patient']);

        return ApiResponse::success(new InvoiceResource($invoice), 'Invoice berhasil diperbarui');
    }

    public function addPayment(StorePaymentRequest $request, Invoice $invoice): JsonResponse
    {
        Gate::authorize('addPayment', $invoice);

        $data = $request->validated();
        $remaining = (float) $invoice->total - (float) $invoice->paid_amount;

        if ($data['amount'] > $remaining) {
            return ApiResponse::error('Jumlah pembayaran melebihi sisa tagihan', 422);
        }

        $payment = $invoice->addPayment(
            $data['amount'],
            $data['method'],
            $data['reference'] ?? null,
            $request->user()->id
        );

        $invoice->load(['patient', 'payments.receivedBy']);

        $message = $invoice->status === 'paid' ? 'Pembayaran berhasil, invoice lunas' : 'Pembayaran berhasil ditambahkan';

        return ApiResponse::created(new InvoiceResource($invoice), $message);
    }

    public function cancel(Invoice $invoice): JsonResponse
    {
        Gate::authorize('cancel', $invoice);

        $invoice->update(['status' => 'cancelled']);

        return ApiResponse::success(new InvoiceResource($invoice), 'Invoice berhasil dibatalkan');
    }

    public function pdf(Invoice $invoice): \Illuminate\Http\Response
    {
        Gate::authorize('view', $invoice);

        $invoice->load(['patient', 'payments.receivedBy']);

        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }
}
