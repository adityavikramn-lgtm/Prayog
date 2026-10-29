// Runs the verification suite and saves the real result for the pitch video.
//   npm run stats
// Writes src/generated/stats.json. Nothing in the video is typed by hand.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "renders", "test-results.json");
fs.mkdirSync(path.dirname(out), { recursive: true });

try {
  execSync(`npx vitest run --reporter=json --outputFile="${out}"`, { stdio: "inherit" });
} catch {
  // A failing suite still writes its report; we record the failure honestly below.
}

const report = JSON.parse(fs.readFileSync(out, "utf8"));
const stats = {
  testsPassed: report.numPassedTests,
  testsTotal: report.numTotalTests,
  allPassed: report.success === true && report.numFailedTests === 0,
  generatedOn: new Date().toISOString().slice(0, 10),
};

const dest = path.join(root, "src", "generated", "stats.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(stats, null, 2) + "\n");
console.log(`Saved ${path.relative(root, dest)}: ${stats.testsPassed}/${stats.testsTotal} tests passed`);
