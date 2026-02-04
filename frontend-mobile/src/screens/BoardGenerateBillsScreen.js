import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardAPI } from '../services/api';

const now = new Date();

export default function BoardGenerateBillsScreen({ navigation }) {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [dueDate, setDueDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`
  );

  const generateMutation = useMutation({
    mutationFn: boardAPI.generateMaintenance,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['board-maintenance']);
      Alert.alert(
        'Bills generated',
        `Maintenance bills generated for ${variables.month}/${variables.year}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (e) => Alert.alert('Error', e?.response?.data?.message || 'Failed to generate bills')
  });

  const submit = () => {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!m || m < 1 || m > 12) {
      Alert.alert('Invalid', 'Month must be 1–12.');
      return;
    }
    if (!y || y < 2020) {
      Alert.alert('Invalid', 'Enter a valid year.');
      return;
    }
    if (!dueDate.trim()) {
      Alert.alert('Required', 'Enter due date.');
      return;
    }
    generateMutation.mutate({
      month: m,
      year: y,
      dueDate: dueDate.trim()
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Generate maintenance bills for all occupied units for the given month/year.</Text>
      <Text style={styles.label}>Month (1–12)</Text>
      <TextInput
        style={styles.input}
        value={month}
        onChangeText={setMonth}
        keyboardType="number-pad"
        placeholder="e.g. 1"
      />
      <Text style={styles.label}>Year</Text>
      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        placeholder="e.g. 2025"
      />
      <Text style={styles.label}>Due date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="2025-01-15"
      />
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={submit}
        disabled={generateMutation.isLoading}
      >
        {generateMutation.isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Generate bills</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa', padding: 16 },
  hint: { color: '#666', fontSize: 13, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  submitBtn: { backgroundColor: '#0d9488', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
