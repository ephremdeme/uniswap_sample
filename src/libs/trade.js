import { CurrencyAmount, Percent, TradeType } from "@uniswap/sdk-core";
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
 * @param {String} options.address
 * @return {*}  {Promise<TransactionState>}
 */
export async function getTokenTransferApproval({
  provider,
  token,
  address,
  wallet,
}) {
  if (!provider || !address) {
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
      SWAP_ROUTER_ADDRESS,
      fromReadableAmount(
        TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
        token.decimals
      ).toString()
    );

    if (transaction && transaction.value) {
      transaction.value = BigNumber.from(transaction.value);
    }
    return sendTransactionViaWallet(provider, wallet, {
      ...transaction,
      from: address,
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
export async function executeTrade({ route, provider, wallet, tokenIn }) {
  if (!wallet.address || !provider) {
    throw new Error("Cannot execute a trade without a connected wallet");
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval({
    token: tokenIn,
    provider,
    address: wallet.address,
    wallet,
  });

  console.log("Token Approval => ", tokenApproval);

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  const res = await sendTransactionViaWallet(provider, wallet, {
    data: route.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: wallet.address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
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
 * @return {Promise<SwapRoute | null>}
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
    options
  );

  return route;
}
