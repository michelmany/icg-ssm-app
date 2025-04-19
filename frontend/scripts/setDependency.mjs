import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Specify the path to your .env file
dotenv.config({ path: resolve(__dirname, "../../.env") });

const packageJsonPath = resolve(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const dependencyType = process.argv[2];
const githubUsername = process.env.GITHUB_USERNAME;

if (dependencyType === "local") {
  packageJson.dependencies["sd-tnrsm-library"] = "file:../../sd-tnrsm-library";
} else if (dependencyType === "git") {
  packageJson.dependencies[
    "sd-tnrsm-library"
  ] = `git+ssh://${githubUsername}@github.com/silicondales/sd-tnrsm-library.git#dev`;
}

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log(`Set sd-tnrsm-library dependency to ${dependencyType}`);
