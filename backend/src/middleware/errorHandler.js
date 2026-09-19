import { HttpError } from "../lib/httpError.js";

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  let status = 500;
  let message = "Internal server error";
  let details;

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err?.name === "ZodError") {
    status = 422;
    message = "Validation failed";
    details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err?.code === "P2002") {
    status = 409;
    message = "A record with these details already exists";
  } else if (err?.code === "P2025") {
    status = 404;
    message = "Record not found";
  } else if (err?.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "Uploaded file is too large";
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON payload";
  }

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body = { message };
  if (details) body.details = details;
  res.status(status).json(body);
}
