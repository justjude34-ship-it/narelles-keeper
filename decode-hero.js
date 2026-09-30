const fs = require("fs");
const path = require("path");
const dir = __dirname;
const assets = path.join(dir, "assets");
if (!fs.existsSync(assets)) {
  console.log("No assets dir; skip hero decode");
  process.exit(0);
}
const parts = fs.readdirSync(assets)
  .filter((f) => /^lotus-cool-cyan-hero-\d+\.b64$/.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/(\d+)/)[1], 10);
    const nb = parseInt(b.match(/(\d+)/)[1], 10);
    return na - nb;
  });
if (!parts.length) {
  console.log("No hero b64 parts; skip (video hosted externally)");
  process.exit(0);
}
const b64 = parts.map((f) => fs.readFileSync(path.join(assets, f), "utf8")).join("");
fs.mkdirSync(assets, { recursive: true });
const outFile = path.join(assets, "lotus-cool-cyan-hero.mp4");
fs.writeFileSync(outFile, Buffer.from(b64, "base64"));
console.log("Wrote", outFile, fs.statSync(outFile).size, "bytes from", parts.length, "parts");
