const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Post = require('../src/models/Post');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Post.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const samplePost = {
  title: 'Learning Docker',
  author: 'Student',
  contents: 'Containers make deployment reproducible.',
  tags: ['docker', 'devops'],
};

describe('Health check', () => {
  test('GET /api/v1/health reports a connected database', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });
});

describe('Posts API', () => {
  test('POST /api/v1/posts creates a post', async () => {
    const res = await request(app).post('/api/v1/posts').send(samplePost);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(samplePost);
    expect(res.body._id).toBeDefined();
  });

  test('POST /api/v1/posts rejects a post without a title', async () => {
    const res = await request(app).post('/api/v1/posts').send({ author: 'x', contents: 'y' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Title is required/);
  });

  test('GET /api/v1/posts lists posts newest first', async () => {
    await Post.create({ ...samplePost, title: 'First' });
    await new Promise((r) => setTimeout(r, 10));
    await Post.create({ ...samplePost, title: 'Second' });
    const res = await request(app).get('/api/v1/posts');
    expect(res.status).toBe(200);
    expect(res.body.map((p) => p.title)).toEqual(['Second', 'First']);
  });

  test('GET /api/v1/posts filters by author and tag', async () => {
    await Post.create(samplePost);
    await Post.create({ ...samplePost, author: 'Other', tags: ['react'] });
    const byAuthor = await request(app).get('/api/v1/posts?author=Other');
    expect(byAuthor.body).toHaveLength(1);
    const byTag = await request(app).get('/api/v1/posts?tag=docker');
    expect(byTag.body).toHaveLength(1);
    expect(byTag.body[0].author).toBe('Student');
  });

  test('GET /api/v1/posts/:id returns a single post', async () => {
    const post = await Post.create(samplePost);
    const res = await request(app).get(`/api/v1/posts/${post._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(samplePost.title);
  });

  test('GET /api/v1/posts/:id returns 404 for a missing post', async () => {
    const res = await request(app).get(`/api/v1/posts/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  test('GET /api/v1/posts/:id returns 400 for an invalid id', async () => {
    const res = await request(app).get('/api/v1/posts/not-an-id');
    expect(res.status).toBe(400);
  });

  test('PATCH /api/v1/posts/:id updates a post', async () => {
    const post = await Post.create(samplePost);
    const res = await request(app)
      .patch(`/api/v1/posts/${post._id}`)
      .send({ title: 'Updated title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
    expect(res.body.author).toBe(samplePost.author);
  });

  test('DELETE /api/v1/posts/:id deletes a post', async () => {
    const post = await Post.create(samplePost);
    const res = await request(app).delete(`/api/v1/posts/${post._id}`);
    expect(res.status).toBe(204);
    expect(await Post.countDocuments()).toBe(0);
  });
});
