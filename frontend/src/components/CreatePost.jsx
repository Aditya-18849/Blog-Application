import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../api/posts.js';

export function CreatePost() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [contents, setContents] = useState('');
  const [tags, setTags] = useState('');
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: () =>
      createPost({
        title,
        author,
        contents,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setTitle('');
      setContents('');
      setTags('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPostMutation.mutate();
  };

  return (
    <form className="card create" onSubmit={handleSubmit}>
      <h2>Create a post</h2>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Author
        <input value={author} onChange={(e) => setAuthor(e.target.value)} required />
      </label>
      <label>
        Contents
        <textarea rows={4} value={contents} onChange={(e) => setContents(e.target.value)} required />
      </label>
      <label>
        Tags (comma separated)
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="docker, react" />
      </label>
      <button type="submit" disabled={createPostMutation.isPending}>
        {createPostMutation.isPending ? 'Creating…' : 'Create'}
      </button>
      {createPostMutation.isSuccess && <p className="ok">Post created successfully!</p>}
      {createPostMutation.isError && (
        <p className="error">Error: {createPostMutation.error.message}</p>
      )}
    </form>
  );
}
