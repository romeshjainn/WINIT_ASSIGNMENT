import { useEffect, useState, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { getJourneyPlans, createJourneyPlan, updateJourneyPlan, deleteJourneyPlan } from '@/api/journeyPlans';
import { getVisits, markVisitComplete, updateVisitNotes, updateVisitSalesOrder, updateVisitStatus } from '@/api/visits';
import { getCustomers } from '@/api/customers';
import { getUsers } from '@/api/users';
import type { JourneyPlan, Visit, Customer, User } from '@/types/index';
import type { VisitStatus } from '@/constants/status';
import { ROLES } from '@/constants/roles';

const today = new Date().toISOString().slice(0, 10);

function formatDisplayDate(d: string) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isToday(d: string) {
  return d?.slice(0, 10) === today;
}

const visitStatusConfig: Record<VisitStatus, { label: string; variant: 'green' | 'gray' | 'red' | 'yellow' }> = {
  pending: { label: 'Pending', variant: 'gray' },
  complete: { label: 'Complete', variant: 'green' },
  missed: { label: 'Missed', variant: 'red' },
  zero_sales: { label: 'Zero Sales', variant: 'yellow' },
};

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{completed}/{total}</span>
    </div>
  );
}

export default function JourneyPlans() {
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(today);
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  const [vanUsers, setVanUsers] = useState<User[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JourneyPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JourneyPlan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState<JourneyPlan | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [apiError, setApiError] = useState('');
  const { showToast } = useToast();
  const limit = 10;

  async function loadPlans(p = page) {
    setLoading(true);
    const res = await getJourneyPlans({
      date: filterDate || undefined,
      assigned_to: filterUser || undefined,
      status: filterStatus || undefined,
      page: p,
      limit,
    });
    if (res.remote === 'success') {
      setPlans(res.data.data);
      setTotal(res.data.total);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPlans(1);
    setPage(1);
  }, [filterDate, filterUser, filterStatus]);

  useEffect(() => { loadPlans(page); }, [page]);

  useEffect(() => {
    getUsers(ROLES.SALES_EXECUTIVE).then((r) => { if (r.remote === 'success') setVanUsers(r.data); });
  }, []);

  async function loadCustomers(search = '') {
    const res = await getCustomers({ search, limit: 100 });
    if (res.remote === 'success') setCustomers(res.data.data);
  }

  useEffect(() => {
    if (createOpen) loadCustomers();
  }, [createOpen]);

  useEffect(() => {
    const t = setTimeout(() => loadCustomers(customerSearch), 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  async function openView(plan: JourneyPlan) {
    setViewTarget(plan);
    setVisitsLoading(true);
    const res = await getVisits(plan.id);
    if (res.remote === 'success') setVisits(res.data);
    setVisitsLoading(false);
  }

  const createSchema = Yup.object({
    plan_name: Yup.string(),
    date: Yup.string().required('Date is required'),
    assigned_to: Yup.string().required('Please select a user'),
  });

  const createFormik = useFormik({
    initialValues: { plan_name: '', date: today, assigned_to: '' },
    validationSchema: createSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (selectedCustomers.length === 0) {
        setApiError('Select at least 1 customer');
        setSubmitting(false);
        return;
      }
      setApiError('');
      const res = await createJourneyPlan({
        plan_name: values.plan_name || undefined,
        assigned_to: values.assigned_to,
        date: values.date,
        customers: selectedCustomers,
      });
      if (res.remote === 'success') {
        await loadPlans(1);
        setPage(1);
        resetForm();
        setSelectedCustomers([]);
        setCreateOpen(false);
        showToast('Journey plan created', 'success');
      } else {
        setApiError(res.error.errors.message);
      }
      setSubmitting(false);
    },
  });

  const editSchema = Yup.object({
    plan_name: Yup.string(),
    date: Yup.string().required('Date is required'),
    assigned_to: Yup.string().required('Please select a user'),
    status: Yup.string().oneOf(['active', 'inactive']).required(),
  });

  const editFormik = useFormik({
    initialValues: { plan_name: '', date: today, assigned_to: '', status: 'active' },
    validationSchema: editSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!editTarget) return;
      setApiError('');
      const res = await updateJourneyPlan(editTarget.id, {
        plan_name: values.plan_name || undefined,
        date: values.date,
        assigned_to: values.assigned_to,
        status: values.status as 'active' | 'inactive',
      });
      if (res.remote === 'success') {
        await loadPlans(page);
        setEditTarget(null);
        showToast('Journey plan updated', 'success');
      } else {
        setApiError(res.error.errors.message);
      }
      setSubmitting(false);
    },
  });

  function openEdit(plan: JourneyPlan) {
    setEditTarget(plan);
    editFormik.resetForm({
      values: {
        plan_name: plan.plan_name ?? '',
        date: plan.date?.slice(0, 10) ?? today,
        assigned_to: plan.assigned_to,
        status: plan.status,
      },
    });
    setApiError('');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteJourneyPlan(deleteTarget.id);
    if (res.remote === 'success') {
      await loadPlans(1);
      setPage(1);
      showToast('Journey plan deleted', 'success');
    } else {
      showToast(res.error.errors.message, 'error');
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  async function handleVisitAction(visitId: string, action: 'complete' | 'status', status?: VisitStatus) {
    let res;
    if (action === 'complete') {
      res = await markVisitComplete(visitId);
    } else {
      res = await updateVisitStatus(visitId, status!);
    }
    if (res.remote === 'success') {
      if (viewTarget) {
        const r = await getVisits(viewTarget.id);
        if (r.remote === 'success') setVisits(r.data);
      }
    } else {
      showToast(res.error.errors.message, 'error');
    }
  }

  const [notesTarget, setNotesTarget] = useState<Visit | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [salesTarget, setSalesTarget] = useState<Visit | null>(null);
  const [salesValue, setSalesValue] = useState('');

  async function saveNotes() {
    if (!notesTarget) return;
    const res = await updateVisitNotes(notesTarget.id, notesValue);
    if (res.remote === 'success') {
      setNotesTarget(null);
      if (viewTarget) {
        const r = await getVisits(viewTarget.id);
        if (r.remote === 'success') setVisits(r.data);
      }
      showToast('Notes saved', 'success');
    } else {
      showToast(res.error.errors.message, 'error');
    }
  }

  async function saveSalesOrder() {
    if (!salesTarget) return;
    const res = await updateVisitSalesOrder(salesTarget.id, salesValue);
    if (res.remote === 'success') {
      setSalesTarget(null);
      if (viewTarget) {
        const r = await getVisits(viewTarget.id);
        if (r.remote === 'success') setVisits(r.data);
      }
      showToast('Sales order saved', 'success');
    } else {
      showToast(res.error.errors.message, 'error');
    }
  }

  const userOptions = vanUsers.map((u) => ({ value: u.id, label: u.name }));
  const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
  const filterUserOptions = [{ value: '', label: 'All Users' }, ...userOptions];
  const filterStatusOptions = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const filteredCustomers = customers.filter((c) =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customer_code.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const toggleCustomer = useCallback((id: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Journey Plans</h2>
          <p className="text-gray-500 text-sm mt-1">{total} total plans</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); createFormik.resetForm(); setSelectedCustomers([]); setApiError(''); setCustomerSearch(''); }}>
          + Create Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto"
        />
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[40px]"
        >
          {filterUserOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[40px]"
        >
          {filterStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left font-medium tracking-wide whitespace-nowrap">Plan Name</th>
              <th className="px-4 py-3 text-left font-medium tracking-wide whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-left font-medium tracking-wide whitespace-nowrap">Assigned To</th>
              <th className="px-4 py-3 text-left font-medium tracking-wide whitespace-nowrap">Route</th>
              <th className="px-4 py-3 text-left font-medium tracking-wide whitespace-nowrap">Progress</th>
              <th className="px-4 py-3 text-left font-medium tracking-wide whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left font-medium tracking-wide whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-gray-400 text-sm">No journey plans found.</p>
                  <p className="text-gray-300 text-xs mt-1">Try changing the filters or create a new plan.</p>
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap font-medium">
                    {plan.plan_name || <span className="text-gray-400 font-normal">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={isToday(plan.date) ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                      {formatDisplayDate(plan.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{plan.assigned_to_name ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {plan.route_name
                      ? <span className="text-gray-700">{plan.route_name}</span>
                      : <Badge variant="blue">Direct Plan</Badge>}
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <ProgressBar completed={plan.completed_visits ?? 0} total={plan.total_visits ?? 0} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={plan.status === 'active' ? 'green' : 'gray'}>
                      {plan.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openView(plan)}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md min-h-[36px]"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(plan)}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md min-h-[36px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(plan)}
                        className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md min-h-[36px]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} limit={limit} onChange={(p) => setPage(p)} />

      {/* Create Plan Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Journey Plan" width="max-w-2xl">
        <form onSubmit={createFormik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="plan_name" label="Plan Name (optional)" placeholder="Auto-generated if blank" {...createFormik.getFieldProps('plan_name')} />
            <Input id="date" label="Date *" type="date" min={today} {...createFormik.getFieldProps('date')} error={createFormik.touched.date ? createFormik.errors.date : undefined} />
            <div className="col-span-1 sm:col-span-2">
              <Select
                id="assigned_to" label="Assign To *"
                options={userOptions} placeholder="Select van sales user"
                {...createFormik.getFieldProps('assigned_to')}
                error={createFormik.touched.assigned_to ? createFormik.errors.assigned_to : undefined}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Select Customers *</label>
              <span className="text-xs text-gray-500">{selectedCustomers.length} selected</span>
            </div>
            <Input
              placeholder="Search customers…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="mb-2"
            />
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No customers found.</p>
              ) : (
                filteredCustomers.map((c) => (
                  <label key={c.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 mt-0.5 shrink-0"
                      checked={selectedCustomers.includes(c.id)}
                      onChange={() => toggleCustomer(c.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        {c.customer_code}
                        {c.contact_number && ` · ${c.contact_number}`}
                        {c.location_route && ` · ${c.location_route}`}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedCustomers.length === 0 && apiError === 'Select at least 1 customer' && (
              <p className="text-xs text-red-600 mt-1">Select at least 1 customer</p>
            )}
          </div>

          {apiError && apiError !== 'Select at least 1 customer' && (
            <p className="text-sm text-red-600">{apiError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createFormik.isSubmitting} disabled={selectedCustomers.length === 0}>
              Create Plan ({selectedCustomers.length} customers)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Journey Plan">
        <form onSubmit={editFormik.handleSubmit} className="space-y-4">
          <Input id="edit_plan_name" label="Plan Name" {...editFormik.getFieldProps('plan_name')} />
          <Input id="edit_date" label="Date *" type="date" {...editFormik.getFieldProps('date')} error={editFormik.touched.date ? editFormik.errors.date : undefined} />
          <Select id="edit_assigned_to" label="Assign To *" options={userOptions} placeholder="Select user" {...editFormik.getFieldProps('assigned_to')} error={editFormik.touched.assigned_to ? editFormik.errors.assigned_to : undefined} />
          <Select id="edit_status" label="Status" options={statusOptions} {...editFormik.getFieldProps('status')} />
          {apiError && <p className="text-sm text-red-600">{apiError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" loading={editFormik.isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Journey Plan">
        <p className="text-sm text-gray-600 mb-6">
          Delete <strong>{deleteTarget?.plan_name || 'this plan'}</strong>?
          This will also delete all {deleteTarget?.total_visits ?? 0} visit records. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* View Plan Detail */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{viewTarget.plan_name || 'Journey Plan'}</h2>
                <p className="text-sm text-gray-500">
                  {formatDisplayDate(viewTarget.date)} · {viewTarget.assigned_to_name}
                  {viewTarget.route_name && ` · ${viewTarget.route_name}`}
                </p>
              </div>
              <button onClick={() => setViewTarget(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Progress:</span>
                <ProgressBar completed={viewTarget.completed_visits ?? 0} total={viewTarget.total_visits ?? 0} />
                <Badge variant={viewTarget.status === 'active' ? 'green' : 'gray'}>
                  {viewTarget.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {visitsLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Loading visits…
                </div>
              ) : visits.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No visits in this plan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Customer</th>
                        <th className="px-4 py-3 text-left font-medium">Code</th>
                        <th className="px-4 py-3 text-left font-medium">Contact</th>
                        <th className="px-4 py-3 text-left font-medium">Area</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visits.map((v) => {
                        const sc = visitStatusConfig[v.status];
                        return (
                          <tr key={v.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{v.name ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{v.customer_code ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{v.contact_number ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{v.location_route ?? '—'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant={sc.variant}>{sc.label}</Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {v.status !== 'complete' && (
                                  <button
                                    onClick={() => handleVisitAction(v.id, 'complete')}
                                    title="Mark complete"
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => { setNotesTarget(v); setNotesValue(v.notes ?? ''); }}
                                  title="Add notes"
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => { setSalesTarget(v); setSalesValue(v.sales_order ?? ''); }}
                                  title="Sales order"
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </button>
                                <select
                                  value={v.status}
                                  onChange={(e) => handleVisitAction(v.id, 'status', e.target.value as VisitStatus)}
                                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[36px]"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="complete">Complete</option>
                                  <option value="missed">Missed</option>
                                  <option value="zero_sales">Zero Sales</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      <Modal open={!!notesTarget} onClose={() => setNotesTarget(null)} title="Visit Notes">
        <div className="space-y-4">
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={4}
            placeholder="Enter notes…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNotesTarget(null)}>Cancel</Button>
            <Button onClick={saveNotes}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Sales Order Modal */}
      <Modal open={!!salesTarget} onClose={() => setSalesTarget(null)} title="Sales Order">
        <div className="space-y-4">
          <Input
            label="Sales Order Number"
            placeholder="e.g. SO-20240501-001"
            value={salesValue}
            onChange={(e) => setSalesValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSalesTarget(null)}>Cancel</Button>
            <Button onClick={saveSalesOrder}>Save</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
