import axios from 'axios';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import { Colors, Radius, Spacing } from '../theme/design';

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
      <AppHeader
        title="AI Assistant"
        subtitle="Ask anything about washes, repairs, or car care."
        onBack={goBackSafe}
      />

      <AppCard>
        <Text style={styles.label}>Question</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Example: What repair should I do if brakes squeak?"
          placeholderTextColor="#9CA3AF"
        />
        <PrimaryButton onPress={askAssistant} label={loading ? 'Thinking...' : 'Ask AI'} loading={loading} />
      </AppCard>

      <AppCard>
        <Text style={styles.label}>Answer</Text>
        <Text style={styles.answer}>{answer || 'Your AI response will appear here.'}</Text>
      </AppCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.md, gap: Spacing.md },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  input: { minHeight: 110, borderRadius: Radius.sm, borderWidth: 1, borderColor: '#D1D5DB', padding: 12, color: Colors.text, textAlignVertical: 'top' },
  answer: { color: '#374151', fontSize: 14, lineHeight: 21 },
});

export default AIAssistantScreen;
