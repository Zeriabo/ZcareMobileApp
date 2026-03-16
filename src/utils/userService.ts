import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiClient } from './apiClient';

export const updateFcmToken = async (
  userId: number,
  fcmToken: string,
  authToken?: string
): Promise<void> => {
  if (!userId || !fcmToken) return;
  const endpoint = API_ENDPOINTS.USER.FCM_TOKEN(userId);
  const headers = authToken
    ? {
        Authorization: `Bearer ${authToken.replace(/^Bearer\\s+/i, '')}`,
      }
    : undefined;

  await apiClient.put(endpoint, null, {
    params: { fcmToken },
    headers,
  });
};
