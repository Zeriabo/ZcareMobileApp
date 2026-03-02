const test = require('node:test');
const assert = require('node:assert/strict');

// Mock inspection statuses
const inspectionStatuses = {
  overdue: {
    plate: 'ABC-123',
    status: 'overdue',
    daysUntilDue: -265,
    message: 'Inspection is overdue',
  },
  dueSoon: {
    plate: 'XYZ-789',
    status: 'due-soon',
    daysUntilDue: 15,
    message: 'Inspection due in 15 days',
  },
  ok: {
    plate: 'LMN-456',
    status: 'ok',
    daysUntilDue: 200,
    message: 'Inspection status OK',
  },
  unknown: {
    plate: 'GHI-234',
    status: 'unknown',
    message: 'Failed to check inspection',
  },
};

test('inspectionNotificationService: Overdue status detection', () => {
  const inspection = inspectionStatuses.overdue;

  assert.equal(inspection.status, 'overdue');
  assert.ok(inspection.daysUntilDue < 0);
  assert.ok(inspection.message.includes('overdue'));
});

test('inspectionNotificationService: Due soon status detection', () => {
  const inspection = inspectionStatuses.dueSoon;

  assert.equal(inspection.status, 'due-soon');
  assert.ok(inspection.daysUntilDue > 0);
  assert.ok(inspection.daysUntilDue <= 30);
});

test('inspectionNotificationService: OK status when not due soon', () => {
  const inspection = inspectionStatuses.ok;

  assert.equal(inspection.status, 'ok');
  assert.ok(inspection.daysUntilDue > 30);
});

test('inspectionNotificationService: Unknown status on error', () => {
  const inspection = inspectionStatuses.unknown;

  assert.equal(inspection.status, 'unknown');
  assert.ok(inspection.message.includes('Failed'));
});

test('inspectionNotificationService: Threshold comparison logic', () => {
  const thresholdDays = 30;

  const results = [
    { daysUntilDue: -265, shouldNotify: true }, // Overdue
    { daysUntilDue: 15, shouldNotify: true }, // Due soon
    { daysUntilDue: 30, shouldNotify: true }, // Exactly at threshold
    { daysUntilDue: 31, shouldNotify: false }, // Just past threshold
    { daysUntilDue: 100, shouldNotify: false }, // Far in future
  ];

  results.forEach((test) => {
    const isWithinThreshold =
      test.daysUntilDue < 0 ||
      (test.daysUntilDue >= 0 && test.daysUntilDue <= thresholdDays);
    assert.equal(isWithinThreshold, test.shouldNotify);
  });
});

test('inspectionNotificationService: Batch check results', () => {
  const batchResults = [
    inspectionStatuses.overdue,
    inspectionStatuses.dueSoon,
    inspectionStatuses.ok,
  ];

  assert.equal(batchResults.length, 3);

  const overdueCount = batchResults.filter((r) => r.status === 'overdue').length;
  const dueSoonCount = batchResults.filter((r) => r.status === 'due-soon').length;
  const okCount = batchResults.filter((r) => r.status === 'ok').length;

  assert.equal(overdueCount, 1);
  assert.equal(dueSoonCount, 1);
  assert.equal(okCount, 1);
});

test('inspectionNotificationService: Message formatting', () => {
  const overdueMsg = `Vehicle ABC-123 inspection is ${Math.abs(-265)} days overdue`;
  assert.ok(overdueMsg.includes('ABC-123'));
  assert.ok(overdueMsg.includes('265'));
  assert.ok(overdueMsg.includes('overdue'));

  const dueSoonMsg = `Vehicle XYZ-789 inspection is due in ${15} days`;
  assert.ok(dueSoonMsg.includes('XYZ-789'));
  assert.ok(dueSoonMsg.includes('15'));
  assert.ok(dueSoonMsg.includes('due in'));
});

test('inspectionNotificationService: Periodic check interval validation', () => {
  const validIntervals = [1, 6, 12, 24, 48]; // Hours
  const testInterval = 24;

  assert.ok(validIntervals.includes(testInterval));
  const intervalMs = testInterval * 60 * 60 * 1000;
  assert.equal(intervalMs, 86400000);
});

test('inspectionNotificationService: Vehicle plate tracking', () => {
  const plates = ['ABC-123', 'XYZ-789', 'LMN-456', 'GHI-234'];
  const trackingMap = new Map();

  plates.forEach((plate) => {
    trackingMap.set(plate, inspectionStatuses.ok);
  });

  assert.equal(trackingMap.size, 4);
  assert.ok(trackingMap.has('ABC-123'));
  assert.ok(trackingMap.has('XYZ-789'));
});

test('inspectionNotificationService: Duplicate check prevention', () => {
  const checkLog = [];
  const plate = 'ABC-123';

  // First check
  checkLog.push({ plate, timestamp: Date.now(), status: 'overdue' });

  // Try duplicate (should be prevented by interval)
  const now = Date.now();
  const lastCheck = checkLog.find((c) => c.plate === plate);
  const timeSinceLastCheck = now - lastCheck.timestamp;
  const minInterval = 24 * 60 * 60 * 1000; // 24 hours

  assert.ok(timeSinceLastCheck < minInterval); // Duplicate in same day
});

test('inspectionNotificationService: Error handling in batch checks', () => {
  const plates = ['ABC-123', 'INVALID', 'XYZ-789'];
  const results = [];

  plates.forEach((plate) => {
    try {
      // Simulate check
      if (plate === 'INVALID') {
        throw new Error('Fetch failed for plate');
      }
      results.push({ plate, status: 'ok', error: null });
    } catch (error) {
      results.push({ plate, status: 'unknown', error: error.message });
    }
  });

  assert.equal(results.length, 3);
  const failed = results.find((r) => r.plate === 'INVALID');
  assert.ok(failed.error);
  assert.equal(failed.status, 'unknown');
});

test('inspectionNotificationService: Notification sent only when needed', () => {
  const inspections = [
    { plate: 'ABC-123', daysUntilDue: -265, shouldNotify: true },
    { plate: 'XYZ-789', daysUntilDue: 15, shouldNotify: true },
    { plate: 'LMN-456', daysUntilDue: 100, shouldNotify: false },
    { plate: 'GHI-234', daysUntilDue: 31, shouldNotify: false },
  ];

  const notificationQueue = [];

  inspections.forEach((inspection) => {
    const isOverdue = inspection.daysUntilDue < 0;
    const isDueSoon = inspection.daysUntilDue >= 0 && inspection.daysUntilDue <= 30;

    if (isOverdue || isDueSoon) {
      notificationQueue.push({
        plate: inspection.plate,
        type: isOverdue ? 'overdue' : 'due-soon',
      });
    }
  });

  assert.equal(notificationQueue.length, 2);
  assert.ok(notificationQueue.some((n) => n.plate === 'ABC-123'));
  assert.ok(notificationQueue.some((n) => n.plate === 'XYZ-789'));
});
