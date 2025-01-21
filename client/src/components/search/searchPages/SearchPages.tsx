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

import { useSearchStore } from "@/store/useSearchStore";
import { useQueryClient } from "@tanstack/react-query";

export default function SearchPages({ totalPages }: { totalPages: number }) {
  const { page, setPage, preData, nextIndex, searchParam, currentFilter } = useSearchStore();
  const queryClient = useQueryClient();
  const pageNumber = generatePage(page, totalPages);

  const handlePage = (mode: number | "prev" | "next") => {
    const cursor = {
      curPage: page,
      preData,
      nextIndex,
    };

    switch (mode) {
      case "prev":
        if (preData) {
          setPage(page - 1);
          queryClient.invalidateQueries({
            queryKey: ["getSearch", searchParam, currentFilter, page - 1, 10, { ...cursor, nextIndex: null }],
          });
        } else {
          setPage(page - 1);
          queryClient.invalidateQueries({
            queryKey: ["getSearch", searchParam, currentFilter, page - 1, 10],
          });
        }
        break;
      case "next":
        if (nextIndex) {
          setPage(page + 1);
          queryClient.invalidateQueries({
            queryKey: ["getSearch", searchParam, currentFilter, page + 1, 10, { ...cursor, preData: null }],
          });
        } else {
          setPage(page + 1);
          queryClient.invalidateQueries({
            queryKey: ["getSearch", searchParam, currentFilter, page + 1, 10],
          });
        }
        break;
      default:
        if (typeof mode === "number") {
          setPage(mode);
          queryClient.invalidateQueries({
            queryKey: ["getSearch", searchParam, currentFilter, mode, 10, cursor],
          });
        }
    }
  };

  return (
    <Pagination className="flex gap-4 absolute bottom-0">
      <PaginationPrevious onClick={() => handlePage("prev")} className="border-none min-w-[100px]" />

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

      <PaginationNext onClick={() => handlePage("next")} className="border-none min-w-[100px]" />
    </Pagination>
  );
}
