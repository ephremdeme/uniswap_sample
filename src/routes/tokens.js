// generate a CRUD router for the tokens collection
import { Router } from "express";
import Token from "../models/tokens";
import { defaultUniswapClient } from "../uniswap";
import {
  createTokenValidator,
  updateTokenValidator,
} from "../validators/tokens.validator";

const tokenRoute = Router();

// get all tokens
tokenRoute.get("/", async (req, res) => {
  const tokens = await Token.find();
  res.json(tokens);
});

// get token by id
tokenRoute.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Id is required" });

  const token = await Token.findById(id);
  return res.json(token);
});

// create token
tokenRoute.post("/", async (req, res) => {
  const { address } = req.body;

  const { error } = createTokenValidator.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const token = await defaultUniswapClient.getToken(address);
  const { name, symbol, decimals } = token;

  const newToken = await Token.create({ name, symbol, address, decimals });
  return res.json({ token: newToken, message: "Token created successfully" });
});

// update token
tokenRoute.put("/:id", async (req, res) => {
  const { id } = req.params;

  const { address } = req.body;

  const { error } = updateTokenValidator.validate({ address, id });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const tokenFound = await Token.findById(id);

  if (!tokenFound) {
    return res.status(404).json({ message: "Token not found" });
  }

  const token = await defaultUniswapClient.getToken(address);
  const { name, symbol, decimals } = token;

  const updatedToken = await Token.findByIdAndUpdate(
    id,
    { name, symbol, address, decimals },
    { new: true }
  );

  return res.json({
    token: updatedToken,
    message: "Token updated successfully",
  });
});

// delete token
tokenRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Id is required" });
  const token = await Token.findByIdAndDelete(id);
  return res.json(token);
});

export default tokenRoute;
