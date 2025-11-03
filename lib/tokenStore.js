import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const TOKEN_FILE = path.join(DATA_DIR, "tokens.json");

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(TOKEN_FILE);
    } catch (_) {
      await fs.writeFile(TOKEN_FILE, JSON.stringify({}, null, 2), {
        encoding: "utf8",
      });
    }
  } catch (err) {
    throw new Error(`Failed to ensure data file: ${err}`);
  }
}

async function readAll() {
  await ensureDataFile();
  const raw = await fs.readFile(TOKEN_FILE, { encoding: "utf8" });
  try {
    return JSON.parse(raw || "{}");
  } catch (err) {
    // If corrupted, reset file
    await fs.writeFile(TOKEN_FILE, JSON.stringify({}, null, 2), {
      encoding: "utf8",
    });
    return {};
  }
}

async function writeAll(obj) {
  await ensureDataFile();
  const tmp = TOKEN_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2), { encoding: "utf8" });
  await fs.rename(tmp, TOKEN_FILE);
}

export async function save(provider, key, tokenObj) {
  if (!provider || !key) throw new Error("provider and key required");
  const all = await readAll();
  all[provider] = all[provider] || {};
  all[provider][key] = tokenObj;
  await writeAll(all);
}

export async function get(provider, key) {
  const all = await readAll();
  return (all[provider] || {})[key] || null;
}

export async function list(provider) {
  const all = await readAll();
  return Object.values(all[provider] || {});
}

export default { save, get, list };
