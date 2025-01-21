import { useState, useEffect } from "react";

import { ONE_MINUTE } from "@/constants/time";

import { debounce } from "@/utils/debounce";

import { getSearch } from "@/api/services/search";
import { useSearchStore } from "@/store/useSearchStore";
import { SearchRequest, SearchResponse, CursorData } from "@/types/search";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

export const useSearch = ({ query, filter, page, pageSize, cursor }: SearchRequest & { cursor?: CursorData }) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const queryClient = useQueryClient();
  const { setCursor } = useSearchStore();

  useEffect(() => {
    const handler = debounce((newQuery: string) => {
      setDebouncedQuery(newQuery);
    }, 300);

    handler(query);

    return () => {
      if (handler.cancel) {
        handler.cancel();
      }
    };
  }, [query]);

  const queryOptions: UseQueryOptions<SearchResponse, Error> = {
    queryKey: ["getSearch", debouncedQuery, filter, page, pageSize, cursor],
    queryFn: () =>
      getSearch({
        query: debouncedQuery,
        filter,
        page,
        pageSize,
        cursor,
      }),
    staleTime: 5 * ONE_MINUTE,
    retry: 1,
    enabled: debouncedQuery.length > 0,
  };

  const { data, isLoading, error } = useQuery<SearchResponse, Error>(queryOptions);

  useEffect(() => {
    if (data?.data?.cursor) {
      setCursor(data.data.cursor);
    }
  }, [data, setCursor]);

  const refetchSearch = () => {
    queryClient.invalidateQueries({
      queryKey: ["getSearch", debouncedQuery, filter, page, pageSize],
    });
  };

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetchSearch,
  };
};
