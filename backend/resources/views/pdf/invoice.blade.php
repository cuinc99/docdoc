<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; margin: 0; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 2px 0; font-size: 11px; color: #666; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .summary-table { width: 300px; margin-left: auto; }
        .summary-table td { border: none; padding: 3px 8px; }
        .summary-table .total { font-weight: bold; font-size: 13px; border-top: 2px solid #333; }
        .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #666; text-align: center; }
        .badge { display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: bold; border-radius: 3px; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-partial { background: #dbeafe; color: #1e40af; }
        .badge-paid { background: #d1fae5; color: #065f46; }
        .badge-cancelled { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>KLINIK DOCDOC</h1>
        <p>Jl. Kesehatan No. 1, Makassar</p>
        <p>Telp: (0411) 123-4567</p>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 16px; font-weight: bold;">INVOICE</span><br>
        <span style="font-size: 12px;">No: {{ $invoice->invoice_number }}</span>
    </div>

    <div class="section">
        <table style="border: none; margin-bottom: 15px;">
            <tr style="border: none;">
                <td style="border: none; padding: 2px 0; width: 120px; font-weight: bold;">Tanggal</td>
                <td style="border: none; padding: 2px 0;">: {{ $invoice->created_at->format('d/m/Y H:i') }} WITA</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; padding: 2px 0; font-weight: bold;">Pasien</td>
                <td style="border: none; padding: 2px 0;">: {{ $invoice->patient->name }} ({{ $invoice->patient->mr_number }})</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; padding: 2px 0; font-weight: bold;">Status</td>
                <td style="border: none; padding: 2px 0;">:
                    @if($invoice->status === 'pending') Belum Dibayar
                    @elseif($invoice->status === 'partial') Dibayar Sebagian
                    @elseif($invoice->status === 'paid') Lunas
                    @else Dibatalkan
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Detail Item</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 25px;">No</th>
                    <th>Deskripsi</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Harga Satuan</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $i => $item)
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $item['description'] }}</td>
                    <td class="text-center">{{ $item['quantity'] }}</td>
                    <td class="text-right">Rp {{ number_format((float)$item['unit_price'], 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format((float)$item['total'], 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <table class="summary-table">
        <tr>
            <td>Subtotal</td>
            <td class="text-right">Rp {{ number_format((float)$invoice->subtotal, 0, ',', '.') }}</td>
        </tr>
        @if((float)$invoice->discount > 0)
        <tr>
            <td>Diskon</td>
            <td class="text-right">- Rp {{ number_format((float)$invoice->discount, 0, ',', '.') }}</td>
        </tr>
        @endif
        @if((float)$invoice->tax > 0)
        <tr>
            <td>Pajak</td>
            <td class="text-right">Rp {{ number_format((float)$invoice->tax, 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr class="total">
            <td>Total</td>
            <td class="text-right">Rp {{ number_format((float)$invoice->total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Dibayar</td>
            <td class="text-right">Rp {{ number_format((float)$invoice->paid_amount, 0, ',', '.') }}</td>
        </tr>
        <tr style="font-weight: bold;">
            <td>Sisa</td>
            <td class="text-right">Rp {{ number_format(max(0, (float)$invoice->total - (float)$invoice->paid_amount), 0, ',', '.') }}</td>
        </tr>
    </table>

    @if($invoice->payments && count($invoice->payments) > 0)
    <div class="section" style="margin-top: 20px;">
        <div class="section-title">Riwayat Pembayaran</div>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th class="text-right">Jumlah</th>
                    <th>Metode</th>
                    <th>Referensi</th>
                    <th>Diterima Oleh</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->payments as $payment)
                <tr>
                    <td>{{ $payment->created_at->format('d/m/Y H:i') }}</td>
                    <td class="text-right">Rp {{ number_format((float)$payment->amount, 0, ',', '.') }}</td>
                    <td>{{ $payment->method === 'cash' ? 'Tunai' : 'Transfer' }}</td>
                    <td>{{ $payment->reference ?? '-' }}</td>
                    <td>{{ $payment->receivedBy->name ?? '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="footer">
        <p>Dicetak pada {{ now()->format('d/m/Y H:i') }} WITA | {{ $invoice->invoice_number }}</p>
    </div>
</body>
</html>
