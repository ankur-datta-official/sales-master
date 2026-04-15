type ErrorWithDetails = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function isErrorWithDetails(value: unknown): value is ErrorWithDetails {
  return Boolean(value) && typeof value === "object";
}

export function toSafeActionError(
  error: unknown,
  fallbackMessage: string,
  context: string
): string {
  if (!isErrorWithDetails(error)) {
    console.error(`[action-error] ${context}`, { error });
    return fallbackMessage;
  }

  const diagnostic = {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
  console.error(`[action-error] ${context}`, diagnostic);

  if (error.code === "23505") {
    return "Duplicate value detected. Please use a unique value and try again.";
  }

  return fallbackMessage;
}
