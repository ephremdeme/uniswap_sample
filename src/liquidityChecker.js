import dotenv from "dotenv";

import { INFURA_RPC_ADDRESS } from "./libs/constants";
import { decrypt } from "./libs/encrypt";
import Account from "./models/accounts";
import Liquidity from "./models/liquidity";
import Uniswap from "./uniswap";

dotenv.config();
(async () => {
  // Populate the liquidity from the Liquidity model field called wallet
  const accounts = await Account.aggregate([
    {
      $lookup: {
        from: Liquidity.collection.name,
        let: { wallet: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$wallet", "$$wallet"] },
                  { $ne: ["$stopLoss", "0"] },
                ],
              },
            },
          },
        ],
        as: "liquidity",
      },
    },
    {
      $match: {
        "liquidity.0": { $exists: true },
      },
    },
  ]);

  setInterval(async () => {
    await Promise.all(
      accounts.map(async (account) => {
        const { liquidity } = account;
        const { privateKey: _privateKey } = account;
        const privateKey = decrypt(_privateKey);
        const uniClient = new Uniswap(INFURA_RPC_ADDRESS, privateKey);

        try {
          const positions = await uniClient.getLiquidityPositions();

          await Promise.all(
            liquidity.map(async (liq) => {
              const { positionId, stopLoss } = liq;
              console.log("Position ID => ", positionId);
              const position = positions.find(
                (pos) => parseInt(pos.id, 10) === positionId
              );

              if (!position) {
                return;
              }

              const { token0, token1 } = position;

              const rate = await uniClient.getExchangeRate(
                token0.id,
                token1.id
              );

              console.log("Rate => ", rate, stopLoss);
              if (parseFloat(rate) >= parseFloat(stopLoss)) {
                return;
              }

              const { depositedToken0, depositedToken1, withdrawnToken1 } =
                position;

              const removeLiquidity = await uniClient.removeLiquidity(
                positionId,
                token0.id,
                token1.id,
                depositedToken0,
                depositedToken1
              );
              console.log("Removed Liquidity => ", removeLiquidity);

              // Swap the tokens to the previous token value after removing the liquidity
              const swap = await uniClient.exchangeTokenOutPut(
                token0.id,
                token1.id,
                depositedToken1 - withdrawnToken1
              );
              console.log("Swapped Tokens => ", swap);
            })
          );
        } catch (error) {
          console.log("Error => ", error);
        }
      })
    );
  }, 3 * 60 * 1000);
})();
