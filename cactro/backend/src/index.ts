import 'dotenv/config';
import express, { Request, Response, NextFunction } from "express";
import convertRouter from "./routes/convert";

const app = express();

app.use(express.json());

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use("/api/convert", convertRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
