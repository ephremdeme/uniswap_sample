/* eslint-disable import/no-extraneous-dependencies */
import express from "express";
import cors from "cors";
import { DEMO_PASSWORD, DEMO_USERNAME } from "./libs/constants";
import connectDb from "./config/db";
import generateJwtToken from "./util/generateJWTToken";
import route from "./uniswap/routes";
import authenticate from "./middleware/authentication";

const app = express();

app.use(express.json());
app.use(cors());
connectDb();

const PORT = 5005;

app.use("/api", authenticate(), route);

app.post("/login", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;

  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    const token = generateJwtToken({ username, id: Date.now() });
    return res.json({ token });
  }
  return res.status(401).json({ message: "Invalid username or password" });
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
