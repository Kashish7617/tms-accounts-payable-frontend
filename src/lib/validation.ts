// ── Generic, reusable field validators ─────────────────────────────────────
// Each validator returns an error string, or undefined when the value is valid.

export function required(label: string) {
  return (value: unknown): string | undefined => {
    if (value === null || value === undefined) return `${label} is required.`;
    if (typeof value === "string" && value.trim() === "") return `${label} is required.`;
    return undefined;
  };
}

export function minLength(label: string, min: number) {
  return (value: string): string | undefined => {
    if (value.trim().length < min) return `${label} must be at least ${min} characters.`;
    return undefined;
  };
}

export function positiveNumber(label: string) {
  return (value: number): string | undefined => {
    if (Number.isNaN(value)) return `${label} must be a number.`;
    if (value <= 0) return `${label} must be greater than 0.`;
    return undefined;
  };
}

export function nonNegativeNumber(label: string) {
  return (value: number): string | undefined => {
    if (Number.isNaN(value)) return `${label} must be a number.`;
    if (value < 0) return `${label} can't be negative.`;
    return undefined;
  };
}

export function isFutureOrTodayDate(label: string) {
  return (value: string): string | undefined => {
    if (!value) return `${label} is required.`;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(date.getTime())) return `${label} isn't a valid date.`;
    if (date < today) return `${label} can't be in the past.`;
    return undefined;
  };
}

export function isValidDate(label: string) {
  return (value: string): string | undefined => {
    if (!value) return `${label} is required.`;
    if (Number.isNaN(new Date(value).getTime())) return `${label} isn't a valid date.`;
    return undefined;
  };
}

export function maxAmount(label: string, max: number) {
  return (value: number): string | undefined => {
    if (value > max) return `${label} can't exceed ${max.toLocaleString()}.`;
    return undefined;
  };
}

// Runs a list of validators against a value, returning the first error found.
export function runValidators<T>(value: T, validators: Array<(v: T) => string | undefined>): string | undefined {
  for (const validate of validators) {
    const error = validate(value);
    if (error) return error;
  }
  return undefined;
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
