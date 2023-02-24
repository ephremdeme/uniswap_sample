// Generate a mongoose model for liquidity
// Attributes: positionId, stopLoss, wallet

import mongoose from "mongoose";

const { Schema } = mongoose;

const LiquiditySchema = new Schema(
  {
    positionId: {
      type: Number,
      required: [true, "Please add a position id"],
      unique: true,
      trim: true,
    },
    stopLoss: {
      type: Number,
      required: [true, "Please add a stop loss"],
      trim: true,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
  },
  {
    timestamps: true,
  }
);

const Liquidity = mongoose.model("Liquidity", LiquiditySchema);

export default Liquidity;
