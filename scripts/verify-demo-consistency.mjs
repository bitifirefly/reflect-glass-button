import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const demoPages = [
  "demo/index.html",
  "demo/showcase.html",
  "demo/readme-shot.html",
  "demo/motion-shot.html",
];

const requiredHeadScript = '<script src="../src/reflect-glass-prepaint.js"></script>';
const requiredCssLink = '<link rel="stylesheet" href="../src/reflect-glass-button.css" />';
const requiredRuntime = "window.ReflectGlassButton.init();";

const cssPath = path.join(repoRoot, "src/reflect-glass-button.css");
const jsPath = path.join(repoRoot, "src/reflect-glass-button.js");
const prepaintPath = path.join(repoRoot, "src/reflect-glass-prepaint.js");
const readmePath = path.join(repoRoot, "README.md");
const implementationPath = path.join(repoRoot, "IMPLEMENTATION.md");
const requiredAssetFiles = [
  "assets/default-pill/displacement-map.png",
  "assets/default-pill/specular-map.png",
  "assets/circle-button/displacement-map.png",
  "assets/circle-button/specular-map.png",
  "assets/rounded-square-button/displacement-map.png",
  "assets/rounded-square-button/specular-map.png",
];

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyDemoPages() {
  for (const relPath of demoPages) {
    const html = read(relPath);
    const headScriptIndex = html.indexOf(requiredHeadScript);
    const cssLinkIndex = html.indexOf(requiredCssLink);
    assert(headScriptIndex !== -1, `${relPath}: missing shared prepaint script`);
    assert(cssLinkIndex !== -1, `${relPath}: missing core stylesheet link`);
    assert(
      headScriptIndex < cssLinkIndex,
      `${relPath}: prepaint script must load before core stylesheet`
    );
    assert(html.includes(requiredRuntime), `${relPath}: missing runtime init call`);
  }

  const showcaseHtml = read("demo/showcase.html");
  assert(
    showcaseHtml.includes('href="../assets/circle-button/displacement-map.png"'),
    'demo/showcase.html: missing circle-button filter wiring'
  );
  assert(
    showcaseHtml.includes('href="../assets/rounded-square-button/displacement-map.png"'),
    'demo/showcase.html: missing rounded-square-button filter wiring'
  );
  assert(
    showcaseHtml.includes('data-reflect-glass-anchor="#circle-anchor"'),
    'demo/showcase.html: missing circle button anchor wiring'
  );
  assert(
    showcaseHtml.includes('data-reflect-glass-anchor="#square-anchor"'),
    'demo/showcase.html: missing rounded-square button anchor wiring'
  );
}

function verifyCoreRuntime() {
  const css = fs.readFileSync(cssPath, "utf8");
  const js = fs.readFileSync(jsPath, "utf8");
  const prepaint = fs.readFileSync(prepaintPath, "utf8");

  assert(
    css.includes('backdrop-filter: var(--reflect-glass-filter);'),
    "src/reflect-glass-button.css: chromium path is not using the direct filter value"
  );
  assert(
    css.includes('-webkit-backdrop-filter: var(--reflect-glass-filter);'),
    "src/reflect-glass-button.css: missing webkit direct filter value"
  );
  assert(
    js.includes("ReflectGlassPrepaint.detectBrowserEngine"),
    "src/reflect-glass-button.js: runtime is not delegating to the shared prepaint detector"
  );
  assert(
    prepaint.includes("root.dataset.browserEngine = engine;"),
    "src/reflect-glass-prepaint.js: prepaint detector does not stamp browser engine"
  );

  for (const relPath of requiredAssetFiles) {
    assert(fs.existsSync(path.join(repoRoot, relPath)), `${relPath}: missing required generated asset`);
  }
}

function verifyDocs() {
  const readme = fs.readFileSync(readmePath, "utf8");
  const implementation = fs.readFileSync(implementationPath, "utf8");

  assert(
    readme.includes("src/reflect-glass-prepaint.js"),
    "README.md: integration guide does not mention the shared prepaint script"
  );
  assert(
    readme.includes("data-reflect-glass-anchor"),
    "README.md: integration guide does not mention per-button anchor wiring"
  );
  assert(
    readme.includes("before the stylesheet"),
    "README.md: missing note about loading the prepaint script before CSS"
  );
  assert(
    implementation.includes("reflect-glass-prepaint.js"),
    "IMPLEMENTATION.md: integration contract does not mention the prepaint script"
  );
  assert(
    implementation.includes("data-reflect-glass-anchor"),
    "IMPLEMENTATION.md: missing per-button anchor guidance"
  );
}

try {
  verifyDemoPages();
  verifyCoreRuntime();
  verifyDocs();
  console.log("Consistency check passed: src, demo pages, and docs are aligned.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
