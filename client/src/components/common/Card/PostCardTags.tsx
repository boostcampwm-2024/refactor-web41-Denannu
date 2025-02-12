interface PostCardTagsProps {
  tags?: string[];
}

export const PostCardTags = ({ tags }: PostCardTagsProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {tags.map((tag) => (
        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
          {tag}
        </span>
      ))}
    </div>
  );
};
