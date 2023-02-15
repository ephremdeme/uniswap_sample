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
export const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS =
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

export const WETH_CONTRACT_ADDRESS =
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const USDC_TOKEN_CONTRACT_ADDRESS =
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const WBTC_CONTRACT_ADDRESS =
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
export const UNI_CONTRACT_ADDRESS =
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

/**
 * @dev Goerli Testnet Addresses
 */

export const GOERLI_WETH_CONTRACT_ADDRESS =
  "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
export const GOERLI_USDC_TOKEN_CONTRACT_ADDRESS =
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
export const GOERLI_WBTC_CONTRACT_ADDRESS =
  "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
export const GOERLI_UNI_CONTRACT_ADDRESS =
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
export const GOERLI_USDT_CONTRACT_ADDRESS =
  "0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49";

export const { INFURA_GORLI_RPC } = process.env;
export const { PRIVATE_KEY } = process.env;
export const { INFURA_RPC_ADDRESS } = process.env;
export const { DEMO_USERNAME } = process.env;
export const { DEMO_PASSWORD } = process.env;

export const CurrentConfig = {
  rpc: {
    local: "https://mainnet.infura.io/v3/f052b40a54c246d996378b63e8dcea38",
    mainnet: "rpc",
  },
  tokens: {
    amountIn: 1,
    fee: FeeAmount.LOW,
    fractionToRemove: 1,
    fractionToAdd: 0.5,
  },
};

// Transactions

export const MAX_FEE_PER_GAS = 100000000000;
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000;

// ABI's
export const NONFUNGIBLE_POSITION_MANAGER_ABI = [
  // Read-Only Functions
  "function balanceOf(address _owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address _owner, uint256 _index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string memory)",

  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
];
