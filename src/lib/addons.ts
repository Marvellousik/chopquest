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
const MUSHROOM = "Oyster mushroom, fresh";
const MELON = "Melon seed, shelled";
const GROUNDNUTS = "Groundnuts, dry";
const FIOFIO = "Pigeon pea, dried";

/** Map key used when the menu item is just a protein sold as an add-on (see `addonsFor`). */
export const PROTEIN_ADDON = "protein add-on";
const ADDON_ONLY =
  /^(peppered |boiled |fried |grilled |smoked )?(chicken|beef|fish|catfish|turkey|sausage|egg|gizzard|cow leg|cow tail|chicken wing|goat meat|kpomo|meat)( \(?(large|small|biggest piece)\)?)?$/;

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
    { food: MELON, strength: 3, extraPrepMin: 0 },
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: SOY_CHUNKS, strength: 2, extraPrepMin: 15 },
  ],
  soup: [
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: SOY_CHUNKS, strength: 2, extraPrepMin: 15 },
    { food: MELON, strength: 2, extraPrepMin: 0 },
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
  // Added 20 Nov 2026 for the real Third Cafe / Machana Cafe menus (also provisional, confirm with a cook).
  okro: [
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: MELON, strength: 2, extraPrepMin: 0 },
  ],
  ogbono: [
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: MELON, strength: 2, extraPrepMin: 0 },
  ],
  "pepper soup": [
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 3, extraPrepMin: 10 },
  ],
  sauce: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  "egg sauce": [
    { food: AWARA, strength: 3, extraPrepMin: 10 },
    { food: AKARA, strength: 2, extraPrepMin: 0 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
  ],
  pasta: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  macaroni: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: MUSHROOM, strength: 2, extraPrepMin: 5 },
  ],
  bolognese: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
  ],
  shawarma: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: BEANS, strength: 1, extraPrepMin: 5 },
  ],
  burger: [
    { food: AKARA, strength: 3, extraPrepMin: 0 },
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: SOY_CHUNKS, strength: 2, extraPrepMin: 15 },
    { food: MUSHROOM, strength: 2, extraPrepMin: 5 },
  ],
  sandwich: [
    { food: AKARA, strength: 3, extraPrepMin: 0 },
    { food: G_PASTE, strength: 2, extraPrepMin: 0 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  wrap: [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
    { food: SOY_CHUNKS, strength: 2, extraPrepMin: 15 },
  ],
  pie: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
    { food: MUSHROOM, strength: 2, extraPrepMin: 5 },
  ],
  rolls: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
  ],
  fries: [
    { food: SOY_CHUNKS, strength: 3, extraPrepMin: 15 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
    { food: MUSHROOM, strength: 2, extraPrepMin: 5 },
  ],
  chips: [
    { food: BEANS, strength: 2, extraPrepMin: 5 },
    { food: AKARA, strength: 2, extraPrepMin: 0 },
  ],
  salad: [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: GROUNDNUTS, strength: 2, extraPrepMin: 0 },
    { food: AWARA, strength: 2, extraPrepMin: 10 },
  ],
  gizdodo: [
    { food: MUSHROOM, strength: 3, extraPrepMin: 5 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
  ],
  dodo: [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: MUSHROOM, strength: 2, extraPrepMin: 5 },
  ],
  masa: [
    { food: KULI, strength: 3, extraPrepMin: 0 },
    { food: BEANS, strength: 2, extraPrepMin: 5 },
    { food: GROUNDNUTS, strength: 2, extraPrepMin: 0 },
  ],
  porridge: [
    { food: BEANS, strength: 3, extraPrepMin: 5 },
    { food: FIOFIO, strength: 2, extraPrepMin: 15 },
  ],
  // A protein bought on its own as an add-on ("Chicken", "Peppered turkey", "Boiled egg"): offer a plant add-on.
  [PROTEIN_ADDON]: [
    { food: MOI_MOI, strength: 3, extraPrepMin: 0 },
    { food: AKARA, strength: 2, extraPrepMin: 0 },
    { food: SOY_CHUNKS, strength: 2, extraPrepMin: 15 },
    { food: KULI, strength: 2, extraPrepMin: 0 },
    { food: AWARA, strength: 1, extraPrepMin: 10 },
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
  [MUSHROOM]: 100, // a good handful, fresh
  [MELON]: 30, // extra ground egusi in the pot, per plate
  [GROUNDNUTS]: 30,
  [FIOFIO]: 60, // dry weight
};

/** Extra prep for a food when the dish has no add-on entry for it (identity check off). */
export const DEFAULT_PREP_MIN: Record<string, number> = {
  [SOY_CHUNKS]: 15,
  [AWARA]: 10,
  [BEANS]: 5,
  [MUSHROOM]: 5,
  [FIOFIO]: 15,
};

/** The add-on entries that match this dish name (all matching keywords, best strength kept). */
export function addonsFor(dishName: string, map: AddonMap = ADDONS): Map<string, AddonFit> {
  const plain = dishName.toLowerCase().replace(/[^a-z0-9()]+/g, " ").trim();
  const name = ` ${plain.replace(/[()]/g, " ").replace(/\s+/g, " ")} `;
  const addonOnly = ADDON_ONLY.test(plain);
  const out = new Map<string, AddonFit>();
  for (const [key, fits] of Object.entries(map)) {
    if (key === PROTEIN_ADDON ? !addonOnly : !name.includes(` ${key} `)) continue;
    for (const fit of fits) {
      const prev = out.get(fit.food);
      if (!prev || fit.strength > prev.strength) out.set(fit.food, fit);
    }
  }
  return out;
}
