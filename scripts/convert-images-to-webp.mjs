import { readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const supportedExtensions = new Set([".avif", ".gif", ".heic", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"]);
const skipWebp = process.argv.includes("--skip-webp");
const folderArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));

if (!folderArgument) {
  console.error("請指定圖片資料夾，例如：npm run images:webp -- ./assets/images/example");
  process.exit(1);
}

const targetDirectory = path.resolve(process.cwd(), folderArgument);
const targetStat = await stat(targetDirectory).catch(() => null);
if (!targetStat?.isDirectory()) {
  console.error(`找不到資料夾：${targetDirectory}`);
  process.exit(1);
}

async function collectImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectImages(entryPath);
    if (!entry.isFile()) return [];
    const extension = path.extname(entry.name).toLowerCase();
    return supportedExtensions.has(extension) ? [entryPath] : [];
  }));
  return nested.flat();
}

const allImages = await collectImages(targetDirectory);
const candidates = allImages.filter((sourcePath) =>
  !skipWebp || path.extname(sourcePath).toLowerCase() !== ".webp"
);
const jobsByTarget = new Map();

for (const sourcePath of candidates) {
  const extension = path.extname(sourcePath);
  const outputPath = `${sourcePath.slice(0, -extension.length)}.webp`;
  const current = jobsByTarget.get(outputPath);

  if (!current) {
    jobsByTarget.set(outputPath, sourcePath);
    continue;
  }

  const currentIsWebp = path.extname(current).toLowerCase() === ".webp";
  const sourceIsWebp = extension.toLowerCase() === ".webp";
  if (currentIsWebp !== sourceIsWebp) {
    jobsByTarget.set(outputPath, currentIsWebp ? sourcePath : current);
    continue;
  }

  console.error(`無法決定輸出檔案：${current} 與 ${sourcePath} 都會寫入 ${outputPath}`);
  process.exit(1);
}

const jobs = [...jobsByTarget.entries()].sort(([left], [right]) => left.localeCompare(right, "zh-Hant", { numeric: true }));
let convertedCount = 0;

for (const [outputPath, sourcePath] of jobs) {
  const outputBuffer = await sharp(sourcePath, { animated: true })
    .rotate()
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
  const temporaryPath = path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.${process.pid}.tmp`);
  await writeFile(temporaryPath, outputBuffer);
  await rename(temporaryPath, outputPath);
  convertedCount += 1;
  console.log(`${path.relative(targetDirectory, sourcePath)} → ${path.relative(targetDirectory, outputPath)}`);
}

const skippedCount = skipWebp
  ? allImages.length - candidates.length
  : allImages.filter((sourcePath) => {
      const extension = path.extname(sourcePath).toLowerCase();
      if (extension !== ".webp") return false;
      const outputPath = sourcePath;
      return jobsByTarget.get(outputPath) !== sourcePath;
    }).length;

console.log(`完成：轉換 ${convertedCount} 張圖片${skippedCount ? `，略過 ${skippedCount} 張既有 WebP` : ""}。`);
