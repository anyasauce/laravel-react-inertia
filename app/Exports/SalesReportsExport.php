<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles; 
use Maatwebsite\Excel\Concerns\ShouldAutoSize; 
use Maatwebsite\Excel\Concerns\WithMapping; 
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesReportsExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithMapping
{
    protected $reportData;
    protected $timeframe;
    private $dataRowCount = 0;

    public function __construct(Collection $reportData, string $timeframe)
    {
        $this->reportData = $reportData;
        $this->timeframe = $timeframe;
        $this->dataRowCount = $reportData->count();
    }

    public function collection()
    {
        return $this->reportData;
    }

    public function map($report): array
    {
        return [
            $report['rank'],
            $report['name'],
            $report['email'],
            $report['sales'],
            $report['transactions'],
        ];
    }

    public function headings(): array
    {
        return [
            [''], // Blank row for title
            ['Rank', 'Cashier Name', 'Cashier Email', 'Total Sales (PHP)', 'Total Transactions'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $endColumn = 'E';
        $titleRow = 1;
        $headerRow = 2;
        $dataStartRow = 3;
        $dataEndRow = $dataStartRow + $this->dataRowCount - 1;

        // --- Title ---
        $sheet->setCellValue("A{$titleRow}", "SALES PERFORMANCE REPORT: {$this->timeframe}");
        $sheet->mergeCells("A{$titleRow}:{$endColumn}{$titleRow}");
        $sheet->getStyle("A{$titleRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF10B981']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ]);

        // --- Headers ---
        $sheet->getStyle("A{$headerRow}:{$endColumn}{$headerRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['argb' => 'FF374151']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFE5E7EB']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN]],
        ]);

        // --- Handle No Data ---
        if ($this->dataRowCount === 0) {
            $sheet->setCellValue("A{$dataStartRow}", "No sales data found for the selected timeframe: {$this->timeframe}.");
            $sheet->mergeCells("A{$dataStartRow}:{$endColumn}{$dataStartRow}");
            $sheet->getStyle("A{$dataStartRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12, 'color' => ['argb' => 'FFFF0000']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFFFEEEE']],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FFCCCCCC']]],
            ]);
            return;
        }

        // --- Style Data Rows ---
        $dataStyle = [
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['argb' => 'FFCCCCCC']]],
            'alignment' => ['vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
        ];

        for ($row = $dataStartRow; $row <= $dataEndRow; $row++) {
            $range = "A{$row}:{$endColumn}{$row}";
            $sheet->getStyle($range)->applyFromArray($dataStyle);

            // Zebra striping
            $fillColor = $row % 2 !== 0 ? 'FFF5F5F5' : 'FFFFFFFF';
            $sheet->getStyle($range)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB($fillColor);

            // Rank & Sales formatting
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $sheet->getStyle("D{$row}")->getFont()->setBold(true)->getColor()->setARGB('FF047857');
            $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        }
    }
}
