const ua = process.env.npm_config_user_agent || "";

if (!ua.startsWith("pnpm/")) {
  console.error("\nThis project uses pnpm only.");
  console.error("Run: pnpm install\n");
  process.exit(1);
}
