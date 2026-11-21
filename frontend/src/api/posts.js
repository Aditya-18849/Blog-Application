// All requests go to a relative /api/v1 path. The dev server (Vite) and the
// production web server (nginx) both proxy /api to the Express backend, so the
// same build works locally, in Docker Compose and on Google Cloud Run.
const API_BASE = import.meta.env.VITE_BACKEND_URL || '/api/v1';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export async function getPosts(queryParams = {}) {
  const params = new URLSearchParams(
    Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== ''),
  );
  const res = await fetch(`${API_BASE}/posts?${params}`);
  return handle(res);
}

export async function createPost(post) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  });
  return handle(res);
}

export async function deletePost(id) {
  const res = await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
  return handle(res);
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handle(res);
}
