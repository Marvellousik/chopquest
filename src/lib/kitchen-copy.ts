// Plain-language text for cafeteria managers. Keep it short, concrete and free of jargon.
// Screens (Ola) and the downloadable report use these strings so the wording is the same everywhere.

export const SWITCH_RATE_TITLE = "Switch rate";

export const SWITCH_RATE_EXPLAINER =
  "Switch rate is how many of your customers for a dish would pick the plant version instead of the meat one. " +
  "Example: you sell 200 plates of chicken jollof a week. If 1 in 4 customers (25%) switch to soya jollof, that's 50 plates. " +
  "At ₦480 more profit per plate, that's ₦24,000 more a week. " +
  "Until your plant dish is on sale we can only guess, so we start at 25% and you can change it. " +
  "Once students start eating and scanning it, ChopQuest replaces the guess with what really happened.";

export const SWITCH_RATE_SHORT = (pct: number) =>
  `We assume ${Math.round(pct)} in 100 customers for this dish pick the plant version (${Math.round(pct)}%). Change it any time.`;

export const ESTIMATE_NOTE =
  "All numbers are estimates from your prices and our market survey. Protein figures are not medical advice.";

export const WHERE_TO_BUY_NOTE =
  "\"Confirmed\" places were checked by the ChopQuest team. \"Check first\" places are where it is usually sold: call or visit before you rely on them.";

/** "₦24,000" */
export const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
