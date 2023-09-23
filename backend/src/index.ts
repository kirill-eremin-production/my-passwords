import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { init } from "./init.js";
import { sessionMiddleware } from "./middlewares/authorization/sessionMiddleware";
import { authorizationMiddleware } from "./middlewares/authorization/authorizationMiddleware";
import { getPasswords, postPasswords } from "./handlers/passwords";
import { validateSession } from "./handlers/auth";
import { generateAndSendCode } from "./handlers/code";

init();

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

/** Ручки, требующие наличия сессии */
app.use(sessionMiddleware);

app.post("/api/auth", validateSession);
app.post("/api/code", generateAndSendCode);

/** Ручки, требующие наличия валидной сессии (авторизации) */
app.use(authorizationMiddleware);

app.get("/api/passwords", getPasswords);
app.post("/api/passwords", postPasswords);

app.listen(60125);
