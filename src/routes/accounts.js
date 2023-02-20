/* eslint-disable no-underscore-dangle */
import express from "express";
import mongoose from "mongoose";
import { INFURA_GORLI_RPC } from "../libs/constants";
import { decrypt, encrypt } from "../libs/encrypt";

import Account from "../models/accounts";
import Token from "../models/tokens";
import Uniswap from "../uniswap";
import { toReadableAmount } from "../libs/utils";
import {
  createAccountValidator,
  updateAccountValidator,
} from "../validators/accounts.validator";

const accountRoute = express.Router();

// get all accounts
accountRoute.get("/", async (req, res) => {
  const accounts = await Account.find({}).lean();
  res.json(
    accounts.map((account) => ({
      ...account,
      privateKey: decrypt(account.privateKey),
    }))
  );
});

// get account by id
accountRoute.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id is required" });

  const account = await Account.findById(id).lean();
  if (!account) return res.status(404).json({ message: "Account not found" });

  return res.json({ ...account, privateKey: decrypt(account.privateKey) });
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
    INFURA_GORLI_RPC,
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

  const privateKey = encrypt(unEncrypted);

  const { error } = createAccountValidator.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const account = await (await Account.create({ name, privateKey })).toJSON();
  return res.json({ ...account, privateKey: decrypt(account.privateKey) });
});

// update account
accountRoute.put("/:id", async (req, res) => {
  const { id } = req.params;

  const { name, privateKey: unEncryptedKey } = req.body;
  const { error } = updateAccountValidator.validate({
    name,
    privateKey: unEncryptedKey,
  });
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const privateKey = encrypt(unEncryptedKey);
  await Account.updateOne(
    { _id: mongoose.Types.ObjectId(id) },
    { $set: { name, privateKey } },
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

  const account = await Account.findByIdAndDelete(id);
  return res.json(account);
});

export default accountRoute;
