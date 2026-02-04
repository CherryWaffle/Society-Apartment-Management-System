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

export default function AdminHomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: '#7c3aed' }]}>
        <Text style={styles.greeting}>Admin • {user?.fullName || 'Admin'}</Text>
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
      <View style={styles.card}>
        <Text style={styles.title}>Super Admin</Text>
        <Text style={styles.message}>
          Full admin features (create societies, assign board members) are available on the <Text style={styles.bold}>web dashboard</Text>. Use the browser for the best experience.
        </Text>
        <Text style={styles.url}>Open: http://localhost:5173 (or your web URL)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ff' },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { color: 'white', fontSize: 18, fontWeight: '600' },
  logoutText: { color: 'white', fontSize: 14, textDecorationLine: 'underline' },
  card: {
    margin: 16,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#7c3aed', marginBottom: 12 },
  message: { fontSize: 15, color: '#555', lineHeight: 22 },
  bold: { fontWeight: '700', color: '#333' },
  url: { marginTop: 12, fontSize: 13, color: '#666' },
});
