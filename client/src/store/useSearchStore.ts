import { create } from "zustand";

import { FilterType, CursorData } from "@/types/search";

interface SearchState {
  currentFilter: FilterType;
  searchParam: string;
  page: number;
  preIndex: CursorData["preIndex"];
  nextIndex: CursorData["nextIndex"];
  setFilter: (filter: FilterType) => void;
  setSearchParam: (param: string) => void;
  setPage: (page: number) => void;
  setCursor: (cursor: CursorData | undefined) => void;
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
  preIndex: undefined,
  nextIndex: undefined,
  setFilter: (currentFilter) => {
    set({ currentFilter });
  },
  setSearchParam: (param) => {
    set({
      searchParam: param,
      preIndex: undefined,
      nextIndex: undefined,
      page: 1,
    });
  },
  setPage: (page) => {
    set({ page });
  },
  setCursor: (cursor) => {
    if (!cursor) return;
    const newState = {
      preIndex: cursor.preIndex || undefined,
      nextIndex: cursor.nextIndex || undefined,
    };
    set(newState);
  },
  resetPage: () => set({ page: 1 }),
  resetParam: () => set({ searchParam: "", preIndex: undefined, nextIndex: undefined }),
  resetFilter: () => set({ currentFilter: "title" }),
}));

export const useAdminSearchStore = create<AdminSearchType>((set) => ({
  searchParam: "",
  setSearchParam: (param) => set({ searchParam: param }),
}));
