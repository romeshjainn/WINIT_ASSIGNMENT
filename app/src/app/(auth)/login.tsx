import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '@/services/auth.service';
import { setToken, setUser } from '@/store/authSlice';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('vansales_test01');
  const [password, setPassword] = useState('Sales@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await authService.login({ username, password });

      const { token, user } = res;

      dispatch(setToken(token));
      dispatch(setUser(user));
      await SecureStore.setItemAsync('token', token);

      router.replace('/home');
    } catch (err: any) {
      console.log(err?.response?.data || err.message);
      setError(err?.response?.data?.error || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white justify-center px-6"
    >
      {/* Title */}
      <View className="mb-10">
        <Text className="text-3xl font-bold text-gray-900">Welcome Back 👋</Text>
        <Text className="text-gray-500 mt-2">Login to continue</Text>
      </View>

      {/* Error */}
      {error ? <Text className="text-red-500 mb-4 text-sm">{error}</Text> : null}

      {/* Username */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Password */}
      <View className="mb-6">
        <Text className="text-gray-700 mb-1">Password</Text>

        <View className="border border-gray-300 rounded-xl flex-row items-center px-4">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            className="flex-1 py-3 text-gray-900"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Button */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="bg-black rounded-xl py-3 items-center"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-lg">Login</Text>
        )}
      </TouchableOpacity>

      {/* Footer */}
      <Text className="text-center text-gray-400 mt-6">
        Don't have an account? <Text className="text-black font-semibold">Sign up</Text>
      </Text>
    </KeyboardAvoidingView>
  );
}
