import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function BoardHomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'requests', title: 'Member requests', icon: '👥', screen: 'BoardJoinRequests' },
    { id: 'notices', title: 'Notices', icon: '📢', screen: 'BoardNotices' },
    { id: 'create-notice', title: 'Create notice', icon: '➕', screen: 'BoardCreateNotice' },
    { id: 'maintenance', title: 'Maintenance bills', icon: '💰', screen: 'BoardMaintenance' },
    { id: 'generate-bills', title: 'Generate bills', icon: '📄', screen: 'BoardGenerateBills' },
    { id: 'visitors', title: 'Visitor passes', icon: '🚪', screen: 'BoardVisitors' },
    { id: 'complaints', title: 'Complaints', icon: '📝', screen: 'BoardComplaints' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: '#0d9488' }]}>
        <Text style={styles.greeting}>Board • {user?.fullName || 'Member'}</Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', onPress: logout, style: 'destructive' }
            ]);
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Manage your society from the tabs below.</Text>
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { color: 'white', fontSize: 18, fontWeight: '600' },
  logoutText: { color: 'white', fontSize: 14, textDecorationLine: 'underline' },
  hint: { padding: 12, color: '#666', fontSize: 13 },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#0d9488',
  },
  menuIcon: { fontSize: 32, marginBottom: 8 },
  menuTitle: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' },
});
