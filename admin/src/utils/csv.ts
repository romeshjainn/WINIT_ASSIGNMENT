import Papa from 'papaparse';
import type { Customer } from '@/types/index';

export function parseCustomerCSV(file: File): Promise<Partial<Customer>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const customers = results.data.map((row) => ({
          name: row['name'] || row['Name'],
          customer_code: row['customer_code'] || row['Customer Code'],
          address: row['address'] || row['Address'],
          company_id: row['company_id'] || row['Company ID'],
          warehouse_id: row['warehouse_id'] || row['Warehouse ID'],
        }));
        resolve(customers);
      },
      error: reject,
    });
  });
}

export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
