<?php

/**
 * fpdf/fpdf v2 ships the class as \Fpdf\Fpdf (namespaced).
 * setasign/fpdi still requires the legacy global FPDF class.
 * This shim bridges the two.
 */
if (! class_exists('FPDF', false)) {
    class_alias(\Fpdf\Fpdf::class, 'FPDF');
}
