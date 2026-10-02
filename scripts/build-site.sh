#!/bin/sh
# Builds every talk (a top-level directory with slides.md) into dist/<talk>/
# and writes dist/index.html listing them.
#
# PAGES_BASE is the URL prefix the site is served under: "/" locally,
# "/<repo>/" on GitHub Pages.
set -eu

cd "$(dirname "$0")/.."

BASE="${PAGES_BASE:-/}"
OUT="$(pwd)/dist"

rm -rf "$OUT"
mkdir -p "$OUT"

links=""

for entry in */slides.md; do
  talk="$(dirname "$entry")"

  # hash routing: GitHub Pages can't fall back to index.html for /<talk>/<slide>
  npx slidev build "$entry" --base "$BASE$talk/" --out "$OUT/$talk" --router-mode hash

  title="$(sed -n "s/^title: *['\"]\{0,1\}\(.*[^'\"]\)['\"]\{0,1\} *$/\1/p" "$entry" | head -n 1)"
  links="$links<li><a href=\"$talk/\">${title:-$talk}</a></li>"
done

cat > "$OUT/index.html" <<EOF
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Talks</title>
<style>
  :root { color-scheme: light dark; --ink: #0c0c0c; --muted: #595959; --bg: #ffffff; --link: #2d848f; }
  @media (prefers-color-scheme: dark) { :root { --ink: #eeeeee; --muted: #a0a0a0; --bg: #0b0b0b; --link: #5bbf8a; } }
  body { margin: 0; padding: 48px 16px; background: var(--bg); color: var(--ink);
         font: 18px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 720px; margin: 0 auto; }
  h1 { margin: 0 0 24px; font-size: 32px; }
  ul { padding-left: 1.2em; }
  a { color: var(--link); }
</style>
</head>
<body>
<main>
<h1>Talks</h1>
<ul>$links</ul>
</main>
</body>
</html>
EOF

echo "site built in $OUT"
