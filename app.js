import express from "express";
// import dotenv from "dotenv";
import { protectedRoute } from "./middlewares/protected-route.js";
import { router as kidRouter } from "./kids/urls.js";
import errorHandler from "./middlewares/error-handler.js";

// dotenv.config();

const app = express();

app.use(express.json());

app.use(protectedRoute);

app.use('/api/kids', kidRouter);

app.use(errorHandler);

// Bearer ....
// app.listen(process.env.LISTEN_PORT, () => console.log(`Listening at port ${process.env.LISTEN_PORT}`));

export default app;