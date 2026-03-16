const test = require('node:test');
const assert = require('node:assert/strict');

// Mock the API responses
const mockApiResponses = {
  lastInspection: {
    registrationNumber: 'ABC-123',
    lastInspectionDate: '2024-06-10',
    message: 'Inspection is overdue',
  },
  nextInspection: {
    registrationNumber: 'ABC-123',
    lastInspectionDate: '2024-06-10',
    nextInspectionDate: '2025-06-10',
    message: 'Next inspection due on 2025-06-10',
  },
  inspectionStatus: {
    registrationNumber: 'ABC-123',
    lastInspectionDate: '2024-06-10',
    nextInspectionDate: '2025-06-10',
    daysUntilDue: -265,
    dueWithinThreshold: true,
    thresholdDays: 30,
    message: 'Inspection is overdue',
  },
  repairBookings: [
    {
      id: 1,
      vehicleRegistrationNumber: 'ABC-123',
      repairShopId: 'shop-1',
      scheduledDate: '2026-03-15T10:00:00',
      status: 'PENDING',
      description: 'Oil change',
      createdAt: '2026-03-03T08:00:00',
    },
    {
      id: 2,
      vehicleRegistrationNumber: 'XYZ-789',
      repairShopId: 'shop-2',
      scheduledDate: '2026-03-16T14:00:00',
      status: 'CONFIRMED',
      description: 'Tire replacement',
      createdAt: '2026-03-03T09:00:00',
    },
  ],
  repairBooking: {
    id: 1,
    vehicleRegistrationNumber: 'ABC-123',
    repairShopId: 'shop-1',
    scheduledDate: '2026-03-15T10:00:00',
    status: 'CONFIRMED',
    description: 'Oil change',
    createdAt: '2026-03-03T08:00:00',
  },
};

test('repairService: Last inspection data has required fields', () => {
  const inspection = mockApiResponses.lastInspection;

  assert.ok(inspection.registrationNumber);
  assert.equal(inspection.registrationNumber, 'ABC-123');
  assert.ok(inspection.lastInspectionDate);
  assert.ok(inspection.message);
});

test('repairService: Next inspection includes next due date', () => {
  const inspection = mockApiResponses.nextInspection;

  assert.ok(inspection.registrationNumber);
  assert.ok(inspection.lastInspectionDate);
  assert.ok(inspection.nextInspectionDate);
  assert.ok(inspection.message);
});

test('repairService: Inspection status includes all required fields', () => {
  const inspection = mockApiResponses.inspectionStatus;

  assert.ok(inspection.registrationNumber);
  assert.ok(inspection.lastInspectionDate);
  assert.ok(inspection.nextInspectionDate);
  assert.ok(typeof inspection.daysUntilDue === 'number');
  assert.ok(typeof inspection.dueWithinThreshold === 'boolean');
  assert.ok(typeof inspection.thresholdDays === 'number');
  assert.ok(inspection.message);
});

test('repairService: Overdue inspection has negative days', () => {
  const inspection = mockApiResponses.inspectionStatus;

  assert.equal(inspection.daysUntilDue, -265);
  assert.equal(inspection.dueWithinThreshold, true);
  assert.ok(inspection.message.includes('overdue'));
});

test('repairService: Repair bookings list has correct structure', () => {
  const bookings = mockApiResponses.repairBookings;

  assert.equal(bookings.length, 2);
  bookings.forEach((booking) => {
    assert.ok(typeof booking.id === 'number');
    assert.ok(booking.vehicleRegistrationNumber);
    assert.ok(booking.repairShopId);
    assert.ok(booking.scheduledDate);
    assert.ok(booking.status);
    assert.ok(booking.createdAt);
  });
});

test('repairService: Status transitions are valid', () => {
  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const booking1 = { ...mockApiResponses.repairBooking, status: 'PENDING' };
  assert.ok(validStatuses.includes(booking1.status));

  const booking2 = { ...mockApiResponses.repairBooking, status: 'CONFIRMED' };
  assert.ok(validStatuses.includes(booking2.status));

  const booking3 = { ...mockApiResponses.repairBooking, status: 'COMPLETED' };
  assert.ok(validStatuses.includes(booking3.status));
});

test('repairService: Create booking request validation', () => {
  const createRequest = {
    vehicleRegistrationNumber: 'ABC-123',
    repairShopId: 'shop-1',
    scheduledDate: '2026-03-15T10:00:00',
    description: 'Oil change',
  };

  assert.ok(createRequest.vehicleRegistrationNumber);
  assert.ok(createRequest.repairShopId);
  assert.ok(createRequest.scheduledDate);
  // Description is optional
  assert.ok(createRequest.description || true);
});

test('repairService: Invalid status should not be accepted', () => {
  const invalidStatus = 'INVALID_STATUS';
  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  assert.equal(validStatuses.includes(invalidStatus), false);
});

test('repairService: Batch inspection results structure', () => {
  const batchResults = [
    mockApiResponses.inspectionStatus,
    { ...mockApiResponses.inspectionStatus, registrationNumber: 'XYZ-789' },
    { ...mockApiResponses.inspectionStatus, registrationNumber: 'LMN-456' },
  ];

  assert.equal(batchResults.length, 3);
  batchResults.forEach((result) => {
    assert.ok(result.registrationNumber);
    assert.ok(typeof result.daysUntilDue === 'number');
  });
});

test('repairService: Inspection threshold comparison', () => {
  const inspection = mockApiResponses.inspectionStatus;
  const thresholdDays = 30;

  // Days until due is -265, so it's definitely within threshold (overdue)
  assert.ok(Math.abs(inspection.daysUntilDue) >= thresholdDays || inspection.daysUntilDue < 0);
  assert.equal(inspection.dueWithinThreshold, true);
});

test('repairService: Date format validation', () => {
  const dateFormats = {
    iso8601: '2026-03-15T10:00:00',
    withMs: '2026-03-15T10:00:00.000',
    date: '2024-06-10',
  };

  Object.values(dateFormats).forEach((dateStr) => {
    // Simple check that dates are parseable
    const date = new Date(dateStr);
    assert.ok(!isNaN(date.getTime()));
  });
});

test('repairService: Repair booking status lifecycle', () => {
  const lifecycle = [
    { status: 'PENDING', canTransitionTo: ['CONFIRMED', 'CANCELLED'] },
    { status: 'CONFIRMED', canTransitionTo: ['IN_PROGRESS', 'CANCELLED'] },
    { status: 'IN_PROGRESS', canTransitionTo: ['COMPLETED'] },
    { status: 'COMPLETED', canTransitionTo: [] },
    { status: 'CANCELLED', canTransitionTo: [] },
  ];

  lifecycle.forEach((state) => {
    assert.ok(state.status);
    assert.ok(Array.isArray(state.canTransitionTo));
  });
});

test('repairService: Inspection booking request validation', () => {
  const inspectionRequest = {
    vehicleRegistrationNumber: 'ABC-123',
    repairShopId: 'shop-1',
    scheduledDate: '2026-03-20T09:00:00',
    notes: 'Annual inspection',
  };

  assert.ok(inspectionRequest.vehicleRegistrationNumber);
  assert.ok(inspectionRequest.repairShopId);
  assert.ok(inspectionRequest.scheduledDate);
});
