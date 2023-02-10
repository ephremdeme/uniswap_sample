/* eslint-disable no-unused-vars */
import { Token, TradeType } from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v3-sdk";
import { BigNumber, ethers, providers } from "ethers";
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

export const parsePositionInfo = (posInfo) =>
  `${posInfo.liquidity.toString()} liquidity, owed ${posInfo.tokensOwed0.toString()} and ${posInfo.tokensOwed1.toString()}`;
