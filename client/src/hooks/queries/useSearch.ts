import { useState, useEffect } from "react";

import { ONE_MINUTE } from "@/constants/time";

import { debounce } from "@/utils/debounce";

import { getSearch } from "@/api/services/search";
import { useSearchStore } from "@/store/useSearchStore";
import { SearchRequest, SearchResponse } from "@/types/search";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useSearch = (params: SearchRequest) => {
  const { query, filter, page, pageSize, cursor } = params;
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

  useEffect(() => {
    if (debouncedQuery.length > 0) {
      gtag("event", "search", {
        event_category: "engagement",
        event_label: "search_query",
        search_term: debouncedQuery,
        filter_type: filter,
      });
    }
  }, [debouncedQuery, filter]);

  const { data, isLoading, error } = useQuery<SearchResponse, Error>({
    queryKey: ["getSearch", debouncedQuery, filter, page, pageSize, cursor ? JSON.stringify(cursor) : null],
    queryFn: async () => {
      const response = await getSearch({
        query: debouncedQuery,
        filter,
        page,
        pageSize,
        cursor,
      });
      return response;
    },
    staleTime: 5 * ONE_MINUTE,
    retry: 1,
    enabled: debouncedQuery.length > 0,
  });

  useEffect(() => {
    if (data?.data?.cursor) {
      setCursor(data.data.cursor);
    }
  }, [data, setCursor]);

  const refetchSearch = () => {
    const queryKey = ["getSearch", debouncedQuery, filter, page, pageSize];
    if (cursor) {
      queryKey.push(JSON.stringify(cursor));
    }
    queryClient.invalidateQueries({
      queryKey: queryKey,
      refetchType: "active",
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
