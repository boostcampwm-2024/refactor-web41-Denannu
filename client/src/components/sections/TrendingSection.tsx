import { TrendingUp } from "lucide-react";

import { PostGridSkeleton } from "@/components/common/Card/PostCardSkeleton.tsx";
import { SectionHeader } from "@/components/common/SectionHeader";
import AnimatedPostGrid from "@/components/sections/AnimatedPostGrid";

import { useTrendingPosts } from "@/hooks/queries/useTrendingPosts";

export default function TrendingSection() {
  const { posts, isLoading } = useTrendingPosts();

  return (
    <section className="flex flex-col p-4 min-h-[300px]">
      <SectionHeader
        icon={TrendingUp}
        text="트렌딩 포스트"
        description="오늘 가장 인기있는 포스트"
        iconColor="text-red-500"
      />
      <div
        className="flex-1 mt-4 p-6 bg-white rounded-2xl transition-all duration-300"
        style={{ boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)" }}
      >
        {isLoading || !posts.length ? <PostGridSkeleton count={4} /> : <AnimatedPostGrid posts={posts} />}
      </div>
    </section>
  );
}
