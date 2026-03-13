jest.mock('@/lib/prisma', () => ({
  prisma: {
    workoutSession: {
      findMany: jest.fn()
    },
    routine: {
      findMany: jest.fn()
    },
    exerciseSetLog: {
      findMany: jest.fn()
    }
  }
}));

import { prisma } from '@/lib/prisma';
import { getAttendanceMonth } from '@/lib/workouts/queries';

describe('getAttendanceMonth', () => {
  it('returns unique session days for the current month', async () => {
    const mockedFindMany = jest.mocked(prisma.workoutSession.findMany);
    mockedFindMany.mockResolvedValue([
      { performedAt: new Date('2026-03-03T08:00:00.000Z') },
      { performedAt: new Date('2026-03-03T18:00:00.000Z') },
      { performedAt: new Date('2026-03-07T08:00:00.000Z') }
    ] as never);

    const result = await getAttendanceMonth(new Date('2026-03-12T10:00:00.000Z'));

    expect(result).toEqual({
      year: 2026,
      month: 3,
      daysWithSessions: [3, 7]
    });
  });
});
