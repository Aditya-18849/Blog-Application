import { Post } from './Post.jsx';

export function PostList({ posts = [] }) {
  if (posts.length === 0) return <p className="muted">No posts yet. Create the first one!</p>;
  return (
    <div className="list">
      {posts.map((post) => (
        <Post key={post._id} {...post} />
      ))}
    </div>
  );
}
