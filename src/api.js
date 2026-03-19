import { Vercel } from "@vercel/sdk";

function createClient(token) {
  return new Vercel({ bearerToken: token });
}

function handleError(err) {
  const status = err?.statusCode ?? err?.status ?? err?.response?.status;
  const code = err?.code ?? err?.cause?.code;

  if (status === 401) {
    throw new Error("Token invalide ou expire. Contactez l'admin.");
  }
  if (status === 403) {
    throw new Error("Pas de permission sur ce projet/environnement.");
  }
  if (status === 404) {
    throw new Error("Projet introuvable.");
  }
  if (status === 429) {
    throw new Error(
      "Rate limit Vercel atteint. Reessayez dans quelques minutes."
    );
  }
  if (
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED"
  ) {
    throw new Error(
      "Impossible de joindre l'API Vercel. Verifiez votre connexion internet."
    );
  }

  throw err;
}

/**
 * List all Vercel projects, handling pagination.
 * @param {string} token
 * @param {string|null|undefined} teamId
 * @returns {Promise<Array<{id: string, name: string, framework: string}>>}
 */
export async function listProjects(token, teamId) {
  const vercel = createClient(token);
  const projects = [];
  let from;

  try {
    do {
      const params = { limit: 100, ...(from !== undefined ? { from } : {}) };
      if (teamId) params.teamId = teamId;

      const res = await vercel.projects.getProjects(params);
      const page = res.projects ?? [];
      for (const p of page) {
        projects.push({ id: p.id, name: p.name, framework: p.framework });
      }
      from = res.pagination?.next ?? undefined;
    } while (from !== undefined);
  } catch (err) {
    handleError(err);
  }

  return projects;
}

/**
 * List all env vars for a project with decryption, handling pagination.
 * @param {string} token
 * @param {string} projectId
 * @param {string|null|undefined} teamId
 * @returns {Promise<Array<{id: string, key: string, value: string, type: string, target: string[], comment: string}>>}
 */
export async function listEnvVars(token, projectId, teamId) {
  const vercel = createClient(token);
  const envVars = [];
  let from;

  try {
    do {
      const params = {
        idOrName: projectId,
        decrypt: true,
        ...(from !== undefined ? { from } : {}),
      };
      if (teamId) params.teamId = teamId;

      const res = await vercel.projects.filterProjectEnvs(params);
      const page = res.envs ?? [];
      for (const e of page) {
        envVars.push({
          id: e.id,
          key: e.key,
          value: e.value,
          type: e.type,
          target: e.target,
          comment: e.comment,
        });
      }
      from = res.pagination?.next ?? undefined;
    } while (from !== undefined);
  } catch (err) {
    handleError(err);
  }

  return envVars;
}

/**
 * Create (or upsert) an env var on a project.
 * @param {string} token
 * @param {string} projectId
 * @param {{ key: string, value: string, type: string, target: string[], comment?: string }} envVar
 * @param {string|null|undefined} teamId
 */
export async function createEnvVar(
  token,
  projectId,
  { key, value, type, target, comment },
  teamId
) {
  const vercel = createClient(token);

  try {
    const params = {
      idOrName: projectId,
      upsert: true,
      requestBody: { key, value, type, target, comment },
    };
    if (teamId) params.teamId = teamId;

    return await vercel.projects.createProjectEnv(params);
  } catch (err) {
    handleError(err);
  }
}

/**
 * Edit an existing env var.
 * @param {string} token
 * @param {string} projectId
 * @param {string} envId
 * @param {{ value?: string, type?: string, target?: string[], comment?: string }} updates
 * @param {string|null|undefined} teamId
 */
export async function editEnvVar(token, projectId, envId, updates, teamId) {
  const vercel = createClient(token);

  try {
    const params = {
      idOrName: projectId,
      id: envId,
      requestBody: updates,
    };
    if (teamId) params.teamId = teamId;

    return await vercel.projects.editProjectEnv(params);
  } catch (err) {
    handleError(err);
  }
}

/**
 * Delete an env var from a project.
 * @param {string} token
 * @param {string} projectId
 * @param {string} envId
 * @param {string|null|undefined} teamId
 */
export async function deleteEnvVar(token, projectId, envId, teamId) {
  const vercel = createClient(token);

  try {
    const params = {
      idOrName: projectId,
      id: envId,
    };
    if (teamId) params.teamId = teamId;

    return await vercel.projects.removeProjectEnv(params);
  } catch (err) {
    handleError(err);
  }
}
