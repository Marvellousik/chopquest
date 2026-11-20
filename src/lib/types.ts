// Shared contracts for ChopQuest (Challenge 2). Frontend, AI and backend all code against these.
// Owner: Marv. Change only by a small PR that tells everyone (see team/README.md).
import type { Food } from "./foods";

export type { Food };

export type Cafeteria = { id: number; slug: string; name: string; location: string | null };

export type DishRole = "protein" | "staple" | "soup" | "side";

/** One part of a plate, e.g. { label: "Chicken", grams: 120, role: "protein" }. */
export type DishPart = { foodId: number | null; label: string; grams: number; role: DishRole };

export type Convertibility = "easy" | "medium" | "hard";

export type MenuItem = {
  id: number;
  cafeteriaId: number;
  name: string; // "Chicken jollof"
  priceNgn: number; // what students pay
  isTopSeller: boolean;
  breakdown: DishPart[] | null; // filled by the AI (Pascal's breakdownDish)
  convertibility?: Convertibility; // filled by the swap engine for the menu board
};

export type SwapLimits = {
  maxCostPerPlateNgn: number | null; // null = no limit
  minProteinKeptPct: number; // e.g. 80 = keep at least 80% of the protein
  keepDishIdentity: boolean; // only add foods that fit this dish (add-on map)
  maxExtraPrepMin: number; // e.g. 15
};

export const DEFAULT_LIMITS: SwapLimits = {
  maxCostPerPlateNgn: null,
  minProteinKeptPct: 80,
  keepDishIdentity: true,
  maxExtraPrepMin: 15,
};

export type SwapAdd = { foodId: number; label: string; grams: number };

export type SwapReason = { factor: string; points: number; note: string };

export type SwapOption = {
  rank: 1 | 2 | 3;
  replaces: DishPart[]; // what comes out (the meat)
  adds: SwapAdd[]; // what goes in
  before: { proteinG: number; costNgn: number | null };
  after: { proteinG: number; costNgn: number | null };
  completeProtein: boolean;
  extraPrepMin: number;
  score: number; // 0 to 100
  reasons: SwapReason[]; // shown on screen ("why this swap")
  priceMissing: string[]; // foods with no price yet: show "price coming"
};

export type KitchenCard = { menuName: string; studentBlurb: string; steps: string[]; validated: boolean };

/** A swap a cafeteria published to the public board. */
export type PlantDish = {
  id: number;
  cafeteriaId: number;
  menuItemId: number;
  name: string;
  priceNgn: number;
  proteinG: number;
  avgRating: number | null;
  reviewCount: number;
  wouldOrderAgainPct: number | null;
};

export type Review = {
  id: number;
  plantDishId: number;
  nickname: string;
  stars: 1 | 2 | 3 | 4 | 5;
  wouldOrderAgain: boolean;
  comment: string | null;
  createdAt: string;
};

export type CafeteriaRank = {
  cafeteria: Cafeteria;
  score: number;
  plantDishCount: number;
  reviewCount: number;
  avgRating: number | null;
};
