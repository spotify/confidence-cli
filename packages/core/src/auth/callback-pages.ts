const TERMINAL_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 16px;
    line-height: 1.6;
    padding: 32px;
    min-height: 100vh;
  }
  .prompt::before {
    content: '▸ ';
    color: #1db954;
  }
  .cursor {
    display: inline-block;
    width: 0.6em;
    height: 1.15em;
    background: #e0e0e0;
    vertical-align: text-bottom;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
`;

function page(lines: string[]): string {
  const body = lines.map((l) => `<p class="prompt">${l}</p>`).join('\n    ');
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><style>${TERMINAL_STYLE}</style></head>
  <body>
    ${body}
    <p class="prompt"><span class="cursor"></span></p>
  </body>
</html>`;
}

export const successPage = page(['Authenticated with Confidence!', 'You can close this tab.']);

export const errorPage = page(['Authentication failed.', 'You can close this tab.']);

export const exchangeErrorPage = page(['Token exchange failed.', 'You can close this tab.']);
