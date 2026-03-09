type TranslateFn = (key: string, options?: any) => string;

const normalizeText = (value?: unknown): string =>
  String(value || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getNameKeyFromText = (name?: unknown): string | null => {
  const normalized = normalizeText(name);
  if (!normalized) return null;

  if (normalized.includes('high pressure')) return 'programs.names.highPressureWash';
  if (normalized.includes('touchless') || normalized.includes('touch less')) return 'programs.names.touchlessWash';
  if (normalized.includes('waterless')) return 'programs.names.waterlessMobileWash';
  if (normalized.includes('premium')) return 'programs.names.premiumWash';
  if (normalized.includes('deluxe')) return 'programs.names.deluxeWash';
  if (normalized.includes('basic')) return 'programs.names.basicWash';

  return null;
};

const getDescriptionKeyFromText = (description?: unknown): string | null => {
  const normalized = normalizeText(description);
  if (!normalized) return null;

  if (normalized.includes('high pressure')) return 'programs.descriptions.highPressureWash';
  if (normalized.includes('touchless') || normalized.includes('touch less')) return 'programs.descriptions.touchlessWash';
  if (normalized.includes('waterless') || normalized.includes('eco-friendly') || normalized.includes('eco friendly')) {
    return 'programs.descriptions.waterlessWash';
  }
  if (normalized.includes('premium') || normalized.includes('deep clean')) return 'programs.descriptions.premiumWash';
  if (normalized.includes('basic') || normalized.includes('quick wash')) return 'programs.descriptions.basicWash';

  return null;
};

const getNameKeyFromType = (programType?: unknown): string | null => {
  const normalized = normalizeText(programType);
  if (!normalized) return null;

  if (normalized.includes('waterless')) return 'programs.names.waterlessMobileWash';
  if (normalized.includes('touchless')) return 'programs.names.touchlessWash';
  if (normalized.includes('high pressure') || normalized.includes('highpressure')) return 'programs.names.highPressureWash';

  return null;
};

export const localizeWashProgramName = (program: any, t: TranslateFn): string => {
  const byName = getNameKeyFromText(program?.name);
  if (byName) return t(byName);

  const byType = getNameKeyFromType(program?.programType);
  if (byType) return t(byType);

  return String(program?.name || '').trim() || t('washes.title');
};

export const localizeWashProgramDescription = (program: any, t: TranslateFn): string => {
  const byDescription = getDescriptionKeyFromText(program?.description);
  if (byDescription) return t(byDescription);

  const byName = getNameKeyFromText(program?.name);
  if (byName === 'programs.names.highPressureWash') return t('programs.descriptions.highPressureWash');
  if (byName === 'programs.names.touchlessWash') return t('programs.descriptions.touchlessWash');
  if (byName === 'programs.names.waterlessMobileWash') return t('programs.descriptions.waterlessWash');
  if (byName === 'programs.names.premiumWash') return t('programs.descriptions.premiumWash');
  if (byName === 'programs.names.basicWash') return t('programs.descriptions.basicWash');

  const byType = getNameKeyFromType(program?.programType);
  if (byType === 'programs.names.waterlessMobileWash') return t('programs.descriptions.waterlessWash');
  if (byType === 'programs.names.touchlessWash') return t('programs.descriptions.touchlessWash');
  if (byType === 'programs.names.highPressureWash') return t('programs.descriptions.highPressureWash');

  return String(program?.description || '').trim();
};

export const localizeProgramNameFromText = (programName: unknown, t: TranslateFn): string => {
  const key = getNameKeyFromText(programName);
  if (key) return t(key);

  const raw = String(programName || '').trim();
  return raw || '-';
};
