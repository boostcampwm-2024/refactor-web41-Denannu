import { Card } from "@/components/ui/card";

import { usePostCardActions } from "@/hooks/common/usePostCardActions";

import { PostCardContent } from "./PostCardContent";
import { PostCardImage } from "./PostCardImage";
import { PostDescription } from "./PostDescription";
import { cn } from "@/lib/utils";
import { Post } from "@/types/post";

interface PostCardProps {
  post: Post;
  className?: string;
}

export const PostCard = ({ post, className }: PostCardProps) => {
  const { handlePostClick } = usePostCardActions(post);

  return (
    <PostDescription postId={post.id}>
      <Card
        onClick={handlePostClick}
        className={cn(
          "h-[240px] group shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border-none rounded-xl cursor-pointer",
          className
        )}
      >
        <PostCardImage thumbnail={post.thumbnail} alt={post.title} />
        <PostCardContent post={post} />
      </Card>
    </PostDescription>
  );
};
