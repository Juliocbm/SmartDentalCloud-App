import { Injectable } from '@angular/core';

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

@Injectable({ providedIn: 'root' })
export class CsvExportService {

  /**
   * Exporta datos a un archivo CSV y lo descarga automáticamente
   */
  export<T>(data: T[], columns: CsvColumn<T>[], filename: string): void {
    if (!data.length) return;

    const headers = columns.map(c => this.escapeCsv(c.header));
    const rows = data.map(item =>
      columns.map(c => this.escapeCsv(String(c.accessor(item) ?? ''))).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${this.getDateStamp()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private getDateStamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
}
