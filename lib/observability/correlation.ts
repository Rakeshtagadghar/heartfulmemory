function randomHex(size: number) {
  const alphabet = "0123456789abcdef";
  let value = "";
  for (let index = 0; index < size; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

export function createCorrelationId(prefix = "ERR") {
  const upperPrefix = prefix.trim().toUpperCase().replaceAll(/[^A-Z0-9]/g, "") || "ERR";
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${upperPrefix}-${date}-${randomHex(6)}`;
}
