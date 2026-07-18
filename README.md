# Markdown Card Studio

A local-first Markdown editor for creating beautifully paginated 3:4 social media cards.

## Features

- CodeMirror 6 Markdown editing with formatting shortcuts
- Live 900 × 1200 card preview and automatic pagination
- Automatic height-based pagination or manual page-break-only mode
- Safe splitting for oversized prose and list blocks
- Explicit page breaks with `<!-- pagebreak -->`
- Two typography templates and eight light/dark themes
- Persistent light/dark application appearance, independent of card themes
- Independently scrollable long-document editor
- Local browser persistence
- Markdown import and download
- Current-page PNG and all-pages ZIP export
- Responsive mobile editing, preview and style tabs

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Quality checks

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

## Page breaks

Put this comment on its own line:

```md
<!-- pagebreak -->
```

The regular Markdown horizontal rule `---` remains a visual divider.

## Privacy

Documents and preferences remain in the browser's local storage. The MVP has no account, database, analytics or cloud sync.

## Known limitation

Remote images must allow cross-origin canvas access to be included in PNG exports. Local object URLs are session-scoped in the MVP.
