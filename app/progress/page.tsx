import { getProgressOverviewPageData } from "@/lib/workouts/queries"
import { ProgressOverviewPage } from "@/components/workouts/progress-overview-page"

export const dynamic = "force-dynamic"

export default async function ProgressOverviewRoute() {
  const progressOverviewPageData = await getProgressOverviewPageData()

  return <ProgressOverviewPage {...progressOverviewPageData} />
}
