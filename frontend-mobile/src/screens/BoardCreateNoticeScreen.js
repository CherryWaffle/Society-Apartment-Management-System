import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardAPI } from '../services/api';

export default function BoardCreateNoticeScreen({ navigation }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');

  const createMutation = useMutation({
    mutationFn: boardAPI.createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries(['board-notices']);
      Alert.alert('Success', 'Notice created.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (e) => Alert.alert('Error', e?.response?.data?.message || 'Failed to create notice')
  });

  const submit = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required', 'Enter title and content.');
      return;
    }
    createMutation.mutate({ title: title.trim(), content: content.trim(), category, priority });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Notice title"
          value={title}
          onChangeText={setTitle}
        />
        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Full content"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
        />
        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {['GENERAL', 'MAINTENANCE', 'EVENT', 'EMERGENCY'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.row}>
          {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, priority === p && styles.chipActive]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={submit}
          disabled={createMutation.isLoading}
        >
          {createMutation.isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create notice</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#0d9488' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#0d9488', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
