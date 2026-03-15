import { notFound } from "next/navigation"

import { getExerciseProgressPageData } from "@/lib/workouts/queries"
import { ExerciseProgressPage } from "@/components/workouts/exercise-progress-page"

export const dynamic = "force-dynamic"

export default async function ExerciseProgressRoute({
  params,
  searchParams,
}: {
  params: Promise<{ movementId: string }>
  searchParams: Promise<{ routineId?: string; slotId?: string }>
}) {
  const { movementId } = await params
  const { routineId, slotId } = await searchParams
  const progressPageData = await getExerciseProgressPageData(movementId)

  if (!progressPageData) {
    notFound()
  }

  return (
    <ExerciseProgressPage
      {...progressPageData}
      backHref={
        routineId
          ? `/?routineId=${encodeURIComponent(routineId)}${
              slotId ? `&slotId=${encodeURIComponent(slotId)}` : ""
            }`
          : "/"
      }
    />
  )
}
