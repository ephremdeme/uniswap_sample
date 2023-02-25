/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
import { ethers } from "ethers";
// eslint-disable-next-line import/no-extraneous-dependencies
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import { FeeAmount } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";

import { USDT_MAINNET, UNI_MAINNET } from "@uniswap/smart-order-router";
import ERC20_ABI from "../libs/ERC20_abi.json";

import {
  INFURA_RPC_ADDRESS,
  NETWORK_ID,
  NONFUNGIBLE_POSITION_MANAGER_ABI,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  PRIVATE_KEY,
  QUOTER_CONTRACT_ADDRESS,
  UNI_CONTRACT_ADDRESS,
} from "../libs/constants";
import {
  fromReadableAmount,
  getCurrencyBalance,
  parsePositionInfo,
  toReadableAmount,
} from "../libs/utils";
import { executeTrade, generateRoute, generateRouteForOutPut } from "../libs/trade";
import {
  getPositionInfo,
  mintPosition,
  removeLiquidity,
} from "../libs/liquidity";
import Liquidity from "../models/liquidity";

class Uniswap {
  constructor(urlRPC, privateKey) {
    this.provider = new ethers.providers.JsonRpcProvider(urlRPC, NETWORK_ID);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async getToken(address) {
    const contract = new ethers.Contract(address, ERC20_ABI, this.wallet);

    const [decimals, symbol, name] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.name(),
    ]);
    return new Token(NETWORK_ID, address, decimals, symbol, name);
  }

  async getExchangeRate(tokenFrom, tokenTo) {
    const quoterContract = new ethers.Contract(
      QUOTER_CONTRACT_ADDRESS,
      Quoter.abi,
      this.provider
    );

    const [contractIn, contractOut] = await Promise.all([
      this.getToken(tokenFrom),
      this.getToken(tokenTo),
    ]);

    const quotedAmountOut =
      await quoterContract.callStatic.quoteExactInputSingle(
        tokenFrom,
        tokenTo,
        FeeAmount.MEDIUM,
        fromReadableAmount(1, contractIn.decimals).toString(),
        0
      );

    return toReadableAmount(quotedAmountOut, contractOut.decimals);
  }

  async exchangeToken(tokenFrom, tokenTo, amount) {
    const [contractIn, contractOut] = await Promise.all([
      this.getToken(tokenFrom),
      this.getToken(tokenTo),
    ]);

    const swapRoute = await generateRoute({
      provider: this.provider,
      tokenIn: contractIn,
      tokenOut: contractOut,
      amount,
      walletAddress: this.wallet.address,
    });

    const res = await executeTrade({
      route: swapRoute,
      tokenIn: contractIn,
      provider: this.provider,
      wallet: this.wallet,
      tokenOut: contractOut,
      amount,
    });
    return res;
  }

  async exchangeTokenOutPut(tokenFrom, tokenTo, amount) {
    const [contractIn, contractOut] = await Promise.all([
      this.getToken(tokenFrom),
      this.getToken(tokenTo),
    ]);

    const swapRoute = await generateRouteForOutPut({
      provider: this.provider,
      tokenIn: contractIn,
      tokenOut: contractOut,
      amount,
      walletAddress: this.wallet.address,
    });

    const res = await executeTrade({
      route: swapRoute,
      tokenIn: contractIn,
      provider: this.provider,
      wallet: this.wallet,
      tokenOut: contractOut,
      amount,
    });
    return res;
  }

  async getWalletCurrencyBalance(currency) {
    // eslint-disable-next-line no-param-reassign
    currency = await this.getToken(currency);
    return getCurrencyBalance({
      provider: this.provider,
      address: this.wallet.address,
      currency,
    });
  }

  async getTokenAndBalance(currency) {
    const contract = new ethers.Contract(currency, ERC20_ABI, this.wallet);

    const [dec, symbol, name, balance] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.name(),
      contract.balanceOf(this.wallet.address),
    ]);

    return [
      new Token(NETWORK_ID, contract.address, dec, symbol, name),
      balance,
    ];
  }

  async createLiquidty(tokenA, tokenB, amountA, amountB) {
    const [token0, token1] = await Promise.all([
      this.getToken(tokenA),
      this.getToken(tokenB),
    ]);

    const liquidity = await mintPosition({
      wallet: this.wallet,
      token0,
      token1,
      token0Amount: amountA,
      token1Amount: amountB,
    });

    return liquidity;
  }

  async getLiquidityPositions() {
    const positionContract = new ethers.Contract(
      NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      NONFUNGIBLE_POSITION_MANAGER_ABI,
      this.provider
    );

    // Get number of positions
    const balance = await positionContract.balanceOf(this.wallet.address);

    // Get all positions
    const tokenIds = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < balance; i++) {
      const tokenOfOwnerByIndex = await positionContract.tokenOfOwnerByIndex(
        this.wallet.address,
        i
      );

      const position = await getPositionInfo(
        parseInt(tokenOfOwnerByIndex.toString(), 10)
      );

      // eslint-disable-next-line no-continue
      if(position.liquidity === '0') continue;

      const liquidity = await Liquidity.findOne({
        positionId: parseInt(tokenOfOwnerByIndex.toString(), 10),
      });

      tokenIds.push({
        ...position,
        balance0: (position.depositedToken0 - position.withdrawnToken0)
          .toString()
          .slice(0, -6),
        balance1: (position.depositedToken1 - position.withdrawnToken1)
          .toString()
          .slice(0, -6),
        stopLoss: liquidity?.stopLoss,
      });
    }

    return tokenIds;
  }

  async getLiquidityPosition(positionId) {
    const position = await getPositionInfo(parseInt(positionId, 10));
    return position;
  }

  async getLiquidityPositionInfo(positionId) {
    const position = await getPositionInfo(parseInt(positionId, 10));
    return parsePositionInfo(position);
  }

  async removeLiquidity(positionId, tokenA, tokenB, amountA, amountB) {
    const [token0, token1] = await Promise.all([
      this.getToken(tokenA),
      this.getToken(tokenB),
    ]);

    const txId = await removeLiquidity({
      wallet: this.wallet,
      token0,
      token1,
      token0Amount: amountA,
      token1Amount: amountB,
      positionId,
    });

    return txId;
  }
}

export const defaultUniswapClient = new Uniswap(INFURA_RPC_ADDRESS, PRIVATE_KEY);

// (async () => {
//   const uniswap = new Uniswap(INFURA_RPC_ADDRESS, PRIVATE_KEY);

//   console.log(UNI_MAINNET.address, USDT_MAINNET.address);
//   const rate = await uniswap.getExchangeRate(
//     UNI_MAINNET.address,
//     USDT_MAINNET.address
//   );

//   console.log(rate);
// })();

export default Uniswap;
