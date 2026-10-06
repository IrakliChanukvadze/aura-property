import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
if (existsSync(".env")) process.loadEnvFile(".env");
const commands = [
  ["npm", ["run", "dev", "-w", "@aura/api"]],
  ["npm", ["exec", "-w", "@aura/web", "--", "next", "dev", "-p", "3100"]],
  ["npm", ["run", "dev", "-w", "@aura/admin"]],
];
const children = commands.map(([cmd, args]) =>
  spawn(cmd, args, { stdio: "inherit", env: process.env }),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
for (const child of children)
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
