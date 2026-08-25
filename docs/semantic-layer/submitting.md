# Submitting a taxonomy entry or entity label

This is a how-to for contributing to the [semantic layer](../semantic-layer.md):
either a taxonomy entry (mapping a raw event topic pattern to a canonical
name like `swap.executed`) or an entity label (attaching a human-readable
name to a contract address). Both are open data, submitted the same way as
any other change: a pull request against `main`.

For the general PR workflow (forking, branch naming, running checks
locally, the Stellar Wave Program), see
[`CONTRIBUTING.md`](../../CONTRIBUTING.md). This document only covers what's
specific to semantic data: the two record shapes, where files live, and what
the automated review checks look for.

---

## Which one do I want?

- **Taxonomy entry** — you're mapping *what an event means*: "this raw
  `swap` topic pattern, emitted by contracts in this scope, means
  `swap.executed`." Schema:
  [`packages/abi-registry/schema/taxonomy.schema.json`](../../packages/abi-registry/schema/taxonomy.schema.json).
- **Entity label** — you're mapping *who a contract is*: "this contract
  address is Circle's USDC issuer." Schema:
  [`packages/abi-registry/schemas/label.schema.json`](../../packages/abi-registry/schemas/label.schema.json).

A submission needs only one of the two, not both.

---

## Submitting a taxonomy entry

1. Read the naming rules in the schema's `$defs.TaxonomyName` description
   (namespace roots, casing, the collision policy) — they're normative,
   not just guidance.
2. Add a new JSON file under
   [`packages/abi-registry/schema/examples/taxonomy/`](../../packages/abi-registry/schema/examples/taxonomy/)
   (for illustrative submissions) or wherever the maintainers direct real
   protocol mappings to land, conforming to `taxonomy.schema.json`.
3. Pick the narrowest `scope` that's honest: `contract` (specific deployed
   addresses) is safest; `wasmHash` covers every deployment of one reviewed
   build; `interface` (e.g. `SEP-41`) is broadest and must only be used for
   events the SEP itself defines.
4. Fill in `provenance` with at least one source URL — a claim with no
   traceable evidence isn't reviewable.

### Worked example: a DEX swap event

```json
{
  "id": "swap-executed-example-dex",
  "version": "1.0.0",
  "name": "swap.executed",
  "title": "Swap executed",
  "description": "ILLUSTRATIVE EXAMPLE - not a mapping for any real deployed protocol. Shows the shape a DEX swap submission takes: a contract-scoped entry, map-shaped data, and parameters projected out of both topic slots and data keys.",
  "match": {
    "topics": [
      { "kind": "symbol", "symbol": "swap" },
      { "kind": "any", "type": "address", "doc": "Account that initiated the swap." }
    ],
    "trailingTopics": "forbidden",
    "dataShape": "map"
  },
  "parameters": {
    "account": { "from": "topic", "index": 1, "type": "address" },
    "token_in": { "from": "data", "path": "token_in", "type": "address" },
    "token_out": { "from": "data", "path": "token_out", "type": "address" },
    "amount_in": { "from": "data", "path": "amount_in", "type": "i128" },
    "amount_out": { "from": "data", "path": "amount_out", "type": "i128" }
  },
  "scope": {
    "kind": "contract",
    "contractIds": ["CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"],
    "networks": ["mainnet"]
  },
  "provenance": {
    "submittedBy": "@ezedike-evan",
    "submittedAt": "2026-07-29T00:00:00Z",
    "sources": [
      "https://github.com/orbital-stellar/orbital_stellar/blob/main/ROADMAP.md",
      "https://github.com/orbital-stellar/orbital_stellar/blob/main/packages/abi-registry/schema/taxonomy.schema.json"
    ]
  }
}
```

