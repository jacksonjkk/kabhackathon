import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(72),
  role: z.enum(["FARMER", "VETERINARIAN", "WORKER"]).default("FARMER"),
  phone: z.string().trim().max(24).nullish(),
});

const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(24).nullable().optional(),
    password: z.string().min(8).max(72).optional(),
    role: z.enum(["FARMER", "VETERINARIAN", "WORKER"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No changes provided" });

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone ?? null,
  farmId: user.farmId ?? null,
  createdAt: user.createdAt,
});

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, phone: phone ?? null },
  });

  res.status(201).json({ user: sanitizeUser(user), token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  res.json({ user: sanitizeUser(user), token: signToken(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(sanitizeUser(req.user));
});

export const updateMe = asyncHandler(async (req, res) => {
  const data = updateProfileSchema.parse(req.body);

  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
  });

  res.json(sanitizeUser(user));
});
