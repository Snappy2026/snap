// ============================================================================
// AuthScreen Component
// Adult+ Auth Screen with Login & Sign Up forms + Supabase Authentication
// Handles Web browser alerts & offline dev fallback seamlessly.
// ============================================================================

import React, { useState } from "react";
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
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";
import { CreatorOnboardingModal } from "../components/CreatorOnboardingModal";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Universal Alert helper supporting both Native and Web browsers
const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
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
  const [selectedRole, setSelectedRole] = useState<"customer" | "creator">(
    "customer",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  const handleAuth = async () => {
    if (!email || !password) {
      showAlert("Required Fields", "Please enter your email and password.");
      return;
    }

    if (!isLogin && (!username || !displayName)) {
      showAlert("Missing Details", "Please enter a username handle and display name to create your account.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Strict Login: Must match existing credentials exactly
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          showAlert("Login Failed", error.message || "Invalid email or password. Please create an account if you do not have one.");
          setLoading(false);
          return;
        }

        if (onEnableDemoMode) onEnableDemoMode();
        navigation.replace("MainTabs", { screen: "Camera" });
      } else {
        // Strict Sign Up
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: username.trim(),
              display_name: displayName.trim(),
              role: selectedRole,
            },
          },
        });

        if (error) {
          showAlert("Sign Up Error", error.message || "Could not register account. Email may already be registered.");
          setLoading(false);
          return;
        }

        if (signUpData?.user) {
          await (supabase.from("profiles") as any).upsert({
            id: signUpData.user.id,
            username: username.trim(),
            display_name: displayName.trim(),
            role: selectedRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        if (selectedRole === "creator") {
          setRegisteredUser(signUpData?.user || { id: signUpData?.user?.id, email: email.trim() });
          setShowCreatorModal(true);
        } else {
          if (onEnableDemoMode) onEnableDemoMode();
          navigation.replace("MainTabs", { screen: "Camera" });
        }
      }
    } catch (err: any) {
      console.error("[Auth Exception]", err);
      showAlert("Authentication Error", err?.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setEmail("admin@adultplus.com");
    setPassword("admin123");
    try {
      await supabase.auth.signUp({
        email: "admin@adultplus.com",
        password: "admin123",
        options: {
          data: {
            username: "master_admin",
            display_name: "Platform Master Admin",
          },
        },
      });
      await supabase.auth.signInWithPassword({
        email: "admin@adultplus.com",
        password: "admin123",
      });
    } catch (e) {
      console.log("[Admin Register Notice]", e);
    }
    if (onEnableDemoMode) onEnableDemoMode();
    navigation.replace("MainTabs", { screen: "Camera" });
  };

  const handleSkipDemo = () => {
    if (onEnableDemoMode) onEnableDemoMode();
    navigation.replace("MainTabs", { screen: "Camera" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <View style={styles.header}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
              LOG IN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
              SIGN UP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          {!isLogin && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ACCOUNT TYPE / ROLE</Text>
                <View style={styles.roleSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleChip,
                      selectedRole === "customer" && styles.selectedRoleChip,
                    ]}
                    onPress={() => setSelectedRole("customer")}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selectedRole === "customer" && styles.selectedRoleText,
                      ]}
                    >
                      👤 Customer / Follower
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleChip,
                      selectedRole === "creator" &&
                        styles.selectedRoleChipCreator,
                    ]}
                    onPress={() => setSelectedRole("creator")}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selectedRole === "creator" &&
                          styles.selectedRoleTextCreator,
                      ]}
                    >
                      🎨 Content Creator
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

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
              <Text style={styles.submitBtnText}>
                {isLogin ? "Log In" : "Sign Up"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Master Admin Direct Login Button */}
          <TouchableOpacity
            style={styles.adminLoginBtn}
            onPress={handleAdminLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.adminLoginBtnText}>
              🛡️ Log In as Master Admin
            </Text>
          </TouchableOpacity>

          <View style={styles.adminCredsBox}>
            <Text style={styles.adminCredsTitle}>🔑 Admin Login Details:</Text>
            <Text style={styles.adminCredsText}>
              Email:{" "}
              <Text style={{ color: "#D4AF37" }}>admin@adultplus.com</Text>
            </Text>
            <Text style={styles.adminCredsText}>
              Password: <Text style={{ color: "#D4AF37" }}>admin123</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkipDemo}>
            <Text style={styles.skipBtnText}>Continue as Guest ⚡️</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
          <CreatorOnboardingModal
        visible={showCreatorModal}
        userId={registeredUser?.id}
        userEmail={registeredUser?.email}
        onClose={() => {
          setShowCreatorModal(false);
          if (onEnableDemoMode) onEnableDemoMode();
          navigation.replace("MainTabs", { screen: "Camera" });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoImage: {
    width: 280,
    height: 100,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 10, 10, 0.7)",
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  tabText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  activeTabText: {
    color: "#D4AF37",
  },
  form: {
    backgroundColor: "rgba(10, 10, 10, 0.75)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.35)",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  roleSelectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleChip: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedRoleChip: {
    backgroundColor: "rgba(0, 242, 254, 0.1)",
    borderColor: "#00F2FE",
  },
  selectedRoleChipCreator: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderColor: "#D4AF37",
  },
  roleChipText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
  },
  selectedRoleText: {
    color: "#00F2FE",
    fontWeight: "900",
  },
  selectedRoleTextCreator: {
    color: "#D4AF37",
    fontWeight: "900",
  },
  label: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  submitBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  adminLoginBtn: {
    backgroundColor: "transparent",
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  adminLoginBtnText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "700",
  },
  adminCredsBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
  adminCredsTitle: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  adminCredsText: {
    color: "#AAA",
    fontSize: 13,
    marginBottom: 2,
    fontWeight: "500",
  },
  skipBtn: {
    marginTop: 16,
    alignItems: "center",
    padding: 8,
  },
  skipBtnText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "700",
  },
});
export default AuthScreen;
