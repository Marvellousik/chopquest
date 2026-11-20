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
const BEANS = "Beans, boiled";
const MUSHROOM = "Oyster mushroom, fresh";
const MELON = "Melon seed, shelled";
const KULI = "Kuli-kuli (groundnut cake)";
const OKPA = "Okpa (steamed bambara pudding)";

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
  [BEANS]: 1100,
  "Soy milk": 1200,
  "Tigernut drink": 1500,
  "Egusi soup (no meat)": 2800,
  "Groundnuts, dry": 2500,
  [MUSHROOM]: 3000,
  [MELON]: 4000,
  [KULI]: 3000,
  [OKPA]: 1800,
};

// Plant dishes use the whole range of local proteins (beans, moi moi, akara, mushroom, egusi, kuli-kuli,
// okpa, tigernut, awara, soya), not soya on everything. Third Cafe and Machana Cafe build on their REAL
// menu items (same names as cafeteria-menus.csv): the seed links to the real dish and never changes it.
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
        blurb: "Our smoky party jollof with crispy fried soya chunks and dodo.", reviews: 34, rating: "great",
        steps: ["Soak 60 g soya chunks per plate in hot water for 10 minutes, then squeeze dry.", "Season with pepper, onion and stock, then fry until golden.", "Serve on jollof with dodo in place of the chicken."],
      },
      {
        from: "Fried rice and turkey", name: "Awara Fried Rice", priceNgn: 2000, replace: ["Turkey"], add: [{ food: AWARA, label: "Awara", grams: 150 }],
        blurb: "Fried rice loaded with veggies and golden fried awara cubes.", reviews: 19, rating: "good",
        steps: ["Cut fresh awara into cubes and fry until golden.", "Toss into the fried rice for the last minute.", "150 g awara per plate in place of the turkey."],
      },
      {
        from: "Meat pie", name: "Soya Meat Pie", priceNgn: 500, replace: ["Minced beef"], add: [{ food: SOY, label: "Soya mince", grams: 20 }],
        blurb: "Flaky pie with peppery soya mince, potatoes and carrots. Snack of the day.", reviews: 27, rating: "great",
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
      { name: "Masa and suya", priceNgn: 1500, topSeller: true, platesPerWeek: 140, parts: [p(RICE, "Masa", 90, "staple"), p("Beef (incl. suya)", "Suya", 80, "protein")] },
      { name: "Chapman", priceNgn: 600, topSeller: false, platesPerWeek: 140, parts: [] },
    ],
    plantDishes: [
      {
        from: "Eba and egusi with goat meat", name: "Mushroom Egusi with Eba", priceNgn: 1900, replace: ["Goat meat"],
        add: [{ food: MUSHROOM, label: "Oyster mushroom", grams: 150 }, { food: MELON, label: "Extra egusi", grams: 30 }],
        blurb: "Thick, nutty double egusi with meaty oyster mushrooms that soak up the soup.", reviews: 22, rating: "good",
        steps: ["Tear 150 g oyster mushroom per plate and fry with onion until browned.", "Add 30 g extra ground egusi per plate to the pot.", "Simmer the mushrooms in the egusi for 5 minutes and serve with eba."],
      },
      {
        from: "Chicken shawarma", name: "Awara Shawarma", priceNgn: 2000, replace: ["Chicken"], add: [{ food: AWARA, label: "Spicy awara", grams: 120 }],
        blurb: "Our shawarma with spicy grilled awara, cabbage, cream and pepper sauce.", reviews: 41, rating: "great",
        steps: ["Slice awara into strips and grill with suya spice.", "Wrap with the usual cabbage, cucumber and sauce.", "120 g awara per wrap in place of the chicken."],
      },
      {
        from: "Masa and suya", name: "Masa and Kuli-kuli", priceNgn: 1000, replace: ["Suya"], add: [{ food: KULI, label: "Kuli-kuli", grams: 40 }],
        blurb: "Soft, hot masa with crunchy kuli-kuli and yaji on the side. Northern classic.", reviews: 18, rating: "great",
        steps: ["Serve 40 g kuli-kuli per plate, crushed or whole.", "Add a spoon of yaji pepper on the side.", "Plate with masa as usual."],
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
        from: "Jollof rice with dodo and chicken", name: "Jollof, Ewa Agoyin and Dodo", priceNgn: 1700, replace: ["Chicken"], add: [{ food: BEANS, label: "Ewa agoyin", grams: 180 }],
        blurb: "Munchbox jollof, sweet dodo and a scoop of peppery ewa agoyin. Same plate, lighter price.", reviews: 37, rating: "great",
        steps: ["Cook beans soft the night before and fry the agoyin pepper sauce.", "Serve 180 g beans per plate with jollof and dodo.", "Pour a spoon of the agoyin sauce on top."],
      },
      {
        from: "Spaghetti and chicken", name: "Mushroom Bolognese", priceNgn: 1500, replace: ["Chicken"],
        add: [{ food: MUSHROOM, label: "Chopped mushroom", grams: 120 }, { food: BEANS, label: "Beans", grams: 100 }],
        blurb: "Spaghetti in a rich tomato sauce with chopped mushrooms and soft beans.", reviews: 16, rating: "good",
        steps: ["Chop 120 g mushroom per plate and fry until dark.", "Stir in 100 g cooked beans and the tomato sauce.", "Simmer for 10 minutes and serve over spaghetti."],
      },
      {
        from: "Chocolate milkshake", name: "Soya Chocolate Shake", priceNgn: 1200, replace: ["Milk"], add: [{ food: "Soy milk", label: "Soya milk", grams: 300 }],
        blurb: "Cold, thick chocolate shake made with soya milk. Drink of the week.", reviews: 24, rating: "good",
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
        blurb: "Soft agege bread with hot, crunchy akara. The classic breakfast.", reviews: 39, rating: "great",
        steps: ["Fry akara fresh each morning (or buy from the akara seller).", "Serve 4 to 5 balls with the bread."],
      },
      {
        from: "Yam porridge with fish", name: "Yam and Beans Porridge", priceNgn: 1300, replace: ["Fish"], add: [{ food: BEANS, label: "Beans", grams: 150 }],
        blurb: "Palm-oil yam porridge with soft beans stirred through.", reviews: 14, rating: "mixed",
        steps: ["Cook beans the night before.", "Stir 150 g cooked beans per plate into the yam porridge.", "Simmer for 5 minutes."],
      },
      {
        from: "White rice and chicken stew", name: "Rice, Stew and Fried Awara", priceNgn: 1600, replace: ["Chicken"], add: [{ food: AWARA, label: "Fried awara", grams: 150 }],
        blurb: "White rice and tomato stew with golden fried awara, the veggie pick First Cafe regulars already ask for.", reviews: 21, rating: "good",
        steps: ["Fry 150 g awara per plate until golden.", "Simmer it in the stew for 3 minutes.", "Serve over white rice."],
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
        blurb: "Fried rice with crispy peppered soya chunks.", reviews: 23, rating: "good",
        steps: ["Soak, squeeze and season 60 g soya chunks per plate.", "Fry until crisp and toss through the fried rice."],
      },
      {
        from: "Jollof rice and beef", name: "Moi Moi Jollof", priceNgn: 1700, replace: ["Beef"], add: [{ food: "Moi moi", label: "Moi moi", grams: 180 }],
        blurb: "Jollof rice with a big wrap of steamy moi moi on the side.", reviews: 33, rating: "great",
        steps: ["Steam moi moi in the morning, or buy wraps from a trusted seller.", "Serve 1.5 wraps per plate with jollof."],
      },
      {
        from: "Egg roll", name: "Hot Okpa", priceNgn: 600, replace: ["Dough", "Boiled egg"], add: [{ food: OKPA, label: "Okpa", grams: 200 }],
        blurb: "Steamed bambara pudding, peppery and filling. Breakfast for the 8am lecture.", reviews: 15, rating: "good",
        steps: ["Buy okpa wraps fresh from a trusted seller each morning.", "Keep warm in the food warmer.", "One wrap (about 200 g) per serving."],
      },
      {
        from: "Fura and yoghurt", name: "Kunun Aya", priceNgn: 600, replace: ["Yoghurt"], add: [{ food: "Tigernut drink", label: "Kunun aya", grams: 350 }],
        blurb: "Chilled tigernut drink, creamy and sweet with ginger.", reviews: 26, rating: "good",
        steps: ["Buy kunun aya from a trusted seller or blend soaked tigernuts with ginger and dates.", "Serve chilled, 350 ml per bottle."],
      },
    ],
  },
  {
    slug: "third-cafe",
    menu: [
      // Real dishes and prices from the Third Cafe board; the parts are a sample estimate for the demo maths.
      { name: "Chicken shawarma single sausage", priceNgn: 3000, topSeller: false, platesPerWeek: 150, parts: [p(WHEAT, "Wrap", 80, "staple"), p("Chicken", "Chicken", 100, "protein"), p("Beef (incl. suya)", "Sausage", 30, "protein")] },
      { name: "Cheese burger", priceNgn: 3000, topSeller: false, platesPerWeek: 90, parts: [p(WHEAT, "Bun", 80, "staple"), p("Beef (incl. suya)", "Beef patty", 100, "protein")] },
      { name: "Spaghetti bolognese", priceNgn: 1500, topSeller: false, platesPerWeek: 120, parts: [p(WHEAT, "Spaghetti", 100, "staple"), p("Beef (incl. suya)", "Minced beef", 80, "protein")] },
      { name: "Gizdodo", priceNgn: 3000, topSeller: false, platesPerWeek: 70, parts: [p("Plantain, ripe", "Dodo", 150, "staple"), p("Chicken", "Gizzard", 120, "protein")] },
    ],
    plantDishes: [
      {
        from: "Chicken shawarma single sausage", name: "Mushroom Suya Shawarma", priceNgn: 2500, replace: ["Chicken", "Sausage"],
        add: [{ food: MUSHROOM, label: "Grilled mushroom", grams: 150 }, { food: KULI, label: "Yaji (kuli-kuli spice)", grams: 25 }],
        blurb: "Oyster mushrooms grilled in yaji suya spice, wrapped with cabbage and pepper sauce.", reviews: 44, rating: "great",
        steps: ["Toss 150 g oyster mushroom per wrap in oil and yaji (ground kuli-kuli, pepper, ginger).", "Grill until the edges char.", "Wrap as usual in place of the chicken and sausage."],
      },
      {
        from: "Cheese burger", name: "Akara Burger", priceNgn: 2500, replace: ["Beef patty"], add: [{ food: "Akara", label: "Akara patty", grams: 120 }],
        blurb: "A big crunchy akara patty in a soft bun with cheese, onions and pepper sauce.", reviews: 31, rating: "great",
        steps: ["Fry the akara batter as one flat patty, 120 g per burger.", "Build the burger as usual with the akara in place of the beef."],
      },
      {
        from: "Spaghetti bolognese", name: "Ewa Bolognese", priceNgn: 1300, replace: ["Minced beef"], add: [{ food: BEANS, label: "Brown beans", grams: 180 }],
        blurb: "Our bolognese with soft brown beans in place of the mince. Hearty and cheaper.", reviews: 17, rating: "good",
        steps: ["Cook brown beans soft the night before.", "Simmer 180 g per plate in the bolognese sauce for 10 minutes.", "Serve over spaghetti."],
      },
      {
        from: "Gizdodo", name: "Mushroom Dodo", priceNgn: 2500, replace: ["Gizzard"], add: [{ food: MUSHROOM, label: "Peppered mushroom", grams: 180 }],
        blurb: "Gizdodo's cousin: sweet dodo tossed with peppered oyster mushrooms.", reviews: 20, rating: "good",
        steps: ["Fry 180 g mushroom per plate in the pepper mix until browned.", "Toss with the fried dodo as you would the gizzard."],
      },
    ],
  },
  {
    slug: "machana",
    menu: [
      // Real dishes and prices from the Machana Cafe menu; parts are a sample estimate.
      { name: "White rice and stew", priceNgn: 800, topSeller: false, platesPerWeek: 220, parts: [p(RICE, "White rice", 90, "staple"), p("Beef (incl. suya)", "Beef", 50, "protein")] },
      { name: "Boiled yam and egg sauce", priceNgn: 1500, topSeller: false, platesPerWeek: 110, parts: [p("Yam, fresh", "Boiled yam", 250, "staple"), p("Egg, hen", "Egg sauce", 100, "protein")] },
    ],
    plantDishes: [
      {
        from: "White rice and stew", name: "Rice, Stew and Moi Moi", priceNgn: 1000, replace: ["Beef"], add: [{ food: "Moi moi", label: "Moi moi", grams: 150 }],
        blurb: "White rice and stew with a fat wrap of moi moi. The cheapest full plate on campus.", reviews: 36, rating: "great",
        steps: ["Serve one wrap of the moi moi already on the menu with each plate.", "Swap it for the beef at no extra prep."],
      },
      {
        from: "Boiled yam and egg sauce", name: "Yam and Ewa Agoyin", priceNgn: 1300, replace: ["Egg sauce"], add: [{ food: BEANS, label: "Ewa agoyin", grams: 180 }],
        blurb: "Boiled yam with soft ewa agoyin and that dark, smoky pepper sauce.", reviews: 19, rating: "good",
        steps: ["Mash the white beans already on the menu slightly.", "Serve 180 g per plate with boiled yam.", "Top with agoyin pepper sauce."],
      },
    ],
  },
  {
    slug: "ggs",
    menu: [
      { name: "White rice, stew and chicken", priceNgn: 2300, topSeller: true, platesPerWeek: 210, parts: [p(RICE, "White rice", 90, "staple"), p("Chicken", "Chicken", 120, "protein")] },
      { name: "Bread and egg", priceNgn: 700, topSeller: false, platesPerWeek: 160, parts: [p(WHEAT, "Bread", 100, "staple"), p("Egg, hen", "Fried egg", 100, "protein")] },
    ],
    plantDishes: [
      {
        from: "White rice, stew and chicken", name: "Rice, Beans and Salad", priceNgn: 1700, replace: ["Chicken"], add: [{ food: BEANS, label: "Beans", grams: 180 }],
        blurb: "White rice and stew with beans and fresh salad, the pairing GG's staff swear by.", reviews: 25, rating: "good",
        steps: ["Cook beans soft each morning.", "Serve 180 g beans per plate with rice, stew and a side of salad."],
      },
      {
        from: "Bread and egg", name: "Ewa Agoyin and Bread", priceNgn: 700, replace: ["Fried egg"], add: [{ food: BEANS, label: "Ewa agoyin", grams: 200 }],
        blurb: "Soft bread dipped in mashed ewa agoyin and smoky pepper sauce. Lagos on a plate.", reviews: 28, rating: "great",
        steps: ["Cook and lightly mash the beans.", "Fry the agoyin pepper sauce in palm oil.", "Serve 200 g beans with bread and sauce."],
      },
    ],
  },
  {
    slug: "mac-d",
    menu: [
      { name: "Goat meat pepper soup", priceNgn: 2500, topSeller: true, platesPerWeek: 90, parts: [p("Goat meat", "Goat meat", 150, "protein"), p("Yam, fresh", "Yam", 150, "staple")] },
      { name: "Plantain and egg sauce", priceNgn: 1500, topSeller: false, platesPerWeek: 120, parts: [p("Plantain, ripe", "Plantain", 200, "staple"), p("Egg, hen", "Egg sauce", 100, "protein")] },
    ],
    plantDishes: [
      {
        from: "Goat meat pepper soup", name: "Mushroom Pepper Soup", priceNgn: 2000, replace: ["Goat meat"],
        add: [{ food: MUSHROOM, label: "Oyster mushroom", grams: 200 }, { food: AWARA, label: "Awara", grams: 80 }],
        blurb: "Hot, peppery broth with oyster mushrooms and soft awara. Cures every cold.", reviews: 16, rating: "good",
        steps: ["Simmer 200 g mushroom and 80 g awara per bowl in the pepper soup base for 8 minutes.", "Serve with yam as usual."],
      },
      {
        from: "Plantain and egg sauce", name: "Dodo and Beans Sauce", priceNgn: 1300, replace: ["Egg sauce"], add: [{ food: BEANS, label: "Beans in pepper sauce", grams: 180 }],
        blurb: "Fried plantain with beans simmered in tomato and pepper sauce.", reviews: 12, rating: "mixed",
        steps: ["Simmer 180 g cooked beans per plate in the egg-sauce base, without the egg.", "Serve with fried plantain."],
      },
    ],
  },
];

