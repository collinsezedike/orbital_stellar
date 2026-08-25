import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
// attestation.schema.json declares JSON Schema 2020-12, so it needs ajv's
// 2020 entry point rather than the draft-07 default export.
import Ajv2020 from "ajv/dist/2020.js";
import { validateAttestationDocument } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = resolve(__dirname, "../schemas");
const FIXTURES_DIR = resolve(__dirname, "fixtures/attestations");

const FIXTURE_FILES = ["usdc.json", "eurc.json", "aqua.json", "native-asset-wrapper.json"];

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf-8"));
}

const attestationSchema = readJson(resolve(SCHEMA_DIR, "attestation.schema.json"));

function compileAttestationSchema() {
  const ajv = new Ajv2020({ allErrors: true });
  ajv.addFormat("date-time", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  return ajv.compile(attestationSchema);
}

const validateAgainstSchema = compileAttestationSchema();

describe("well-known SAC attestation fixtures", () => {
  it.each(FIXTURE_FILES)("%s validates against attestation.schema.json", (file) => {
    const doc = readJson(resolve(FIXTURES_DIR, file));
    const valid = validateAgainstSchema(doc);
    expect(validateAgainstSchema.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it.each(FIXTURE_FILES)("%s validates via validateAttestationDocument", (file) => {
    const doc = readJson(resolve(FIXTURES_DIR, file));
    expect(validateAttestationDocument(doc)).toEqual({ valid: true });
  });

  it.each(FIXTURE_FILES)('%s has executableKind "stellarAsset" and no wasmHash', (file) => {
    const doc = readJson(resolve(FIXTURES_DIR, file)) as Record<string, unknown>;
    expect(doc["executableKind"]).toBe("stellarAsset");
    expect(doc["wasmHash"]).toBeUndefined();
  });
});
