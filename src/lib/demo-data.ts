// DEMO DATA ONLY: fake menus, prices, students, reviews and scans so the app looks alive while we wait
// for Jason's real survey. Everything seeded from this file is tagged in demo_records and removed with
// POST /api/admin/demo {"action":"clear"}. Never present these numbers as real evidence.
// Food names must match foods.food exactly; grams are on each food's basis (dry rice, raw meat...).

export type DemoPart = { food: string; label: string; grams: number; role: "protein" | "staple" | "soup" | "side" };
export type DemoMenuItem = { name: string; priceNgn: number; topSeller: boolean; platesPerWeek: number; parts: DemoPart[] };
export type DemoPlantDish = {
  from: string; // menu item it was made from
  name: string;
  priceNgn: number;
  replace: string[]; // labels of the parts taken out
  add: { food: string; label: string; grams: number }[];
  blurb: string;
  steps: string[];
  reviews: number; // how many demo reviews
  rating: "great" | "good" | "mixed";
};
export type DemoCafeteria = { slug: string; menu: DemoMenuItem[]; plantDishes: DemoPlantDish[] };

const p = (food: string, label: string, grams: number, role: DemoPart["role"]): DemoPart => ({ food, label, grams, role });
const RICE = "Rice, milled";
const SOY = "Soy chunks (textured soy protein)";
const AWARA = "Soy cheese / Nigerian tofu";
const WHEAT = "Wheat flour (bread)";

/** Demo market prices (₦ per kg on each food's basis). Fake, for demo maths only. */
export const DEMO_PRICES: Record<string, number> = {
  Chicken: 5500,
  "Beef (incl. suya)": 6500,
  "Goat meat": 7000,
  "Fish fillet": 4500,
  "Egg, hen": 3600,
  "Milk, cow": 1800,
  [RICE]: 1700,
  [WHEAT]: 1500,
  "Cassava meal": 1200,
  "Yam, fresh": 900,
  "Plantain, ripe": 1000,
  "Instant noodles, dry": 2000,
  "Maize, dried": 900,
  [SOY]: 3500,
  [AWARA]: 2500,
  "Moi moi": 2000,
  Akara: 2500,
  "Beans, boiled": 1100,
  "Soy milk": 1200,
  "Tigernut drink": 1500,
  "Egusi soup (no meat)": 2800,
  "Groundnuts, dry": 2500,
};

