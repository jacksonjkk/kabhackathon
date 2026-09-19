import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new HttpError(401, "Authentication required");
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new HttpError(401, "Invalid or expired session token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { farm: true },
    });
    if (!user) throw new HttpError(401, "Account no longer exists");

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action"));
    }
    next();
  };
