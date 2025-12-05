<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles; 
use Maatwebsite\Excel\Concerns\ShouldAutoSize; 
use Maatwebsite\Excel\Concerns\WithMapping; 
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockerReportsExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithMapping
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
            $report['quantity_stocked'],
            $report['items_stocked'],
        ];
    }

    public function headings(): array
    {
        return [
            [''], // Blank row for title
            ['Rank', 'Stocker Name', 'Stocker Email', 'Total Units Stocked', 'Unique Items Stocked'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $endColumn = 'E';
        $headerRow = 2;
        $dataStartRow = 3;
        $dataEndRow = $dataStartRow + $this->dataRowCount - 1;

        // --- Title ---
        $sheet->setCellValue('A1', "STOCKER PERFORMANCE REPORT: {$this->timeframe}");
        $sheet->mergeCells("A1:{$endColumn}1");
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF9333EA']],
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
            $sheet->setCellValue("A{$dataStartRow}", "No stock data found for the selected timeframe: {$this->timeframe}.");
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

            // Rank & Quantity formatting
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $sheet->getStyle("D{$row}")->getFont()->setBold(true)->getColor()->setARGB('FF6B21A8');
        }
    }
}
