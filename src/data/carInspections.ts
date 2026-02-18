export type InspectionInfo = {
  lastInspectionDate: string;
  result: 'PASSED' | 'WARNING' | 'FAILED';
};

export const carInspections: Record<string, InspectionInfo> = {
  Z123: { lastInspectionDate: '2025-12-10', result: 'PASSED' },
  A123: { lastInspectionDate: '2025-11-03', result: 'WARNING' },
};

export const getInspectionForPlate = (plate?: string): InspectionInfo | null => {
  if (!plate) return null;
  const normalized = plate.trim().toUpperCase();
  return carInspections[normalized] || null;
};
