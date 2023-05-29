import express from "express";

import { prepareStore } from "./store.js";

prepareStore();

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(60125);
