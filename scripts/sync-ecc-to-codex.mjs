#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const managedServers = [
  "supabase",
  "playwright",
  "context7",
  "exa",
  "github",
  "memory",
  "sequential-thinking",
];

const aliases = new Map([["context7-mcp", "context7"]]);
const updateMcp = process.argv.includes("--update-mcp");
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectConfigPath = path.join(repoRoot, ".codex", "config.toml");
const homeConfigPath = path.join(os.homedir(), ".codex", "config.toml");

function readFileIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function splitTomlTables(source) {
  const root = [];
  const tables = new Map();
  let currentName = "";
  let currentLines = root;

  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (match) {
      currentName = match[1].trim();
      currentLines = [line];
      tables.set(currentName, currentLines);
      continue;
    }

    currentLines.push(line);
  }

  return { root, tables };
}

function tableBlock(tables, name) {
  const direct = tables.get(name);
  return direct ? direct.join("\n").trimEnd() : "";
}

function serverBlocks(tables, name) {
  const prefix = `mcp_servers.${name}`;
  const blocks = [];

  for (const [tableName, lines] of tables) {
    if (tableName === prefix || tableName.startsWith(`${prefix}.`)) {
      blocks.push(lines.join("\n").trimEnd());
    }
  }

  return blocks.join("\n\n").trimEnd();
}

function normalizeBlock(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function removeServerBlocks(source, serverNames) {
  const canonicalNames = new Set(serverNames);
  const lines = source.split(/\r?\n/);
  const kept = [];
  let dropping = false;

  for (const line of lines) {
    const match = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (match) {
      const tableName = match[1].trim();
      const serverMatch = tableName.match(/^mcp_servers\.([^.]+)(?:\.|$)/);
      const serverName = serverMatch ? aliases.get(serverMatch[1]) ?? serverMatch[1] : "";
      dropping = Boolean(serverMatch && canonicalNames.has(serverName));
    }

    if (!dropping) {
      kept.push(line);
    }
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

function detectPackageManager(root) {
  if (fs.existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(root, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(root, "bun.lockb")) || fs.existsSync(path.join(root, "bun.lock"))) return "bun";
  return "npm";
}

const projectConfig = readFileIfExists(projectConfigPath);
if (!projectConfig) {
  console.error(`Missing project config: ${projectConfigPath}`);
  process.exit(1);
}

const homeConfig = readFileIfExists(homeConfigPath);
const projectTables = splitTomlTables(projectConfig).tables;
const homeTables = splitTomlTables(homeConfig).tables;
const packageManager = detectPackageManager(repoRoot);
const additions = [];

console.log(`ECC Codex sync: package manager detected as ${packageManager}.`);

for (const server of managedServers) {
  const desired = serverBlocks(projectTables, server);
  if (!desired) {
    console.warn(`warning: project config has no [mcp_servers.${server}] block.`);
    continue;
  }

  const aliasesForServer = [server, ...[...aliases].filter(([, canonical]) => canonical === server).map(([alias]) => alias)];
  const existingName = aliasesForServer.find((name) => serverBlocks(homeTables, name));
  const existing = existingName ? serverBlocks(homeTables, existingName) : "";

  if (updateMcp) {
    additions.push(desired);
    console.log(existing ? `update: [mcp_servers.${server}]` : `add: [mcp_servers.${server}]`);
    continue;
  }

  if (!existing) {
    additions.push(desired);
    console.log(`add: [mcp_servers.${server}]`);
    continue;
  }

  if (normalizeBlock(existing) !== normalizeBlock(desired)) {
    console.warn(`warning: [mcp_servers.${existingName}] differs from ECC [mcp_servers.${server}]. Use --update-mcp to replace it.`);
  }
}

let nextConfig = homeConfig.trimEnd();
if (updateMcp) {
  nextConfig = removeServerBlocks(nextConfig, managedServers);
}

if (additions.length) {
  nextConfig = [nextConfig, additions.join("\n\n")].filter(Boolean).join("\n\n").trimEnd();
}

if (!nextConfig.endsWith("\n")) {
  nextConfig += "\n";
}

fs.mkdirSync(path.dirname(homeConfigPath), { recursive: true });
fs.writeFileSync(homeConfigPath, nextConfig, "utf8");
console.log(`wrote: ${homeConfigPath}`);
