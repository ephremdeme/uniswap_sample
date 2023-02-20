import mongoose from "mongoose";

const { Schema } = mongoose;

const AccountSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    privateKey: {
      type: String,
      required: [true, "Please add a private key"],
      unique: true,
      trim: true,
    },

    tokens: [
      {
        type: Schema.Types.ObjectId,
        ref: "Token",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model("Account", AccountSchema);

export default Account;
