type ErrorWithDetails = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function isErrorWithDetails(value: unknown): value is ErrorWithDetails {
  return Boolean(value) && typeof value === "object";
}

function logActionError(context: string, diagnostic: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[action-error] ${context}`, diagnostic);
    return;
  }
  // Keep production logs low-detail to reduce accidental sensitive diagnostics leakage.
  console.error(`[action-error] ${context}`);
}

export function toSafeActionError(
  error: unknown,
  fallbackMessage: string,
  context: string
): string {
  if (!isErrorWithDetails(error)) {
    logActionError(context, { error });
    return fallbackMessage;
  }

  const diagnostic = {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
  logActionError(context, diagnostic);

  if (error.code === "23505") {
    return "Duplicate value detected. Please use a unique value and try again.";
  }

  return fallbackMessage;
}
