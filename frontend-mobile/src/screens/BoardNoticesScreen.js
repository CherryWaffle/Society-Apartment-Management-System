import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { boardAPI } from '../services/api';

export default function BoardNoticesScreen() {
  const { data: notices, isLoading } = useQuery({
    queryKey: ['board-notices'],
    queryFn: async () => {
      const res = await boardAPI.listNotices();
      return res.data.notices;
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
        data={notices || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notices.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.content}>{item.content}</Text>
            <View style={styles.meta}>
              <Text style={styles.badge}>{item.category}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
    borderLeftWidth: 4,
    borderLeftColor: '#0d9488',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 8 },
  content: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 11, fontWeight: '600', color: '#0d9488', backgroundColor: '#ccfbf1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  date: { fontSize: 12, color: '#999' },
});
