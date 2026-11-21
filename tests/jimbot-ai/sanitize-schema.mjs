/**
 * Regression: OpenAI strict json_schema sanitizer must keep property key "title"
 * and rewrite nullable objects to anyOf. Mirrors supabase/functions/jimbot/index.ts.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "supabase/functions/jimbot/response-schema.json"), "utf8"),
);
const tools = JSON.parse(
  fs.readFileSync(path.join(root, "supabase/functions/jimbot/tools.json"), "utf8"),
);

function sanitizeSchemaForOpenAI(schema) {
  if (Array.isArray(schema)) return schema.map(sanitizeSchemaForOpenAI);
  if (!schema || typeof schema !== "object") return schema;
  const type = schema.type;
  if (
    Array.isArray(type) &&
    type.includes("object") &&
    type.includes("null") &&
    schema.properties
  ) {
    const objectSchema = {
      type: "object",
      properties: sanitizeSchemaForOpenAI(schema.properties),
      additionalProperties: schema.additionalProperties ?? false,
    };
    if (Array.isArray(schema.required)) objectSchema.required = schema.required;
    return { anyOf: [objectSchema, { type: "null" }] };
  }
  const blockedKeys = new Set(["$schema", "examples", "default"]);
  const clean = {};
  for (const [key, value] of Object.entries(schema)) {
    if (blockedKeys.has(key)) continue;
    if ((key === "title" || key === "description") && typeof value === "string") continue;
    clean[key] = sanitizeSchemaForOpenAI(value);
  }
  return clean;
}

function sanitizeToolsForOpenAI(tools) {
  if (Array.isArray(tools)) return tools.map(sanitizeToolsForOpenAI);
  if (!tools || typeof tools !== "object") return tools;
  const blocked = new Set(["uniqueItems"]);
  const out = {};
  for (const [k, v] of Object.entries(tools)) {
    if (blocked.has(k)) continue;
    out[k] = sanitizeToolsForOpenAI(v);
  }
  return out;
}

const clean = sanitizeSchemaForOpenAI(schema);
const draft = clean.properties.itineraryDraft;
assert.ok(draft.anyOf, "nullable itineraryDraft should become anyOf");
assert.ok(draft.anyOf[0].properties.title, "property key title must survive sanitizer");
assert.deepEqual(draft.anyOf[0].required, ["title", "area", "days"]);

const cleanTools = sanitizeToolsForOpenAI(tools);
const dump = JSON.stringify(cleanTools);
assert.equal(dump.includes('"uniqueItems"'), false, "uniqueItems must be stripped from tools");

console.log("sanitize-schema: ok");
