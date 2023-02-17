import Joi from "joi";

const createAccountValidator = Joi.object({
  name: Joi.string().required(),
  privateKey: Joi.string().required(),
});

const updateAccountValidator = Joi.object({
  name: Joi.string().required(),
  privateKey: Joi.string().required(),
  id: Joi.string().required(),
});

export { createAccountValidator, updateAccountValidator };
