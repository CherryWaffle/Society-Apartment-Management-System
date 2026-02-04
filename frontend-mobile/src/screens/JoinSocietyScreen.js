import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function JoinSocietyScreen({ onJoinSuccess }) {
  const queryClient = useQueryClient();
  const [requestingId, setRequestingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: status } = useQuery({
    queryKey: ['member-status'],
    queryFn: async () => {
      const res = await memberAPI.getStatus();
      return res.data;
    }
  });

  const { data: societiesData, isLoading: loadingSocieties, refetch: refetchSocieties } = useQuery({
    queryKey: ['available-societies'],
    queryFn: async () => {
      const res = await memberAPI.getAvailableSocieties();
      return res.data.societies;
    }
  });

  const { data: myRequests, isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['member-join-requests'],
    queryFn: async () => {
      const res = await memberAPI.listJoinRequests();
      return res.data.requests;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries(['member-status']),
      queryClient.invalidateQueries(['available-societies']),
      queryClient.invalidateQueries(['member-join-requests'])
    ]);
    await refetchSocieties();
    await refetchRequests();
    setRefreshing(false);
  };

  const createRequestMutation = useMutation({
    mutationFn: (societyId) => memberAPI.createJoinRequest(societyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['member-join-requests']);
      queryClient.invalidateQueries(['member-status']);
      setRequestingId(null);
      Alert.alert('Request sent', 'The board will review your request. You can check status below.');
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
    // We're on Join Society screen so we have no unit. Don't block on APPROVED (treat as REMOVED; can request again).
    // Only block on PENDING.
    setRequestingId(society.id);
    createRequestMutation.mutate(society.id);
  };

  // When we're on Join Society screen, we have no unit. So APPROVED in DB is stale (we were removed).
  // Treat it as REMOVED so UI shows "Removed" and "Request to join again".
  const getRequestStatus = (societyId) => {
    const r = myRequests?.find((req) => req.societyId === societyId);
    if (!r) return null;
    return r.status === 'APPROVED' ? 'REMOVED' : r.status;
  };

  if (status?.hasUnit && onJoinSuccess) {
    onJoinSuccess();
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} tintColor="#6366f1" />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>🏘️</Text>
        </View>
        <Text style={styles.heroTitle}>Join a society</Text>
        <Text style={styles.heroSubtitle}>
          You’re not in any society yet. Choose one below and send a request. The board will approve it and assign you a unit.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your requests</Text>
        {loadingRequests ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : (
          <View style={styles.requestList}>
            {(!myRequests || myRequests.length === 0) ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>No requests yet</Text>
                <Text style={styles.emptyText}>Request to join a society below. Your status will appear here.</Text>
              </View>
            ) : (
              (() => {
                // Group requests by societyId and keep only the most recent one
                const latestRequests = {};
                myRequests.forEach((req) => {
                  if (!latestRequests[req.societyId] || 
                      new Date(req.createdAt) > new Date(latestRequests[req.societyId].createdAt)) {
                    latestRequests[req.societyId] = req;
                  }
                });
                
                return Object.values(latestRequests).map((req) => {
                  const displayStatus = req.status === 'APPROVED' ? 'REMOVED' : req.status;
                  return (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.requestCardLeft}>
                        <Text style={styles.requestSociety}>{req.societyName}</Text>
                        {req.societyCity && (
                          <Text style={styles.requestMeta}>{req.societyCity}</Text>
                        )}
                      </View>
                      <View style={[styles.statusBadge, styles[`status_${displayStatus}`]]}>
                        <Text style={styles.statusText}>{displayStatus}</Text>
                      </View>
                    </View>
                  );
                });
              })()
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Available societies</Text>
        {loadingSocieties ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : !societiesData?.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <Text style={styles.emptyTitle}>No societies yet</Text>
            <Text style={styles.emptyText}>The admin can add societies from the web dashboard. Check back later.</Text>
          </View>
        ) : (
          <View style={styles.societyList}>
            {societiesData.map((item) => {
              const reqStatus = getRequestStatus(item.id);
              const isPending = reqStatus === 'PENDING';
              const isApproved = reqStatus === 'APPROVED'; // only show "Member" if still approved (has unit)
              const isRemoved = reqStatus === 'REMOVED';
              return (
                <View key={item.id} style={styles.societyCard}>
                  <View style={styles.societyCardContent}>
                    <Text style={styles.societyName}>{item.name}</Text>
                    <Text style={styles.societyAddress}>
                      {item.address}, {item.city} — {item.pincode}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.requestButton,
                      (isPending || isApproved) && styles.requestButtonDisabled
                    ]}
                    onPress={() => requestToJoin(item)}
                    disabled={isPending || isApproved || requestingId === item.id}
                    activeOpacity={0.8}
                  >
                    {requestingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.requestButtonText}>
                        {isPending ? 'Pending' : isApproved ? 'Member' : isRemoved ? 'Request to join again' : 'Request to join'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  requestList: {
    gap: 10,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  requestCardLeft: {
    flex: 1,
  },
  requestSociety: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  requestMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  status_PENDING: {
    backgroundColor: '#fef3c7',
  },
  status_APPROVED: {
    backgroundColor: '#d1fae5',
  },
  status_REJECTED: {
    backgroundColor: '#fee2e2',
  },
  status_REMOVED: {
    backgroundColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  societyList: {
    gap: 14,
  },
  societyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  societyCardContent: {
    padding: 18,
  },
  societyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 6,
  },
  societyAddress: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  requestButton: {
    backgroundColor: '#6366f1',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  requestButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    height: 24,
  },
});
