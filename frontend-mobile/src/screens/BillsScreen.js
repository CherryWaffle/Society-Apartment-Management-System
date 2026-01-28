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

export default function BillsScreen({ navigation }) {
  const { data: bills, isLoading } = useQuery({
    queryKey: ['member-bills'],
    queryFn: async () => {
      const res = await memberAPI.getBills();
      return res.data.bills;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return '#28a745';
      case 'PENDING': return '#ffc107';
      case 'OVERDUE': return '#dc3545';
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
      <FlatList
        data={bills || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.billCard}
            onPress={() => navigation.navigate('BillDetails', { billId: item.id })}
          >
            <View style={styles.billHeader}>
              <Text style={styles.billMonth}>
                {new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.billAmount}>₹{item.amount}</Text>
            <Text style={styles.billDueDate}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No bills found</Text>
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
  billCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billMonth: {
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
  billAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 5,
  },
  billDueDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
