import express from "express";
import bodyParser from "body-parser";

import { getPasswords, postPasswords } from "./handlers/passwords/index.js";

// Для NodeJS ECMAScript modules обязательно надо указывать расширение файлов
import { prepareStore } from "./store.js";

prepareStore();

const app = express();
app.use(bodyParser.json());

app.get("/api/passwords", getPasswords);
app.post("/api/passwords", postPasswords);

app.listen(60125);
