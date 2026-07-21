// ============================================================================
// AppNavigator Component
// Comprehensive Snapchat Stack Navigator (Camera, Chat, Stories, VIP Members, Auth, SendTo, DirectChat, StoryViewer)
// ============================================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';

import CameraScreen from '../screens/CameraScreen';
import ChatFeedScreen from '../screens/ChatFeedScreen';
import StoriesScreen from '../screens/StoriesScreen';
import VipMembersScreen from '../screens/VipMembersScreen';
import SnapViewerScreen from '../screens/SnapViewerScreen';
import AuthScreen from '../screens/AuthScreen';
import SendToModal from '../screens/SendToModal';
import DirectChatScreen from '../screens/DirectChatScreen';
import StoryViewerScreen from '../screens/StoryViewerScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        let label = '📷';
        if (route.name === 'ChatFeed') label = '💬';
        if (route.name === 'Camera') label = '📷';
        if (route.name === 'Stories') label = '▶️';
        if (route.name === 'VipMembers') label = '👑';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tabItem, isFocused && styles.tabItemFocused]}
          >
            <Text style={styles.tabIcon}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Camera" // Camera-first entry experience
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
    // Check initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth state changes
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
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 50, marginBottom: 16 }}>👻</Text>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  const showAuthScreen = !session && !demoMode;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={showAuthScreen ? 'Auth' : 'MainTabs'}
        screenOptions={{
          headerShown: false,
        }}
      >
        {showAuthScreen ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onEnableDemoMode={() => setDemoMode(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
        <Stack.Screen name="DirectChat" component={DirectChatScreen} />
        <Stack.Screen
          name="SendToModal"
          component={SendToModal}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="SnapViewer"
          component={SnapViewerScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="StoryViewer"
          component={StoryViewerScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabItem: {
    padding: 12,
    borderRadius: 20,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabIcon: {
    fontSize: 22,
  },
});
