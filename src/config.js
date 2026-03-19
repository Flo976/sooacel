import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';

const ENV_PATH = join(homedir(), '.sooacel', '.env');

const ACCOUNTS = [
  { name: "Dexyu (team)", key: "dexyu", tokenVar: "VERCEL_TOKEN_DEXYU", teamIdVar: "VERCEL_TEAM_DEXYU" },
  { name: "Eanet", key: "eanet", tokenVar: "VERCEL_TOKEN_EANET", teamIdVar: null },
  { name: "Sooatek", key: "sooatek", tokenVar: "VERCEL_TOKEN_SOOATEK", teamIdVar: null },
];

const LINE_REGEX = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/;

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(LINE_REGEX);
    if (match) {
      vars[match[1]] = match[2];
    }
  }
  return vars;
}

function checkFilePermissions(filePath) {
  const os = platform();
  if (os === 'linux' || os === 'darwin') {
    try {
      const stat = statSync(filePath);
      if ((stat.mode & 0o077) !== 0) {
        process.stderr.write(
          `Warning: ~/.sooacel/.env has loose permissions (mode ${(stat.mode & 0o777).toString(8)}). ` +
          `Run: chmod 600 ~/.sooacel/.env\n`
        );
      }
    } catch {
      // Ignore stat errors — file existence already checked before this call
    }
  }
}

export function loadAccounts() {
  let vars;
  try {
    checkFilePermissions(ENV_PATH);
    vars = parseEnvFile(ENV_PATH);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error("Fichier ~/.sooacel/.env introuvable. Lancez le script d'installation.");
    }
    throw err;
  }

  return ACCOUNTS
    .map(({ name, key, tokenVar, teamIdVar }) => {
      const token = vars[tokenVar] ?? '';
      const teamId = teamIdVar ? (vars[teamIdVar] ?? null) : null;
      return { name, key, token, teamId };
    })
    .filter(({ token }) => token !== '');
}
