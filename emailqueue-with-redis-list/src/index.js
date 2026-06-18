import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const queueName = "queue:email";

app.get("/", (req, res) => {
  res.json({ message: "Email queue with Redis list is running." });
});

// Producer: push an email job onto the queue using LPUSH
app.post("/email/send", async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: "`to` and `body` are required." });
    }

    const job = {
      to,
      subject: subject || "No Subject",
      body,
      createdAt: new Date().toISOString(),
    };

    await redis.lpush(queueName, JSON.stringify(job));

    res.json({ message: "Job pushed to queue", job });
  } catch (error) {
    console.error("Failed to push job:", error);
    res.status(500).json({ error: "Failed to push job to queue" });
  }
});

// Consumer: pop an email job from the queue using RPOP
app.post("/email/process", async (req, res) => {
  try {
    const rawJob = await redis.rpop(queueName);

    if (!rawJob) {
      return res.json({ message: "No jobs in queue" });
    }

    const job = JSON.parse(rawJob);

    // Here we simulate sending the email.
    // In production, replace this with a real email service call.
    console.log("Processing email job:", job);

    res.json({ message: "Email sent", job });
  } catch (error) {
    console.error("Failed to process job:", error);
    res.status(500).json({ error: "Failed to process job" });
  }
});

// Queue length endpoint for visibility
app.get("/email/queue-length", async (req, res) => {
  try {
    const length = await redis.llen(queueName);
    res.json({ queueName, length });
  } catch (error) {
    console.error("Failed to get queue length:", error);
    res.status(500).json({ error: "Failed to get queue length" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Email queue service listening on port ${port}`);
});
