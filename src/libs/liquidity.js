import { CurrencyAmount, Percent } from "@uniswap/sdk-core";
import axios from "axios";
import {
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
} from "@uniswap/v3-sdk";
import {
  CurrentConfig,
  NETWORK_ID,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  UNISWAP_GRAPH_URL,
} from "./constants";
import { getPoolInfo } from "./pool";
import {
  getTokenTransferApproval,
  sendTransactionViaWallet,
  TransactionState,
} from "./provider";
import { fromReadableAmount } from "./utils";

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {CurrencyAmount<Token>} options.token0Amount
 * @param {CurrencyAmount<Token>} options.token1Amount
 * @param {import('ethers').Wallet} options.wallet
 * @return {Promise<Position>}
 */
export async function constructPosition({
  token0Amount,
  token1Amount,
  wallet,
}) {
  // get pool info
  const poolInfo = await getPoolInfo(
    wallet.provider,
    token0Amount.currency,
    token1Amount.currency
  );

  // construct pool instance
  const configuredPool = new Pool(
    token0Amount.currency,
    token1Amount.currency,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  // create position using the maximum liquidity from input amounts
  return Position.fromAmounts({
    pool: configuredPool,
    tickLower:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) -
      poolInfo.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) +
      poolInfo.tickSpacing * 2,
    amount0: token0Amount.quotient,
    amount1: token1Amount.quotient,
    useFullPrecision: true,
  });
}

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {number} options.positionId
 * @param {import('ethers').Wallet} options.wallet
 * @param {Token} options.token0
 * @param {Token} options.token1
 * @param {string} options.token0Amount
 * @param {string} options.token1Amount
 *
 * @return {Promise<String>}
 */
export async function removeLiquidity({
  positionId,
  wallet,
  token0,
  token1,
  token0Amount,
  token1Amount,
}) {
  const currentPosition = await constructPosition({
    token0Amount: CurrencyAmount.fromRawAmount(
      token0,
      fromReadableAmount(token0Amount, token0.decimals)
    ),
    token1Amount: CurrencyAmount.fromRawAmount(
      token1,
      fromReadableAmount(token1Amount, token1.decimals)
    ),
    wallet,
  });

  const collectOptions = {
    expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
    expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
    recipient: wallet.address,
  };

  const removeLiquidityOptions = {
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
    tokenId: positionId,
    // percentage of liquidity to remove
    liquidityPercentage: new Percent(CurrentConfig.tokens.fractionToRemove),
    collectOptions,
  };
  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
    currentPosition,
    removeLiquidityOptions
  );

  // build transaction
  const transaction = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value,
    from: wallet.address,
    gasLimit: 5000000,
  };

  return sendTransactionViaWallet(wallet, transaction);
}

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {import('ethers').Wallet} options.wallet
 * @param {Token} options.token0
 * @param {Token} options.token1
 * @param {number} options.token0Amount
 * @param {number} options.token1Amount
 *
 * @return {Promise<String>}
 */
export async function mintPosition({
  wallet,
  token0Amount,
  token1Amount,
  token0,
  token1,
}) {
  // Give approval to the contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval({
    token: token0,
    wallet,
    amount: token0Amount,
    contracAddress: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  });
  const tokenOutApproval = await getTokenTransferApproval({
    token: token0,
    wallet,
    amount: token0Amount,
    contracAddress: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  });

  if (
    tokenInApproval !== TransactionState.Sent ||
    tokenOutApproval !== TransactionState.Sent
  ) {
    return TransactionState.Failed;
  }

  const positionToMint = await constructPosition({
    token0Amount: CurrencyAmount.fromRawAmount(
      token0,
      fromReadableAmount(token0Amount, token0.decimals)
    ),
    token1Amount: CurrencyAmount.fromRawAmount(
      token1,
      fromReadableAmount(token1Amount, token1.decimals)
    ),
    wallet,
  });

  console.log("positionToMint => ", positionToMint);

  const mintOptions = {
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  };

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    positionToMint,
    mintOptions
  );

  // build transaction
  const transaction = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value,
    from: wallet.address,
    gasLimit: 5000000,
    chainId: NETWORK_ID,
  };

  return sendTransactionViaWallet(wallet, transaction);
}

/**
 *
 *
 * @export
 * @param {number} tokenId
 *
 * @return {Promise<Position>}
 */
export async function getPositionInfo(positionId) {
  if (!positionId) {
    throw new Error("No Position Available");
  }

  const res = await axios.post(UNISWAP_GRAPH_URL, {
    query: `\n{  position(id: ${positionId}) {\n    id\n    owner\n    token0 {\n      id\n      name\n      decimals\n      symbol\n    }\n    token1 {\n      id\n      name\n      decimals\n      symbol\n    }\n    depositedToken0\n    depositedToken1\n  withdrawnToken0\n  withdrawnToken1\n    collectedFeesToken0\n    collectedFeesToken1\n    liquidity\n  \tfeeGrowthInside0LastX128\n  \tfeeGrowthInside1LastX128\n}   \n}`,
  });

  if (!res.data || !res.data.data || !res.data.data.position) {
    throw new Error("No Position Available");
  }

  const { position } = res.data.data;

  return position;
}
