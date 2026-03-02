/**
 * Custom hooks for repair operations
 */

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import {
  fetchRepairBookings,
  fetchInspectionStatus,
  createRepairBooking,
  updateRepairBookingStatus,
  cancelRepairBooking,
} from '../redux/actions/repairActions';

/**
 * Hook for accessing repair bookings state and actions
 */
export const useRepairBookings = () => {
  const dispatch = useDispatch<any>();
  const bookings = useSelector((state: RootState) => (state as any).repair?.bookings ?? []);
  const selectedBooking = useSelector((state: RootState) => (state as any).repair?.selectedBooking ?? null);
  const loading = useSelector((state: RootState) => (state as any).repair?.loading ?? false);
  const error = useSelector((state: RootState) => (state as any).repair?.error ?? null);

  return {
    bookings,
    selectedBooking,
    loading,
    error,
    fetchBookings: () => dispatch(fetchRepairBookings() as any),
  };
};

/**
 * Hook for accessing inspection data
 */
export const useInspectionData = (registrationPlate: string) => {
  const dispatch = useDispatch<any>();
  const inspectionData = useSelector(
    (state: RootState) => (state as any).repair?.inspectionData ?? new Map()
  );
  const loading = useSelector((state: RootState) => (state as any).repair?.loading ?? false);

  const data = inspectionData.get(registrationPlate);

  const fetchInspection = () => {
    if (registrationPlate) {
      dispatch(fetchInspectionStatus(registrationPlate) as any);
    }
  };

  return {
    inspection: data,
    loading,
    fetchInspection,
    isOverdue: data?.dueWithinThreshold,
    daysUntilDue: data?.daysUntilDue,
    message: data?.message,
  };
};

/**
 * Hook for creating and managing repair bookings
 */
export const useRepairBookingActions = () => {
  const dispatch = useDispatch<any>();
  const loading = useSelector((state: RootState) => (state as any).repair?.loading ?? false);
  const error = useSelector((state: RootState) => (state as any).repair?.error ?? null);

  return {
    loading,
    error,
    createBooking: (data: any) => dispatch(createRepairBooking(data) as any),
    updateStatus: (bookingId: string | number, status: string) =>
      dispatch(updateRepairBookingStatus(bookingId, status) as any),
    cancelBooking: (bookingId: string | number) =>
      dispatch(cancelRepairBooking(bookingId) as any),
  };
};
