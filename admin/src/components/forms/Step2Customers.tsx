import { useEffect, useState, useRef, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { getCustomers } from '@/api/customers';
import { downloadCSV } from '@/utils/csv';
import type { Customer } from '@/types/index';
import type { RouteFormValues } from '@/pages/routes/CreateRoute';
import type { Frequency } from '@/constants/frequency';

const FREQUENCY_OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Visit every day' },
  { value: 'weekly', label: 'Weekly', description: 'Visit once a week' },
  { value: 'monthly', label: 'Monthly', description: 'Visit once a month' },
];

export function Step2Customers() {
  const { values, setFieldValue } = useFormikContext<RouteFormValues>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limit = 10;

  const loadCustomers = useCallback(async (p: number, s: string) => {
    setLoading(true);
    const res = await getCustomers({ page: p, limit, search: s });
    if (res.remote === 'success') {
      setCustomers(res.data.data);
      setTotal(res.data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCustomers(1, ''); }, [loadCustomers]);

  function handleSearch(val: string) {
    setSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setPage(1); loadCustomers(1, val); }, 400);
  }

  function handlePageChange(p: number) {
    setPage(p);
    loadCustomers(p, search);
  }

  function isSelected(id: string) {
    return values.selected_customers.some((c) => c.id === id);
  }

  function toggleCustomer(customer: Customer) {
    if (isSelected(customer.id)) {
      setFieldValue('selected_customers', values.selected_customers.filter((c) => c.id !== customer.id));
    } else {
      setFieldValue('selected_customers', [...values.selected_customers, customer]);
    }
  }

  function toggleAll() {
    const allSelected = customers.every((c) => isSelected(c.id));
    if (allSelected) {
      setFieldValue('selected_customers', values.selected_customers.filter((c) => !customers.find((cc) => cc.id === c.id)));
    } else {
      const toAdd = customers.filter((c) => !isSelected(c.id));
      setFieldValue('selected_customers', [...values.selected_customers, ...toAdd]);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { parseCustomerCSV } = await import('@/utils/csv');
    const parsed = await parseCustomerCSV(file);
    const merged = [...values.selected_customers];
    parsed.forEach((p) => {
      if (p.id && !isSelected(p.id)) merged.push(p as Customer);
    });
    setFieldValue('selected_customers', merged);
    if (fileRef.current) fileRef.current.value = '';
  }

  function downloadTemplate() {
    const csv = [
      'name,customer_code,address,company_id,warehouse_id',
      'Example Customer,CUST-001,123 Main Street,,',
    ].join('\n');
    downloadCSV(csv, 'customers_template.csv');
  }

  const allOnPageSelected = customers.length > 0 && customers.every((c) => isSelected(c.id));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Visit Frequency *</p>
        <div className="grid grid-cols-3 gap-3">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFieldValue('frequency', opt.value)}
              className={`py-4 px-3 rounded-xl border-2 text-center transition-all ${
                values.frequency === opt.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className={`text-sm font-semibold ${values.frequency === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                {opt.label}
              </p>
              <p className={`text-xs mt-0.5 ${values.frequency === opt.value ? 'text-blue-500' : 'text-gray-400'}`}>
                {opt.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 font-medium">
          {values.selected_customers.length} customer{values.selected_customers.length !== 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            Import CSV
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
            Download Template
          </Button>
        </div>
      </div>

      <Input placeholder="Search customers…" value={search} onChange={(e) => handleSearch(e.target.value)} />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No customers found.</td></tr>
            ) : customers.map((c) => (
              <tr
                key={c.id}
                className={`cursor-pointer transition-colors ${isSelected(c.id) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                onClick={() => toggleCustomer(c)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected(c.id)}
                    onChange={() => toggleCustomer(c)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.customer_code}</td>
                <td className="px-4 py-3 text-gray-500">{c.address ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} onChange={handlePageChange} />
    </div>
  );
}
