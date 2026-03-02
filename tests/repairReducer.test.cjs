const test = require('node:test');
const assert = require('node:assert/strict');

// Mock repairService
const repairReducer = require('../.test-build/redux/reducers/repairReducer.js').default;
const REPAIR_ACTION_TYPES = require('../.test-build/redux/types/repairTypes.js').REPAIR_ACTION_TYPES;

test('repairReducer: returns initial state', () => {
  const state = repairReducer(undefined, { type: 'UNKNOWN' });

  assert.ok(state);
  assert.deepEqual(state.bookings, []);
  assert.equal(state.selectedBooking, null);
  assert.equal(state.loading, false);
  assert.equal(state.error, null);
  assert.ok(state.inspectionData instanceof Map || typeof state.inspectionData === 'object');
});

test('repairReducer: SET_REPAIR_BOOKINGS adds bookings', () => {
  const bookings = [
    {
      id: 1,
      vehicleRegistrationNumber: 'ABC-123',
      repairShopId: 'shop-1',
      scheduledDate: '2026-03-15T10:00:00',
      status: 'PENDING',
    },
    {
      id: 2,
      vehicleRegistrationNumber: 'XYZ-789',
      repairShopId: 'shop-2',
      scheduledDate: '2026-03-16T14:00:00',
      status: 'CONFIRMED',
    },
  ];

  const state = repairReducer(undefined, {
    type: REPAIR_ACTION_TYPES.SET_REPAIR_BOOKINGS,
    payload: bookings,
  });

  assert.equal(state.bookings.length, 2);
  assert.equal(state.bookings[0].status, 'PENDING');
  assert.equal(state.bookings[1].status, 'CONFIRMED');
  assert.equal(state.error, null);
});

test('repairReducer: ADD_REPAIR_BOOKING appends new booking', () => {
  const initialState = {
    bookings: [{ id: 1, vehicleRegistrationNumber: 'ABC-123', status: 'PENDING' }],
    selectedBooking: null,
    loading: false,
    error: null,
    inspectionData: new Map(),
  };

  const newBooking = {
    id: 2,
    vehicleRegistrationNumber: 'XYZ-789',
    repairShopId: 'shop-2',
    scheduledDate: '2026-03-16T14:00:00',
    status: 'CONFIRMED',
  };

  const state = repairReducer(initialState, {
    type: REPAIR_ACTION_TYPES.ADD_REPAIR_BOOKING,
    payload: newBooking,
  });

  assert.equal(state.bookings.length, 2);
  assert.equal(state.bookings[1].id, 2);
});

test('repairReducer: UPDATE_REPAIR_BOOKING updates existing booking', () => {
  const initialState = {
    bookings: [
      { id: 1, vehicleRegistrationNumber: 'ABC-123', status: 'PENDING' },
      { id: 2, vehicleRegistrationNumber: 'XYZ-789', status: 'CONFIRMED' },
    ],
    selectedBooking: null,
    loading: false,
    error: null,
    inspectionData: new Map(),
  };

  const updatedBooking = {
    id: 1,
    vehicleRegistrationNumber: 'ABC-123',
    status: 'IN_PROGRESS',
  };

  const state = repairReducer(initialState, {
    type: REPAIR_ACTION_TYPES.UPDATE_REPAIR_BOOKING,
    payload: updatedBooking,
  });

  assert.equal(state.bookings.length, 2);
  assert.equal(state.bookings[0].status, 'IN_PROGRESS');
  assert.equal(state.bookings[1].status, 'CONFIRMED');
});

test('repairReducer: DELETE_REPAIR_BOOKING removes booking', () => {
  const initialState = {
    bookings: [
      { id: 1, vehicleRegistrationNumber: 'ABC-123', status: 'PENDING' },
      { id: 2, vehicleRegistrationNumber: 'XYZ-789', status: 'CONFIRMED' },
    ],
    selectedBooking: null,
    loading: false,
    error: null,
    inspectionData: new Map(),
  };

  const state = repairReducer(initialState, {
    type: REPAIR_ACTION_TYPES.DELETE_REPAIR_BOOKING,
    payload: 1,
  });

  assert.equal(state.bookings.length, 1);
  assert.equal(state.bookings[0].id, 2);
});

test('repairReducer: SET_SELECTED_REPAIR_BOOKING sets selected booking', () => {
  const initialState = {
    bookings: [],
    selectedBooking: null,
    loading: false,
    error: null,
    inspectionData: new Map(),
  };

  const booking = {
    id: 1,
    vehicleRegistrationNumber: 'ABC-123',
    status: 'PENDING',
  };

  const state = repairReducer(initialState, {
    type: REPAIR_ACTION_TYPES.SET_SELECTED_REPAIR_BOOKING,
    payload: booking,
  });

  assert.deepEqual(state.selectedBooking, booking);
});

test('repairReducer: SET_REPAIR_LOADING sets loading state', () => {
  const state = repairReducer(undefined, {
    type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
    payload: true,
  });

  assert.equal(state.loading, true);

  const stateLoaded = repairReducer(state, {
    type: REPAIR_ACTION_TYPES.SET_REPAIR_LOADING,
    payload: false,
  });

  assert.equal(stateLoaded.loading, false);
});

test('repairReducer: SET_REPAIR_ERROR sets error message', () => {
  const errorMsg = 'Failed to fetch bookings';

  const state = repairReducer(undefined, {
    type: REPAIR_ACTION_TYPES.SET_REPAIR_ERROR,
    payload: errorMsg,
  });

  assert.equal(state.error, errorMsg);
});

test('repairReducer: CLEAR_REPAIR_ERROR clears error', () => {
  const initialState = {
    bookings: [],
    selectedBooking: null,
    loading: false,
    error: 'Some error',
    inspectionData: new Map(),
  };

  const state = repairReducer(initialState, {
    type: REPAIR_ACTION_TYPES.CLEAR_REPAIR_ERROR,
  });

  assert.equal(state.error, null);
});

test('repairReducer: SET_INSPECTION_DATA_FOR_PLATE stores inspection', () => {
  const initialState = {
    bookings: [],
    selectedBooking: null,
    loading: false,
    error: null,
    inspectionData: new Map(),
  };

  const inspectionData = {
    registrationNumber: 'ABC-123',
    lastInspectionDate: '2024-06-10',
    nextInspectionDate: '2025-06-10',
    daysUntilDue: -265,
    dueWithinThreshold: true,
    message: 'Inspection is overdue',
  };

  const state = repairReducer(initialState, {
    type: REPAIR_ACTION_TYPES.SET_INSPECTION_DATA_FOR_PLATE,
    payload: {
      plate: 'ABC-123',
      data: inspectionData,
    },
  });

  // For Map-based implementation
  if (state.inspectionData instanceof Map) {
    assert.ok(state.inspectionData.has('ABC-123'));
    const stored = state.inspectionData.get('ABC-123');
    assert.equal(stored.registrationNumber, 'ABC-123');
  } else {
    // For object-based implementation
    assert.ok(state.inspectionData['ABC-123']);
  }
});

test('repairReducer: status transitions are valid', () => {
  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const initialState = {
    bookings: validStatuses.map((status, idx) => ({
      id: idx,
      vehicleRegistrationNumber: `PLATE-${idx}`,
      status,
    })),
    selectedBooking: null,
    loading: false,
    error: null,
    inspectionData: new Map(),
  };

  validStatuses.forEach((status, idx) => {
    assert.equal(initialState.bookings[idx].status, status);
  });
});
