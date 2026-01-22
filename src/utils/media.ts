export const resolveMediaUrl = (path?: string) => {
  if (!path) return undefined;

  // already absolute
  if (path.startsWith('http')) return path;

  return `${process.env.EXPO_PUBLIC_SERVER_URL}${path}`;
};
