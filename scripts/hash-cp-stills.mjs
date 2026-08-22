import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cpDirectory = path.join(projectRoot, "assets/images/still/CP");
const galleryFile = path.join(projectRoot, "src/still/still.js");
const supportedExtensions = new Set([".avif", ".gif", ".heic", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"]);
const maximumStills = 20;
const mappingPattern = /const STILL_FILES = Object\.freeze\(\{[\s\S]*?\n  \}\);/;

const gallerySource = await readFile(galleryFile, "utf8");
const mappingBlock = gallerySource.match(mappingPattern)?.[0];

if (!mappingBlock) {
  throw new Error(`找不到 ${path.relative(projectRoot, galleryFile)} 內的 STILL_FILES 設定。`);
}

const existingMapping = [...mappingBlock.matchAll(/"(\d{2})":\s*"([^"]+)"/g)]
  .map(([, id, filename]) => ({ id, filename }));
const directoryEntries = await readdir(cpDirectory, { withFileTypes: true });
const sourceFilenames = directoryEntries
  .filter((entry) => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => entry.name);
const sourceSet = new Set(sourceFilenames);

const orderedFilenames = [
  ...existingMapping
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(({ filename }) => filename)
    .filter((filename) => sourceSet.has(filename)),
  ...sourceFilenames
    .filter((filename) => !existingMapping.some((item) => item.filename === filename))
    .sort((left, right) => left.localeCompare(right, "zh-Hant", { numeric: true })),
];

if (orderedFilenames.length > maximumStills) {
  throw new Error(`CP 資料夾有 ${orderedFilenames.length} 張圖片，但劇照收藏目前最多支援 ${maximumStills} 張。`);
}

await mkdir(cpDirectory, { recursive: true });

const converted = [];
for (const filename of orderedFilenames) {
  const sourcePath = path.join(cpDirectory, filename);
  const extension = path.extname(filename).toLowerCase();
  const webpBuffer = extension === ".webp"
    ? await readFile(sourcePath)
    : await sharp(sourcePath).rotate().webp({ quality: 90, effort: 6 }).toBuffer();
  const hash = createHash("sha256").update(webpBuffer).digest("hex");
  converted.push({ filename, hashedFilename: `${hash}.webp`, webpBuffer });
}

for (const { hashedFilename, webpBuffer } of converted) {
  await writeFile(path.join(cpDirectory, hashedFilename), webpBuffer);
}

const retainedFiles = new Set(converted.map(({ hashedFilename }) => hashedFilename));
for (const filename of sourceFilenames) {
  if (!retainedFiles.has(filename)) await unlink(path.join(cpDirectory, filename));
}

const mappingLines = converted.map(({ hashedFilename }, index) =>
  `    "${String(index + 1).padStart(2, "0")}": "${hashedFilename}",`
);
const updatedMapping = `const STILL_FILES = Object.freeze({\n${mappingLines.join("\n")}\n  });`;
await writeFile(galleryFile, gallerySource.replace(mappingPattern, updatedMapping), "utf8");

console.log(`已處理 ${converted.length} 張劇照：`);
converted.forEach(({ filename, hashedFilename }, index) => {
  console.log(`${String(index + 1).padStart(2, "0")}  ${filename} → ${hashedFilename}`);
});
console.log("劇照收藏連結已同步更新。");
