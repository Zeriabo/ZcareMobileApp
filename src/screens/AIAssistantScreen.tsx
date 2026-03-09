import axios from 'axios';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useLanguage } from '../contexts/LanguageContext';
import { RootState } from '../redux/store';
import { Colors, Radius, Spacing } from '../theme/design';
import { goBackOrHome } from '../utils/navigation';

interface AIResponse {
  intent: string;
  payload?: any;
  text?: string;
}

const AIAssistantScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: RootState) => state.user.user as any);

  const askAssistant = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert(t('ai.messageRequiredTitle'), t('ai.messageRequiredBody'));
      return;
    }

    setLoading(true);
    try {
      const base = process.env.EXPO_PUBLIC_SERVER_URL || '';
      const aiBase = process.env.EXPO_PUBLIC_AI_URL || base;
      
      // Try multiple endpoints for the AI analyze service
      const candidates = [
        `${aiBase}/analyze`,
        `${aiBase}/api/zcare-ai/analyze`,
        `${base}/api/zcare-ai/analyze`,
        `${base}/analyze`,
      ].filter(Boolean);

      let lastError: any = null;
      let response: any = null;

      const requestBody = { message: trimmed };

      for (const url of candidates) {
        try {
          response = await axios.post<AIResponse>(url, requestBody, {
            timeout: 20000,
            headers: {
              'Content-Type': 'application/json',
            },
          });
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

      if (!response || !response.data) {
        throw lastError || new Error(
          t('ai.endpointNotReachable')
        );
      }

      const aiResponse: AIResponse = response.data;

      // Handle different intent types
      switch (aiResponse.intent) {
        case 'login_user':
          if (aiResponse.payload) {
            setAnswer(
              `${t('ai.loginSuccessful')}\n\n${t('ai.userLabel')}: ${aiResponse.payload.username}\n${t('ai.tokenLabel')}: ${aiResponse.payload.token?.substring(0, 20)}...`
            );
          } else {
            setAnswer(t('ai.loginIntentNoCredentials'));
          }
          break;

        case 'book_station':
          if (aiResponse.payload) {
            setAnswer(
              `${t('ai.bookingIntentDetected')}\n\n${JSON.stringify(aiResponse.payload, null, 2)}\n\n${t('ai.proceedToBookingQuestion')}`
            );
          } else {
            setAnswer(t('ai.bookingIntentIncomplete'));
          }
          break;

        case 'chat':
        case 'error':
          setAnswer(aiResponse.text || t('ai.noResponse'));
          break;

        default:
          setAnswer(aiResponse.text || JSON.stringify(aiResponse, null, 2));
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || t('ai.failedToGetResponse');
      Alert.alert(t('ai.unavailableTitle'), errorMsg);
      setAnswer(`❌ ${t('common.error')}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const goBackSafe = () => {
    goBackOrHome(navigation);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        onBack={goBackSafe}
      />

      <AppCard>
        <Text style={styles.label}>{t('ai.questionLabel')}</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder={t('ai.exampleQuestion')}
          placeholderTextColor="#9CA3AF"
        />
        <PrimaryButton onPress={askAssistant} label={loading ? t('ai.thinking') : t('ai.askButton')} loading={loading} />
      </AppCard>

      <AppCard>
        <Text style={styles.label}>{t('ai.answerLabel')}</Text>
        <Text style={styles.answer}>{answer || t('ai.responsePlaceholder')}</Text>
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
