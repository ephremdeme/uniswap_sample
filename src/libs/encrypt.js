import Cryptr from "cryptr";
import { ACCESS_TOKEN_SECRET } from "./constants";

const cryptr = new Cryptr(ACCESS_TOKEN_SECRET);

export const encrypt = (text) => cryptr.encrypt(text);

export const decrypt = (text) => cryptr.decrypt(text);
