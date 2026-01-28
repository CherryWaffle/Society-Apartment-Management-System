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
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberAPI } from '../services/api';

export default function ComplaintsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OTHER'
  });
  const queryClient = useQueryClient();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['member-complaints'],
    queryFn: async () => {
      const res = await memberAPI.listComplaints();
      return res.data.complaints;
    }
  });

  const raiseMutation = useMutation({
    mutationFn: memberAPI.raiseComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries(['member-complaints']);
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'OTHER' });
      Alert.alert('Success', 'Complaint raised successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to raise complaint');
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    raiseMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': return '#28a745';
      case 'IN_PROGRESS': return '#ffc107';
      case 'CLOSED': return '#6c757d';
      default: return '#dc3545';
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
        <Text style={styles.addButtonText}>+ Raise Complaint</Text>
      </TouchableOpacity>

      <FlatList
        data={complaints || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.complaintCard}>
            <View style={styles.complaintHeader}>
              <Text style={styles.complaintTitle}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.complaintCategory}>{item.category}</Text>
            <Text style={styles.complaintDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.complaintDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No complaints found</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Raise Complaint</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description *"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
            
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryButtons}>
              {['PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'OTHER'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    formData.category === cat && styles.categoryButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === cat && styles.categoryButtonTextActive
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
                disabled={raiseMutation.isLoading}
              >
                {raiseMutation.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  complaintCard: {
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
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  complaintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  complaintCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 5,
  },
  complaintDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  complaintDate: {
    fontSize: 12,
    color: '#999',
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
    maxHeight: '80%',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    padding: 8,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  categoryButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: 'white',
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