// 23 crews: clan-style names or named after a person. Never departments.
const CREWS = [
  "Jollof Mafia", "Soya Squad", "Awara Avengers", "Moi Moi Mob", "Plantain Pirates", "Kuli Kuli Clan", "Chidi's Chop Crew", "Egusi Elites",
  "Akara Assassins", "Zobo Zealots", "Ofada Outlaws", "Dodo Dynasty", "Okpa Order", "Tiger Nut Titans", "Beans Brigade", "Puff Puff Posse",
  "Garri Gang", "Kunu Kings", "Ewa Agoyin Army", "Tobi's Table", "Hauwa's Hungry Hippos", "Big Femi Energy", "Aunty Bisi's Babes",
];
const NAMED: [string, string][] = [
  ["TolaEats", "Jollof Mafia"], ["JollofJudge", "Jollof Mafia"], ["Kemi_K", "Jollof Mafia"], ["DavidChops", "Jollof Mafia"],
  ["Ify.Codes", "Soya Squad"], ["ChiomaCooks", "Soya Squad"], ["Zainab.B", "Soya Squad"], ["Emeka247", "Soya Squad"],
  ["AmakaFoodie", "Awara Avengers"], ["Tunde_Tastes", "Awara Avengers"], ["Halima_H", "Awara Avengers"],
  ["Obinna_O", "Moi Moi Mob"], ["BisolaBites", "Moi Moi Mob"], ["Sola_On_Air", "Moi Moi Mob"], ["Musa.Grill", "Moi Moi Mob"],
  ["Ada_LLB", "Plantain Pirates"], ["Kunle_K", "Plantain Pirates"], ["Esther.E", "Plantain Pirates"],
  ["Nurse_Joy_NG", "Kuli Kuli Clan"], ["Precious_P", "Kuli Kuli Clan"], ["Damilola_D", "Kuli Kuli Clan"], ["Ruth.Rx", "Kuli Kuli Clan"],
  ["Chidi_Accounts", "Chidi's Chop Crew"], ["Bukky_B", "Chidi's Chop Crew"], ["Yusuf_Y", "Chidi's Chop Crew"],
  ["Ngozi_Econ", "Egusi Elites"], ["Femi.F", "Egusi Elites"], ["Hauwa_H", "Egusi Elites"], ["Victor_V", "Egusi Elites"], ["Jessica.J", "Egusi Elites"],
];
const FIRST = [
  "Aisha", "Tobi", "Chinwe", "Kelechi", "Fatima", "Seun", "Uche", "Amina", "Ifeoma", "Segun", "Nneka", "Ibrahim", "Funke", "Ikenna", "Zara",
  "Bolaji", "Chiamaka", "Sani", "Yemi", "Adaeze", "Rotimi", "Maryam", "Ebuka", "Temi", "Usman", "Nkechi", "Dayo", "Khadija", "Chuka", "Lola",
  "Abdul", "Ogechi", "Wale", "Rukayat", "Somto", "Ayo", "Blessing", "Gbenga", "Hadiza", "Jide", "Kosi", "Mide", "Nonso", "Ope", "Salma",
];
const STYLES: ((n: string, k: number) => string)[] = [
  (n, k) => `${n}Eats${k % 90}`,
  (n) => `${n}_${n[0]}${n.length}`,
  (n, k) => `${n}.Chops${k % 50}`,
  (n, k) => `${n}${200 + (k % 700)}`,
  (n) => `Iam${n}`,
  (n, k) => `${n}_Bites${k % 30}`,
  (n, k) => `Chef${n}${k % 20}`,
  (n) => `${n}.Naija`,
];

