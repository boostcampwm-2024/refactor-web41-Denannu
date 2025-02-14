export interface SearchResult {
  id: number;
  title: string;
  blogName: string;
  path: string;
  createdAt: string;
}

export interface CursorData {
  curPage: number;
  preIndex?: {
    feedId: number;
    createdAt: string;
  };
  nextIndex?: {
    feedId: number;
    createdAt: string;
  };
}

interface SearchData {
  totalCount: number;
  result: SearchResult[];
  totalPages: number;
  limit?: number;
  cursor?: CursorData;
}

export interface SearchResponse {
  data: SearchData;
  message: string;
}

export interface SearchRequest {
  query: string;
  filter: FilterType;
  page: number;
  pageSize: number;
  cursor?: CursorData;
}

export type FilterType = "title" | "blogName" | "all" | "tag";
