import { ONE_MINUTE } from "@/constants/time";

import { chart } from "@/api/services/chart/chart";
import { ChartResponse, ChartPlatforms } from "@/types/chart";
import { useQuery } from "@tanstack/react-query";

export const useAllChart = () =>
  useQuery<ChartResponse>({
    queryKey: ["charts", "all"],
    queryFn: chart.getAll,
    staleTime: 10 * ONE_MINUTE,
    retry: 1,
  });

export const useTodayChart = () =>
  useQuery<ChartResponse>({
    queryKey: ["charts", "today"],
    queryFn: chart.getToday,
    staleTime: 5 * ONE_MINUTE,
    retry: 1,
  });

export const usePlatformChart = () =>
  useQuery<ChartPlatforms>({
    queryKey: ["charts", "platform"],
    queryFn: chart.getPlatform,
    staleTime: 5 * ONE_MINUTE,
    retry: 1,
  });
