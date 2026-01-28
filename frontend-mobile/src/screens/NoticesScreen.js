import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { memberAPI } from '../services/api';

export default function NoticesScreen({ navigation }) {
  const { data: notices, isLoading } = useQuery({
    queryKey: ['member-notices'],
    queryFn: async () => {
      const res = await memberAPI.listNotices();
      return res.data.notices;
    }
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case 'EMERGENCY': return '#dc3545';
      case 'EVENT': return '#28a745';
      case 'MAINTENANCE': return '#ffc107';
      default: return '#667eea';
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
      <FlatList
        data={notices || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noticeCard}
            onPress={() => navigation.navigate('NoticeDetails', { noticeId: item.id })}
          >
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeTitle}>{item.title}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>
            <Text style={styles.noticeContent} numberOfLines={2}>
              {item.content}
            </Text>
            <Text style={styles.noticeDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No notices found</Text>
          </View>
        }
      />
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
  noticeCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  categoryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  noticeContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  noticeDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
