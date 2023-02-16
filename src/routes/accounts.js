import express from "express";
import Account from "../models/accounts";

const accountRoute = express.Router();

// get all accounts
accountRoute.get("/", async (req, res) => {
  const accounts = await Account.find();
  res.json(accounts);
});

// get account by id
accountRoute.get("/:id", async (req, res) => {
  const { id } = req.params;

  const account = await Account.findById(id);
  res.json(account);
});

// create account
accountRoute.post("/", async (req, res) => {
  const { name, privateKey } = req.body;
  const account = await Account.create({ name, privateKey });
  res.json(account);
});

// update account
accountRoute.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, privateKey } = req.body;
  const account = await Account.findByIdAndUpdate(
    id,
    { name, privateKey },
    { new: true }
  );
  res.json(account);
});

// delete account
accountRoute.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const account = await Account.findByIdAndDelete(id);
  res.json(account);
});

export default accountRoute;
