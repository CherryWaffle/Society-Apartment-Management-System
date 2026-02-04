import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { boardAPI } from '../services/api';

export default function BoardComplaintsScreen() {
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['board-complaints'],
    queryFn: async () => {
      const res = await boardAPI.listComplaints();
      return res.data.complaints;
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
        data={complaints || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No complaints.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <View style={styles.meta}>
              <Text style={styles.badge}>{item.category}</Text>
              <Text style={[styles.statusBadge, styles[`status_${item.status}`]]}>{item.status}</Text>
            </View>
            <Text style={styles.by}>By: {item.raisedBy?.name} (Unit {item.raisedBy?.unitNumber})</Text>
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
  title: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 6 },
  desc: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { fontSize: 11, fontWeight: '600', color: '#0d9488', backgroundColor: '#ccfbf1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  status_open: { backgroundColor: '#dbeafe', color: '#1e40af' },
  status_in_progress: { backgroundColor: '#fef3c7', color: '#92400e' },
  status_resolved: { backgroundColor: '#d1fae5', color: '#065f46' },
  status_closed: { backgroundColor: '#e2e8f0', color: '#475569' },
  by: { fontSize: 12, color: '#999' },
});
