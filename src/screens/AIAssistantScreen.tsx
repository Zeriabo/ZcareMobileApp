import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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
      const base = process.env.EXPO_PUBLIC_SERVER_URL || '';
      const aiBase = process.env.EXPO_PUBLIC_AI_URL || '';
      const candidates = [
        aiBase ? `${aiBase}/api/zcare-ai/${encoded}` : '',
        aiBase ? `${aiBase}/zcare-ai/${encoded}` : '',
        `${base}/api/zcare-ai/${encoded}`,
        `${base}/zcare-ai/${encoded}`,
        `${base}/v1/zcare-ai/${encoded}`,
      ].filter(Boolean);

      let lastError: any = null;
      let response: any = null;

      for (const url of candidates) {
        try {
          response = await axios.get(url, { timeout: 15000 });
          if (response?.status >= 200 && response?.status < 300) {
            break;
          }
        } catch (error: any) {
          lastError = error;
          if (error?.response?.status && error.response.status !== 404) {
            break;
          }
        }
      }

      if (!response) {
        throw lastError || new Error(
          'AI endpoint not reachable. Set EXPO_PUBLIC_AI_URL to the AI service host.'
        );
      }

      setAnswer(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    } catch (error: any) {
      Alert.alert('AI unavailable', error?.response?.data?.message || error?.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const goBackSafe = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={goBackSafe} hitSlop={12} style={styles.iconButton}>
            <Icon name="chevron-back" size={22} color="#111827" />
          </Pressable>
        </View>
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
  headerTopRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffffee',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
