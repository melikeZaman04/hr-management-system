import fs from 'node:fs'
import path from 'node:path'

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/markdown-to-print-html.mjs <input.md> <output.html>')
}

const input = fs.readFileSync(inputPath, 'utf8')

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

const lines = input.split(/\r?\n/)
const body = []
let paragraph = []
let list = []
let code = []
let inCode = false

function flushParagraph() {
  if (paragraph.length === 0) return
  body.push(`<p>${inline(paragraph.join(' '))}</p>`)
  paragraph = []
}

function flushList() {
  if (list.length === 0) return
  body.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`)
  list = []
}

function flushCode() {
  body.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
  code = []
}

for (const line of lines) {
  if (line.startsWith('```')) {
    if (inCode) {
      flushCode()
      inCode = false
    } else {
      flushParagraph()
      flushList()
      inCode = true
    }
    continue
  }

  if (inCode) {
    code.push(line)
    continue
  }

  if (!line.trim()) {
    flushParagraph()
    flushList()
    continue
  }

  const heading = line.match(/^(#{1,3})\s+(.*)$/)
  if (heading) {
    flushParagraph()
    flushList()
    const level = heading[1].length
    body.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    continue
  }

  const bullet = line.match(/^-\s+(.*)$/)
  if (bullet) {
    flushParagraph()
    list.push(bullet[1])
    continue
  }

  paragraph.push(line.trim())
}

flushParagraph()
flushList()
if (inCode && code.length > 0) flushCode()

const title = path.basename(inputPath, '.md')

const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      background: #ffffff;
    }

    h1 {
      margin: 0 0 18px;
      padding-bottom: 10px;
      color: #0f172a;
      font-size: 22pt;
      line-height: 1.15;
      border-bottom: 2px solid #d7dce5;
    }

    h2 {
      break-after: avoid;
      margin: 22px 0 8px;
      color: #1d4ed8;
      font-size: 13.5pt;
      line-height: 1.3;
    }

    h3 {
      break-after: avoid;
      margin: 18px 0 8px;
      color: #334155;
      font-size: 11.5pt;
    }

    p {
      margin: 0 0 9px;
    }

    strong {
      color: #0f172a;
      font-weight: 700;
    }

    ul {
      margin: 0 0 10px 18px;
      padding: 0;
    }

    li {
      margin: 2px 0;
    }

    code {
      padding: 1px 4px;
      border-radius: 4px;
      color: #0f172a;
      background: #eef2f7;
      font-family: Consolas, "Courier New", monospace;
      font-size: 9.5pt;
    }

    pre {
      break-inside: avoid;
      margin: 8px 0 12px;
      padding: 10px 12px;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      border: 1px solid #dbe3ef;
      border-radius: 6px;
      background: #f8fafc;
    }

    pre code {
      padding: 0;
      background: transparent;
    }
  </style>
</head>
<body>
${body.join('\n')}
</body>
</html>
`

fs.writeFileSync(outputPath, html, 'utf8')
