/**
 * Embed live verified businesses for Jimbot hybrid search.
 * Usage: node scripts/embed-businesses.mjs
 * Reads OPENAI_API_KEY from supabase/functions/.env (or process env).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = path.join(root, "supabase/functions/.env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBED_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY missing");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function contentFor(row) {
  return [
    row.name,
    row.business_type,
    row.city,
    row.about,
    Array.isArray(row.specialties) ? row.specialties.join(", ") : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function embed(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.data[0].embedding;
}

const { data: businesses, error } = await supabase
  .from("businesses")
  .select("id,name,business_type,city,about,specialties")
  .eq("live", true)
  .eq("verification_status", "verified");

if (error) {
  console.error(error);
  process.exit(1);
}

const { data: existing } = await supabase.from("business_embeddings").select("business_id,content_hash");
const byId = new Map((existing ?? []).map((r) => [r.business_id, r.content_hash]));

let written = 0;
let skipped = 0;
for (const row of businesses ?? []) {
  const text = contentFor(row);
  const content_hash = hash(text);
  if (byId.get(row.id) === content_hash) {
    skipped += 1;
    continue;
  }
  const embedding = await embed(text);
  const { error: upErr } = await supabase.from("business_embeddings").upsert({
    business_id: row.id,
    embedding,
    content_hash,
    updated_at: new Date().toISOString(),
  });
  if (upErr) {
    console.error("upsert failed", row.id, upErr.message);
    continue;
  }
  written += 1;
  console.log("embedded", row.name);
}

console.log(`done: wrote ${written}, skipped ${skipped}, total ${businesses?.length ?? 0}`);
