import chalk from "chalk";

export function showSuccess(message) {
  console.log(chalk.green(`✅ ${message}`));
}

export function showError(message) {
  console.error(chalk.red(`❌ ${message}`));
}

export function showWarning(message) {
  console.log(chalk.yellow(`⚠️  ${message}`));
}

export function showEnvVarList(vars, projectName, accountName, { showValues = false } = {}) {
  if (!vars || vars.length === 0) {
    console.log("  Aucune variable d'environnement.");
    return;
  }

  console.log("");
  console.log(`  Variables d'environnement — ${projectName} (${accountName})`);
  console.log("");

  const headers = { name: "Nom", value: "Valeur", type: "Type", envs: "Environnements" };

  const rows = vars.map((v) => ({
    name: v.key || v.name || "",
    value: showValues ? (v.value || "") : maskValue(v.value),
    type: v.type || "",
    envs: Array.isArray(v.target)
      ? v.target.join(", ")
      : v.environments
        ? v.environments.join(", ")
        : "",
  }));

  const colName = Math.max(headers.name.length, ...rows.map((r) => r.name.length));
  const colValue = Math.max(headers.value.length, ...rows.map((r) => r.value.length));
  const colType = Math.max(headers.type.length, ...rows.map((r) => r.type.length));

  const pad = (str, width) => str + " ".repeat(Math.max(0, width - str.length));

  console.log(
    `  ${chalk.bold(pad(headers.name, colName))}   ${chalk.bold(pad(headers.value, colValue))}   ${chalk.bold(pad(headers.type, colType))}   ${chalk.bold(headers.envs)}`
  );

  for (const row of rows) {
    console.log(
      `  ${pad(row.name, colName)}   ${chalk.dim(pad(row.value, colValue))}   ${chalk.dim(pad(row.type, colType))}   ${row.envs}`
    );
  }

  console.log("");
  console.log(`  ${vars.length} variable(s)`);
}

export function maskValue(value) {
  if (!value || value.length < 4) return "****";
  return value.substring(0, 4) + "****";
}

export function showHeader() {
  const logo = [
    "",
    chalk.bold.white("   ███████╗  ██████╗   ██████╗   █████╗   ██████╗ ███████╗ ██╗     "),
    chalk.bold.white("   ██╔════╝ ██╔═══██╗ ██╔═══██╗ ██╔══██╗ ██╔════╝ ██╔════╝ ██║     "),
    chalk.bold.white("   ███████╗ ██║   ██║ ██║   ██║ ███████║ ██║      █████╗   ██║     "),
    chalk.bold.white("   ╚════██║ ██║   ██║ ██║   ██║ ██╔══██║ ██║      ██╔══╝   ██║     "),
    chalk.bold.white("   ███████║ ╚██████╔╝ ╚██████╔╝ ██║  ██║ ╚██████╗ ███████╗ ███████╗"),
    chalk.bold.white("   ╚══════╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═╝  ╚═════╝ ╚══════╝ ╚══════╝"),
    "",
    chalk.dim("   Vercel Env Manager — by sooatek."),
    "",
  ];
  console.log(logo.join("\n"));
}
