import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardAPI } from '../services/api';

export default function BoardVisitorsScreen() {
  const queryClient = useQueryClient();

  const { data: visitors, isLoading } = useQuery({
    queryKey: ['board-visitors'],
    queryFn: async () => {
      const res = await boardAPI.listVisitors();
      return res.data.visitors;
    }
  });

  const approveMutation = useMutation({
    mutationFn: boardAPI.approveVisitor,
    onSuccess: () => queryClient.invalidateQueries(['board-visitors'])
  });
  const rejectMutation = useMutation({
    mutationFn: boardAPI.rejectVisitor,
    onSuccess: () => queryClient.invalidateQueries(['board-visitors'])
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
        data={visitors || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No visitor passes.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.visitorName}</Text>
            <Text style={styles.detail}>{item.visitorPhone} • {item.purpose}</Text>
            <Text style={styles.detail}>By: {item.requestedBy?.name} (Unit {item.requestedBy?.unitNumber})</Text>
            <Text style={styles.date}>{new Date(item.expectedDate).toLocaleDateString()} {item.expectedTime}</Text>
            <View style={[styles.statusBadge, styles[`status_${item.status?.toLowerCase()}`]]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            {item.status === 'PENDING' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => approveMutation.mutate(item.id)}>
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectMutation.mutate(item.id)}>
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
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
  name: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 4 },
  detail: { fontSize: 13, color: '#666', marginBottom: 2 },
  date: { fontSize: 12, color: '#999', marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  status_pending: { backgroundColor: '#fef3c7' },
  status_approved: { backgroundColor: '#d1fae5' },
  status_rejected: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#333' },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#0d9488', padding: 10, borderRadius: 8, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rejectBtn: { flex: 1, backgroundColor: '#f87171', padding: 10, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
