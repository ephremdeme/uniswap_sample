/* eslint-disable no-unused-vars */
import {
  CurrencyAmount,
  Percent,
  SupportedChainId,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import { ethers, Wallet } from "ethers";
import { AlphaRouter, ChainId, SwapType } from "@uniswap/smart-order-router";

import { V3_SWAP_ROUTER_ADDRESS } from "./constants";

import { fromReadableAmount } from "./utils";
import {
  getTokenTransferApproval,
  sendTransactionViaWallet,
  TransactionState,
} from "./provider";

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
    wallet,
    amount,
    contracAddress: V3_SWAP_ROUTER_ADDRESS,
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
      maxSwapsPerPath: 3, // default is 3
    }
  );

  return route;
}
