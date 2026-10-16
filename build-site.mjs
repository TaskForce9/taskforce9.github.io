import { cp, mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";

const rootFiles = ["index.html", "script.js", "styles.css"];
const rootDirectories = ["activity", "assets", "wordle"];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of rootFiles) {
  await cp(file, `dist/${file}`);
}

for (const directory of rootDirectories) {
  await cp(directory, `dist/${directory}`, { recursive: true });
}

const buildOptions = {
  entryPoints: ["wordle/game.js"],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2020"],
  sourcemap: false,
};

await mkdir("dist/wordle", { recursive: true });
await mkdir("dist/activity", { recursive: true });
await build({
  ...buildOptions,
  outfile: "dist/wordle/game.bundle.js",
});
await build({
  ...buildOptions,
  outfile: "dist/activity/game.bundle.js",
});
await cp("wordle/config.js", "dist/activity/config.js");
await cp("wordle/game.css", "dist/activity/game.css");
