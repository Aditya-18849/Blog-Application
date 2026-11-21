import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPosts, getHealth } from './api/posts.js';
import { CreatePost } from './components/CreatePost.jsx';
import { PostFilter } from './components/PostFilter.jsx';
import { PostSorting } from './components/PostSorting.jsx';
import { PostList } from './components/PostList.jsx';

export default function App() {
  const [author, setAuthor] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('descending');

  const postsQuery = useQuery({
    queryKey: ['posts', { author, sortBy, sortOrder }],
    queryFn: () => getPosts({ author, sortBy, sortOrder }),
  });

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30000,
  });

  const apiStatus = healthQuery.isError
    ? 'offline'
    : healthQuery.data
      ? `online (db: ${healthQuery.data.database})`
      : 'checking…';

  return (
    <div className="container">
      <header>
        <h1>MERN Blog</h1>
        <span className={`status ${healthQuery.isError ? 'bad' : 'good'}`}>API: {apiStatus}</span>
      </header>

      <CreatePost />

      <section className="toolbar">
        <PostFilter field="author" value={author} onChange={setAuthor} />
        <PostSorting
          fields={['createdAt', 'updatedAt', 'title']}
          value={sortBy}
          onChange={setSortBy}
          orderValue={sortOrder}
          onOrderChange={setSortOrder}
        />
      </section>

      {postsQuery.isLoading && <p>Loading posts…</p>}
      {postsQuery.isError && <p className="error">Error: {postsQuery.error.message}</p>}
      {postsQuery.data && <PostList posts={postsQuery.data} />}
    </div>
  );
}
