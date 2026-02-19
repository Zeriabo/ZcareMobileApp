import { Platform } from 'react-native';

export const resolveMediaUrl = (path?: string) => {
  if (!path) return undefined;

  const serverBase = (process.env.EXPO_PUBLIC_SERVER_URL || '').trim().replace(/\/+$/, '');
  const baseOrPath = serverBase || path;

  const toAndroidDebugLocalhost = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl);
      if (!(Platform.OS === 'android' && __DEV__)) return rawUrl;
      if (!serverBase) return rawUrl;
      const base = new URL(serverBase);
      const isLocalHost = base.hostname === 'localhost' || base.hostname === '127.0.0.1';
      if (isLocalHost) return rawUrl;
      url.protocol = base.protocol;
      url.hostname = 'localhost';
      url.port = base.port;
      return url.toString();
    } catch {
      return rawUrl;
    }
  };

  // already absolute
  if (path.startsWith('http')) return toAndroidDebugLocalhost(path);

  if (!serverBase) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Allow overriding media host/port when backend serves files from a different service.
  if (normalizedPath.startsWith('/media/')) {
    const mediaBase = (process.env.EXPO_PUBLIC_MEDIA_BASE_URL || serverBase).trim().replace(/\/+$/, '');
    if (mediaBase) {
      return toAndroidDebugLocalhost(`${mediaBase}${normalizedPath}`);
    }
  }

  return toAndroidDebugLocalhost(`${baseOrPath}${normalizedPath}`);
};
