import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const sha256File = (filePath) =>
  createHash("sha256").update(readFileSync(filePath)).digest("hex");
