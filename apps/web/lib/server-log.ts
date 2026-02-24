function serialize(value: unknown) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }

  try {
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function write(level: "warn" | "error", event: string, details?: unknown) {
  if (details === undefined) {
    process.stderr.write(`[${level}] ${event}\n`);
    return;
  }

  const serializedDetails =
    typeof details === "string" ? details : JSON.stringify(serialize(details));
  const line = `[${level}] ${event} ${serializedDetails}\n`;

  process.stderr.write(line);
}

export function logWarn(event: string, details?: unknown) {
  write("warn", event, details);
}

export function logError(event: string, details?: unknown) {
  write("error", event, details);
}
