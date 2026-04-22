<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>{{ $agreement->title }}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'DejaVu Sans', Arial, sans-serif;
        font-size: 11px;
        color: #2a2a2a;
        line-height: 1.55;
        background: #ffffff;
    }

    /* Logo */
    .logo-band {
        text-align: center;
        padding: 28px 52px 0;
    }
    .logo-band img { height: 64px; width: auto; }

    /* Content wrapper */
    .content { padding: 16px 52px 48px; }

    /* Header */
    .header {
        text-align: center;
        margin-bottom: 28px;
        padding-bottom: 20px;
        border-bottom: 1.5px solid #e8e0d5;
    }
    .doc-title { font-size: 20px; font-weight: bold; color: #1a2a1a; margin-bottom: 6px; }
    .doc-subtitle { font-size: 10px; color: #666; }

    /* Section */
    .section { margin-bottom: 24px; }
    .section-title {
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: #4a3f30;
        border-bottom: 1px solid #e8e0d5;
        padding-bottom: 5px;
        margin-bottom: 12px;
    }

    /* Details grid */
    .detail-row { display: table; width: 100%; margin-bottom: 5px; }
    .detail-label { display: table-cell; width: 145px; font-weight: bold; color: #888480; font-size: 10px; }
    .detail-value { display: table-cell; color: #2a2a2a; font-size: 10px; }

    /* Items table */
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f5f2ee; }
    th {
        text-align: left;
        padding: 8px 10px;
        font-size: 9px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #888480;
        border: 1px solid #e0dbd4;
    }
    th.right, td.right { text-align: right; }
    td {
        padding: 7px 10px;
        font-size: 10px;
        border: 1px solid #e0dbd4;
        color: #2a2a2a;
        vertical-align: top;
    }
    tr.total-row td {
        font-weight: bold;
        background: #f5f2ee;
        border-top: 2px solid #c9a84c;
        color: #1a2a1a;
    }
    tr.alt td { background: #fafaf8; }

    /* Agreement box */
    .agreement-box {
        background: #fffdf5;
        border: 1px solid #e0d090;
        padding: 14px 16px;
        margin-bottom: 24px;
    }
    .agreement-box h3 { font-size: 11px; font-weight: bold; color: #1a2a1a; margin-bottom: 6px; }
    .agreement-box p { font-size: 10px; color: #5a4a20; margin-bottom: 7px; }
    .agreement-box ul { padding-left: 14px; }
    .agreement-box li { font-size: 10px; color: #5a4a20; margin-bottom: 4px; }

    /* Notes */
    .notes-box {
        background: #f5f2ee;
        border: 1px solid #d8d0c8;
        padding: 10px 14px;
        margin-bottom: 24px;
    }
    .notes-box .label { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; color: #888480; margin-bottom: 4px; }
    .notes-box p { font-size: 10px; color: #3a3028; }

    /* Signature section */
    .signature-section { margin-top: 32px; padding-top: 20px; border-top: 1.5px solid #e8e0d5; }
    .signature-title { font-size: 13px; font-weight: bold; color: #1a2a1a; margin-bottom: 4px; }
    .signature-subtitle { font-size: 10px; color: #888480; margin-bottom: 18px; }

    .sig-table { width: 100%; border-collapse: collapse; }
    .sig-left-cell { width: 55%; vertical-align: top; padding-right: 24px; }
    .sig-right-cell { width: 45%; vertical-align: top; padding-left: 8px; }

    .sig-label { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; color: #888480; margin-bottom: 6px; }
    .sig-value { font-size: 12px; color: #1a2a1a; font-weight: bold; }
    .sig-image-box {
        border: 1px solid #d8d0c8;
        background: #fafaf8;
        padding: 8px;
        margin-bottom: 10px;
        height: 72px;
    }
    .sig-image-box img { max-height: 56px; max-width: 100%; }

    .status-pill {
        display: inline-block;
        background: #e8f5e9;
        border: 1px solid #4a9a6a;
        color: #1a6030;
        font-size: 9px;
        font-weight: bold;
        padding: 3px 10px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    /* Footer */
    .footer {
        padding: 12px 52px 20px;
        border-top: 0.5px solid #e0dbd4;
        text-align: center;
        font-size: 8px;
        color: #aaa;
        letter-spacing: 0.5px;
    }
</style>
</head>
<body>

{{-- Logo --}}
<div class="logo-band">
    <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('bgr-logo-pdf.png'))) }}" alt="Bespoke Garden Rooms Ballycastle">
</div>

<div class="content">

{{-- Header --}}
<div class="header">
    <div class="doc-title">Client Variation Agreement</div>
    <div class="doc-subtitle">
        This document confirms changes or additions to the originally agreed scope of works.<br>
        All variations must be approved in writing before works proceed.
    </div>
</div>

{{-- Project Details --}}
<div class="section">
    <div class="section-title">Project Details</div>
    <div class="detail-row">
        <span class="detail-label">Client Name:</span>
        <span class="detail-value">{{ $agreement->client_name }}</span>
    </div>
    @if($agreement->project_address)
    <div class="detail-row">
        <span class="detail-label">Project Address:</span>
        <span class="detail-value">{{ $agreement->project_address }}</span>
    </div>
    @endif
    @if($agreement->contract_reference)
    <div class="detail-row">
        <span class="detail-label">Contract / Reference:</span>
        <span class="detail-value">{{ $agreement->contract_reference }}</span>
    </div>
    @endif
    <div class="detail-row">
        <span class="detail-label">Date Issued:</span>
        <span class="detail-value">{{ $agreement->sent_at?->format('j F Y') ?? $agreement->created_at->format('j F Y') }}</span>
    </div>
</div>

{{-- Variation Details --}}
@if(!empty($agreement->items) && count($agreement->items) > 0)
<div class="section">
    <div class="section-title">Variation Details</div>
    <p style="font-size:10px; color:#666; margin-bottom:10px;">
        Prices stated are exclusive of VAT unless otherwise noted.
    </p>
    <table>
        <thead>
            <tr>
                <th style="width:36px;">No.</th>
                <th>Description of Variation</th>
                <th class="right" style="width:100px;">Price (£)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($agreement->items as $i => $item)
            <tr class="{{ $i % 2 === 1 ? 'alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $item['description'] }}</td>
                <td class="right">
                    {{ floatval($item['price']) > 0 ? '£' . number_format(floatval($item['price']), 2) : '—' }}
                </td>
            </tr>
            @endforeach
        </tbody>
        @if($agreement->total_amount)
        <tfoot>
            <tr class="total-row">
                <td colspan="2">Total Variation Cost (£)</td>
                <td class="right">£{{ number_format($agreement->total_amount, 2) }}</td>
            </tr>
        </tfoot>
        @endif
    </table>
</div>
@endif

{{-- Notes --}}
@if($agreement->notes)
<div class="notes-box">
    <div class="label">Additional Notes</div>
    <p>{{ $agreement->notes }}</p>
</div>
@endif

{{-- Agreement terms --}}
<div class="agreement-box">
    <h3>Agreement</h3>
    <p>By signing below, the client confirms that:</p>
    <ul>
        <li>The above variations are requested by the client</li>
        <li>Any impact on cost and/or project timeline has been explained</li>
        <li>The total variation cost will be added to the original contract value</li>
        <li>Works related to this variation will proceed only after this agreement is signed</li>
    </ul>
</div>

{{-- Signature --}}
<div class="signature-section">
    <div class="signature-title">Client Acceptance</div>
    <div class="signature-subtitle">Electronically signed via BGR Client Portal</div>

    <table class="sig-table">
        <tr>
            <td class="sig-left-cell">
                <div class="sig-label">Signature</div>
                <div class="sig-image-box">
                    @if($agreement->signature_data)
                        <img src="{{ $agreement->signature_data }}" alt="Signature">
                    @endif
                </div>
                <div class="sig-label">Full Name</div>
                <div class="sig-value">{{ $agreement->signed_by_name }}</div>
            </td>
            <td class="sig-right-cell">
                <div class="sig-label">Date Signed</div>
                <div class="sig-value" style="margin-bottom:14px;">{{ $agreement->signed_at?->format('j F Y') }}</div>
                <div class="sig-label">Status</div>
                <span class="status-pill">SIGNED</span>
            </td>
        </tr>
    </table>
</div>

</div>{{-- /content --}}

{{-- Footer --}}
<div class="footer">
    Generated by BGR Client Portal &nbsp;&middot;&nbsp; Agreement #{{ $agreement->id }} &nbsp;&middot;&nbsp; {{ now()->format('j F Y') }}
</div>

</body>
</html>
