import express from "express";
import cors from "cors";
import Uniswap from "./uniswap";
import { INFURA_GORLI_RPC, PRIVATE_KEY } from "./libs/constants";

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 3000;

const uniswapClient = new Uniswap(INFURA_GORLI_RPC, PRIVATE_KEY);

// get exchange rate from token to token (tokenFrom, tokenTo)
app.get("/exchange-rate/:tokenFrom/:tokenTo", async (req, res) => {
  const { tokenFrom, tokenTo } = req.params;
  const exchangeRate = await uniswapClient.getExchangeRate(tokenFrom, tokenTo);
  res.json(exchangeRate);
});

// get token balance
app.get("/token-balance/:tokenAddress", async (req, res) => {
  const { tokenAddress } = req.params;
  const tokenBalance = await uniswapClient.getTokenAndBalance(tokenAddress);
  res.json(tokenBalance);
});

// get position info
app.get("/positions/:posId/info", async (req, res) => {
  const { posId } = req.params;
  const positionInfo = await uniswapClient.getLiquidityPositionInfo(posId);
  res.json(positionInfo);
});

// get position
app.get("/positions/:posId", async (req, res) => {
  const { posId } = req.params;
  const position = await uniswapClient.getLiquidityPosition(posId);
  res.json(position);
});

// get all positions
app.get("/positions", async (req, res) => {
  const positions = await uniswapClient.getLiquidityPositions();
  res.json(positions);
});

// remove liquidity
app.post("/positions/:posId", async (req, res) => {
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
app.post("/positions", async (req, res) => {
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
app.post("/swap", async (req, res) => {
  const { tokenFrom, tokenTo, amountIn, amountOut } = req.body;
  const txId = await uniswapClient.swap(
    tokenFrom,
    tokenTo,
    amountIn,
    amountOut
  );

  res.json(txId);
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
