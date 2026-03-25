import express from "express";

const app = express();

app.get("/admin/health", (_request, response) => {
  response.json({ status: "ok" });
});

export default app;
