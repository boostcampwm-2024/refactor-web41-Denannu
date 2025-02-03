import { usePostViewIncrement } from "@/hooks/queries/usePostViewIncrement";

import { pipe } from "@/utils/pipe";

import { Post } from "@/types/post";

interface PostWithState {
  post: Post;
  isWindowOpened?: boolean;
}

export const usePostCardActions = (post: Post) => {
  const { mutate } = usePostViewIncrement(post.id);

  const openPost = ({ post }: Pick<PostWithState, "post">): PostWithState => {
    gtag("event", "post_click", {
      event_category: "content",
      event_label: "post_open",
      post_id: post.id,
      post_title: post.title,
      post_url: post.path,
    });

    const link = document.createElement("a");
    link.href = post.path;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
    return { post, isWindowOpened: true };
  };

  const incrementView = ({ post, isWindowOpened }: PostWithState): PostWithState => {
    if (isWindowOpened) {
      gtag("event", "post_view", {
        event_category: "engagement",
        event_label: "view_increment",
        post_id: post.id,
      });

      mutate(undefined, {
        onError: (error) => {
          console.error("조회수 증가 실패", error);
        },
      });
    }
    return { post, isWindowOpened };
  };

  const handlePostClick = () => {
    if (!post.path) return;
    pipe(openPost, incrementView)({ post });
  };

  return { handlePostClick };
};
