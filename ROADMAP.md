# Roadmap

Rough ordering. Not a schedule.

## v0.2 — Single-file chapter splitting ✓

**Driving use case:** a speaking script (`# Title` then many `## Slide N — Title`) read on Kindle without the slides. Every `##` is now a navigable chapter.

- [x] Auto-split a single `.md` file when it has ≥2 `##` headings
- [x] Extract book title from first `# Heading` (flag `-t` still wins)
- [x] Content before the first `##` prepends to the first chapter (no phantom "Introduction")
- [x] `--no-split` escape hatch
- [x] `--split-on <level>` for files that use `#` or `###` as chapter markers

## v0.3 — Better defaults

- [ ] Title page with book title + author
- [ ] Opinionated default CSS (serif body, sans-serif headings, humane line-height)
- [ ] `--css <file>` override
- [ ] Chapter title inference: strip leading `Slide N — ` / numbering noise, or keep raw with a flag

## v1.0 — New input types

URLs (all flavors of "point bookbind at a web thing"):

- [ ] Single article URL → readability extraction → one chapter. Works for blog posts, Substack, Medium, docs pages — anything readability-friendly.
- [ ] YouTube URL → transcript (auto-captions or uploaded) → one chapter. Title/author/description from video metadata. Ideally strip filler, collapse speaker turns into paragraphs.
- [ ] Anthology mode: mix article URLs, YouTube URLs, and local files in one bind. Each becomes a chapter, in the order given.
- [ ] RSS/Atom feed → the last N entries → one book (periodic digest workflow).

Local text-shaped:

- [ ] HTML files and zipped HTML bundles
- [ ] Obsidian vaults (wikilink rewriting)
- [ ] Notion markdown exports
- [ ] Pocket / Instapaper / Readwise exports

Format converters:

- [ ] PDF (text + images; body-text extraction, not layout-faithful)
- [ ] DOCX via `mammoth`
- [ ] Jupyter notebooks (markdown + code + outputs)
- [ ] mbox / email archives

Image-heavy:

- [ ] Folder of images → picture book (natural sort, one image per page)
- [ ] CBZ / CBR → EPUB for comics
- [ ] OCR scanned pages (tesseract)

## v2.0 — Site-as-source

Not single pages (those are v1.0). This is about treating a whole site as the corpus — selection, ordering, and curation UX.

- [ ] **WordPress plugin:** site owner picks posts / category / tag / date range, clicks "Export as EPUB." Uses WP auth + block content directly. Primary surface for site owners who want a book of their own writing.
- [ ] CLI site mode: `bookbind https://blog.example.com --posts 20` pulls the last N entries from the feed into one book.
- [ ] Arbitrary-site crawl with a small config (allowlist, depth, ordering) — scope carefully; this is where things get messy.

## Later / maybe

- [ ] Chat log exports (Slack, Discord) as conversation books
- [ ] Git repo docs mode (`README.md` + `docs/` → dev book)
- [ ] Scrivener projects
- [ ] Audiobook transcripts
- [ ] Send-to-Kindle integration (email the built EPUB from the CLI)
- [ ] `--watch` mode: rebuild on source changes
