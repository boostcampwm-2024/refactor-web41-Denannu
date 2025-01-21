import { create } from "zustand";

import { FilterType, CursorData } from "@/types/search";

interface SearchState {
  currentFilter: FilterType;
  searchParam: string;
  page: number;
  preData: CursorData["preData"] | null;
  nextIndex: CursorData["nextIndex"] | null;
  setFilter: (filter: FilterType) => void;
  setSearchParam: (param: string) => void;
  setPage: (page: number) => void;
  setCursor: (cursor: CursorData | null) => void;
  resetPage: () => void;
  resetParam: () => void;
  resetFilter: () => void;
}

interface AdminSearchType {
  searchParam: string;
  setSearchParam: (param: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  currentFilter: "title",
  searchParam: "",
  page: 1,
  preData: null,
  nextIndex: null,
  setFilter: (currentFilter) => set({ currentFilter }),
  setSearchParam: (param) =>
    set({
      searchParam: param,
      preData: null,
      nextIndex: null,
      page: 1,
    }),
  setPage: (page) => set({ page }),
  setCursor: (cursor) =>
    set({
      preData: cursor?.preData || null,
      nextIndex: cursor?.nextIndex || null,
    }),
  resetPage: () => set({ page: 1 }),
  resetParam: () => set({ searchParam: "" }),
  resetFilter: () => set({ currentFilter: "title" }),
}));

export const useAdminSearchStore = create<AdminSearchType>((set) => ({
  searchParam: "",
  setSearchParam: (param) => set({ searchParam: param }),
}));
