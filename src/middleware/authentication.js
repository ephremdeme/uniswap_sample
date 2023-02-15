import { expressjwt as jwt } from "express-jwt";
import ErrorResponse from "../util/errorResponse";
import { RESPONSE_STATUS_CODE } from "./errorHandler";

export default function authenticate() {
  return [
    jwt({
      secret: Buffer.from(process.env.ACCESS_TOKEN_SECRET, "base64"),
      algorithms: ["HS256"],
      credentialsRequired: true,
    }),
    async (req, res, next) => {
      const { id, username } = req.user;

      if (!username || !id) {
        next(
          new ErrorResponse("User Not Found!", RESPONSE_STATUS_CODE.not_found)
        );
      } else if (username !== process.env.DEMO_USERNAME) {
        next(
          new ErrorResponse(
            "UnAuthorized Access!",
            RESPONSE_STATUS_CODE.un_authorized
          )
        );
      }
      next();
    },
  ];
}
