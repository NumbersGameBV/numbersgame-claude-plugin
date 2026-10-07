// Regenerates skills/numbers-game-wizard/ from the app's published skill seed,
// using the app's own renderer (no firm customisation) and splitter, the same code
// that builds the customer zip at /api/firms/skill?format=zip. Maintainers only:
// needs a checkout of numbersgame-app at /opt/numbersgame-app.
//   cd /opt/numbersgame-app && TSX_TSCONFIG_PATH=$PWD/tsconfig.json \
//     node_modules/.bin/tsx <this repo>/scripts/render-skill.ts <this repo>/skills/numbers-game-wizard

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { renderSkill, parseLabel } from "/opt/numbersgame-app/lib/skill/skill";
import { splitSkill } from "/opt/numbersgame-app/lib/skill/split";
const out = process.argv[2];
const body = readFileSync("/opt/numbersgame-app/scripts/skill-seed/NGWIZARD.md", "utf8");
const md = renderSkill(body, null);
if (md.includes("$FIRMTRIGGER") || md.includes("$FIRMSECTION")) throw new Error("placeholder survived");
const { skillMd, references } = splitSkill(md);
const files: [string, string][] = [["SKILL.md", skillMd], ...references.map((r) => [r.path, r.body] as [string, string])];
for (const [p, b] of files) { const f = join(out, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, b); }
console.log("label", parseLabel(body), "files", files.map(([p, b]) => `${p}:${b.length}`).join(" "));
