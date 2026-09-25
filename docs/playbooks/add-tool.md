# Playbook — add a tool

Use this when the behaviour you need already exists as an engine operation. If it does not, the
operation must be added first (engine lane, separate change) with golden fixtures from cited sources.

## 1. Pick or create the preset

- Presets live in `presets/<engine>/<name>.yaml` and configure exactly one operation (`operation: <id>@<major>`).
- Values the user calculates with (amounts, rates, what to solve for) are operation **inputs** → `fields`.
- Settings that change how the operation behaves (indent, direction, variant) are operation **params** → `userOptions`.
- Keyed maps only (`fields`, `outputs`, `userOptions`, `samples`); use `visible: false` or `visibleWhen` instead of deleting.
- Every `labelKey` / `titleKey` must have an English string under `strings.en`.
- Presets never contain formulas or expressions.

## 2. Scaffold the tool

```
pnpm new:tool <slug> --preset <engine/name> --category <category-id> --tier <T1|T2|T3|T4> --archetype <A|B|C|D|E>
```

This creates `tools/<slug>/manifest.yaml`, `content.md` and `fixtures/001-sample.yaml`. The scaffold
fails validation until you write the SEO and content text it asks for.

## 3. Fill in the manifest

- `seo.title` 30–60 characters and containing `seo.primaryKeyword`; `seo.description` 120–160 characters.
- `seo.primaryKeyword` must not be used by any other tool.
- T1/T2 tools need `quality.verifiedAgainst` and `quality.lastVerified`.
- Slugs are the search phrase in kebab-case and may not collide with categories or reserved slugs.

## 4. Write the content

`content.md` sections: T1/T2 need `## How to use`, `## Method`, `## Worked example`, `## FAQ`, `## References`.
T3/T4 need `## How to use` and `## FAQ`. FAQ questions are `###` headings. Do not link to other websites;
cite references as plain text. Set `example: <fixture-id>` in front matter to render the worked-example table.

## 5. Add fixtures

Tool fixtures live in `tools/<slug>/fixtures/NNN-description.yaml` and reference the preset:
T1 ≥ 3, T2 ≥ 2, T3/T4 ≥ 1. Cite the source. Never change the expected values of an existing fixture.

## 6. Verify

```
pnpm verify
pnpm dev        # open http://localhost:4321/<slug> and run the sample
pnpm build
pnpm test:e2e
```