Full file:
[`schema/examples/taxonomy/swap-executed-example-dex.json`](../../packages/abi-registry/schema/examples/taxonomy/swap-executed-example-dex.json).
A second worked example — a `payment.sent` entry scoped to `SEP-41` rather
than a specific contract — lives alongside it at
[`payment-sent-sep41-transfer.json`](../../packages/abi-registry/schema/examples/taxonomy/payment-sent-sep41-transfer.json).

---

## Submitting an entity label

1. Confirm the contract ID is the canonical mainnet Soroban address
   (C-prefixed, 56 characters).
2. Pick an honest `confidence` — the schema's description spells out what
   each value means (`1.0` verified on-chain or signed attestation down to
   `0.3` heuristic inference).
3. Add at least one verifiable `sources` URL: official project docs, an
   explorer link, a signed attestation, or a published audit.
4. Don't label a contract you own or control — reviewers run an automated
   conflict-of-interest check comparing `submittedBy` against `label`, and a
   flagged submission needs manual review either way.
5. Add the record as a new JSON file conforming to `label.schema.json`.
   Real production labels live under
   [`data/labels/`](../../data/labels/); illustrative examples for docs
   live under
   [`packages/abi-registry/schema/examples/labels/`](../../packages/abi-registry/schema/examples/labels/).

### Worked example: a protocol label

```json
{
  "schemaVersion": "1.0.0",
  "contractId": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
  "label": "Example DEX Router",
  "entityType": "protocol",
  "confidence": 0.5,
  "sources": [
    "https://github.com/orbital-stellar/orbital_stellar/blob/main/ROADMAP.md",
    "https://github.com/orbital-stellar/orbital_stellar/blob/main/packages/abi-registry/schemas/label.schema.json"
  ],
  "verifiedAt": "2026-08-01T00:00:00Z",
  "submittedBy": "@orbital-example",
  "notes": "ILLUSTRATIVE EXAMPLE - not a real deployed protocol. Shows the shape a protocol-router label submission takes: entityType \"protocol\", confidence 0.5 for community consensus with partial evidence, and multiple source URLs."
}
```

Full file:
[`schema/examples/labels/protocol-router-example-dex.json`](../../packages/abi-registry/schema/examples/labels/protocol-router-example-dex.json).
For a real, fully-verified example see
[`data/labels/circle-usdc.json`](../../data/labels/circle-usdc.json)
(`confidence: 1.0`, sourced against Circle's own documentation).

---

## What review checks apply

The `Validate semantic data` GitHub Actions workflow
(`.github/workflows/validate-data.yml`) runs on every pull request touching
`data/**` or `packages/abi-registry/schema*/**` and gates merge on:

- **Schema validation** — every label file in `data/labels/` and every file
  under the example directories must validate against its schema.
- **Duplicate detection** — no two label files may share a `contractId`.
- **Source URL well-formedness** — every `sources` entry must parse as an
  `http:`/`https:` URL.
- **Conflict-of-interest check** — flags a label whose `submittedBy` handle
  appears inside its own `label` text, for manual reviewer attention.

Taxonomy entries are additionally checked for collisions
(`findTaxonomyConflicts()` in `@orbital-stellar/abi-registry`): two entries
whose match pattern and scope can cover the same contract are a collision
unless one lists the other in `supersedes`.

Beyond the automated gate, a maintainer reviews the submission per the
[Stellar Wave Program flow](../../CONTRIBUTING.md#stellar-wave-program) —
comment on the issue to signal intent, get assigned, then open the PR.

---

## Related reading

- [`../semantic-layer.md`](../semantic-layer.md) — what the semantic layer
  is and how mappings and labels resolve at runtime.
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) — the general PR workflow.
- [`.github/ISSUE_TEMPLATE/taxonomy-mapping.yml`](../../.github/ISSUE_TEMPLATE/taxonomy-mapping.yml)
  and
  [`entity-label.yml`](../../.github/ISSUE_TEMPLATE/entity-label.yml) —
  issue templates for signaling intent before you submit.
