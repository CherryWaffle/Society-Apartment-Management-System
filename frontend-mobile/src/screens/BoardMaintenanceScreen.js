import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { boardAPI } from '../services/api';

export default function BoardMaintenanceScreen() {
  const { data: bills, isLoading } = useQuery({
    queryKey: ['board-maintenance'],
    queryFn: async () => {
      const res = await boardAPI.listMaintenance();
      return res.data.bills;
    }
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bills || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No maintenance bills.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.unit}>Unit {item.unitNumber} • {item.memberName}</Text>
            <Text style={styles.period}>{item.month}/{item.year} — ₹{item.amount}</Text>
            <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  unit: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  period: { fontSize: 14, color: '#666', marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  status_pending: { backgroundColor: '#fef3c7' },
  status_paid: { backgroundColor: '#d1fae5' },
  status_overdue: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#333' },
});
