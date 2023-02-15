import jwt from "jsonwebtoken";

export default function generateJwtToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      email: user.username,
    },
    Buffer.from(process.env.ACCESS_TOKEN_SECRET, "base64"),
    { expiresIn: "30d" }
  );
}
