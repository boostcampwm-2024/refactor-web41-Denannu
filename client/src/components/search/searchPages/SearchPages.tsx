import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import generatePage from "@/utils/pagination";

import { getSearch } from "@/api/services/search";
import { useSearchStore } from "@/store/useSearchStore";
import { useQueryClient } from "@tanstack/react-query";

export default function SearchPages({ totalPages }: { totalPages: number }) {
  const { page, setPage, preIndex, nextIndex, searchParam, currentFilter } = useSearchStore();
  const queryClient = useQueryClient();
  const pageNumber = generatePage(page, totalPages);

  const handlePage = (mode: number | "prev" | "next") => {
    switch (mode) {
      case "prev":
        if (preIndex) {
          const cursor = {
            curPage: page,
            preIndex,
            nextIndex: undefined,
          };
          setPage(page - 1);
          queryClient.prefetchQuery({
            queryKey: ["getSearch", searchParam, currentFilter, page - 1, 10],
            queryFn: () =>
              getSearch({
                query: searchParam,
                filter: currentFilter,
                page: page - 1,
                pageSize: 5,
                cursor,
              }),
          });
        } else {
          setPage(page - 1);
        }
        break;
      case "next":
        if (nextIndex) {
          const cursor = {
            curPage: page,
            preIndex: undefined,
            nextIndex,
          };
          setPage(page + 1);
          queryClient.prefetchQuery({
            queryKey: ["getSearch", searchParam, currentFilter, page + 1, 10],
            queryFn: () =>
              getSearch({
                query: searchParam,
                filter: currentFilter,
                page: page + 1,
                pageSize: 5,
                cursor,
              }),
          });
        } else {
          setPage(page + 1);
        }
        break;
      default:
        if (typeof mode === "number") {
          const cursor =
            preIndex || nextIndex
              ? {
                  curPage: page,
                  preIndex,
                  nextIndex,
                }
              : undefined;
          setPage(mode);
          if (cursor) {
            queryClient.prefetchQuery({
              queryKey: ["getSearch", searchParam, currentFilter, mode, 10],
              queryFn: () =>
                getSearch({
                  query: searchParam,
                  filter: currentFilter,
                  page: mode,
                  pageSize: 5,
                  cursor,
                }),
            });
          }
        }
    }
  };

  return (
    <Pagination className="flex gap-4 absolute bottom-0">
      <PaginationPrevious
        onClick={() => handlePage("prev")}
        className={`border-none min-w-[100px] ${page === 1 ? "pointer-events-none opacity-0" : ""}`}
      />

      <PaginationContent>
        {page > 2 && <PaginationEllipsis />}
        {pageNumber.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink onClick={() => handlePage(number)} className={page === number ? "border" : ""}>
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < totalPages - 2 && <PaginationEllipsis />}
      </PaginationContent>

      <PaginationNext
        onClick={() => handlePage("next")}
        className={`border-none min-w-[100px] ${page === totalPages ? "pointer-events-none opacity-0" : ""}`}
      />
    </Pagination>
  );
}
