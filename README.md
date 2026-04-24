# bookbind

Convert markdown, plain text, or a whole directory of content into a Kindle-friendly EPUB.

## Install

Clone and link globally:

```sh
git clone https://github.com/dereksmart/bookbind.git
cd bookbind
npm install
npm link
```

Requires Node 18+.

## Usage

Single file:

```sh
bookbind notes.md
bookbind draft.md -o my-book.epub -t "My Book" -a "Derek Smart"
```

Directory (recursively walked, files sorted naturally, hidden files skipped):

```sh
bookbind ./chapters -t "The Collected Notes" -a "Derek Smart" -c cover.jpg
```

## Options

| Flag | Description |
|---|---|
| `-o, --output <file>` | Output `.epub` path (default: `<input>.epub`) |
| `-t, --title <title>` | Book title (default: derived from input name) |
| `-a, --author <author>` | Author name (default: `Unknown`) |
| `-c, --cover <image>` | Cover image path |
| `--lang <lang>` | Language code (default: `en`) |
| `--description <desc>` | Book description |
| `--no-split` | Keep a single markdown file as one chapter |
| `--split-on <level>` | Heading level for chapter splitting (1-6, default: 2) |

## Chapter splitting

A single markdown file with multiple `##` headings is auto-split into chapters — each `##` heading becomes a navigable chapter on Kindle. The first `# Heading` in the file is used as the book title (overridden by `-t`). Content before the first `##` is prepended to the first chapter.

For directories, each file is a chapter; splitting inside files is off.

## Input

- Supported text: `.md`, `.markdown`, `.txt`
- Each file becomes a chapter; the filename (minus leading numbers/punctuation, with `-`/`_` spaced out) becomes the chapter title
- Images referenced by relative path in markdown are resolved against the file's directory and embedded
- `.txt` is escaped and split into paragraphs on blank lines

## Sending to Kindle

Email the resulting `.epub` to your Send-to-Kindle address, or drop it on the device over USB. Amazon accepts EPUB directly now.

## License

MIT
