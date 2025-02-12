import { axiosInstance } from "@/api/instance";

interface PostSummaryResponse {
  message: string;
  data: {
    id: number;
    summary: string;
  };
}

export const postDescription = {
  getSummary: async (feedId: number): Promise<string | null> => {
    try {
      const response = await axiosInstance.get<PostSummaryResponse>(`/api/feed/ai/summary`, {
        params: {
          feedId,
        },
      });

      const summary = response.data.data.summary;

      if (summary === "FAILED" || summary === "") {
        return null;
      }

      return summary;
    } catch (error) {
      console.error("Failed to fetch post summary:", error);
      return null;
    }
  },
};
