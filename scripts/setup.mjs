import { existsSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (!existsSync(".env")) copyFileSync(".env.example", ".env");
process.loadEnvFile(".env");
for (const [command, args] of [
  ["docker", ["compose", "up", "-d", "--wait", "postgres"]],
  ["npm", ["run", "db:generate"]],
  ["npm", ["run", "deploy", "-w", "@aura/database"]],
  ["npm", ["run", "db:seed"]],
]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(
  "Aura local setup complete. npm run dev starts web3100, admin5173 and API4000.",
);
