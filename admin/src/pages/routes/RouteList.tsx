import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Layout } from '@/components/layout/Layout';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { getRoutes, updateRoute, deleteRoute } from '@/api/routes';
import { getUsers } from '@/api/users';
import { formatDate } from '@/utils/date';
import { FREQUENCY_LABELS } from '@/constants/frequency';
import { ROLES } from '@/constants/roles';
import { PROTECTED_ROUTES } from '@/constants/routes';
import type { Route, User } from '@/types/index';

const editSchema = Yup.object({
  route_name: Yup.string().required('Route name is required'),
  status: Yup.string().oneOf(['active', 'inactive']).required(),
  valid_to: Yup.string().required('Valid to date is required'),
  primary_employee_id: Yup.string(),
});

export default function RouteList() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [vanUsers, setVanUsers] = useState<User[]>([]);
  const [editTarget, setEditTarget] = useState<Route | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    const res = await getRoutes();
    if (res.remote === 'success') setRoutes(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    getUsers(ROLES.SALES_EXECUTIVE).then((r) => { if (r.remote === 'success') setVanUsers(r.data); });
  }, []);

  const formik = useFormik({
    initialValues: { route_name: '', status: 'active', valid_to: '', primary_employee_id: '' },
    validationSchema: editSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!editTarget) return;
      setApiError('');
      const res = await updateRoute(editTarget.id, {
        route_name: values.route_name,
        status: values.status as 'active' | 'inactive',
        valid_to: values.valid_to,
        primary_employee_id: values.primary_employee_id || undefined,
      });
      if (res.remote === 'success') {
        await load();
        setEditTarget(null);
        showToast('Route updated', 'success');
      } else {
        setApiError(res.error.errors.message);
      }
      setSubmitting(false);
    },
  });

  function openEdit(r: Route) {
    setEditTarget(r);
    formik.resetForm({
      values: {
        route_name: r.route_name,
        status: r.status,
        valid_to: r.valid_to ? r.valid_to.slice(0, 10) : '',
        primary_employee_id: r.primary_employee_id ?? '',
      },
    });
    setApiError('');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteRoute(deleteTarget.id);
    if (res.remote === 'success') {
      await load();
      showToast('Route deleted', 'success');
    } else {
      showToast(res.error.errors.message, 'error');
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  const userOptions = vanUsers.map((u) => ({ value: u.id, label: u.name }));
  const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Routes</h2>
          <p className="text-gray-500 text-sm mt-1">{routes.length} total routes</p>
        </div>
        <Button onClick={() => navigate(PROTECTED_ROUTES.ROUTES_NEW)}>+ Create Route</Button>
      </div>

      <Table
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyMessage="No routes found. Create your first route."
        data={routes}
        columns={[
          { key: 'route_name', header: 'Route Name' },
          { key: 'route_code', header: 'Code' },
          { key: 'company_name', header: 'Company' },
          {
            key: 'valid_from', header: 'Valid Period',
            render: (r) => <span>{formatDate(r.valid_from)} – {formatDate(r.valid_to)}</span>,
          },
          {
            key: 'frequency', header: 'Frequency',
            render: (r) => <Badge variant="blue">{FREQUENCY_LABELS[r.frequency]}</Badge>,
          },
          {
            key: 'status', header: 'Status',
            render: (r) => <Badge variant={r.status === 'active' ? 'green' : 'gray'}>{r.status === 'active' ? 'Active' : 'Inactive'}</Badge>,
          },
          { key: 'primary_employee_name', header: 'Assigned To', render: (r) => <span>{r.primary_employee_name ?? '—'}</span> },
          {
            key: 'actions', header: '',
            render: (r) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(r)}
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md min-h-[36px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(r)}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md min-h-[36px]"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Route">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Input id="route_name" label="Route Name *" {...formik.getFieldProps('route_name')} error={formik.touched.route_name ? formik.errors.route_name : undefined} />
          <Select id="status" label="Status" options={statusOptions} {...formik.getFieldProps('status')} />
          <Input id="valid_to" label="Valid To *" type="date" {...formik.getFieldProps('valid_to')} error={formik.touched.valid_to ? formik.errors.valid_to : undefined} />
          <Select id="primary_employee_id" label="Assigned Employee" options={userOptions} placeholder="None" {...formik.getFieldProps('primary_employee_id')} />
          {apiError && <p className="text-sm text-red-600">{apiError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" loading={formik.isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Route">
        <p className="text-sm text-gray-600 mb-6">
          Delete route <strong>{deleteTarget?.route_name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  );
}
