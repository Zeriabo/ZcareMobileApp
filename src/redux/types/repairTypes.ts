/**
 * Repair service types and interfaces
 */

export interface InspectionData {
  registrationNumber: string;
  lastInspectionDate: string;
  nextInspectionDate?: string;
  daysUntilDue?: number;
  dueWithinThreshold?: boolean;
  message: string;
}

export interface RepairBooking {
  id?: number;
  vehicleRegistrationNumber: string;
  repairShopId: string;
  scheduledDate: string;
  status: RepairBookingStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export enum RepairBookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface RepairState {
  bookings: RepairBooking[];
  selectedBooking: RepairBooking | null;
  loading: boolean;
  error: string | null;
  inspectionData: Map<string, InspectionData>;
}

export interface CreateRepairBookingRequest {
  vehicleRegistrationNumber: string;
  repairShopId: string;
  scheduledDate: string;
  description?: string;
}

export const REPAIR_ACTION_TYPES = {
  // Bookings
  SET_REPAIR_BOOKINGS: 'SET_REPAIR_BOOKINGS',
  SET_SELECTED_REPAIR_BOOKING: 'SET_SELECTED_REPAIR_BOOKING',
  ADD_REPAIR_BOOKING: 'ADD_REPAIR_BOOKING',
  UPDATE_REPAIR_BOOKING: 'UPDATE_REPAIR_BOOKING',
  DELETE_REPAIR_BOOKING: 'DELETE_REPAIR_BOOKING',
  
  // Inspection
  SET_INSPECTION_DATA: 'SET_INSPECTION_DATA',
  SET_INSPECTION_DATA_FOR_PLATE: 'SET_INSPECTION_DATA_FOR_PLATE',
  
  // Loading & Error
  SET_REPAIR_LOADING: 'SET_REPAIR_LOADING',
  SET_REPAIR_ERROR: 'SET_REPAIR_ERROR',
  CLEAR_REPAIR_ERROR: 'CLEAR_REPAIR_ERROR',
};
