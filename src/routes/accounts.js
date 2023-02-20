/* eslint-disable no-underscore-dangle */
import express from "express";
import mongoose from "mongoose";
import { decrypt, encrypt } from "../libs/encrypt";

import Account from "../models/accounts";
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
  const account = await Account.findOneAndUpdate(
    { _id: mongoose.Types.ObjectId(id) },
    { $set: { name, privateKey } },
    { new: true }
  )
    .lean()
    .catch((err) => {
      console.log("err => ", err);
    });
  console.log("account => ", account);
  return res.json({ ...account, privateKey: decrypt(account.privateKey) });
});

// delete account
accountRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Id is required" });

  const account = await Account.findByIdAndDelete(id);
  return res.json(account);
});

export default accountRoute;
