import { cp, mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";

const rootFiles = ["index.html", "script.js", "styles.css"];
const rootDirectories = ["assets", "wordle"];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of rootFiles) {
  await cp(file, `dist/${file}`);
}

for (const directory of rootDirectories) {
  await cp(directory, `dist/${directory}`, { recursive: true });
}

await build({
  entryPoints: ["wordle/game.js"],
  outfile: "dist/wordle/game.bundle.js",
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2020"],
  sourcemap: false,
});
