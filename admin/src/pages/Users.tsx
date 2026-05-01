import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Layout } from '@/components/layout/Layout';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { getUsers, createUser, updateUser, deleteUser } from '@/api/users';
import { ROLES, ROLE_LABELS } from '@/constants/roles';
import type { User } from '@/types/index';

const createSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  username: Yup.string().required('Username is required'),
  password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  role: Yup.string().oneOf(Object.values(ROLES)).required('Role is required'),
  phone: Yup.string(),
});

const editSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  phone: Yup.string(),
  password: Yup.string().test('min-if-filled', 'Minimum 6 characters', (v) => !v || v.length >= 6),
});

const roleOptions = [
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
  { value: ROLES.GENERAL_MANAGER, label: ROLE_LABELS[ROLES.GENERAL_MANAGER] },
  { value: ROLES.TEAM_LEAD, label: ROLE_LABELS[ROLES.TEAM_LEAD] },
  { value: ROLES.SALES_EXECUTIVE, label: ROLE_LABELS[ROLES.SALES_EXECUTIVE] },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState('');
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    const res = await getUsers();
    if (res.remote === 'success') setUsers(res.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const createFormik = useFormik({
    initialValues: { name: '', username: '', password: '', role: ROLES.SALES_EXECUTIVE, phone: '' },
    validationSchema: createSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setApiError('');
      const res = await createUser(values);
      if (res.remote === 'success') {
        await load();
        resetForm();
        setModalOpen(false);
        showToast('User created', 'success');
      } else {
        setApiError(res.error.errors.message);
      }
      setSubmitting(false);
    },
  });

  const editFormik = useFormik({
    initialValues: { name: '', phone: '', password: '' },
    validationSchema: editSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!editTarget) return;
      setApiError('');
      const payload: { name?: string; phone?: string; password?: string } = { name: values.name, phone: values.phone };
      if (values.password) payload.password = values.password;
      const res = await updateUser(editTarget.id, payload);
      if (res.remote === 'success') {
        await load();
        setEditTarget(null);
        showToast('User updated', 'success');
      } else {
        setApiError(res.error.errors.message);
      }
      setSubmitting(false);
    },
  });

  function openEdit(u: User) {
    setEditTarget(u);
    editFormik.resetForm({ values: { name: u.name, phone: u.phone ?? '', password: '' } });
    setApiError('');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteUser(deleteTarget.id);
    if (res.remote === 'success') {
      await load();
      showToast('User deleted', 'success');
    } else {
      showToast(res.error.errors.message, 'error');
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
        </div>
        <Button onClick={() => { setModalOpen(true); createFormik.resetForm(); setApiError(''); }}>
          + Add User
        </Button>
      </div>

      <Table
        keyExtractor={(u) => u.id}
        loading={loading}
        emptyMessage="No users found."
        data={users}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'username', header: 'Username' },
          { key: 'phone', header: 'Phone', render: (u) => <span>{u.phone ?? '—'}</span> },
          {
            key: 'role', header: 'Role',
            render: (u) => <Badge variant={u.role === ROLES.ADMIN ? 'blue' : 'green'}>{ROLE_LABELS[u.role] ?? u.role}</Badge>,
          },
          {
            key: 'created_at', header: 'Created',
            render: (u) => <span className="text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>,
          },
          {
            key: 'actions', header: '',
            render: (u) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(u)}
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md min-h-[36px] min-w-[36px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(u)}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md min-h-[36px] min-w-[36px]"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* Add User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add User">
        <form onSubmit={createFormik.handleSubmit} className="space-y-4">
          <Input id="name" label="Full Name" placeholder="e.g., John Doe" {...createFormik.getFieldProps('name')} error={createFormik.touched.name ? createFormik.errors.name : undefined} />
          <Input id="username" label="Username" placeholder="e.g., john_doe" {...createFormik.getFieldProps('username')} error={createFormik.touched.username ? createFormik.errors.username : undefined} />
          <Input id="phone" label="Phone" placeholder="e.g., +91 98765 43210" {...createFormik.getFieldProps('phone')} />
          <Input id="password" label="Password" type="password" placeholder="Min 6 characters" {...createFormik.getFieldProps('password')} error={createFormik.touched.password ? createFormik.errors.password : undefined} />
          <Select id="role" label="Role" options={roleOptions} {...createFormik.getFieldProps('role')} error={createFormik.touched.role ? createFormik.errors.role : undefined} />
          {apiError && <p className="text-sm text-red-600">{apiError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createFormik.isSubmitting}>Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User">
        <form onSubmit={editFormik.handleSubmit} className="space-y-4">
          <Input id="edit_name" label="Full Name" placeholder="e.g., John Doe" {...editFormik.getFieldProps('name')} error={editFormik.touched.name ? editFormik.errors.name : undefined} />
          <Input id="edit_phone" label="Phone" placeholder="e.g., +91 98765 43210" {...editFormik.getFieldProps('phone')} />
          <Input id="edit_password" label="New Password (optional)" type="password" placeholder="Leave blank to keep current" {...editFormik.getFieldProps('password')} error={editFormik.touched.password ? editFormik.errors.password : undefined} />
          {apiError && <p className="text-sm text-red-600">{apiError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" loading={editFormik.isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User">
        <p className="text-sm text-gray-600 mb-2">
          Delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
        {deleteTarget?.role === ROLES.SALES_EXECUTIVE && (
          <p className="text-sm text-amber-600 mb-4">Warning: this user may have active journey plans assigned to them.</p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  );
}
