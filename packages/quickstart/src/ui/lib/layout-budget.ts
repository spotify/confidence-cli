import { CONFIDENCE_TIPS } from './tips.js';

// ScreenContainer: TitleBar(1) + paddingY top(1) + paddingY bottom(1)
const CONTAINER_CHROME = 3;

// Left panel above status lines:
//   heading(1) + marginBottom(1) + description(~2) + marginBottom(1) + framework(1) + marginBottom(1)
const PANEL_HEADER_ROWS = 7;

// PromptPanel in info mode: borderTop(1) + status(1) + marginBottom(1) + hints(1)
const PROMPT_PANEL_ROWS = 4;

// Between status lines and tip card:
//   marginTop(1) on onboarding Box + spinner(1) + marginTop(1) on tips wrapper + intro text(1)
const TIP_PREAMBLE_ROWS = 4;

// TipCard chrome: marginTop(1) + borderTop(1) + title(1) + marginY top(1) + marginY bottom(1) + link(1) + borderBottom(1)
const TIP_CARD_CHROME = 7;

function estimateWrappedLines(text: string, availableWidth: number): number {
  const width = Math.max(availableWidth, 20);
  return Math.ceil(text.length / width);
}

export function tipsFitInViewport(rows: number, columns: number, maxStatusLines: number): boolean {
  // TipCard body width: column minus paddingX(2) from ScreenContainer, borders(2), paddingLeft(1)
  const tipCardContentWidth = columns - 5;

  const maxBodyLines = Math.max(
    ...CONFIDENCE_TIPS.map((t) => estimateWrappedLines(t.body, tipCardContentWidth)),
  );

  const tipSectionRows = TIP_PREAMBLE_ROWS + TIP_CARD_CHROME + maxBodyLines;

  const totalNeeded =
    CONTAINER_CHROME + PANEL_HEADER_ROWS + maxStatusLines + tipSectionRows + PROMPT_PANEL_ROWS;

  return rows >= totalNeeded;
}
