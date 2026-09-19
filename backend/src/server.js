import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { emailEnabled } from "./services/email.service.js";

const server = app.listen(env.port, () => {
  console.log(`BoviPulse API running at http://localhost:${env.port} (${env.nodeEnv})`);
  // One-line email readiness probe: Render logs show instantly whether the
  // SMTP secrets are live (enabled) or the server is silently skipping mail.
  console.log(
    emailEnabled()
      ? `[email] enabled via ${env.smtpHost}:${env.smtpPort} as ${env.smtpUser}`
      : "[email] disabled — set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS on this service"
  );
});

function shutdown() {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
