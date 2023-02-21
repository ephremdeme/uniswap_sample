import Joi from "joi";

export const swapTwoTokensValidator = Joi.object({
  token1: Joi.string().required(),
  token2: Joi.string().required(),
  token1Amount: Joi.number().required(),
  wallet: Joi.string().required(),
});

export default swapTwoTokensValidator;
