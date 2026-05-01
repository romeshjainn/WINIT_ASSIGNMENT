import { useFormikContext } from 'formik';
import { Badge } from '@/components/ui/Badge';
import { FREQUENCY_LABELS } from '@/constants/frequency';
import { ROLE_OPTIONS } from '@/constants/roles';
import { formatDate } from '@/utils/date';
import type { RouteFormValues } from '@/pages/routes/CreateRoute';

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  normal: 'Normal',
  can_wait: 'Can Wait',
};

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
      <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 text-sm w-40 shrink-0">{label}</span>
      <span className="text-gray-900 text-sm font-medium">{value || '—'}</span>
    </div>
  );
}

export function Step4Review() {
  const { values } = useFormikContext<RouteFormValues>();
  const roleLabel = ROLE_OPTIONS.find((r) => r.value === values.role)?.label ?? values.role;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Review the route details before submitting.</p>

      <ReviewCard title="Route Information">
        <Row label="Route Name" value={values.route_name} />
        <Row label="Route Code" value={values.route_code} />
        <Row label="Valid From" value={formatDate(values.valid_from)} />
        <Row label="Valid To" value={formatDate(values.valid_to)} />
        <Row label="Company" value={values.company_name} />
        <Row label="Warehouse" value={values.warehouse_name} />
        <Row label="Vehicle" value={values.vehicle_name} />
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm w-40 shrink-0">Status</span>
          <Badge variant={values.status === 'active' ? 'green' : 'gray'}>
            {values.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </ReviewCard>

      <ReviewCard title="Assignment">
        <Row label="Role" value={roleLabel} />
        <Row label="Primary Employee" value={values.primary_employee_name} />
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm w-40 shrink-0">Frequency</span>
          <Badge variant="blue">{FREQUENCY_LABELS[values.frequency]}</Badge>
        </div>
      </ReviewCard>

      <ReviewCard title={`Customers (${values.route_customers.length})`}>
        {values.route_customers.length === 0 ? (
          <p className="text-sm text-gray-400">No customers selected.</p>
        ) : (
          <div className="space-y-2">
            {values.route_customers.map((rc, idx) => (
              <div key={rc.customer_id} className="flex items-center gap-3 text-sm flex-wrap">
                <span className="text-gray-400 w-5 shrink-0">{idx + 1}.</span>
                <span className="font-medium text-gray-900">{rc.name}</span>
                <span className="text-gray-500">{rc.duration} min</span>
                {rc.scheduled_time && <span className="text-gray-500">@ {rc.scheduled_time}</span>}
                {rc.priority && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {PRIORITY_LABELS[rc.priority] ?? rc.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </ReviewCard>

      <ReviewCard title="Schedule Configuration">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-500 text-sm w-40 shrink-0">Frequency</span>
          <Badge variant="blue">{FREQUENCY_LABELS[values.frequency]}</Badge>
        </div>
        {values.frequency === 'daily' && (
          <Row label="Start Time" value={values.schedule.time ?? 'Not set'} />
        )}
        {values.frequency === 'weekly' && (
          <>
            <Row
              label="Days"
              value={(values.schedule.days ?? []).map((d) => DAYS_SHORT[d]).join(', ') || 'None selected'}
            />
            <Row label="Time" value={values.schedule.time ?? 'Not set'} />
          </>
        )}
        {values.frequency === 'monthly' && (
          <>
            <Row label="Day of Month" value={String(values.schedule.dayOfMonth ?? 'Not set')} />
            <Row label="Time" value={values.schedule.time ?? 'Not set'} />
          </>
        )}
      </ReviewCard>
    </div>
  );
}
