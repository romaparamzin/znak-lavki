import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials, setLoading, setError } from '../../store/slices/authSlice';
import { useLogin } from '../../services/api/queries';
import { biometricService } from '../../services/biometric/biometricService';

const LoginScreen = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await biometricService.isSupported();
    setBiometricAvailable(available);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showSnackbar('Please enter email and password');
      return;
    }

    dispatch(setLoading(true));

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        })
      );

      showSnackbar(t('auth.loginSuccess'));
    } catch (error: any) {
      dispatch(setError(error.message || t('auth.loginError')));
      showSnackbar(error.message || t('auth.loginError'));
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const authenticated = await biometricService.authenticate(t('auth.biometricPrompt'));

      if (authenticated) {
        // Here you would retrieve stored credentials securely
        // For demo purposes, we'll show a message
        showSnackbar('Biometric authentication successful');
      }
    } catch (error) {
      showSnackbar('Biometric authentication failed');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.surface}>
        <View style={styles.logoContainer}>
          <Text variant="displaySmall" style={styles.logo}>
            📦
          </Text>
          <Text variant="headlineLarge" style={styles.title}>
            Znak Lavki
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Warehouse Quality Management
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            mode="outlined"
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
            style={styles.loginButton}
          >
            {t('auth.login')}
          </Button>

          {biometricAvailable && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              icon="fingerprint"
              style={styles.biometricButton}
            >
              Login with Biometric
            </Button>
          )}
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.version}>
            Version 1.0.0
          </Text>
        </View>
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  surface: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    color: '#111',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    paddingVertical: 6,
    marginTop: 8,
    backgroundColor: '#4F46E5',
  },
  biometricButton: {
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
  },
  version: {
    color: '#999',
  },
});

export default LoginScreen;