// How big each crew grows (same order as CREWS): some packed, some small, every one present.
const CREW_WEIGHT = [3, 3, 2, 2, 2, 2, 1, 3, 3, 2, 2, 3, 1, 2, 3, 2, 2, 1, 3, 2, 1, 3, 2];
const WEIGHT_TOTAL = CREW_WEIGHT.reduce((a, b) => a + b, 0);
function crewFor(k: number) {
  let slot = (k * 37) % WEIGHT_TOTAL;
  for (let i = 0; i < CREWS.length; i++) {
    if (slot < CREW_WEIGHT[i]) return CREWS[i];
    slot -= CREW_WEIGHT[i];
  }
  return CREWS[0];
}

/** About 200 demo students: the 30 named ones plus a crowd spread unevenly over 23 crews. */
export const DEMO_USERS: { nickname: string; group: string }[] = (() => {
  const out = NAMED.map(([nickname, group]) => ({ nickname, group }));
  const taken = new Set(out.map((u) => u.nickname.toLowerCase()));
  let k = 0;
  for (let i = 0; out.length < 200 && i < 5000; i++) {
    const name = FIRST[(i * 7) % FIRST.length];
    const nick = STYLES[(i + Math.floor(i / FIRST.length)) % STYLES.length](name, i * 13 + 5);
    if (taken.has(nick.toLowerCase())) continue;
    taken.add(nick.toLowerCase());
    // Uneven crew sizes so the board has big crews and small ones.
    out.push({ nickname: nick, group: crewFor(k) });
    k++;
  }
  return out;
})();

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
