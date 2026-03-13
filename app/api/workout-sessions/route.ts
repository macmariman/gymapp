import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';
import { createWorkoutSession } from '@/lib/workouts/create-workout-session';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const session = await createWorkoutSession(payload);

    return NextResponse.json({
      id: session.id
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: 'Los datos de la sesión no son válidos.',
          issues: error.issues
        },
        { status: 400 }
      );
    }

    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'Failed to create workout session'
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'No se pudo guardar la sesión.'
      },
      { status: 400 }
    );
  }
}
