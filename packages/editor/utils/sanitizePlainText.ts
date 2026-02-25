export function sanitizePlainText(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

