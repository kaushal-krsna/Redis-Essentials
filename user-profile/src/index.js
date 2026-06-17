import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const PORT = process.env.PORT || 3000;

function jsonUserKey(id) {
    return `user:${id}:json`;
}

function hashUserKey(id) {
    return `user:${id}:hash`;
}

app.post("/users/:id/json", async (req, res) => {
    const key = jsonUserKey(req.params.id);
    await redis.set(key, JSON.stringify(req.body));
    res.json({ success: true, key });
});

app.get("/users/:id/json", async (req, res) => {
    const key = jsonUserKey(req.params.id);
    const raw = await redis.get(key);
    const user = raw ? JSON.parse(raw) : null;
    res.json({ user });
});

app.post("/users/:id/hash", async (req, res) => {
    const key = hashUserKey(req.params.id);
    await redis.hset(key, req.body);
    res.json({ success: true, key });
});

app.get("/users/:id/hash", async (req, res) => {
    const key = hashUserKey(req.params.id);
    const user = await redis.hgetall(key);
    res.json({ user });
});

app.get("/users/:id/hash/:field", async (req, res) => {
    const key = hashUserKey(req.params.id);
    const value = await redis.hget(key, req.params.field);
    res.json({ value });
});

app.delete("/users/:id/hash/:field", async (req, res) => {
    const key = hashUserKey(req.params.id);
    const deleted = await redis.hdel(key, req.params.field);
    res.json({ deleted: Boolean(deleted) });
});

app.get("/users/:id/hash/:field/exists", async (req, res) => {
    const key = hashUserKey(req.params.id);
    const exists = await redis.hexists(key, req.params.field);
    res.json({ exists: Boolean(exists) });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
