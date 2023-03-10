import express from "express";
import Uniswap from "../uniswap";
import { INFURA_RPC_ADDRESS, PRIVATE_KEY } from "../libs/constants";
import { swapTwoTokensValidator } from "../validators/uniswap.validtor";
import Account from "../models/accounts";
import { decrypt } from "../libs/encrypt";
import Liquidity from "../models/liquidity";

const route = express.Router();
const uniswapClient = new Uniswap(INFURA_RPC_ADDRESS, PRIVATE_KEY);

// get exchange rate from token to token (tokenFrom, tokenTo)
route.get("/exchange-rate/:tokenFrom/:tokenTo", async (req, res) => {
  const { tokenFrom, tokenTo } = req.params;
  const exchangeRate = await uniswapClient.getExchangeRate(tokenFrom, tokenTo);
  res.json(exchangeRate);
});

// get token balance
route.get("/token-balance/:tokenAddress", async (req, res) => {
  const { tokenAddress } = req.params;
  const tokenBalance = await uniswapClient.getTokenAndBalance(tokenAddress);
  res.json(tokenBalance);
});

// get position info
route.get("/:walletId/positions/:posId/info", async (req, res) => {
  const { posId } = req.params;
  const positionInfo = await uniswapClient.getLiquidityPositionInfo(posId);
  res.json(positionInfo);
});

// get position
route.get("/:walletId/positions/:posId", async (req, res) => {
  const { posId } = req.params;
  const position = await uniswapClient.getLiquidityPosition(posId);
  res.json(position);
});

// get all positions
route.get("/:walletId/positions", async (req, res) => {
  const { walletId } = req.params;

  const wallet = await Account.findById(walletId);
  if (!wallet) {
    return res.status(400).json({ error: "Wallet not found" });
  }

  const privateKey = decrypt(wallet.privateKey); //

  const uniClient = new Uniswap(INFURA_RPC_ADDRESS, privateKey);

  const positions = await uniClient.getLiquidityPositions();
  return res.json(positions);
});

// remove liquidity
route.put("/:walletId/positions/:posId", async (req, res) => {
  const { walletId } = req.params;
  const { stopLoss, id } = req.body;

  await Liquidity.deleteMany({ positionId: id })

  const positionId = parseInt(id, 10);

  const wallet = await Account.findById(walletId);

  if (!wallet) {
    return res.status(400).json({ error: "Wallet not found" });
  }

  const privateKey = decrypt(wallet.privateKey); //

  const uniClient = new Uniswap(INFURA_RPC_ADDRESS, privateKey);

  const liquidityPosition = await uniClient.getLiquidityPosition(positionId);

  if (!liquidityPosition || parseInt(liquidityPosition.liquidity, 10) === 0) {
    return res.status(400).json({ error: "Position not found" });
  }

  const liquidity = await Liquidity.updateOne(
    { positionId },
    {
      $set: {
        positionId,
        // eslint-disable-next-line no-underscore-dangle
        wallet: wallet._id,
        stopLoss,
      },
    },
    {
      upsert: true,
    }
  );

  return res.json(liquidity);
});

// add liquidity
route.post("/:walletId/positions", async (req, res) => {
  const { tokenA, tokenB, amountA, amountB } = req.body;
  const txId = await uniswapClient.addLiquidity(
    tokenA,
    tokenB,
    amountA,
    amountB
  );
  res.json(txId);
});

// swap token
route.post("/swap", async (req, res) => {
  const { token1, token2, token1Amount, wallet: walletId } = req.body;
  const { error } = swapTwoTokensValidator.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const wallet = await Account.findById(walletId);
  if (!wallet) {
    return res.status(400).json({ error: "Wallet not found" });
  }

  const privateKey = decrypt(wallet.privateKey); //

  const uniClient = new Uniswap(INFURA_RPC_ADDRESS, privateKey);

  const status = await uniClient.exchangeToken(token1, token2, token1Amount);

  return res.json(status);
});

export default route;
