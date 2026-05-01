import { Stack, Redirect } from 'expo-router';
import { useSelector } from 'react-redux';

export default function AppLayout() {
  const token = useSelector((state: any) => state.auth.accessToken);

  // 🔒 block access if no token
  if (!token) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
