import { ethers } from "ethers";
// eslint-disable-next-line import/no-extraneous-dependencies
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import { FeeAmount } from "@uniswap/v3-sdk";
import { SupportedChainId, Token } from "@uniswap/sdk-core";

import ERC20_ABI from "./libs/ERC20_abi.json";

import {
  GOERLI_UNI_CONTRACT_ADDRESS,
  GOERLI_USDT_CONTRACT_ADDRESS,
  INFURA_GORLI_RPC,
  PRIVATE_KEY,
  QUOTER_CONTRACT_ADDRESS,
} from "./libs/constants";
import {
  fromReadableAmount,
  getCurrencyBalance,
  toReadableAmount,
} from "./libs/utils";
import { executeTrade, generateRoute } from "./libs/trade";

class Uniswap {
  constructor(urlRPC, privateKey) {
    this.provider = new ethers.providers.JsonRpcProvider(
      urlRPC,
      SupportedChainId.GOERLI
    );
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async getToken(address) {
    const contract = new ethers.Contract(address, ERC20_ABI, this.wallet);

    const [decimals, symbol, name] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.name(),
    ]);
    return new Token(SupportedChainId.GOERLI, address, decimals, symbol, name);
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
      new Token(SupportedChainId.GOERLI, contract.address, dec, symbol, name),
      balance,
    ];
  }
}

(async () => {
  const uniswapClient = new Uniswap(INFURA_GORLI_RPC, PRIVATE_KEY);

  // const swapUNIbyETHRate = await uniswapClient.getExchangeRate(
  //   UNI_CONTRACT_ADDRESS,
  //   WETH_CONTRACT_ADDRESS
  // );
  // console.log(swapUNIbyETHRate);

  // const swapETHbyUSDCRate = await uniswapClient.getExchangeRate(
  //   WETH_CONTRACT_ADDRESS,
  //   USDC_TOKEN_CONTRACT_ADDRESS
  // );

  // console.log(swapETHbyUSDCRate);

  // Testing Swap and Balance Using Goerli Testnet

  let [inputToken, balance] = await uniswapClient.getTokenAndBalance(
    GOERLI_USDT_CONTRACT_ADDRESS
  );
  console.log(
    `   Input: ${inputToken.symbol} (${
      inputToken.name
    }) => Balance:  ${ethers.utils.formatUnits(balance, inputToken.decimals)}`
  );

  const swapped = await uniswapClient.exchangeToken(
    GOERLI_USDT_CONTRACT_ADDRESS,
    GOERLI_UNI_CONTRACT_ADDRESS,
    140
  );

  console.log("swapped => ", swapped);

  [inputToken, balance] = await uniswapClient.getTokenAndBalance(
    GOERLI_USDT_CONTRACT_ADDRESS
  );
  console.log(
    `   Input: ${inputToken.symbol} (${
      inputToken.name
    }): ${ethers.utils.formatUnits(balance, inputToken.decimals)}`
  );
})();
