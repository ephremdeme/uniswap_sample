import { SupportedChainId, Token } from "@uniswap/sdk-core";
import { FeeAmount } from "@uniswap/v3-sdk";
import dotenv from "dotenv";

dotenv.config();

export const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const QUOTER_CONTRACT_ADDRESS =
  "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
export const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
export const V3_SWAP_ROUTER_ADDRESS =
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

export const WETH_CONTRACT_ADDRESS =
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const USDC_TOKEN_CONTRACT_ADDRESS =
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const WBTC_CONTRACT_ADDRESS =
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
export const UNI_CONTRACT_ADDRESS =
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

export const { INFURA_GORLI_RPC } = process.env;
export const { PRIVATE_KEY } = process.env;
export const { INFURA_RPC_ADDRESS } = process.env;

// Currencies and Tokens for Goerli Testing purpose
export const WETH_TOKEN = new Token(
  SupportedChainId.GOERLI,
  "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  18,
  "WETH",
  "Wrapped Ether"
);

export const DAI_TOKEN = new Token(
  SupportedChainId.GOERLI,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18,
  "DAI",
  "Dai Stablecoin"
);

export const USDC_TOKEN = new Token(
  SupportedChainId.GOERLI,
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  6,
  "USDC",
  "USD//C"
);

export const CurrentConfig = {
  rpc: {
    local: "https://mainnet.infura.io/v3/f052b40a54c246d996378b63e8dcea38",
    mainnet: "rpc",
  },
  tokens: {
    in: WETH_TOKEN,
    amountIn: 1,
    out: USDC_TOKEN,
    fee: FeeAmount.MEDIUM,
  },
};

// Transactions

export const MAX_FEE_PER_GAS = 100000000000;
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000;
