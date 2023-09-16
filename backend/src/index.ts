import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { authorizationMiddleware } from "./middlewares/authorization/authorizationMiddleware";
import { getPasswords, postPasswords } from "./handlers/passwords";
import { checkAuth, sendAuthCode } from "./handlers/auth";
import { init } from "./init.js";

init();

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.post("/api/auth", sendAuthCode);

app.use(authorizationMiddleware);

app.get("/api/auth", checkAuth);
app.get("/api/passwords", getPasswords);
app.post("/api/passwords", postPasswords);

app.listen(60125);
