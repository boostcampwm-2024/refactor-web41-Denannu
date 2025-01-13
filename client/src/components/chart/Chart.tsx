import { lazy, Suspense } from "react";

import ChartSkeleton from "@/components/chart/ChartSkeleton";

import { useAllChart, useTodayChart, usePlatformChart } from "@/hooks/queries/useChart";

const BarChartItem = lazy(() => import("@/components/chart/BarChartItem"));
const PieChartItem = lazy(() => import("@/components/chart/PieChartItem"));

export default function Chart() {
  const { data: chartAll, isLoading: isAllLoading, error: allError } = useAllChart();
  const { data: chartToday, isLoading: isTodayLoading, error: todayError } = useTodayChart();
  const { data: chartPlatform, isLoading: isPlatformLoading, error: platformError } = usePlatformChart();

  if (isAllLoading || isTodayLoading || isPlatformLoading) return <ChartSkeleton />;
  if (allError || todayError || platformError) return <p>Error loading data</p>;

  return (
    <div className="p-8">
      <div className="flex">
        <Suspense fallback={<ChartSkeleton />}>
          <BarChartItem title="전체 조회수" description="전체 조회수 TOP5" data={chartAll?.data || []} color={true} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <BarChartItem
            title="오늘의 조회수"
            description="금일 조회수 TOP5"
            data={chartToday?.data || []}
            color={false}
          />
        </Suspense>
      </div>
      <div>
        <Suspense fallback={<ChartSkeleton />}>
          <PieChartItem data={chartPlatform?.data || []} title="플랫폼별 블로그 수" />
        </Suspense>
      </div>
    </div>
  );
}
