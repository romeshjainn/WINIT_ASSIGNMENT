import { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Layout } from '@/components/layout/Layout';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, importCustomersCSV, exportCustomersCSV } from '@/api/customers';
import { getCompanies } from '@/api/companies';
import { getWarehouses } from '@/api/warehouses';
import type { Customer, Company, Warehouse } from '@/types/index';

const schema = Yup.object({
  name: Yup.string().required('Name is required'),
  customer_code: Yup.string().required('Customer code is required'),
  company_id: Yup.string().required('Company is required'),
  address: Yup.string(),
  contact_number: Yup.string(),
  location_route: Yup.string(),
});

type FormValues = {
  name: string;
  customer_code: string;
  address: string;
  company_id: string;
  warehouse_id: string;
  contact_number: string;
  location_route: string;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const limit = 10;

  async function loadCustomers(p = page, s = search) {
    setLoading(true);
    const res = await getCustomers({ page: p, limit, search: s });
    if (res.remote === 'success') {
      setCustomers(res.data.data);
      setTotal(res.data.total);
    }
    setLoading(false);
  }

  useEffect(() => {
    getCompanies().then((r) => { if (r.remote === 'success') setCompanies(r.data); });
  }, []);

  useEffect(() => { loadCustomers(page, search); }, [page]);

  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { setPage(1); loadCustomers(1, val); }, 400);
  }

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: w.name }));

  const initialValues: FormValues = {
    name: '', customer_code: '', address: '', company_id: '', warehouse_id: '', contact_number: '', location_route: '',
  };

  const formik = useFormik<FormValues>({
    initialValues,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setApiError('');
      const res = editTarget
        ? await updateCustomer(editTarget.id, values)
        : await createCustomer(values);
      if (res.remote === 'success') {
        await loadCustomers(1, search);
        setPage(1);
        resetForm();
        setModalOpen(false);
        setEditTarget(null);
        showToast(editTarget ? 'Customer updated' : 'Customer added', 'success');
      } else {
        setApiError(res.error.errors.message);
      }
      setSubmitting(false);
    },
  });

  function openAdd() {
    setEditTarget(null);
    formik.resetForm({ values: initialValues });
    setApiError('');
    setWarehouses([]);
    setModalOpen(true);
  }

  async function openEdit(c: Customer) {
    setEditTarget(c);
    if (c.company_id) {
      const res = await getWarehouses(c.company_id);
      if (res.remote === 'success') setWarehouses(res.data);
    }
    formik.resetForm({
      values: {
        name: c.name,
        customer_code: c.customer_code,
        address: c.address ?? '',
        company_id: c.company_id,
        warehouse_id: c.warehouse_id ?? '',
        contact_number: c.contact_number ?? '',
        location_route: c.location_route ?? '',
      },
    });
    setApiError('');
    setModalOpen(true);
  }

  async function handleCompanyChange(companyId: string) {
    formik.setFieldValue('company_id', companyId);
    formik.setFieldValue('warehouse_id', '');
    if (companyId) {
      const res = await getWarehouses(companyId);
      if (res.remote === 'success') setWarehouses(res.data);
    } else {
      setWarehouses([]);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteCustomer(deleteTarget.id);
    if (res.remote === 'success') {
      await loadCustomers(1, search);
      setPage(1);
      showToast('Customer deleted', 'success');
    } else {
      showToast(res.error.errors.message, 'error');
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const res = await importCustomersCSV(file);
    if (res.remote === 'success') {
      await loadCustomers(1, search);
      setPage(1);
      showToast(`Imported ${res.data.imported} customers`, 'success');
    } else {
      showToast('Import failed: ' + res.error.errors.message, 'error');
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-500 text-sm mt-1">{total} total customers</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="secondary" size="sm" loading={importing} onClick={() => fileRef.current?.click()}>
            Import CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportCustomersCSV()}>
            Export CSV
          </Button>
          <Button onClick={openAdd}>+ Add Customer</Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by name or customer code…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage="No customers found."
        data={customers}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'customer_code', header: 'Code' },
          { key: 'address', header: 'Location', render: (c) => <span>{c.address ?? '—'}</span> },
          { key: 'contact_number', header: 'Contact', render: (c) => <span>{c.contact_number ?? '—'}</span> },
          { key: 'location_route', header: 'Route/Area', render: (c) => <span>{c.location_route ?? '—'}</span> },
          { key: 'company_name', header: 'Company', render: (c) => <span>{c.company_name ?? '—'}</span> },
          {
            key: 'actions', header: '',
            render: (c) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(c)}
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md min-h-[36px] min-w-[36px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(c)}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md min-h-[36px] min-w-[36px]"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      <Pagination page={page} total={total} limit={limit} onChange={(p) => setPage(p)} />

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }} title={editTarget ? 'Edit Customer' : 'Add Customer'} width="max-w-2xl">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="name" label="Name *" placeholder="Customer name" {...formik.getFieldProps('name')} error={formik.touched.name ? formik.errors.name : undefined} />
            <Input id="customer_code" label="Customer Code *" placeholder="CUST-001" {...formik.getFieldProps('customer_code')} error={formik.touched.customer_code ? formik.errors.customer_code : undefined} />
            <div className="col-span-1 sm:col-span-2">
              <Input id="address" label="Location / Address" placeholder="e.g. 12 Jalan Ampang, Kuala Lumpur" {...formik.getFieldProps('address')} />
            </div>
            <Input id="contact_number" label="Contact Number" placeholder="e.g. +91 98765 43210" {...formik.getFieldProps('contact_number')} error={formik.touched.contact_number ? formik.errors.contact_number : undefined} />
            <Input id="location_route" label="Route / Area" placeholder="e.g. North Zone" {...formik.getFieldProps('location_route')} />
            <Select
              id="company_id" label="Company *"
              options={companyOptions} placeholder="Select company"
              value={formik.values.company_id}
              onChange={(e) => handleCompanyChange(e.target.value)}
              error={formik.touched.company_id ? formik.errors.company_id : undefined}
            />
            <Select
              id="warehouse_id" label="Warehouse"
              options={warehouseOptions} placeholder="Select warehouse"
              disabled={!formik.values.company_id}
              {...formik.getFieldProps('warehouse_id')}
            />
          </div>
          {apiError && <p className="text-sm text-red-600">{apiError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditTarget(null); }}>Cancel</Button>
            <Button type="submit" loading={formik.isSubmitting}>{editTarget ? 'Save Changes' : 'Add Customer'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Customer">
        <p className="text-sm text-gray-600 mb-6">
          Delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  );
}
