# slidev-theme-taloscon2026

Slidev theme built from the official *TalosCon 2026 Master Slide Deck* template.
Canvas is 960×540, so positions in `styles/layout.css` map 1:1 to the template
(720×405pt, 1pt = 4/3px).

Use it from a talk with:

```yaml
---
theme: ../themes/taloscon2026
---
```

Run `npm run theme:dev` from the repository root to preview `example.md`.

## Layouts

| Layout            | Template slide           | Content                                                  |
| ----------------- | ------------------------ | -------------------------------------------------------- |
| `cover`           | Title (dark)             | `# Title`, then subtitle paragraph(s)                    |
| `default`         | Title and body           | `# Title`, then body                                     |
| `center`          | Title and body, centered | anything                                                 |
| `two-cols-header` | Title and two columns    | `# Title`, `::left::`, `::right::`                       |
| `two-cols`        | Title and two columns    | default slot = left column, `::right::`                  |
| `image-left/right`| Title and body + image   | frontmatter `image:`, optional `backgroundSize:`         |
| `section`         | Section header (dark)    | `# Title`, optional description                          |
| `full`            | (none)                   | edge-to-edge content, only the gradient bar             |
| `end`             | Thank you (dark)         | frontmatter `contacts: [{ name, role, email }]`; slot overrides "Thank you" |

Any slide can hide the page number with `slideNumber: false`.

Brand colors are available as CSS variables: `--tc-pink`, `--tc-purple`,
`--tc-blue`, `--tc-teal`, `--tc-green`, and `--tc-gradient`.
