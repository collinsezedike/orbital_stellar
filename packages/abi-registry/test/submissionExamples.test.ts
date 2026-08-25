import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
// Both schemas declare JSON Schema 2020-12, so they need ajv's 2020 entry
// point rather than the draft-07 default export.
import Ajv2020 from "ajv/dist/2020.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = resolve(__dirname, "../schema");
const SCHEMAS_DIR = resolve(__dirname, "../schemas");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function compile(schemaPath: string) {
  const ajv = new Ajv2020({ allErrors: true });
  ajv.addFormat("date-time", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  return ajv.compile(readJson(schemaPath));
}

/**
 * The two worked examples docs/semantic-layer/submitting.md walks through:
 * one taxonomy entry, one entity label. Both must validate against their
 * respective schemas, per #25's "Done when".
 */
describe("docs/semantic-layer/submitting.md worked examples", () => {
  it("the taxonomy entry example validates against taxonomy.schema.json", () => {
    const validate = compile(resolve(SCHEMA_DIR, "taxonomy.schema.json"));
    const doc = readJson(resolve(SCHEMA_DIR, "examples/taxonomy/swap-executed-example-dex.json"));

    const valid = validate(doc);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it("the entity label example validates against label.schema.json", () => {
    const validate = compile(resolve(SCHEMAS_DIR, "label.schema.json"));
    const doc = readJson(resolve(SCHEMA_DIR, "examples/labels/protocol-router-example-dex.json"));

    const valid = validate(doc);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });
});
