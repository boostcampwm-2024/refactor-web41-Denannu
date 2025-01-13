import { ONE_SECOND } from "@/constants/time";

import { admin } from "@/api/services/admin/rss";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useFetchData = (queryKey: string[], queryFn: () => Promise<any>) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    retry: 1,
    refetchInterval: 5 * ONE_SECOND,
  });

  const refetchData = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return { data, isLoading, error, refetchData };
};

export const useFetchRss = () => useFetchData(["rss", "list"], admin.getRss);
export const useFetchAccept = () => useFetchData(["rss", "accepted"], admin.getAccept);
export const useFetchReject = () => useFetchData(["rss", "rejected"], admin.getReject);
