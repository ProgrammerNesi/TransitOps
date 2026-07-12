import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { locked, unauthorized } from "../../common/http-error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/auth.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized("Invalid credentials");
  if (!user.isActive) throw locked("Account disabled");

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) throw unauthorized("Invalid credentials");

  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return {
    token: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser),
    user: authUser
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || !user.isActive) throw unauthorized("Invalid refresh token");

  return {
    token: signAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
  };
}
