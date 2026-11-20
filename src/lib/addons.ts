// Which plant proteins fit which dish, the usual serving of each, and the extra kitchen time.
// Content owner: Jason (team/market-survey/addon-map.csv). Code owner: Marv.
// PROVISIONAL: every value below is our best starting guess and must be confirmed with a
// cafeteria cook before the pitch. Keys are lower-case dish keywords matched inside the menu
// item name ("Chicken jollof rice" matches "jollof"). Food names must match `foods.food` exactly.

export type AddonFit = { food: string; strength: 1 | 2 | 3; extraPrepMin: number };

export type AddonMap = Record<string, AddonFit[]>;

const SOY_CHUNKS = "Soy chunks (textured soy protein)";
const MOI_MOI = "Moi moi";
const AKARA = "Akara";
const AWARA = "Soy cheese / Nigerian tofu";
const BEANS = "Beans, boiled";
const OKPA = "Okpa (steamed bambara pudding)";
const KULI = "Kuli-kuli (groundnut cake)";
const G_PASTE = "Groundnut paste";

export const ADDONS: AddonMap = {
  jollof: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: MOI_MOI, strength: 3, extraPrepMin: 0 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  "fried rice": [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: MOI_MOI, strength: 2, extraPrepMin: 0 },
  ],
  "white rice": [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: MOI_MOI, strength: 2, extraPrepMin: 0 },
  ],
  "rice and stew": [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  spaghetti: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  indomie: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  noodles: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  egusi: [
    { food: AWARA, strength: 3, extraPrepMin: 10 },
    { food: SOY_CHUNKS, strength: 2, extraPrepMin: 15 },
  ],
  soup: [
    { food: AWARA, strength: 3, extraPrepMin: 10 },
    { food: SOY_CHUNKS, strength: 2, extraPrepMin: 15 },
  ],
  stew: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
  ],
  bread: [
    { food: AKARA, strength: 3, extraPrepMin: 0 },
    { food: MOI_MOI, strength: 2, extraPrepMin: 0 },
    { food: G_PASTE, strength: 2, extraPrepMin: 0 },
  ],
  pap: [
    { food: AKARA, strength: 3, extraPrepMin: 0 },
    { food: MOI_MOI, strength: 3, extraPrepMin: 0 },
    { food: KULI, strength: 2, extraPrepMin: 0 },
  ],
  yam: [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  plantain: [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: OKPA, strength: 2, extraPrepMin: 0 },
  ],
};

/** One kitchen serving of each swap food, in grams, on the same basis as foods.protein_g_per_100g.
 *  PROVISIONAL until Jason's serving_g column lands. Foods not listed here are never suggested. */
export const SERVING_G: Record<string, number> = {
  [SOY_CHUNKS]: 40, // dry weight, about a handful before soaking
  [MOI_MOI]: 120, // one wrap
  [AKARA]: 60, // about three pieces
  [AWARA]: 100, // two to three pieces
  [BEANS]: 150, // one serving spoon of cooked beans
  [OKPA]: 150, // one wrap
  [KULI]: 30,
  [G_PASTE]: 30,
};

/** Extra prep for a food when the dish has no add-on entry for it (identity check off). */
export const DEFAULT_PREP_MIN: Record<string, number> = {
  [SOY_CHUNKS]: 15,
  [AWARA]: 10,
  [BEANS]: 5,
};

/** The add-on entries that match this dish name (all matching keywords, best strength kept). */
export function addonsFor(dishName: string, map: AddonMap = ADDONS): Map<string, AddonFit> {
  const name = ` ${dishName.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  const out = new Map<string, AddonFit>();
  for (const [key, fits] of Object.entries(map)) {
    if (!name.includes(` ${key} `)) continue;
    for (const fit of fits) {
      const prev = out.get(fit.food);
      if (!prev || fit.strength > prev.strength) out.set(fit.food, fit);
    }
  }
  return out;
}
