import { WorkoutApp } from '@/components/workouts/workout-app';
import { getWorkoutPageData } from '@/lib/workouts/queries';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const workoutPageData = await getWorkoutPageData();

  return <WorkoutApp {...workoutPageData} />;
}
