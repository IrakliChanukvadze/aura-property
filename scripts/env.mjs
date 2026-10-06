import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
if (existsSync(".env")) process.loadEnvFile(".env");
const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
