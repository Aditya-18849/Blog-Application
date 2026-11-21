import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePost } from '../api/posts.js';

export function Post({ _id, title, contents, author, tags = [], createdAt }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deletePost(_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  return (
    <article className="card">
      <h3>{title}</h3>
      <p className="contents">{contents}</p>
      <p className="meta">
        Written by <strong>{author}</strong>
        {createdAt && <> on {new Date(createdAt).toLocaleString()}</>}
      </p>
      {tags.length > 0 && (
        <p className="tags">
          {tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </p>
      )}
      <button
        className="danger"
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        Delete
      </button>
    </article>
  );
}
