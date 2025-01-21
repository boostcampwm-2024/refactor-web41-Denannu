import { Loader } from "lucide-react";

import { CommandList, CommandEmpty, CommandGroup } from "@/components/ui/command";

import { useSearch } from "@/hooks/queries/useSearch";

import SearchPages from "../searchPages/SearchPages";
import SearchResultItem from "./SearchResultItem";
import { useSearchStore } from "@/store/useSearchStore";
import { SearchResponse, SearchResult } from "@/types/search";

const RESULT_PER_PAGE = 5;
const COMMANDCLASS = "flex h-[28rem] justify-center items-center";

export default function SearchResults() {
  const { searchParam, currentFilter, page } = useSearchStore();
  const { data, isLoading, isError } = useSearch({
    query: searchParam,
    filter: currentFilter,
    page,
    pageSize: RESULT_PER_PAGE,
  });

  const responseData = data as SearchResponse | undefined;
  const totalItems = responseData?.data?.totalCount ?? 0;
  const totalPages = responseData?.data?.totalPages ?? 0;
  const results = responseData?.data?.result ?? [];

  const renderContent = {
    noQuery: <CommandEmpty className={COMMANDCLASS}>검색어를 입력해주세요</CommandEmpty>,
    loading: (
      <CommandEmpty className={COMMANDCLASS}>
        <Loader data-testid="loader-icon" />
      </CommandEmpty>
    ),
    searchEmpty: <CommandEmpty className={COMMANDCLASS}>검색결과가 없습니다</CommandEmpty>,
    error: <div className={COMMANDCLASS}>에러발생</div>,
    default: (
      <CommandGroup
        heading={`검색결과 (총 ${totalItems}건)`}
        className="h-[28rem] relative"
        data-testid="command-group-heading"
      >
        <CommandList className="">
          {results.map((result: SearchResult, index: number) => (
            <SearchResultItem key={result.id ?? index} {...result} />
          ))}
        </CommandList>
        <SearchPages totalPages={totalPages} />
      </CommandGroup>
    ),
  };

  const getRenderKey = () => {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (searchParam.length === 0) return "noQuery";
    if (results.length === 0) return "searchEmpty";
    return "default";
  };

  return renderContent[getRenderKey()];
}
