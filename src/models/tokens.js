import mongoose from "mongoose";

const { Schema } = mongoose;

const TokenSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    symbol: {
      type: String,
      required: [true, "Please add a symbol"],
      unique: true,
      trim: true,
      maxlength: [10, "Symbol can not be more than 10 characters"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
      unique: true,
      trim: true,
      maxlength: [100, "Address can not be more than 100 characters"],
    },
    decimals: {
      type: Number,
      required: [true, "Please add decimals"],
      trim: true,
      maxlength: [2, "Decimals can not be more than 2 characters"],
    },
    logo_url: {
      type: String,
      trim: true,
    },
  },

  {
    timestamps: true,
  }
);

const Token = mongoose.model("Token", TokenSchema);

export default Token;
