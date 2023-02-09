import { ethers } from "ethers";
// eslint-disable-next-line import/no-extraneous-dependencies
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import { FeeAmount } from "@uniswap/v3-sdk";
import { SupportedChainId, Token } from "@uniswap/sdk-core";

import ERC20_ABI from "./libs/ERC20_abi.json";

import {
  INFURA_GORLI_RPC,
  INFURA_RPC_ADDRESS,
  PRIVATE_KEY,
  QUOTER_CONTRACT_ADDRESS,
  UNI_CONTRACT_ADDRESS,
  USDC_TOKEN_CONTRACT_ADDRESS,
  WETH_CONTRACT_ADDRESS,
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
    const contract = new ethers.Contract(address, ERC20_ABI, this.provider);

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

    console.log(swapRoute);
    const res = await executeTrade({
      route: swapRoute,
      tokenIn: contractIn,
      provider: this.provider,
      wallet: this.wallet,
      tokenOut: contractOut,
    });
    return res;
  }

  async getWalletCurrencyBalance(currency) {
    // eslint-disable-next-line no-param-reassign
    currency = await this.getToken(currency);
    console.log(currency);
    return getCurrencyBalance({
      provider: this.provider,
      address: this.wallet.address,
      currency,
    });
  }
}

(async () => {
  const uniswapClient = new Uniswap(INFURA_GORLI_RPC, PRIVATE_KEY);

  const swapUNIbyETH = await uniswapClient.getExchangeRate(
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
  );
  console.log(swapUNIbyETH);

  // const swapETHbyUSDC = await uniswapClient.getExchangeRate(
  //   "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  //   "0xcc7bb2d219a0fc08033e130629c2b854b7ba9195"
  // );

  // console.log(swapETHbyUSDC);

  const ethBalance = await uniswapClient.getWalletCurrencyBalance(
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
  );
  console.log("Wallet => ", ethBalance);

  const swapped = await uniswapClient.exchangeToken(
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    0.001
  );

  console.log("swapped => ", swapped);
})();
