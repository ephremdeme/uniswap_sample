import express from "express";
import Account from "../models/accounts";
import {
  createAccountValidator,
  updateAccountValidator,
} from "../validators/accounts.validator";

const accountRoute = express.Router();

// get all accounts
accountRoute.get("/", async (req, res) => {
  const accounts = await Account.find();
  res.json(accounts);
});

// get account by id
accountRoute.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id is required" });

  const account = await Account.findById(id);
  return res.json(account);
});

// create account
accountRoute.post("/", async (req, res) => {
  const { name, privateKey } = req.body;

  const { error } = createAccountValidator.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const account = await Account.create({ name, privateKey });
  return res.json(account);
});

// update account
accountRoute.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, privateKey } = req.body;
  const { error } = updateAccountValidator.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  const account = await Account.findByIdAndUpdate(
    id,
    { name, privateKey },
    { new: true }
  );
  return res.json(account);
});

// delete account
accountRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Id is required" });

  const account = await Account.findByIdAndDelete(id);
  return res.json(account);
});

export default accountRoute;
