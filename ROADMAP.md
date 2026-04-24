# Roadmap

Rough ordering. Not a schedule.

## v0.2 — Single-file chapter splitting

**Driving use case:** a speaking script (`# Title` then many `## Slide N — Title`) read on Kindle without the slides. Today bookbind crams the whole thing into one chapter; every `##` should be a navigable chapter instead.

- [ ] Auto-split a single `.md` file when it has ≥2 `##` headings
- [ ] Extract book title from first `# Heading` (flag `-t` still wins)
- [ ] Content before the first `##` prepends to the first chapter (no phantom "Introduction")
- [ ] `--no-split` escape hatch
- [ ] `--split-on h2|h3` for files that use `#` as chapter markers

## v0.3 — Better defaults

- [ ] Title page with book title + author
- [ ] Opinionated default CSS (serif body, sans-serif headings, humane line-height)
- [ ] `--css <file>` override
- [ ] Chapter title inference: strip leading `Slide N — ` / numbering noise, or keep raw with a flag

## v1.0 — New input types

Text-shaped:

- [ ] HTML files and zipped HTML bundles
- [ ] Obsidian vaults (wikilink rewriting)
- [ ] Notion markdown exports
- [ ] Single URL → readability extraction → one chapter
- [ ] Anthology mode: list of URLs / feed → one book
- [ ] Pocket / Instapaper / Readwise exports
- [ ] RSS/Atom → periodic digest

Format converters:

- [ ] PDF (text + images; body-text extraction, not layout-faithful)
- [ ] DOCX via `mammoth`
- [ ] Jupyter notebooks (markdown + code + outputs)
- [ ] mbox / email archives

Image-heavy:

- [ ] Folder of images → picture book (natural sort, one image per page)
- [ ] CBZ / CBR → EPUB for comics
- [ ] OCR scanned pages (tesseract)

## v2.0 — Websites

The parsing is easy; the UX is the hard part.

- [ ] **WordPress plugin:** site owner selects posts / category / tag / date range, clicks "Export as EPUB." Leans on existing WP auth + block content. Probably the right primary interface for sites.
- [ ] CLI fallback: `bookbind https://blog.example.com --posts 20` crawls the feed.
- [ ] Arbitrary-site crawl with a small config (allowlist, depth, ordering) — scope carefully, this is where things get messy.

## Later / maybe

- [ ] Chat log exports (Slack, Discord) as conversation books
- [ ] Git repo docs mode (`README.md` + `docs/` → dev book)
- [ ] Scrivener projects
- [ ] Audiobook transcripts
- [ ] Send-to-Kindle integration (email the built EPUB from the CLI)
- [ ] `--watch` mode: rebuild on source changes
