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
  .option("--no-split", "Keep a single markdown file as one chapter (don't split on headings)")
  .option("--split-on <level>", "Heading level for chapter splitting (1-6)", "2")
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

  const splitOn = Number.parseInt(opts.splitOn, 10);
  if (!Number.isInteger(splitOn) || splitOn < 1 || splitOn > 6) {
    throw new Error(`--split-on must be 1-6 (got "${opts.splitOn}").`);
  }

  const { bookTitle, chapters } = isDir
    ? await chaptersFromDirectory(input)
    : await chaptersFromFile(input, { splitOn, split: opts.split });

  if (chapters.length === 0) {
    throw new Error("No convertible content found (looked for .md, .markdown, .txt).");
  }

  const defaultTitle = basename(input, extname(input)).replace(/[-_]/g, " ");
  const title = opts.title || bookTitle || defaultTitle;
  const output = resolve(opts.output || `${basename(input, extname(input))}.epub`);

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

async function chaptersFromFile(file, { splitOn, split }) {
  const ext = extname(file).toLowerCase();
  if (!TEXT_EXTS.has(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Supported: ${[...TEXT_EXTS].join(", ")}`);
  }
  if (ext === ".txt") {
    const html = await fileToHtml(file);
    return { bookTitle: null, chapters: [{ title: titleFromFilename(file), content: html }] };
  }
  return chaptersFromMarkdownFile(file, { splitOn, split });
}

async function chaptersFromMarkdownFile(file, { splitOn, split }) {
  const raw = await readFile(file, "utf8");
  const baseDir = dirname(file);
  const tokens = marked.lexer(raw);

  let bookTitle = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "heading") {
      if (t.depth === 1 && splitOn !== 1) {
        bookTitle = t.text;
        tokens.splice(i, 1);
      }
      break;
    }
  }

  const splitCount = tokens.filter((t) => t.type === "heading" && t.depth === splitOn).length;

  if (!split || splitCount < 2) {
    const html = await marked.parse(joinRaw(tokens));
    return {
      bookTitle,
      chapters: [{
        title: bookTitle || titleFromFilename(file),
        content: rewriteImagePaths(html, baseDir),
      }],
    };
  }

  const sections = [];
  let currentTitle = null;
  let currentRaw = [];
  for (const token of tokens) {
    if (token.type === "heading" && token.depth === splitOn) {
      sections.push({ title: currentTitle, raw: currentRaw.join("") });
      currentTitle = token.text;
      currentRaw = [];
    } else {
      currentRaw.push(token.raw || "");
    }
  }
  sections.push({ title: currentTitle, raw: currentRaw.join("") });

  if (sections[0].title === null) {
    const preamble = sections.shift();
    if (preamble.raw.trim()) sections[0].raw = preamble.raw + sections[0].raw;
  }

  const chapters = [];
  for (const s of sections) {
    const html = await marked.parse(s.raw);
    chapters.push({ title: s.title, content: rewriteImagePaths(html, baseDir) });
  }
  return { bookTitle, chapters };
}

function joinRaw(tokens) {
  return tokens.map((t) => t.raw || "").join("");
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
  return { bookTitle: null, chapters };
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
