<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use setasign\Fpdi\Fpdi;

class PdfSigningService
{
    /**
     * Download the PDF from $fileUrl, stamp a signature block on the last page,
     * and return the signed PDF as a binary string.
     */
    public function stamp(string $fileUrl, string $signerName, Carbon $signedAt): string
    {
        // Point FPDF to its bundled font directory
        if (! defined('FPDF_FONTPATH')) {
            define('FPDF_FONTPATH', base_path('vendor/setasign/fpdf/font') . DIRECTORY_SEPARATOR);
        }

        // Download original PDF
        $response = Http::timeout(30)->get($fileUrl);
        if (! $response->successful()) {
            throw new \RuntimeException('Could not download PDF: HTTP ' . $response->status());
        }

        // FPDI needs a real file path
        $tmpIn = tempnam(sys_get_temp_dir(), 'bgr_pdf_') . '.tmp';
        file_put_contents($tmpIn, $response->body());

        try {
            $pdf        = new Fpdi();
            $pdf->SetAutoPageBreak(false);
            $pageCount  = $pdf->setSourceFile($tmpIn);

            for ($i = 1; $i <= $pageCount; $i++) {
                $tpl  = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($tpl);

                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);

                // Stamp signature on the last page only
                if ($i === $pageCount) {
                    $this->addSignatureBlock($pdf, $size['width'], $size['height'], $signerName, $signedAt);
                }
            }

            return $pdf->Output('S', ''); // return as string
        } finally {
            @unlink($tmpIn);
        }
    }

    private function addSignatureBlock(
        Fpdi $pdf,
        float $pageW,
        float $pageH,
        string $signerName,
        Carbon $signedAt
    ): void {
        $boxW   = 130;
        $boxH   = 30;
        $margin = 12;
        $x      = $pageW - $boxW - $margin;
        $y      = $pageH - $boxH - $margin;

        // Background + border
        $pdf->SetFillColor(248, 244, 239);
        $pdf->SetDrawColor(200, 168, 76);
        $pdf->SetLineWidth(0.4);
        $pdf->Rect($x, $y, $boxW, $boxH, 'FD');

        // "DIGITALLY SIGNED" label
        $pdf->SetFont('Helvetica', 'B', 6);
        $pdf->SetTextColor(180, 148, 60);
        $pdf->SetXY($x + 4, $y + 3);
        $pdf->Cell($boxW - 8, 4, 'DIGITALLY SIGNED', 0, 0, 'L');

        // Signer name
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetTextColor(26, 60, 46);
        $pdf->SetXY($x + 4, $y + 8);
        $pdf->Cell($boxW - 8, 6, $signerName, 0, 0, 'L');

        // Date line
        $pdf->SetFont('Helvetica', '', 7.5);
        $pdf->SetTextColor(90, 79, 66);
        $pdf->SetXY($x + 4, $y + 16);
        $pdf->Cell($boxW - 8, 4, 'Date signed: ' . $signedAt->format('d M Y'), 0, 0, 'L');

        // Divider
        $pdf->SetDrawColor(220, 196, 120);
        $pdf->SetLineWidth(0.2);
        $pdf->Line($x + 4, $y + 22, $x + $boxW - 4, $y + 22);

        // Footer note
        $pdf->SetFont('Helvetica', 'I', 5.5);
        $pdf->SetTextColor(150, 135, 115);
        $pdf->SetXY($x + 4, $y + 23.5);
        $pdf->Cell($boxW - 8, 4, 'Electronic signature — BGR Portal', 0, 0, 'L');
    }
}
