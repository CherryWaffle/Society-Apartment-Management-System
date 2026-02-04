import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function JoinSocietyScreen({ onJoinSuccess }) {
  const queryClient = useQueryClient();
  const [requestingId, setRequestingId] = useState(null);

  const { data: status } = useQuery({
    queryKey: ['member-status'],
    queryFn: async () => {
      const res = await memberAPI.getStatus();
      return res.data;
    }
  });

  const { data: societiesData, isLoading: loadingSocieties } = useQuery({
    queryKey: ['available-societies'],
    queryFn: async () => {
      const res = await memberAPI.getAvailableSocieties();
      return res.data.societies;
    }
  });

  const { data: myRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['member-join-requests'],
    queryFn: async () => {
      const res = await memberAPI.listJoinRequests();
      return res.data.requests;
    }
  });

  const createRequestMutation = useMutation({
    mutationFn: (societyId) => memberAPI.createJoinRequest(societyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['member-join-requests']);
      queryClient.invalidateQueries(['member-status']);
      setRequestingId(null);
      Alert.alert('Success', 'Join request sent. The board will review it.');
    },
    onError: (err) => {
      setRequestingId(null);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send request');
    }
  });

  const requestToJoin = (society) => {
    const pending = myRequests?.find(
      (r) => r.societyId === society.id && r.status === 'PENDING'
    );
    if (pending) {
      Alert.alert('Already requested', 'You have a pending request for this society.');
      return;
    }
    if (myRequests?.find((r) => r.societyId === society.id && r.status === 'APPROVED')) {
      Alert.alert('Already a member', 'You are already in this society.');
      return;
    }
    setRequestingId(society.id);
    createRequestMutation.mutate(society.id);
  };

  const getRequestStatus = (societyId) => {
    const r = myRequests?.find((req) => req.societyId === societyId);
    return r ? r.status : null;
  };

  if (status?.hasUnit && onJoinSuccess) {
    onJoinSuccess();
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Join a Society</Text>
        <Text style={styles.subtitle}>
          You are not in any society yet. Request to join one below. The board will approve your request.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>My requests</Text>
      {loadingRequests ? (
        <ActivityIndicator size="small" color="#667eea" style={styles.loader} />
      ) : (
        <View style={styles.requestList}>
          {myRequests?.length === 0 && (
            <Text style={styles.emptyText}>No requests yet.</Text>
          )}
          {myRequests?.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <Text style={styles.requestSociety}>{req.societyName}</Text>
              <View style={[styles.statusBadge, styles[`status_${req.status}`]]}>
                <Text style={styles.statusText}>{req.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Available societies</Text>
      {loadingSocieties ? (
        <ActivityIndicator size="small" color="#667eea" style={styles.loader} />
      ) : (
        <FlatList
          data={societiesData || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const reqStatus = getRequestStatus(item.id);
            const isPending = reqStatus === 'PENDING';
            const isApproved = reqStatus === 'APPROVED';
            return (
              <View style={styles.societyCard}>
                <Text style={styles.societyName}>{item.name}</Text>
                <Text style={styles.societyAddress}>{item.address}, {item.city} - {item.pincode}</Text>
                <TouchableOpacity
                  style={[
                    styles.requestButton,
                    (isPending || isApproved) && styles.requestButtonDisabled
                  ]}
                  onPress={() => requestToJoin(item)}
                  disabled={isPending || isApproved || requestingId === item.id}
                >
                  {requestingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.requestButtonText}>
                      {isPending ? 'Request pending' : isApproved ? 'Member' : 'Request to join'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No societies available. Admin can add societies from the web.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  loader: {
    marginVertical: 10,
  },
  requestList: {
    marginBottom: 24,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  requestSociety: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_PENDING: {
    backgroundColor: '#fff3cd',
  },
  status_APPROVED: {
    backgroundColor: '#d4edda',
  },
  status_REJECTED: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    paddingBottom: 24,
  },
  societyCard: {
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
  societyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 6,
  },
  societyAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  requestButton: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    backgroundColor: '#ccc',
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginVertical: 10,
  },
});
