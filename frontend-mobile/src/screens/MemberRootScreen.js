import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { memberAPI } from '../services/api';
import JoinSocietyScreen from './JoinSocietyScreen';
import HomeScreen from './HomeScreen';

export default function MemberRootScreen({ navigation }) {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['member-status'],
    queryFn: async () => {
      const res = await memberAPI.getStatus();
      return res.data;
    }
  });

  const onJoinSuccess = () => {
    queryClient.invalidateQueries(['member-status']);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!status?.hasUnit) {
    return <JoinSocietyScreen onJoinSuccess={onJoinSuccess} />;
  }

  return <HomeScreen navigation={navigation} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
});
