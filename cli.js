#!/usr/bin/env node
import { readFile, stat, readdir, writeFile } from "node:fs/promises";
import { resolve, join, basename, extname, dirname, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { Command } from "commander";
import { marked } from "marked";
import { EPub } from "epub-gen-memory";

const TEXT_EXTS = new Set([".md", ".markdown", ".txt"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

const program = new Command();
program
  .name("bookbind")
  .description("Convert markdown/text/directories into a Kindle-friendly EPUB")
  .argument("<input>", "File or directory to convert")
  .option("-o, --output <file>", "Output .epub path")
  .option("-t, --title <title>", "Book title")
  .option("-a, --author <author>", "Author name", "Unknown")
  .option("-c, --cover <image>", "Cover image path")
  .option("--lang <lang>", "Language code", "en")
  .option("--description <desc>", "Book description")
  .parse();

const opts = program.opts();
const inputPath = resolve(program.args[0]);

try {
  await run(inputPath, opts);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

async function run(input, opts) {
  const info = await stat(input);
  const isDir = info.isDirectory();

  const defaultTitle = basename(input, extname(input)).replace(/[-_]/g, " ");
  const title = opts.title || defaultTitle;
  const output = resolve(opts.output || `${basename(input, extname(input))}.epub`);

  const chapters = isDir
    ? await chaptersFromDirectory(input)
    : await chaptersFromFile(input);

  if (chapters.length === 0) {
    throw new Error("No convertible content found (looked for .md, .markdown, .txt).");
  }

  console.log(`Building EPUB: "${title}" (${chapters.length} chapter${chapters.length === 1 ? "" : "s"})`);

  const epubOptions = {
    title,
    author: opts.author,
    lang: opts.lang,
    description: opts.description,
    cover: opts.cover ? pathToFileURL(resolve(opts.cover)).href : undefined,
    tocTitle: "Contents",
    ignoreFailedDownloads: true,
  };

  const buffer = await new EPub(epubOptions, chapters).genEpub();
  await writeFile(output, buffer);

  console.log(`Wrote ${relative(process.cwd(), output) || output}`);
}

async function chaptersFromFile(file) {
  const ext = extname(file).toLowerCase();
  if (!TEXT_EXTS.has(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Supported: ${[...TEXT_EXTS].join(", ")}`);
  }
  const html = await fileToHtml(file);
  return [{ title: titleFromFilename(file), content: html }];
}

async function chaptersFromDirectory(dir) {
  const files = await collectFiles(dir);
  const textFiles = files
    .filter((f) => TEXT_EXTS.has(extname(f).toLowerCase()))
    .sort(naturalSort);

  const chapters = [];
  for (const file of textFiles) {
    const html = await fileToHtml(file);
    chapters.push({ title: titleFromFilename(file), content: html });
  }
  return chapters;
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function fileToHtml(file) {
  const raw = await readFile(file, "utf8");
  const ext = extname(file).toLowerCase();
  if (ext === ".txt") {
    const escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  }
  const html = await marked.parse(raw, { async: true });
  return rewriteImagePaths(html, dirname(file));
}

function rewriteImagePaths(html, baseDir) {
  return html.replace(/<img([^>]*?)src=["']([^"']+)["']([^>]*)>/g, (match, pre, src, post) => {
    if (/^(https?:|data:|file:)/i.test(src)) return match;
    const abs = resolve(baseDir, src);
    if (!IMAGE_EXTS.has(extname(abs).toLowerCase())) return match;
    return `<img${pre}src="${pathToFileURL(abs).href}"${post}>`;
  });
}

function titleFromFilename(file) {
  const name = basename(file, extname(file));
  const stripped = name.replace(/^[\d\W_]+/, "");
  const pretty = (stripped || name).replace(/[-_]+/g, " ").trim();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
