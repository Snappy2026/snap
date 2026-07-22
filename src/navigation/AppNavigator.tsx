// ============================================================================
// AppNavigator Component
// Comprehensive Snapchat Stack Navigator (Camera, Chat, Stories, VIP Members, Auth, SendTo, DirectChat, StoryViewer)
// ============================================================================

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Platform,
} from "react-native";
import { RootStackParamList, MainTabParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";

import MapScreen from "../screens/MapScreen";
import CameraScreen from "../screens/CameraScreen";
import ChatFeedScreen from "../screens/ChatFeedScreen";
import StoriesScreen from "../screens/StoriesScreen";
import VipMembersScreen from "../screens/VipMembersScreen";
import SnapViewerScreen from "../screens/SnapViewerScreen";
import AuthScreen from "../screens/AuthScreen";
import SendToModal from "../screens/SendToModal";
import DirectChatScreen from "../screens/DirectChatScreen";
import StoryViewerScreen from "../screens/StoryViewerScreen";
import { StoryViewerProvider } from "../context/StoryViewerContext";

const AdultPlusTheme = {
  dark: true,
  colors: {
    primary: "#D4AF37",
    background: "transparent",
    card: "rgba(10,10,10,0.9)",
    text: "#ffffff",
    border: "#D4AF37",
    notification: "#D4AF37",
  },
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        let icon = "📷";
        let title = "Camera";

        if (route.name === "ChatFeed") {
          icon = "💬";
          title = "Chat";
        } else if (route.name === "Camera") {
          icon = "📷";
          title = "Camera";
        } else if (route.name === "Stories") {
          icon = "👥";
          title = "Stories";
        } else if (route.name === "VipMembers") {
          icon = "👑";
          title = "VIP";
        }

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tabItem,
              isFocused && styles.tabItemFocused,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.tabIcon, isFocused && styles.tabIconFocused]}>
              {icon}
            </Text>
            <Text
              style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}
            >
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Stories"
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="ChatFeed" component={ChatFeedScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Stories" component={StoriesScreen} />
      <Tab.Screen name="VipMembers" component={VipMembersScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const [session, setSession] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [demoMode, setDemoMode] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 50, marginBottom: 16 }}>👻</Text>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  const initialRoute = !session && !demoMode ? "Auth" : "MainTabs";

  return (
    <StoryViewerProvider>
      <ImageBackground
        source={require("../assets/marble_bg.png")}
        style={{ flex: 1, backgroundColor: "#0a0a0a" }}
        resizeMode="cover"
      >
        <NavigationContainer theme={AdultPlusTheme as any}>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Auth">
              {(props) => (
                <AuthScreen
                  {...props}
                  onEnableDemoMode={() => setDemoMode(true)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="DirectChat" component={DirectChatScreen} />
            <Stack.Screen
              name="SendToModal"
              component={SendToModal}
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="SnapViewer"
              component={SnapViewerScreen}
              options={{
                presentation: "fullScreenModal",
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="StoryViewer"
              component={StoryViewerScreen}
              options={{
                presentation: "fullScreenModal",
                animation: "fade",
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ImageBackground>
    </StoryViewerProvider>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "web" ? 76 : 70,
    backgroundColor: "#0A0A0C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingBottom: Platform.OS === "web" ? 14 : 10,
    zIndex: 9999,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabItemFocused: {},
  tabIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  tabLabelFocused: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
