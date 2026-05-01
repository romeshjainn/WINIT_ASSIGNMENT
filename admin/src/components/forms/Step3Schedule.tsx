import { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { Input } from '@/components/ui/Input';
import { DAYS_OF_WEEK, FREQUENCY_LABELS } from '@/constants/frequency';
import type { RouteFormValues } from '@/pages/routes/CreateRoute';

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
  { value: 'can_wait', label: 'Can Wait' },
];

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export function Step3Schedule() {
  const { values, setFieldValue } = useFormikContext<RouteFormValues>();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (values.route_customers.length === 0 && values.selected_customers.length > 0) {
      const synced = values.selected_customers.map((c, idx) => ({
        customer_id: c.id,
        name: c.name,
        customer_code: c.customer_code,
        duration: Math.floor(Math.random() * 51) + 10,
        scheduled_time: undefined as string | undefined,
        priority: 'normal',
        order_index: idx,
      }));
      setFieldValue('route_customers', synced);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function removeCustomer(customerId: string) {
    setFieldValue('route_customers', values.route_customers.filter((rc) => rc.customer_id !== customerId));
    setFieldValue('selected_customers', values.selected_customers.filter((c) => c.id !== customerId));
  }

  function updateRouteCustomer(customerId: string, field: string, value: string | number) {
    setFieldValue(
      'route_customers',
      values.route_customers.map((rc) => rc.customer_id === customerId ? { ...rc, [field]: value } : rc),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule Configuration</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Frequency:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
              {FREQUENCY_LABELS[values.frequency]}
            </span>
          </div>

          {values.frequency === 'daily' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Daily Time Slot</p>
              <Input
                type="time"
                label="Start Time"
                value={values.schedule.time ?? ''}
                onChange={(e) => setFieldValue('schedule', { ...values.schedule, time: e.target.value })}
                className="max-w-xs"
              />
            </div>
          )}

          {values.frequency === 'weekly' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Days of Week</p>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const active = (values.schedule.days ?? []).includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => {
                        const days = values.schedule.days ?? [];
                        setFieldValue('schedule', {
                          ...values.schedule,
                          days: active ? days.filter((x) => x !== d.value) : [...days, d.value],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {d.label.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <Input
                type="time"
                label="Time Slot"
                value={values.schedule.time ?? ''}
                onChange={(e) => setFieldValue('schedule', { ...values.schedule, time: e.target.value })}
                className="max-w-xs"
              />
            </div>
          )}

          {values.frequency === 'monthly' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Day of Month</p>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 15"
                value={values.schedule.dayOfMonth ?? ''}
                onChange={(e) => setFieldValue('schedule', { ...values.schedule, dayOfMonth: Number(e.target.value) })}
                className="max-w-xs"
              />
              <Input
                type="time"
                label="Time Slot"
                value={values.schedule.time ?? ''}
                onChange={(e) => setFieldValue('schedule', { ...values.schedule, time: e.target.value })}
                className="max-w-xs"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Schedule</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Scheduled Time</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {values.route_customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No customers selected. Go back to add customers.
                  </td>
                </tr>
              ) : (
                values.route_customers.map((rc, idx) => (
                  <tr key={rc.customer_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{rc.name}</td>
                    <td className="px-4 py-3 text-gray-600">{rc.duration} min</td>
                    <td className="px-4 py-3">
                      {editingId === rc.customer_id ? (
                        <input
                          type="time"
                          value={rc.scheduled_time ?? ''}
                          onChange={(e) => updateRouteCustomer(rc.customer_id, 'scheduled_time', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-600">{rc.scheduled_time ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={rc.priority ?? 'normal'}
                        onChange={(e) => updateRouteCustomer(rc.customer_id, 'priority', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(editingId === rc.customer_id ? null : rc.customer_id)}
                          title={editingId === rc.customer_id ? 'Save' : 'Edit scheduled time'}
                          className={`p-1.5 rounded transition-colors ${
                            editingId === rc.customer_id
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {editingId === rc.customer_id ? <CheckIcon /> : <PencilIcon />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustomer(rc.customer_id)}
                          title="Remove customer"
                          className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
