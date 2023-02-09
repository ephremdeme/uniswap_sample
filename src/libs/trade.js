import {
  CurrencyAmount,
  Percent,
  SupportedChainId,
  TradeType,
} from "@uniswap/sdk-core";
import { BigNumber, ethers, Wallet } from "ethers";
import { AlphaRouter, ChainId, SwapType } from "@uniswap/smart-order-router";

import {
  SWAP_ROUTER_ADDRESS,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  V3_SWAP_ROUTER_ADDRESS,
} from "./constants";

import { fromReadableAmount } from "./utils";
import { sendTransactionViaWallet, TransactionState } from "./provider";
import ERC20_ABI from "./ERC20_abi.json";

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {providers.Provider} options.provider
 * @param {Token} options.token
 * @param {Wallet} options.wallet
 * @return {*}  {Promise<TransactionState>}
 */
export async function getTokenTransferApproval({
  provider,
  token,
  wallet,
  amount,
}) {
  if (!provider) {
    console.log("No Provider Found");
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    );

    const transaction = await tokenContract.populateTransaction.approve(
      V3_SWAP_ROUTER_ADDRESS,
      fromReadableAmount(amount, token.decimals).toString()
    );
    return await sendTransactionViaWallet(wallet, {
      ...transaction,
      from: wallet.address,
    });
  } catch (e) {
    console.error(e);
    return TransactionState.Failed;
  }
}

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {providers.Provider} options.provider
 * @param {Token} options.tokenIn
 * @param {Token} options.tokenOut
 * @param {Wallet} options.wallet
 * @param {import("@uniswap/smart-order-router").SwapRoute} options.route
 * @return {Promise<TransactionState>}
 */
export async function executeTrade({
  route,
  provider,
  wallet,
  tokenIn,
  amount,
}) {
  if (!wallet.address || !provider) {
    throw new Error("Cannot execute a trade without a connected wallet");
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval({
    token: tokenIn,
    provider,
    wallet,
    amount,
  });

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  const res = await sendTransactionViaWallet(wallet, {
    data: route.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: wallet.address,
    gasLimit: 5000000,
    chainId: SupportedChainId.GOERLI,
  });

  return res;
}

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {providers.Provider} options.provider
 * @param {Token} options.tokenIn
 * @param {Token} options.tokenOut
 * @param {String} options.amount
 * @param {String} options.walletAddress
 * @return {Promise<import("@uniswap/smart-order-router").SwapRoute | null>}
 */
export async function generateRoute({
  provider,
  tokenIn,
  tokenOut,
  amount,
  walletAddress,
}) {
  const router = new AlphaRouter({
    chainId: ChainId.GÖRLI,
    provider,
  });

  const options = {
    recipient: walletAddress,
    slippageTolerance: new Percent(5, 100),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(amount, tokenIn.decimals).toString()
    ),
    tokenOut,
    TradeType.EXACT_INPUT,
    options,
    {
      maxSwapsPerPath: 1,
    }
  );

  return route;
}
