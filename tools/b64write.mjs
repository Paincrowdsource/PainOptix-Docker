#!/usr/bin/env node
import fs from "fs"; import path from "path";
const [, , outPath, b64] = process.argv;
if (!outPath || !b64) { console.error("usage: node tools/b64write.mjs <path> <base64>"); process.exit(1); }
const p = path.resolve(outPath); fs.mkdirSync(path.dirname(p), { recursive: true });
fs.writeFileSync(p, Buffer.from(b64, "base64")); console.log("WROTE", p);
