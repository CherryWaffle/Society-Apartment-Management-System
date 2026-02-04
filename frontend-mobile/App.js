import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BillsScreen from './src/screens/BillsScreen';
import VisitorsScreen from './src/screens/VisitorsScreen';
import NoticesScreen from './src/screens/NoticesScreen';
import ComplaintsScreen from './src/screens/ComplaintsScreen';
import MemberRootScreen from './src/screens/MemberRootScreen';
import BoardHomeScreen from './src/screens/BoardHomeScreen';
import BoardJoinRequestsScreen from './src/screens/BoardJoinRequestsScreen';
import BoardCreateNoticeScreen from './src/screens/BoardCreateNoticeScreen';
import BoardGenerateBillsScreen from './src/screens/BoardGenerateBillsScreen';
import BoardNoticesScreen from './src/screens/BoardNoticesScreen';
import BoardMaintenanceScreen from './src/screens/BoardMaintenanceScreen';
import BoardVisitorsScreen from './src/screens/BoardVisitorsScreen';
import BoardComplaintsScreen from './src/screens/BoardComplaintsScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MemberStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MemberRoot" component={MemberRootScreen} options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Bills" component={BillsScreen} options={{ title: 'Maintenance Bills' }} />
      <Stack.Screen name="Visitors" component={VisitorsScreen} options={{ title: 'Visitor Passes' }} />
      <Stack.Screen name="Notices" component={NoticesScreen} options={{ title: 'Notices' }} />
      <Stack.Screen name="Complaints" component={ComplaintsScreen} options={{ title: 'Complaints' }} />
    </Stack.Navigator>
  );
}

function BoardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BoardHome" component={BoardHomeScreen} options={{ title: 'Board' }} />
      <Stack.Screen name="BoardJoinRequests" component={BoardJoinRequestsScreen} options={{ title: 'Member requests' }} />
      <Stack.Screen name="BoardCreateNotice" component={BoardCreateNoticeScreen} options={{ title: 'Create notice' }} />
      <Stack.Screen name="BoardGenerateBills" component={BoardGenerateBillsScreen} options={{ title: 'Generate bills' }} />
      <Stack.Screen name="BoardNotices" component={BoardNoticesScreen} options={{ title: 'Notices' }} />
      <Stack.Screen name="BoardMaintenance" component={BoardMaintenanceScreen} options={{ title: 'Maintenance' }} />
      <Stack.Screen name="BoardVisitors" component={BoardVisitorsScreen} options={{ title: 'Visitors' }} />
      <Stack.Screen name="BoardComplaints" component={BoardComplaintsScreen} options={{ title: 'Complaints' }} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Admin' }} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { user } = useAuth();
  const role = user?.role || 'MEMBER';

  if (role === 'SUPER_ADMIN') {
    return <AdminStack />;
  }
  if (role === 'BOARD_MEMBER') {
    return <BoardStack />;
  }
  return <MemberStack />;
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
