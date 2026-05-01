import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { login as loginApi } from '@/api/auth';
import { PROTECTED_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

const schema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  if (isAuthenticated && user?.role === ROLES.ADMIN) {
    navigate(PROTECTED_ROUTES.DASHBOARD, { replace: true });
  }

  const formik = useFormik({
    initialValues: { username: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError('');
      const result = await loginApi(values.username, values.password);
      console.log(result, 'result')
      if (result.remote === 'success') {
        const { token, user: userData } = result.data as { token: string; user: { id: string; name: string; role: string } };
        if (userData.role !== ROLES.ADMIN) {
          setApiError('Access denied. Admin accounts only.');
          setSubmitting(false);
          return;
        }
        login(token, { id: userData.id, name: userData.name, role: userData.role as typeof ROLES.ADMIN, username: values.username });
        navigate(PROTECTED_ROUTES.DASHBOARD, { replace: true });
      } else {
        setApiError(result.error.errors.message || 'Invalid credentials');
      }
      setSubmitting(false);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Van Sales Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your admin account</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Input
            id="username"
            label="Username"
            placeholder="Enter your username"
            {...formik.getFieldProps('username')}
            error={formik.touched.username ? formik.errors.username : undefined}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...formik.getFieldProps('password')}
            error={formik.touched.password ? formik.errors.password : undefined}
          />
          {apiError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</div>
          )}
          <Button type="submit" className="w-full justify-center" loading={formik.isSubmitting} size="lg">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
