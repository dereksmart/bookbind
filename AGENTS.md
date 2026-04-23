# bookbind

A small Node CLI that converts markdown, plain text, or a directory of mixed content into a Kindle-friendly EPUB.

## Layout

- `cli.js` — the entire tool. Single file, ES module, uses `commander` for args, `marked` for markdown→HTML, and `epub-gen-memory` to assemble the EPUB.
- `package.json` — `type: module`, exposes `bin.bookbind → ./cli.js`.
- No build step, no tests yet.

## Usage

```
bookbind <input> [-o out.epub] [-t title] [-a author] [-c cover.jpg] [--lang en] [--description ...]
```

- Input can be a single `.md` / `.markdown` / `.txt` file, or a directory (recursively walked; hidden files skipped; text files sorted with a natural sort).
- Images referenced by relative paths in markdown are resolved against the file's directory and rewritten to `file://` URLs so `epub-gen-memory` can inline them.
- `.txt` is escaped and wrapped into `<p>` blocks on blank lines.

## Conventions

- Default branch is `trunk`, not `main`.
- ESM only (`import` syntax, top-level `await`). Node >= 18.
- Keep it single-file until there's a real reason to split. No premature abstraction.
- No comments that restate what the code does. Only add a comment when the *why* is non-obvious.
