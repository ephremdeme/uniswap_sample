/* eslint-disable no-unused-vars */
import { CurrencyAmount, Token, TradeType } from "@uniswap/sdk-core";
import { SwapQuoter, Trade } from "@uniswap/v3-sdk";
import { BigNumber, ethers, providers } from "ethers";
import { CurrentConfig, QUOTER_CONTRACT_ADDRESS } from "./constants";
import ERC20_ABI from "./ERC20_abi.json";

const READABLE_FORM_LEN = 6;

/**
 *
 *
 * @export
 * @param {number}      rawAmount
 * @param {number}      decimals
 * @return {BigNumber}  converted value
 */
export function fromReadableAmount(amount, decimals) {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

/**
 *
 *
 * @export
 * @param {number}  rawAmount
 * @param {number}  decimals
 * @return {String} converted readble value
 */
export function toReadableAmount(rawAmount, decimals) {
  return ethers.utils
    .formatUnits(rawAmount, decimals)
    .slice(0, READABLE_FORM_LEN);
}

/**
 *
 *
 * @export
 * @param {Trade<Token, Token, TradeType>} trade
 * @return {String} displays trade route
 */
export function displayTrade(trade) {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`;
}

/**
 *
 *
 * @export
 * @param {Route<Currency, Currency>} route
 * @param {providers.Provider} provider
 * @return {ethers.utils.Result}
 */
export async function getOutputQuote(route, provider) {
  if (!provider) {
    throw new Error("Provider required to get pool state");
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  );

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  });

  return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData);
}

/**
 *
 *
 * @export
 * @param {Object} options
 * @param {providers.Provider} options.provider
 * @param {string} options.address
 * @param {Currency} options.currency
 * @return {Promise<string>}
 */
export async function getCurrencyBalance({ provider, address, currency }) {
  // Handle ETH directly
  if (currency.isNative) {
    return ethers.utils.formatEther(await provider.getBalance(address));
  }

  // Get currency otherwise
  const walletContract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider
  );
  const balance = await walletContract.balanceOf(address);
  const decimals = await walletContract.decimals();

  // Format with proper units (approximate)
  return toReadableAmount(balance, decimals).toString();
}
