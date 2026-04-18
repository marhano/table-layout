var fs = require("fs");
var path = require("path");

var files = [
  "src/core/GridConfig.js",
  "src/core/GridEvents.js",
  "src/core/GridCore.js",
  "src/modules/GridRender.js",
  "src/modules/GridLayers.js",
  "src/modules/GridToolbar.js",
  "src/modules/GridZoom.js",
  "src/modules/GridFullscreen.js",
  "src/modules/GridDrag.js",
  "src/modules/GridResize.js",
  "src/modules/GridEdit.js",
  "src/modules/GridPlace.js",
  "src/modules/GridRooms.js",
  "src/TableLayout.js",
];

var banner = [
  "/*!",
  " * table-layout.js v" + require("./package.json").version,
  " * Restaurant Table Layout Grid Library",
  " * Built: " + new Date().toISOString(),
  " * Requires: jQuery 3+",
  " * License: MIT",
  " */",
  "",
].join("\n");

var bundle = files
  .map(function (f) {
    var content = fs.readFileSync(path.join(__dirname, f), "utf8");
    return "/* " + f + " */\n" + content;
  })
  .join("\n\n");

fs.mkdirSync("./dist", { recursive: true });

// JS
fs.writeFileSync("./dist/table-layout.js", banner + "\n" + bundle, "utf8");
console.log(
  "✅ JS  → dist/table-layout.js (" +
    (bundle.length / 1024).toFixed(1) +
    " KB)",
);

// CSS — copy from src
var css = fs.readFileSync("./table-layout.css", "utf8");
fs.writeFileSync("./dist/table-layout.css", css, "utf8");
console.log("\u2705 CSS → dist/table-layout.css");

// --- Copy to MVC project static assets ---
var mvcDir = "C:/Users/marjan.carullo/source/repos/OmniBusiness/OmniBusiness/wwwroot/libs/table-layout/";
try {
  fs.mkdirSync(mvcDir, { recursive: true });
  fs.copyFileSync("./dist/table-layout.js", path.join(mvcDir, "table-layout.js"));
  fs.copyFileSync("./dist/table-layout.css", path.join(mvcDir, "table-layout.css"));
  console.log("\u2705 Copied to MVC: " + mvcDir);
} catch (e) {
  console.error("\u26A0\uFE0F Failed to copy to MVC project:", e.message);
}
console.log("✅ CSS → dist/table-layout.css");
