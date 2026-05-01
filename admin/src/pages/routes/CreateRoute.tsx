import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { Layout } from '@/components/layout/Layout';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/Button';
import { Step1BasicInfo, step1InitialValues } from '@/components/forms/Step1BasicInfo';
import { Step2Customers } from '@/components/forms/Step2Customers';
import { Step3Schedule } from '@/components/forms/Step3Schedule';
import { Step4Review } from '@/components/forms/Step4Review';
import { createRoute } from '@/api/routes';
import { PROTECTED_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import type { Customer, RouteCustomer } from '@/types/index';
import type { Frequency } from '@/constants/frequency';

export interface ScheduleConfig {
  time?: string;
  days?: number[];
  dayOfMonth?: number;
}

export interface RouteFormValues {
  route_name: string;
  route_code: string;
  valid_from: string;
  valid_to: string;
  status: 'active' | 'inactive';
  company_id: string;
  company_name: string;
  warehouse_id: string;
  warehouse_name: string;
  vehicle_id: string;
  vehicle_name: string;
  role: string;
  primary_employee_id: string;
  primary_employee_name: string;
  frequency: Frequency;
  selected_customers: Customer[];
  route_customers: RouteCustomer[];
  schedule: ScheduleConfig;
}

const STEPS = [
  { label: 'Basic Information' },
  { label: 'Customers' },
  { label: 'Schedule' },
  { label: 'Review' },
];

const step1Schema = Yup.object({
  route_name: Yup.string().required('Route name is required'),
  route_code: Yup.string().required('Route code is required'),
  valid_from: Yup.string().required('Valid from is required'),
  valid_to: Yup.string().required('Valid to is required').test(
    'after',
    'Valid to must be after valid from',
    function (val) {
      const { valid_from } = this.parent as RouteFormValues;
      if (!valid_from || !val) return true;
      return new Date(val) > new Date(valid_from);
    },
  ),
  company_id: Yup.string().required('Company is required'),
  warehouse_id: Yup.string().required('Warehouse is required'),
  vehicle_id: Yup.string().required('Vehicle is required'),
  role: Yup.string().required('Role is required'),
  primary_employee_id: Yup.string().when('role', {
    is: ROLES.SALES_EXECUTIVE,
    then: (s) => s.required('Primary employee is required'),
    otherwise: (s) => s,
  }),
});

const step2Schema = Yup.object({
  frequency: Yup.string().required('Frequency is required'),
  selected_customers: Yup.array().min(1, 'Select at least one customer'),
});

const schemas = [step1Schema, step2Schema, Yup.object(), Yup.object()];

const initialValues: RouteFormValues = {
  ...step1InitialValues,
  frequency: 'daily',
  selected_customers: [],
  route_customers: [],
  schedule: {},
};

export default function CreateRoute() {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(values: RouteFormValues, helpers: FormikHelpers<RouteFormValues>) {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      helpers.setSubmitting(false);
      return;
    }

    setSubmitError('');
    const payload = {
      route_name: values.route_name,
      route_code: values.route_code,
      valid_from: values.valid_from,
      valid_to: values.valid_to,
      status: values.status,
      company_id: values.company_id,
      warehouse_id: values.warehouse_id || undefined,
      vehicle_id: values.vehicle_id || undefined,
      role: values.role || undefined,
      primary_employee_id: values.primary_employee_id || undefined,
      frequency: values.frequency,
      customers: values.route_customers.map((rc, idx) => ({
        customer_id: rc.customer_id,
        duration: rc.duration ? Number(rc.duration) : undefined,
        scheduled_time: rc.scheduled_time || undefined,
        priority: rc.priority || 'normal',
        order_index: rc.order_index ?? idx,
      })),
    };

    const res = await createRoute(payload);
    if (res.remote === 'success') {
      navigate(PROTECTED_ROUTES.ROUTES);
    } else {
      setSubmitError(res.error.errors.message || 'Failed to create route');
    }
    helpers.setSubmitting(false);
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(PROTECTED_ROUTES.ROUTES)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Routes
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Create Route</h2>
        </div>

        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={step} />
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={schemas[step]}
          validateOnChange={false}
          validateOnBlur={true}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit: formikSubmit, isSubmitting, values, setFieldValue }) => {
            function handleNext() {
              if (step === 1) {
                const routeCustomers = values.selected_customers.map((c, idx) => {
                  const existing = values.route_customers.find((rc) => rc.customer_id === c.id);
                  return existing ?? {
                    customer_id: c.id,
                    name: c.name,
                    customer_code: c.customer_code,
                    duration: Math.floor(Math.random() * 51) + 10,
                    scheduled_time: undefined as string | undefined,
                    priority: 'normal',
                    order_index: idx,
                  };
                });
                setFieldValue('route_customers', routeCustomers);
              }
              formikSubmit();
            }

            return (
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  {step === 0 && <Step1BasicInfo />}
                  {step === 1 && <Step2Customers />}
                  {step === 2 && <Step3Schedule />}
                  {step === 3 && <Step4Review />}
                </div>

                {submitError && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {submitError}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                  >
                    Back
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    {step === STEPS.length - 1 ? 'Submit Route' : 'Next'}
                  </Button>
                </div>
              </form>
            );
          }}
        </Formik>
      </div>
    </Layout>
  );
}
