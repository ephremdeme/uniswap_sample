import express from "express";
import Uniswap from ".";
import { INFURA_GORLI_RPC, PRIVATE_KEY } from "../libs/constants";

const route = express.Router();
const uniswapClient = new Uniswap(INFURA_GORLI_RPC, PRIVATE_KEY);

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
route.get("/positions/:posId/info", async (req, res) => {
  const { posId } = req.params;
  const positionInfo = await uniswapClient.getLiquidityPositionInfo(posId);
  res.json(positionInfo);
});

// get position
route.get("/positions/:posId", async (req, res) => {
  const { posId } = req.params;
  const position = await uniswapClient.getLiquidityPosition(posId);
  res.json(position);
});

// get all positions
route.get("/positions", async (req, res) => {
  const positions = await uniswapClient.getLiquidityPositions();
  res.json(positions);
});

// remove liquidity
route.post("/positions/:posId", async (req, res) => {
  const { posId } = req.params;
  const { tokenA, tokenB, amountA, amountB } = req.body;

  const txId = await uniswapClient.removeLiquidity(
    posId,
    tokenA,
    tokenB,
    amountA,
    amountB
  );
  res.json(txId);
});

// add liquidity
route.post("/positions", async (req, res) => {
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
  const { tokenFrom, tokenTo, amountIn, amountOut } = req.body;
  const txId = await uniswapClient.swap(
    tokenFrom,
    tokenTo,
    amountIn,
    amountOut
  );

  res.json(txId);
});

export default route;
