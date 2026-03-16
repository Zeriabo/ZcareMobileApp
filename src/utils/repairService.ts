/**
 * Repair Service API Client
 * Handles all repair booking and vehicle inspection API calls
 */

import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiClient } from './apiClient';

/**
 * Types for repair services
 */
export interface VehicleInspection {
  registrationNumber: string;
  lastInspectionDate: string;
  message: string;
}

export interface InspectionStatus {
  registrationNumber: string;
  lastInspectionDate: string;
  nextInspectionDate: string;
  daysUntilDue: number;
  dueWithinThreshold: boolean;
  thresholdDays: number;
  message: string;
}

interface CarInspectionResponse {
  registrationPlate: string;
  inspection: InspectionStatus;
}

export interface InspectionCalculationRequest {
  registrationNumber?: string;
  vehicleClass?: string;
  firstRegistrationDate?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  thresholdDays?: number;
}

export interface RepairBooking {
  id?: number;
  vehicleRegistrationNumber: string;
  repairShopId: string;
  scheduledDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface CreateRepairBookingRequest {
  vehicleRegistrationNumber: string;
  repairShopId: string;
  scheduledDate: string;
  description?: string;
}

export interface CreateInspectionBookingRequest {
  vehicleRegistrationNumber: string;
  repairShopId: string;
  scheduledDate: string;
  notes?: string;
}

export interface UpdateRepairBookingStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

const normalizeToken = (token?: string): string => (token || '').trim().replace(/^Bearer\s+/i, '');

/**
 * Get last inspection date for a vehicle
 */
export const getLastInspection = async (registrationPlate: string): Promise<VehicleInspection> => {
  const endpoint = API_ENDPOINTS.VEHICLE_INSPECTION.LAST_INSPECTION(registrationPlate);
  return apiClient.get<VehicleInspection>(endpoint);
};

/**
 * Get next inspection due date for a vehicle
 */
export const getNextInspection = async (registrationPlate: string): Promise<VehicleInspection> => {
  const endpoint = API_ENDPOINTS.VEHICLE_INSPECTION.NEXT_INSPECTION(registrationPlate);
  return apiClient.get<VehicleInspection>(endpoint);
};

/**
 * Get complete inspection status for a vehicle with threshold
 */
export const getInspectionStatus = async (
  registrationPlate: string,
  thresholdDays: number = 30,
  token?: string
): Promise<InspectionStatus> => {
  const endpoint = API_ENDPOINTS.CARS.INSPECTION(registrationPlate);
  const rawToken = normalizeToken(token);
  const response = await apiClient.get<CarInspectionResponse>(endpoint, {
    params: { thresholdDays },
    headers: rawToken
      ? {
          Authorization: `Bearer ${rawToken}`,
        }
      : undefined,
  });
  return response.inspection;
};

export const setLastInspectionDate = async (
  registrationPlate: string,
  lastInspectionDate: string,
  token?: string
): Promise<InspectionStatus> => {
  const endpoint = API_ENDPOINTS.CARS.SET_LAST_INSPECTION(registrationPlate);
  const rawToken = normalizeToken(token);
  const headers = token
    ? {
        Authorization: `Bearer ${rawToken}`,
      }
    : undefined;

  const response = await apiClient.put<CarInspectionResponse>(
    endpoint,
    { lastInspectionDate },
    { headers }
  );

  return response.inspection;
};

/**
 * Calculate inspection status from manually provided vehicle details
 */
export const calculateInspectionStatus = async (
  payload: InspectionCalculationRequest,
  thresholdDays: number = 30
): Promise<InspectionStatus> => {
  const endpoint = API_ENDPOINTS.VEHICLE_INSPECTION.CALCULATE_INSPECTION;
  return apiClient.post<InspectionStatus>(`${endpoint}?thresholdDays=${thresholdDays}`, payload);
};

/**
 * List all repair bookings
 */
export const listRepairBookings = async (): Promise<RepairBooking[]> => {
  const endpoint = API_ENDPOINTS.REPAIR_BOOKINGS.LIST;
  return apiClient.get<RepairBooking[]>(endpoint);
};

/**
 * Get a specific repair booking
 */
export const getRepairBooking = async (bookingId: string | number): Promise<RepairBooking> => {
  const endpoint = API_ENDPOINTS.REPAIR_BOOKINGS.DETAIL(String(bookingId));
  return apiClient.get<RepairBooking>(endpoint);
};

/**
 * Create a new repair booking
 */
export const createRepairBooking = async (data: CreateRepairBookingRequest): Promise<RepairBooking> => {
  const endpoint = API_ENDPOINTS.REPAIR_BOOKINGS.CREATE;
  return apiClient.post<RepairBooking>(endpoint, data);
};

/**
 * Create a new inspection booking
 */
export const createInspectionBooking = async (data: CreateInspectionBookingRequest): Promise<RepairBooking> => {
  const endpoint = API_ENDPOINTS.REPAIR_BOOKINGS.INSPECTION;
  return apiClient.post<RepairBooking>(endpoint, data);
};

/**
 * Update repair booking status
 */
export const updateRepairBookingStatus = async (
  bookingId: string | number,
  status: string
): Promise<RepairBooking> => {
  const endpoint = API_ENDPOINTS.REPAIR_BOOKINGS.UPDATE_STATUS(String(bookingId));
  const data: UpdateRepairBookingStatusRequest = { status: status as any };
  return apiClient.patch<RepairBooking>(endpoint, data);
};

/**
 * Cancel a repair booking
 */
export const cancelRepairBooking = async (bookingId: string | number): Promise<RepairBooking> => {
  const endpoint = API_ENDPOINTS.REPAIR_BOOKINGS.DELETE(String(bookingId));
  return apiClient.delete<RepairBooking>(endpoint);
};

/**
 * Batch check inspection status for multiple vehicles
 */
export const checkMultipleInspections = async (
  plates: string[],
  thresholdDays: number = 30
): Promise<Map<string, InspectionStatus>> => {
  const results = new Map<string, InspectionStatus>();
  
  const promises = plates.map(async (plate) => {
    try {
      const status = await getInspectionStatus(plate, thresholdDays);
      results.set(plate, status);
    } catch (error: any) {
      console.warn(`Failed to fetch inspection for plate ${plate}:`, error.message);
    }
  });

  await Promise.all(promises);
  return results;
};
