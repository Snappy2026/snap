// ============================================================================
// AuthScreen Component
// Snapchat Auth Screen with Login & Sign Up forms + Supabase Authentication
// Handles Web browser alerts & offline dev fallback seamlessly.
// ============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Universal Alert helper supporting both Native and Web browsers
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

interface AuthScreenProps {
  onEnableDemoMode?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onEnableDemoMode }) => {
  const navigation = useNavigation<NavigationProp>();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      showAlert('Required Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Sign In Existing User
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          console.warn('[Supabase Auth Error]', error.message);
          showAlert('Login Failed', error.message || 'Invalid email or password. Please check your credentials.');
          setLoading(false);
          return;
        } else {
          showAlert('Welcome Back! 🎉', 'Successfully logged in.');
          if (onEnableDemoMode) onEnableDemoMode();
        }
      } else {
        // Sign Up New User
        if (!username) {
          showAlert('Username Required', 'Please enter a unique username handle.');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim(),
              display_name: displayName.trim() || username.trim(),
            },
          },
        });

        if (error) {
          console.warn('[Supabase Sign Up Error]', error.message);
          showAlert('Sign Up Error', error.message || 'Could not create account.');
          setLoading(false);
          return;
        } else {
          showAlert('Account Created! 🎉', 'Welcome to Snapchat. Logged in successfully.');
          if (onEnableDemoMode) onEnableDemoMode();
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      console.error('[Auth Exception]', errorMessage);
      showAlert('Auth Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    setEmail('admin@snapchat.com');
    setPassword('admin123');
    showAlert('🛡️ Master Admin Credentials Set', 'Email: admin@snapchat.com | Password: admin123\nTapped to log in as Platform Admin.');
    if (onEnableDemoMode) onEnableDemoMode();
  };

  const handleSkipDemo = () => {
    if (onEnableDemoMode) {
      onEnableDemoMode();
    } else {
      navigation.replace('MainTabs', { screen: 'Camera' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        {/* Snapchat Header Ghost */}
        <View style={styles.header}>
          <Text style={styles.ghostLogo}>👻</Text>
          <Text style={styles.title}>Snapchat</Text>
          <Text style={styles.subtitle}>Real-time Ephemeral Mobile & Web App</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>LOG IN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>SIGN UP</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          {!isLogin && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>USERNAME HANDLE</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g. sarah_snap"
                  placeholderTextColor="#666"
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DISPLAY NAME</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Sarah Connor"
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              placeholderTextColor="#666"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#666"
              style={styles.input}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>

          {/* Master Admin Direct Login Button */}
          <TouchableOpacity
            style={styles.adminLoginBtn}
            onPress={handleAdminLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.adminLoginBtnText}>🛡️ Log In as Master Admin</Text>
          </TouchableOpacity>

          <View style={styles.adminCredsBox}>
            <Text style={styles.adminCredsTitle}>🔑 Admin Login Details:</Text>
            <Text style={styles.adminCredsText}>Email: <Text style={{ color: '#FFFC00' }}>admin@snapchat.com</Text></Text>
            <Text style={styles.adminCredsText}>Password: <Text style={{ color: '#FFFC00' }}>admin123</Text></Text>
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkipDemo}>
            <Text style={styles.skipBtnText}>Continue as Guest ⚡️</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFC00', // Snapchat Yellow Accent
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ghostLogo: {
    fontSize: 70,
    marginBottom: 8,
  },
  title: {
    color: '#000',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#FFFC00',
  },
  form: {
    backgroundColor: '#000',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#FFFC00',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800',
  },
  adminLoginBtn: {
    backgroundColor: 'rgba(255, 252, 0, 0.15)',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFFC00',
  },
  adminLoginBtnText: {
    color: '#FFFC00',
    fontSize: 15,
    fontWeight: '800',
  },
  adminCredsBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  adminCredsTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  adminCredsText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  skipBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;
