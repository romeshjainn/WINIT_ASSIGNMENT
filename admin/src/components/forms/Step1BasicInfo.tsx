import { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { getCompanies } from '@/api/companies';
import { getWarehouses } from '@/api/warehouses';
import { getVehicles } from '@/api/vehicles';
import { getUsers } from '@/api/users';
import { ROLES, ROLE_OPTIONS } from '@/constants/roles';
import { today, oneYearFromToday } from '@/utils/date';
import type { Company, Warehouse, Vehicle, User } from '@/types/index';
import type { RouteFormValues } from '@/pages/routes/CreateRoute';

export function Step1BasicInfo() {
  const { values, setFieldValue, errors, touched } = useFormikContext<RouteFormValues>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  useEffect(() => {
    getCompanies().then((r) => { if (r.remote === 'success') setCompanies(r.data); });
  }, []);

  useEffect(() => {
    if (values.role === ROLES.SALES_EXECUTIVE) {
      getUsers(ROLES.SALES_EXECUTIVE).then((r) => { if (r.remote === 'success') setEmployees(r.data); });
    } else {
      setEmployees([]);
    }
  }, [values.role]);

  useEffect(() => {
    if (values.company_id) {
      getWarehouses(values.company_id).then((r) => { if (r.remote === 'success') setWarehouses(r.data); });
      getVehicles(values.company_id).then((r) => { if (r.remote === 'success') setVehicles(r.data); });
    } else {
      setWarehouses([]);
      setVehicles([]);
    }
  }, [values.company_id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Route Information</h3>
        <Toggle
          checked={values.status === 'active'}
          onChange={(v) => setFieldValue('status', v ? 'active' : 'inactive')}
          activeLabel="Active"
          inactiveLabel="Inactive"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="route_name" label="Route Name *"
          placeholder="e.g., Downtown Morning Route"
          value={values.route_name}
          onChange={(e) => setFieldValue('route_name', e.target.value)}
          error={touched.route_name ? errors.route_name : undefined}
        />
        <Input
          id="route_code" label="Route Code *"
          placeholder="e.g., RT-001"
          value={values.route_code}
          onChange={(e) => setFieldValue('route_code', e.target.value)}
          error={touched.route_code ? errors.route_code : undefined}
        />
        <Input
          id="valid_from" label="Valid From *" type="date"
          min={today()}
          value={values.valid_from}
          onChange={(e) => setFieldValue('valid_from', e.target.value)}
          error={touched.valid_from ? errors.valid_from : undefined}
        />
        <Input
          id="valid_to" label="Valid To *" type="date"
          min={values.valid_from || today()}
          value={values.valid_to}
          onChange={(e) => setFieldValue('valid_to', e.target.value)}
          error={touched.valid_to ? errors.valid_to : undefined}
        />
        <Select
          id="company_id" label="Company *"
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select company"
          value={values.company_id}
          onChange={(e) => {
            const val = e.target.value;
            const name = companies.find((c) => c.id === val)?.name ?? '';
            setFieldValue('company_id', val);
            setFieldValue('company_name', name);
            setFieldValue('warehouse_id', '');
            setFieldValue('warehouse_name', '');
            setFieldValue('vehicle_id', '');
            setFieldValue('vehicle_name', '');
          }}
          error={touched.company_id ? errors.company_id : undefined}
        />
        <Select
          id="warehouse_id" label="Warehouse *"
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          placeholder="Select warehouse"
          disabled={!values.company_id}
          value={values.warehouse_id}
          onChange={(e) => {
            const val = e.target.value;
            const name = warehouses.find((w) => w.id === val)?.name ?? '';
            setFieldValue('warehouse_id', val);
            setFieldValue('warehouse_name', name);
          }}
          error={touched.warehouse_id ? errors.warehouse_id : undefined}
        />
        <Select
          id="vehicle_id" label="Vehicle *"
          options={vehicles.map((v) => ({ value: v.id, label: `${v.name} (${v.plate_number})` }))}
          placeholder="Select vehicle"
          disabled={!values.company_id}
          value={values.vehicle_id}
          onChange={(e) => {
            const val = e.target.value;
            const found = vehicles.find((v) => v.id === val);
            const name = found ? `${found.name} (${found.plate_number})` : '';
            setFieldValue('vehicle_id', val);
            setFieldValue('vehicle_name', name);
          }}
          error={touched.vehicle_id ? errors.vehicle_id : undefined}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="role" label="Role *"
            options={ROLE_OPTIONS}
            placeholder="Select role"
            value={values.role}
            onChange={(e) => {
              setFieldValue('role', e.target.value);
              if (e.target.value !== ROLES.SALES_EXECUTIVE) {
                setFieldValue('primary_employee_id', '');
                setFieldValue('primary_employee_name', '');
              }
            }}
            error={touched.role ? errors.role : undefined}
          />
          <Select
            id="primary_employee_id" label="Primary Employee *"
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
            placeholder={values.role === ROLES.SALES_EXECUTIVE ? 'Select primary employee' : 'Select Sales Executive role first'}
            disabled={values.role !== ROLES.SALES_EXECUTIVE}
            value={values.primary_employee_id}
            onChange={(e) => {
              const val = e.target.value;
              const name = employees.find((em) => em.id === val)?.name ?? '';
              setFieldValue('primary_employee_id', val);
              setFieldValue('primary_employee_name', name);
            }}
            error={touched.primary_employee_id ? errors.primary_employee_id : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export const step1InitialValues = {
  route_name: '',
  route_code: '',
  valid_from: today(),
  valid_to: oneYearFromToday(),
  status: 'active' as const,
  company_id: '',
  company_name: '',
  warehouse_id: '',
  warehouse_name: '',
  vehicle_id: '',
  vehicle_name: '',
  role: '',
  primary_employee_id: '',
  primary_employee_name: '',
};
