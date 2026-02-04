import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardAPI } from '../services/api';

export default function BoardJoinRequestsScreen() {
  const queryClient = useQueryClient();
  const [approveModal, setApproveModal] = useState(null);
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('2BHK');
  const [floorNumber, setFloorNumber] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['board-join-requests'],
    queryFn: async () => {
      const res = await boardAPI.listJoinRequests();
      return res.data.requests;
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }) => boardAPI.approveJoinRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['board-join-requests']);
      setApproveModal(null);
      setUnitNumber('');
      setFloorNumber('');
      setUnitType('2BHK');
      Alert.alert('Done', 'Member approved and assigned to unit.');
    },
    onError: (e) => Alert.alert('Error', e?.response?.data?.message || 'Failed to approve')
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => boardAPI.rejectJoinRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['board-join-requests']);
      Alert.alert('Done', 'Request rejected.');
    },
    onError: (e) => Alert.alert('Error', e?.response?.data?.message || 'Failed to reject')
  });

  const handleApprove = () => {
    if (!unitNumber.trim() || !floorNumber.trim()) {
      Alert.alert('Required', 'Enter unit number and floor.');
      return;
    }
    approveMutation.mutate({
      id: approveModal.id,
      data: {
        unitNumber: unitNumber.trim(),
        unitType,
        floorNumber: parseInt(floorNumber, 10) || 0
      }
    });
  };

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
        data={requests || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No pending member requests.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.memberName}</Text>
            <Text style={styles.phone}>{item.memberPhone}</Text>
            <Text style={styles.date}>Requested: {new Date(item.requestedAt).toLocaleDateString()}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => setApproveModal(item)}
              >
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => {
                  Alert.alert('Reject request?', 'This will reject the member\'s join request.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reject', onPress: () => rejectMutation.mutate(item.id), style: 'destructive' }
                  ]);
                }}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={!!approveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Assign unit</Text>
            <TextInput
              style={styles.input}
              placeholder="Unit number (e.g. 101)"
              value={unitNumber}
              onChangeText={setUnitNumber}
            />
            <Text style={styles.label}>Unit type</Text>
            <View style={styles.row}>
              {['1BHK', '2BHK', '3BHK', '4BHK'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.unitTypeBtn, unitType === t && styles.unitTypeBtnActive]}
                  onPress={() => setUnitType(t)}
                >
                  <Text style={[styles.unitTypeText, unitType === t && styles.unitTypeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Floor number"
              value={floorNumber}
              onChangeText={setFloorNumber}
              keyboardType="number-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setApproveModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.okBtn}
                onPress={handleApprove}
                disabled={approveMutation.isLoading}
              >
                {approveMutation.isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.okBtnText}>Approve & assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#666', marginTop: 24, fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 4,
  },
  name: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  phone: { fontSize: 14, color: '#666', marginBottom: 4 },
  date: { fontSize: 12, color: '#999', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#0d9488', padding: 12, borderRadius: 8, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '600' },
  rejectBtn: { flex: 1, backgroundColor: '#f87171', padding: 12, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 8 },
  unitTypeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  unitTypeBtnActive: { backgroundColor: '#0d9488' },
  unitTypeText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  unitTypeTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#e2e8f0', alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: '#475569' },
  okBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#0d9488', alignItems: 'center' },
  okBtnText: { fontWeight: '600', color: '#fff' },
});
