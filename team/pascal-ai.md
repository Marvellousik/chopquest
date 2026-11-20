# Pascal: AI layer (OpenRouter)

You own everything the AI does, plus the test that proves it works. The judges score "AI contribution" and "evidence", so this is where we win or lose. Keep every AI output **structured and checked against our verified food data**: the guide says plain chatbot text is not enough.

## 0. Move from Gemini direct to OpenRouter (do this first)

We use **OpenRouter** because the team has credits there. It's one OpenAI-compatible API for many models, so we can pick the best vision model and switch without changing code.

**Env vars** (`.env.local` and Vercel, never commit):

```
OPENROUTER_API_KEY=sk-or-...          # from openrouter.ai/keys
OPENROUTER_MODEL=google/gemini-2.5-flash   # check the exact id on openrouter.ai/models; must support images + JSON
OPENROUTER_MODEL_FALLBACK=             # optional second vision model if the first fails
```

`GEMINI_API_KEY` is no longer needed once this lands.

**Replace `src/lib/gemini.ts` with `src/lib/ai/client.ts`:**

```ts
// POST https://openrouter.ai/api/v1/chat/completions
headers: {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "https://<our-vercel-url>",   // optional: shows our app in OpenRouter stats
  "X-Title": "ChopQuest",
}
body: {
  model: process.env.OPENROUTER_MODEL,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: [
      { type: "text", text: "..." },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },  // only when we have a photo
    ]},
  ],
  response_format: { type: "json_object" },   // or a json_schema where the model supports it
  temperature: 0.2,
  max_tokens: 1200,
}
```

- Read `choices[0].message.content`, strip code fences, `JSON.parse`, then **sanitise** exactly like `sanitizeVision()` does today. Never trust model JSON.
- Keep the existing error kinds and map them: **429** = rate limit ("Chloe is busy, try again in a minute"), **402** = out of credits (tell the team, switch to the fallback model or the cached/demo data), **401/403** = bad key, other = upstream.
- Timeout 45 s with `AbortSignal.timeout`. One retry on 5xx, then the fallback model.
- Keep the cache by input hash (`scan_cache`): the same dish or photo never spends credits twice.
- Update `/api/scan` to call the new client, so scanning still works.

**Protect the credits:**
- In the OpenRouter dashboard, set a **credit limit on the key** we deploy to Vercel. If the key leaks, the damage is capped.
- Log `usage` (tokens) from each response so we know the cost per breakdown for the pitch ("about ₦X per dish analysed").
- Pre-compute and cache all menu breakdowns tonight. The live demo should read from the cache, not spend credits.

## 1. Dish breakdown: `breakdownDish()`

`src/lib/ai/breakdown.ts`

```ts
breakdownDish(input: { menuItemName: string; cafeteria: string; priceNgn: number; photoBase64?: string }, foods: Food[]): Promise<DishPart[]>
```

- Input is the menu item name (e.g. "Chicken jollof with dodo") and, if we have one, a photo of a real plate.
- The model returns the parts of a **typical campus serving** with grams and a role (`protein`, `staple`, `soup`, `side`). Reuse the current prompt style and add: "This is a Nigerian campus cafeteria plate at about ₦{price}. Estimate a typical student portion."
- Match each part to our `foods` table with the existing `matchFood()` in `src/lib/match.ts`. Unmatched parts keep `foodId: null` so the manager can fix them.
- Sanitise: clamp grams (0 to 800), drop junk, max 8 parts.

## 2. Kitchen card: `writeKitchenCard()`

`src/lib/ai/kitchen-card.ts`

```ts
writeKitchenCard(input: { menuItem: MenuItem; option: SwapOption; foods: Food[] }): Promise<KitchenCard>
```

- The model writes: a menu name students would order ("Soya Jollof Special"), a one-line student blurb, and 3 to 6 prep steps for a busy campus kitchen.
- **The prompt gives only the chosen ingredients and quantities** and says "use only these ingredients plus salt, oil, pepper, onion, stock and spices already in the original dish".
- **Validator (the part judges care about):** after the model answers, scan the steps and blurb for any food name from our `foods` table that is not in the swap. If one appears, retry once with a correction; if it still fails, return `validated: false`. Also reject health claims ("cures", "healthy for diabetes").
- Fallback when the API is down, rate-limited or out of credits: a template card built from the option, `validated: true`, so the demo never breaks.

## 3. AI accuracy test (our evidence slide)

`scripts/eval-breakdown.mts`, run with `npm run eval`.

- Jason's menus give us 30 to 40 real dishes. For **15 of them**, Jason writes the "true" breakdown by hand (`team/market-survey/eval-dishes.csv`: dish, part, grams).
- The script runs `breakdownDish()` on each and reports:
  - **Part accuracy:** the share of true parts the model found.
  - **Protein error:** average gap between the protein from the model's breakdown and Jason's, in grams and %.
  - Time and **credits used** (from `usage`).
- **Bonus that strengthens "AI contribution":** run the same 15 dishes through 2 models on OpenRouter (e.g. a Gemini Flash and a GPT-4o-mini-class vision model) and show which is more accurate per ₦. That's a real model choice made from evidence.
- Also run the kitchen-card validator on 15 cards and report the share that passed first time.
- Output a small table for the pitch deck. **Report the real numbers, even if they're bad.** The guide rewards honest limits.

## 4. Offline demo fixtures

Save the breakdown, top-3 swaps and kitchen card for **3 demo dishes** (ideally chicken jollof, a beef stew dish and a fried rice) as JSON in `src/data/demo/`. Ola's `/demo` reads them with no network.

## Order of work

1. OpenRouter client + `/api/scan` moved over. 2. `breakdownDish()` on 3 real menu items. 3. Pre-compute breakdowns for all collected menus. 4. `writeKitchenCard()` + validator + fallback. 5. Eval script (and the 2-model comparison). 6. Demo fixtures.

## Hand-offs

- **From Jason:** menus (`cafeteria-menus.csv`) and the 15 hand breakdowns (`eval-dishes.csv`).
- **To Marv:** the two functions with the signatures above.
- **To Ola:** demo fixtures.
- **To everyone:** say in the chat when the deployed key's credit limit is set, and post the cost per breakdown once you know it.
