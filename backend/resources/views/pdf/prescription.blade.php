<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 2px 0; font-size: 11px; color: #666; }
        .info-row { display: flex; margin-bottom: 3px; }
        .info-label { font-weight: bold; width: 120px; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 13px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; font-size: 11px; }
        th { background: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #666; text-align: center; }
        .rx-number { font-size: 14px; font-weight: bold; color: #333; }
    </style>
</head>
<body>
    <div class="header">
        <h1>KLINIK DOCDOC</h1>
        <p>Jl. Kesehatan No. 1, Makassar</p>
        <p>Telp: (0411) 123-4567</p>
    </div>

    <div style="text-align: center; margin-bottom: 15px;">
        <span class="rx-number">RESEP OBAT</span><br>
        <span style="font-size: 11px;">No: {{ $prescription->prescription_number }}</span>
    </div>

    <div class="section">
        <table style="border: none; margin-bottom: 10px;">
            <tr style="border: none;">
                <td style="border: none; padding: 2px 0; width: 120px; font-weight: bold;">Tanggal</td>
                <td style="border: none; padding: 2px 0;">: {{ $prescription->created_at->format('d/m/Y H:i') }} WITA</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; padding: 2px 0; font-weight: bold;">Pasien</td>
                <td style="border: none; padding: 2px 0;">: {{ $prescription->patient->name }} ({{ $prescription->patient->mr_number }})</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none; padding: 2px 0; font-weight: bold;">Dokter</td>
                <td style="border: none; padding: 2px 0;">: {{ $prescription->doctor->name }}{{ $prescription->doctor->specialization ? ' - ' . $prescription->doctor->specialization : '' }}</td>
            </tr>
            @if($prescription->doctor->sip_number)
            <tr style="border: none;">
                <td style="border: none; padding: 2px 0; font-weight: bold;">No. SIP</td>
                <td style="border: none; padding: 2px 0;">: {{ $prescription->doctor->sip_number }}</td>
            </tr>
            @endif
        </table>
    </div>

    <div class="section">
        <div class="section-title">Daftar Obat</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 25px;">No</th>
                    <th>Nama Obat</th>
                    <th>Dosis</th>
                    <th>Frekuensi</th>
                    <th>Durasi</th>
                    <th>Jumlah</th>
                    <th>Instruksi</th>
                </tr>
            </thead>
            <tbody>
                @foreach($prescription->items as $i => $item)
                <tr>
                    <td style="text-align: center;">{{ $i + 1 }}</td>
                    <td>{{ $item['drug_name'] }}</td>
                    <td>{{ $item['dosage'] }}</td>
                    <td>{{ $item['frequency'] }}</td>
                    <td>{{ $item['duration'] ?? '-' }}</td>
                    <td style="text-align: center;">{{ $item['quantity'] }}</td>
                    <td>{{ $item['instructions'] ?? '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    @if($prescription->notes)
    <div class="section">
        <div class="section-title">Catatan</div>
        <p style="margin: 0;">{{ $prescription->notes }}</p>
    </div>
    @endif

    @if($prescription->is_dispensed)
    <div class="section" style="background: #f0fff0; padding: 8px; border: 1px solid #ccc;">
        <strong>Status:</strong> Sudah ditebus pada {{ $prescription->dispensed_at->format('d/m/Y H:i') }} WITA
    </div>
    @endif

    <div class="footer">
        <p>Dicetak pada {{ now()->format('d/m/Y H:i') }} WITA | {{ $prescription->prescription_number }}</p>
    </div>
</body>
</html>
