import Joi from "joi";

const createTokenValidator = Joi.object({
  address: Joi.string().required(),
});

const updateTokenValidator = Joi.object({
  address: Joi.string().required(),
  id: Joi.string().required(),
});

export { createTokenValidator, updateTokenValidator };
