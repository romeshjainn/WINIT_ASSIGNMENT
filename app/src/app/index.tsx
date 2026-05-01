import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { setToken, setUser, logout } from '@/store/authSlice';

function decodeJWTPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');

        if (token && token !== 'null' && token !== 'undefined') {
          dispatch(setToken(token));
          const payload = decodeJWTPayload(token);
          if (payload?.id && payload?.name) {
            dispatch(setUser({ id: payload.id, name: payload.name, role: payload.role ?? '' }));
          }
          setIsLoggedIn(true);
        } else {
          dispatch(logout()); // 🔥 important
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.log('Auth error:', err);
        dispatch(logout());
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? '/home' : '/login'} />;
}
