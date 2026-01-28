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
import { memberAPI } from '../services/api';

export default function VisitorsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    purpose: '',
    expectedDate: '',
    expectedTime: ''
  });
  const queryClient = useQueryClient();

  const { data: visitors, isLoading } = useQuery({
    queryKey: ['member-visitors'],
    queryFn: async () => {
      const res = await memberAPI.listVisitors();
      return res.data.visitors;
    }
  });

  const requestMutation = useMutation({
    mutationFn: memberAPI.requestVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries(['member-visitors']);
      setShowModal(false);
      setFormData({
        visitorName: '',
        visitorPhone: '',
        visitorEmail: '',
        purpose: '',
        expectedDate: '',
        expectedTime: ''
      });
      Alert.alert('Success', 'Visitor pass requested successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to request visitor pass');
    }
  });

  const handleSubmit = () => {
    if (!formData.visitorName || !formData.visitorPhone || !formData.purpose || !formData.expectedDate || !formData.expectedTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    requestMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#28a745';
      case 'PENDING': return '#ffc107';
      case 'REJECTED': return '#dc3545';
      default: return '#666';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Text style={styles.addButtonText}>+ Request Visitor Pass</Text>
      </TouchableOpacity>

      <FlatList
        data={visitors || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.visitorCard}>
            <View style={styles.visitorHeader}>
              <Text style={styles.visitorName}>{item.visitorName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.visitorInfo}>Phone: {item.visitorPhone}</Text>
            <Text style={styles.visitorInfo}>Purpose: {item.purpose}</Text>
            <Text style={styles.visitorInfo}>
              Expected: {new Date(item.expectedDate).toLocaleDateString()} at {item.expectedTime}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No visitor passes found</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Visitor Pass</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Visitor Name *"
              value={formData.visitorName}
              onChangeText={(text) => setFormData({ ...formData, visitorName: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Visitor Phone *"
              value={formData.visitorPhone}
              onChangeText={(text) => setFormData({ ...formData, visitorPhone: text })}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Visitor Email"
              value={formData.visitorEmail}
              onChangeText={(text) => setFormData({ ...formData, visitorEmail: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Purpose *"
              value={formData.purpose}
              onChangeText={(text) => setFormData({ ...formData, purpose: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Expected Date (YYYY-MM-DD) *"
              value={formData.expectedDate}
              onChangeText={(text) => setFormData({ ...formData, expectedDate: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Expected Time (HH:MM) *"
              value={formData.expectedTime}
              onChangeText={(text) => setFormData({ ...formData, expectedTime: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={requestMutation.isLoading}
              >
                {requestMutation.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#667eea',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  visitorCard: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  visitorInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#667eea',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
