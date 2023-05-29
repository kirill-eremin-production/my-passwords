import express from "express";

// Для NodeJS ECMAScript modules обязательно надо указывать расширение файлов
import { prepareStore } from "./store.js";

prepareStore();

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(60125);