export const DEMO_CAFETERIAS: DemoCafeteria[] = [
  {
    slug: "ase-cafe",
    menu: [
      { name: "Jollof rice and chicken", priceNgn: 2000, topSeller: true, platesPerWeek: 240, parts: [p(RICE, "Jollof rice", 90, "staple"), p("Chicken", "Chicken", 120, "protein"), p("Plantain, ripe", "Dodo", 60, "side")] },
      { name: "Fried rice and turkey", priceNgn: 2300, topSeller: true, platesPerWeek: 180, parts: [p(RICE, "Fried rice", 90, "staple"), p("Chicken", "Turkey", 130, "protein")] },
      { name: "White rice and beef stew", priceNgn: 1800, topSeller: true, platesPerWeek: 150, parts: [p(RICE, "White rice", 90, "staple"), p("Beef (incl. suya)", "Beef", 90, "protein")] },
      { name: "Meat pie", priceNgn: 600, topSeller: false, platesPerWeek: 300, parts: [p(WHEAT, "Pastry", 60, "staple"), p("Beef (incl. suya)", "Minced beef", 35, "protein")] },
      { name: "Fura da nono", priceNgn: 700, topSeller: false, platesPerWeek: 90, parts: [p("Maize, dried", "Fura", 40, "staple"), p("Milk, cow", "Nono (milk)", 250, "protein")] },
    ],
    plantDishes: [
      {
        from: "Jollof rice and chicken", name: "Soya Jollof", priceNgn: 1800, replace: ["Chicken"], add: [{ food: SOY, label: "Soya chunks", grams: 60 }],
        blurb: "Our smoky party jollof with crispy fried soya chunks and dodo.", reviews: 11, rating: "great",
        steps: ["Soak 60 g soya chunks per plate in hot water for 10 minutes, then squeeze dry.", "Season with pepper, onion and stock, then fry until golden.", "Serve on jollof with dodo in place of the chicken."],
      },
      {
        from: "Fried rice and turkey", name: "Awara Fried Rice", priceNgn: 2000, replace: ["Turkey"], add: [{ food: AWARA, label: "Awara", grams: 150 }],
        blurb: "Fried rice loaded with veggies and golden fried awara cubes.", reviews: 7, rating: "good",
        steps: ["Cut fresh awara into cubes and fry until golden.", "Toss into the fried rice for the last minute.", "150 g awara per plate in place of the turkey."],
      },
      {
        from: "Meat pie", name: "Soya Meat Pie", priceNgn: 500, replace: ["Minced beef"], add: [{ food: SOY, label: "Soya mince", grams: 20 }],
        blurb: "Flaky pie with peppery soya mince, potatoes and carrots. Snack of the day.", reviews: 9, rating: "great",
        steps: ["Soak soya chunks, squeeze and chop them fine.", "Cook with the usual pie filling seasoning.", "Fill and bake as usual: 20 g dry soya per pie."],
      },
    ],
  },
  {
    slug: "bush-cafe",
    menu: [
      { name: "Eba and egusi with goat meat", priceNgn: 2200, topSeller: true, platesPerWeek: 160, parts: [p("Cassava meal", "Eba", 120, "staple"), p("Egusi soup (no meat)", "Egusi soup", 150, "soup"), p("Goat meat", "Goat meat", 100, "protein")] },
      { name: "Pounded yam and egusi with fish", priceNgn: 2500, topSeller: true, platesPerWeek: 110, parts: [p("Yam, fresh", "Pounded yam", 250, "staple"), p("Egusi soup (no meat)", "Egusi soup", 150, "soup"), p("Fish fillet", "Fish", 100, "protein")] },
      { name: "Chicken shawarma", priceNgn: 2500, topSeller: true, platesPerWeek: 200, parts: [p(WHEAT, "Wrap", 80, "staple"), p("Chicken", "Chicken", 100, "protein")] },
      { name: "Chapman", priceNgn: 600, topSeller: false, platesPerWeek: 140, parts: [] },
    ],
    plantDishes: [
      {
        from: "Eba and egusi with goat meat", name: "Egusi and Awara with Eba", priceNgn: 1900, replace: ["Goat meat"], add: [{ food: AWARA, label: "Awara", grams: 150 }],
        blurb: "Thick, nutty egusi with soft awara chunks that soak up all the soup.", reviews: 8, rating: "good",
        steps: ["Fry 150 g awara per plate until the outside is firm.", "Simmer it in the egusi for 5 minutes before serving.", "Serve with eba as usual."],
      },
      {
        from: "Chicken shawarma", name: "Awara Shawarma", priceNgn: 2000, replace: ["Chicken"], add: [{ food: AWARA, label: "Spicy awara", grams: 120 }],
        blurb: "Our shawarma with spicy grilled awara, cabbage, cream and pepper sauce.", reviews: 14, rating: "great",
        steps: ["Slice awara into strips and grill with suya spice.", "Wrap with the usual cabbage, cucumber and sauce.", "120 g awara per wrap in place of the chicken."],
      },
    ],
  },
  {
    slug: "munchbox",
    menu: [
      { name: "Jollof rice with dodo and chicken", priceNgn: 2000, topSeller: true, platesPerWeek: 260, parts: [p(RICE, "Jollof rice", 85, "staple"), p("Chicken", "Chicken", 120, "protein"), p("Plantain, ripe", "Dodo", 100, "side")] },
      { name: "Spaghetti and chicken", priceNgn: 1700, topSeller: true, platesPerWeek: 170, parts: [p(WHEAT, "Spaghetti", 100, "staple"), p("Chicken", "Chicken", 110, "protein")] },
      { name: "Indomie and egg", priceNgn: 1200, topSeller: true, platesPerWeek: 220, parts: [p("Instant noodles, dry", "Indomie", 120, "staple"), p("Egg, hen", "Fried egg", 100, "protein")] },
      { name: "Chocolate milkshake", priceNgn: 1500, topSeller: false, platesPerWeek: 80, parts: [p("Milk, cow", "Milk", 300, "protein")] },
    ],
    plantDishes: [
      {
        from: "Jollof rice with dodo and chicken", name: "Soya Jollof and Dodo", priceNgn: 1800, replace: ["Chicken"], add: [{ food: SOY, label: "Soya chunks", grams: 60 }],
        blurb: "Munchbox jollof, sweet dodo and peppered soya chunks. Same plate, lighter price.", reviews: 12, rating: "great",
        steps: ["Soak and squeeze 60 g soya chunks per plate.", "Fry in the jollof stew base until browned.", "Plate with jollof and dodo."],
      },
      {
        from: "Spaghetti and chicken", name: "Soya Bolognese Spaghetti", priceNgn: 1500, replace: ["Chicken"], add: [{ food: SOY, label: "Soya mince", grams: 50 }],
        blurb: "Spaghetti in a rich tomato sauce packed with soya mince.", reviews: 6, rating: "good",
        steps: ["Soak soya chunks, squeeze and chop them fine.", "Cook into the tomato sauce for 10 minutes.", "50 g dry soya per plate."],
      },
      {
        from: "Chocolate milkshake", name: "Soya Chocolate Shake", priceNgn: 1200, replace: ["Milk"], add: [{ food: "Soy milk", label: "Soya milk", grams: 300 }],
        blurb: "Cold, thick chocolate shake made with soya milk. Drink of the week.", reviews: 10, rating: "good",
        steps: ["Blend 300 ml chilled soya milk with cocoa and sugar.", "Serve cold."],
      },
    ],
  },
  {
    slug: "first-cafe",
    menu: [
      { name: "Bread and egg", priceNgn: 800, topSeller: true, platesPerWeek: 300, parts: [p(WHEAT, "Bread", 100, "staple"), p("Egg, hen", "Fried egg", 100, "protein")] },
      { name: "Yam porridge with fish", priceNgn: 1500, topSeller: true, platesPerWeek: 120, parts: [p("Yam, fresh", "Yam porridge", 300, "staple"), p("Fish fillet", "Fish", 80, "protein")] },
      { name: "White rice and chicken stew", priceNgn: 1900, topSeller: true, platesPerWeek: 180, parts: [p(RICE, "White rice", 90, "staple"), p("Chicken", "Chicken", 110, "protein")] },
      { name: "Akara and pap", priceNgn: 700, topSeller: false, platesPerWeek: 150, parts: [p("Akara", "Akara", 120, "protein"), p("Maize, dried", "Pap", 40, "staple")] },
    ],
    plantDishes: [
      {
        from: "Bread and egg", name: "Bread and Akara", priceNgn: 700, replace: ["Fried egg"], add: [{ food: "Akara", label: "Akara", grams: 120 }],
        blurb: "Soft agege bread with hot, crunchy akara. The classic breakfast.", reviews: 13, rating: "great",
        steps: ["Fry akara fresh each morning (or buy from the akara seller).", "Serve 4 to 5 balls with the bread."],
      },
      {
        from: "Yam porridge with fish", name: "Yam and Beans Porridge", priceNgn: 1300, replace: ["Fish"], add: [{ food: "Beans, boiled", label: "Beans", grams: 150 }],
        blurb: "Palm-oil yam porridge with soft beans stirred through.", reviews: 5, rating: "mixed",
        steps: ["Cook beans the night before.", "Stir 150 g cooked beans per plate into the yam porridge.", "Simmer for 5 minutes."],
      },
    ],
  },
  {
    slug: "second-cafe",
    menu: [
      { name: "Fried rice and chicken", priceNgn: 2200, topSeller: true, platesPerWeek: 200, parts: [p(RICE, "Fried rice", 90, "staple"), p("Chicken", "Chicken", 120, "protein")] },
      { name: "Jollof rice and beef", priceNgn: 2000, topSeller: true, platesPerWeek: 170, parts: [p(RICE, "Jollof rice", 90, "staple"), p("Beef (incl. suya)", "Beef", 90, "protein")] },
      { name: "Egg roll", priceNgn: 500, topSeller: false, platesPerWeek: 250, parts: [p(WHEAT, "Dough", 70, "staple"), p("Egg, hen", "Boiled egg", 50, "protein")] },
      { name: "Fura and yoghurt", priceNgn: 800, topSeller: false, platesPerWeek: 100, parts: [p("Maize, dried", "Fura", 40, "staple"), p("Milk, cow", "Yoghurt", 250, "protein")] },
    ],
    plantDishes: [
      {
        from: "Fried rice and chicken", name: "Soya Fried Rice", priceNgn: 1900, replace: ["Chicken"], add: [{ food: SOY, label: "Soya chunks", grams: 60 }],
        blurb: "Fried rice with crispy peppered soya chunks.", reviews: 9, rating: "good",
        steps: ["Soak, squeeze and season 60 g soya chunks per plate.", "Fry until crisp and toss through the fried rice."],
      },
      {
        from: "Jollof rice and beef", name: "Moi Moi Jollof", priceNgn: 1700, replace: ["Beef"], add: [{ food: "Moi moi", label: "Moi moi", grams: 180 }],
        blurb: "Jollof rice with a big wrap of steamy moi moi on the side.", reviews: 8, rating: "great",
        steps: ["Steam moi moi in the morning, or buy wraps from a trusted seller.", "Serve 1.5 wraps per plate with jollof."],
      },
      {
        from: "Fura and yoghurt", name: "Kunun Aya", priceNgn: 600, replace: ["Yoghurt"], add: [{ food: "Tigernut drink", label: "Kunun aya", grams: 350 }],
        blurb: "Chilled tigernut drink, creamy and sweet with ginger.", reviews: 7, rating: "good",
        steps: ["Buy kunun aya from a trusted seller or blend soaked tigernuts with ginger and dates.", "Serve chilled, 350 ml per bottle."],
      },
    ],
  },
];

