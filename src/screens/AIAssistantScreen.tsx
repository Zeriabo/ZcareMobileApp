import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const AIAssistantScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const askAssistant = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert('Message required', 'Please enter a question for the AI assistant.');
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(trimmed);
      const response = await axios.get(`${process.env.EXPO_PUBLIC_SERVER_URL}/api/zcare-ai/${encoded}`);
      setAnswer(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    } catch (error: any) {
      Alert.alert('AI unavailable', error?.response?.data?.message || error?.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Ask anything about washes, repairs, or car care.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Question</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Example: What repair should I do if brakes squeak?"
          placeholderTextColor="#9CA3AF"
        />

        <Pressable onPress={askAssistant} style={[styles.askBtn, loading && styles.disabled]} disabled={loading}>
          <Text style={styles.askBtnText}>{loading ? 'Thinking...' : 'Ask AI'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Answer</Text>
        <Text style={styles.answer}>{answer || 'Your AI response will appear here.'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 14 },
  header: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EEF2FF' },
  backBtnText: { color: '#4F46E5', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  subtitle: { marginTop: 4, color: '#6B7280', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: { minHeight: 110, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', padding: 12, color: '#111827', textAlignVertical: 'top' },
  askBtn: { marginTop: 12, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  askBtnText: { color: '#fff', fontWeight: '800' },
  answer: { color: '#374151', fontSize: 14, lineHeight: 21 },
  disabled: { opacity: 0.6 },
});

export default AIAssistantScreen;
