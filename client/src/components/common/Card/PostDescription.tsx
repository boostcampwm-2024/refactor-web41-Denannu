import React, { useState, useRef, useCallback } from "react";

import { Loader2 } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { postDescription } from "@/api/services/postDescription";

interface PostDescriptionProps {
  postId: number;
  children: React.ReactNode;
}

const Spinner = () => {
  return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
};

export const PostDescription = ({ postId, children }: PostDescriptionProps) => {
  const [description, setDescription] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setIsLoading(true);

    if (hasRequested) {
      setIsLoading(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const summary = await postDescription.getSummary(postId);
      setDescription(summary);
      setIsLoading(false);
      setHasRequested(true);
    }, 1000);
  }, [postId, hasRequested]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!hasRequested) {
      setIsLoading(false);
    }
  }, [hasRequested]);

  const getTooltipContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 py-1">
          <Spinner />
          <p className="text-sm text-foreground">요약을 불러오는 중입니다...</p>
        </div>
      );
    }

    if (description === null && hasRequested) {
      return (
        <div className="py-1">
          <p className="text-sm text-muted-foreground">게시글 요약을 제공할 수 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="py-1">
        <p className="text-sm text-foreground leading-relaxed">{description}</p>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip open={isHovering}>
        <TooltipTrigger onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="w-full">
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] p-3 shadow-lg bg-background border-border" sideOffset={5}>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