/** Demo students: nickname + department (the leaderboard groups). */
export const DEMO_USERS: { nickname: string; group: string }[] = [
  ["TolaEats", "Computer Science"], ["JollofJudge", "Computer Science"], ["Kemi_K", "Computer Science"], ["DavidChops", "Computer Science"], ["Ify.Codes", "Computer Science"],
  ["ChiomaCooks", "Microbiology"], ["Zainab.B", "Microbiology"], ["Emeka247", "Microbiology"], ["AmakaFoodie", "Microbiology"],
  ["Tunde_Tastes", "Mass Communication"], ["Halima_H", "Mass Communication"], ["Obinna_O", "Mass Communication"], ["BisolaBites", "Mass Communication"], ["Sola_On_Air", "Mass Communication"],
  ["Musa.Grill", "Law"], ["Ada_LLB", "Law"], ["Kunle_K", "Law"], ["Esther.E", "Law"],
  ["Nurse_Joy_NG", "Nursing"], ["Precious_P", "Nursing"], ["Damilola_D", "Nursing"], ["Ruth.Rx", "Nursing"],
  ["Chidi_Accounts", "Accounting"], ["Bukky_B", "Accounting"], ["Yusuf_Y", "Accounting"],
  ["Ngozi_Econ", "Economics"], ["Femi.F", "Economics"], ["Hauwa_H", "Economics"], ["Victor_V", "Economics"], ["Jessica.J", "Economics"],
].map(([nickname, group]) => ({ nickname, group }));

/** Review comments by how the dish lands. Plain, campus-style, no emojis. */
export const DEMO_COMMENTS: Record<"great" | "good" | "mixed", string[]> = {
  great: [
    "Honestly didn't miss the meat at all. Will order again.",
    "Cheaper than the chicken plate and I was full till evening.",
    "The soya soaks up the pepper so well. Top tier.",
    "My roommate thought it was meat until I told her.",
    "Best thing on the menu this week, no cap.",
    "Portion was big and the price is fair for students.",
    "Came for the gist, stayed for the food. Very nice.",
    "Tried it because of the quest and now it's my regular.",
  ],
  good: [
    "Nice one. Could use a bit more pepper.",
    "Good, but I'd like a bigger portion.",
    "Tasty. Took a while to come out at lunch rush.",
    "Didn't expect much but it was solid.",
    "Good for the price. Would get it again on a broke week.",
    "Texture took some getting used to, but I liked it.",
  ],
  mixed: [
    "It's okay. The beans made it a bit heavy for me.",
    "Not bad, but I still prefer the fish version.",
    "Needed more salt. Might try it again.",
    "Fine for a quick lunch, nothing special.",
  ],
};
