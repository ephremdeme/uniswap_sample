/* eslint-disable import/no-extraneous-dependencies */
import express from "express";
import cors from "cors";
import { DEMO_PASSWORD, DEMO_USERNAME } from "./libs/constants";
import connectDb from "./config/db";
import generateJwtToken from "./util/generateJWTToken";
import route from "./routes/uniswap";
import authenticate from "./middleware/authentication";
import accountRoute from "./routes/accounts";
import tokenRoute from "./routes/tokens";

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 5005;

app.use("/api/uniswap", authenticate(), route);
app.use("/api/accounts", authenticate(), accountRoute);
app.use("/api/tokens", authenticate(), tokenRoute);

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    const token = generateJwtToken({ username, id: Date.now() });
    return res.json({ token });
  }
  return res.status(401).json({ message: "Invalid username or password" });
});

// handle 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

connectDb();
