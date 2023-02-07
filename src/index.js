import { ethers } from "ethers";
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import ERC20_abi from "./libs/ERC20_abi.json";

import {
  INFURA_RPC_ADDRESS,
  PRIVATE_KEY,
  QUOTER_CONTRACT_ADDRESS,
  UNI_CONTRACT_ADDRESS,
  USDC_TOKEN_CONTRACT_ADDRESS,
  WETH_CONTRACT_ADDRESS,
} from "./libs/contants.js";
import { SupportedChainId, Token } from "@uniswap/sdk-core";
import { FeeAmount } from "@uniswap/v3-sdk";
import { fromReadableAmount, toReadableAmount } from "./libs/conversion.js";

class Uniswap {
  constructor(urlRPC, privateKey) {
    this.provider = new ethers.providers.JsonRpcProvider(
      urlRPC,
      SupportedChainId.MAINNET
    );
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async getToken(address) {
    const contract = new ethers.Contract(address, ERC20_abi, this.provider);

    const [decimals, symbol, name] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.name(),
    ]);
    return new Token(SupportedChainId.MAINNET, address, decimals, symbol, name);
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
}

(async () => {
  let uniswapClient = new Uniswap(INFURA_RPC_ADDRESS, PRIVATE_KEY);

  const swapUNIbyETH = await uniswapClient.getExchangeRate(
    UNI_CONTRACT_ADDRESS,
    WETH_CONTRACT_ADDRESS
  );
  console.log(swapUNIbyETH);

  const swapETHbyUSDC = await uniswapClient.getExchangeRate(
    WETH_CONTRACT_ADDRESS,
    USDC_TOKEN_CONTRACT_ADDRESS
  );

  console.log(swapETHbyUSDC);
})();
