/* eslint-disable no-underscore-dangle */
import express from "express";
import mongoose from "mongoose";
import { Wallet } from "ethers";
import { INFURA_RPC_ADDRESS } from "../libs/constants";
import { decrypt, encrypt } from "../libs/encrypt";

import Account from "../models/accounts";
import Token from "../models/tokens";
import Uniswap from "../uniswap";
import { toReadableAmount } from "../libs/utils";
import { createAccountValidator } from "../validators/accounts.validator";

const accountRoute = express.Router();

accountRoute.get("/", async (req, res) => {
  const accounts = await Account.find({}, { privateKey: 0 });
  res.json(accounts);
});

// get account by id
accountRoute.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id is required" });

  const account = await Account.findById(id, { privateKey: 0 });

  if (!account) return res.status(404).json({ message: "Account not found" });

  return res.json(account);
});

accountRoute.post("/:id/tokens", async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;

  if (!id) return res.status(400).json({ message: "Id is required" });
  if (!token) return res.status(400).json({ message: "Token is required" });

  const tokenFound = await Token.findById(token);
  if (!tokenFound) return res.status(404).json({ message: "Token not found" });

  const account = await Account.findById(id);
  if (!account) return res.status(404).json({ message: "Account not found" });

  // check if token already exists
  const tokenExists = account.tokens.find((t) => t.toString() === token);
  if (tokenExists)
    return res.status(400).json({ message: "Token already exists" });

  account.tokens.push(token);

  await account.save();

  return res.json({ message: "Token added successfully" });
});

// get account by id
accountRoute.get("/:id/tokens", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id is required" });

  const account = await Account.findById(id).populate("tokens").lean();
  if (!account) return res.status(404).json({ message: "Account not found" });

  const uniswapClient = new Uniswap(
    INFURA_RPC_ADDRESS,
    decrypt(account.privateKey)
  );
  const tokens = await Promise.all(
    account.tokens.map(async (token) => {
      const [_token, tokenBalalance] = await uniswapClient.getTokenAndBalance(
        token.address
      );

      return {
        ..._token,
        ...token,
        balance: toReadableAmount(tokenBalalance, token.decimals).toString(),
      };
    })
  );

  return res.json(tokens);
});

// remove token from account
accountRoute.delete("/:id/tokens/:tokenId", async (req, res) => {
  const { id, tokenId } = req.params;
  if (!id) return res.status(400).json({ message: "Id is required" });
  if (!tokenId)
    return res.status(400).json({ message: "Token id is required" });

  const account = await Account.findById(id);
  if (!account) return res.status(404).json({ message: "Account not found" });

  // check if token already exists
  const tokenExists = account.tokens.find((t) => t.toString() === tokenId);
  if (!tokenExists)
    return res.status(400).json({ message: "Token does not exists" });

  account.tokens = account.tokens.filter((t) => t.toString() !== tokenId);

  await account.save();

  return res.json({ message: "Token removed successfully" });
});

// create account
accountRoute.post("/", async (req, res) => {
  const { name, privateKey: unEncrypted } = req.body;

  const { address } = new Wallet(unEncrypted);

  const privateKey = encrypt(unEncrypted);

  const { error } = createAccountValidator.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const account = await Account.create({ name, privateKey, address });
  account.privateKey = null;
  return res.json(account);
});

// update account
accountRoute.put("/:id", async (req, res) => {
  const { id } = req.params;

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name Is Required!" });
  }

  await Account.updateOne(
    { _id: mongoose.Types.ObjectId(id) },
    { $set: { name } },
    { new: true }
  ).catch((err) => {
    console.log("err => ", err);
  });

  return res.json({ message: "Account updated successfully" });
});

// delete account
accountRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Id is required" });

  await Account.findByIdAndDelete(id);
  return res.json({ message: "Account deleted successfully" });
});

export default accountRoute;
