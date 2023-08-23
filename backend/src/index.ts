import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { authorizationMiddleware } from "./middlewares/authorization.js";
import { getPasswords, postPasswords } from "./handlers/passwords/index.js";
import { checkAuth, sendAuthCode } from "./handlers/auth/index.js";

// Для NodeJS ECMAScript modules обязательно надо указывать расширение файлов
import { prepareStore } from "./store.js";
import { prepareSessionsStore } from "./sessionsStore.js";

prepareStore();
prepareSessionsStore();

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.post("/api/auth", sendAuthCode);

app.use(authorizationMiddleware);

app.get("/api/auth", checkAuth);
app.get("/api/passwords", getPasswords);
app.post("/api/passwords", postPasswords);

app.listen(60125);
