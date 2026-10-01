export interface LegalPageOptions {
  title: string;
  description: string;
  brandHtml: string;
  brandUrl: string;
  accent: string;
  accentSoft: string;
  heading: string;
  background: string;
  body: string;
  footer: string;
}

export function renderLegalPage(o: LegalPageOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${o.description}" />
  <title>${o.title}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0d0d0d;
      --text: #fff7e8;
      --muted: #cdbdc5;
      --accent: ${o.accent};
      --border: ${o.accentSoft};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: ${o.background};
      color: var(--text);
      font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
      font-size: 16px;
      line-height: 1.7;
    }
    a { color: var(--accent); }
    .wrap { width: min(100% - 32px, 880px); margin: 0 auto; padding: 48px 0 72px; }
    .brand { font-size: 1.35rem; font-weight: 800; letter-spacing: 0.02em; text-decoration: none; color: var(--text); }
    .brand span { color: var(--accent); }
    h1 { margin: 28px 0 8px; font-size: clamp(2rem, 6vw, 3.4rem); line-height: 1.1; letter-spacing: -0.03em; }
    .meta { color: var(--muted); margin: 0 0 28px; }
    .notice {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px 18px;
      margin: 0 0 32px;
      background: rgba(255, 255, 255, 0.05);
    }
    h2 { margin: 36px 0 12px; font-size: 1.35rem; }
    h3 { margin: 22px 0 8px; color: ${o.heading}; font-size: 1.05rem; }
    p, ul { margin: 0 0 14px; }
    li + li { margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
    th, td { text-align: left; vertical-align: top; padding: 12px; border-bottom: 1px solid var(--border); }
    th { color: var(--accent); font-size: 0.85rem; }
    footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="brand" href="${o.brandUrl}">${o.brandHtml}</a>
${o.body}
    <footer>${o.footer}</footer>
  </div>
</body>
</html>`;
}
