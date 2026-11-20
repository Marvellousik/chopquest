# Market survey kit

Everything Jason needs to collect real menus, prices and suppliers around Veritas University, Bwari.

## Files

| File | What goes in it |
|---|---|
| `alt-proteins-checklist.csv` | Your shopping list: every plant and alternative protein we can suggest, what to ask for, the usual unit and where it's likely sold. **Start here.** |
| `price-log.csv` | One row per price you see: date, place, food, unit, price, weight. ₦ per kg is worked out from it. |
| `suppliers.csv` | Who sells what, exactly where, phone, delivery and minimum order. |
| `cafeteria-menus.csv` | Every dish at Ase Cafe, Bush Cafe, Munchbox, First Cafe and Second Cafe, with price and top sellers. |
| `addon-map.csv` | Which plant proteins fit which dish, how well, and the extra prep time. |
| `eval-dishes.csv` | Hand-weighed breakdowns of 15 dishes, used to test the AI. |
| `manager-interview.md` | Questions and a record sheet for cafeteria managers. |
| `student-survey.md` | Questions for students who try a swapped dish. |

## Where to look (confirm each one; none are verified yet)

1. **On campus first:** the five cafeterias themselves (ask what they buy and from whom), campus provision shops, and food vendors near the hostels (akara, moi moi, awara, kuli-kuli sellers).
2. **Bwari Main Market**, Bwari town: likely the nearest full foodstuff market. Grain and beans sellers (mudu), spice sellers (iru, egusi), groundnut and kuli-kuli sellers.
3. **Dutse Market** (Bwari Area Council): a community market; check how far it is from campus first.
4. **Supermarkets and provision stores** in Bwari for packaged items: soy chunks, soy milk, groundnut paste, sometimes mushrooms.
5. If a food can't be found within Bwari, write "not found in Bwari" in the checklist. **That's useful evidence too**, because the engine will avoid suggesting foods kitchens can't buy.

Ask the cafeterias who supplies their meat and grains: the same suppliers may sell beans or soy in bulk at a better price.

## How to record a price

1. Ask the price **per unit** the seller uses: mudu, derica, paint rubber, sachet, piece, wrap, bottle.
2. Weigh one unit (a small kitchen scale costs little; or buy one unit and weigh it at the hostel). If you can't weigh it, ask the seller and write "seller said" in notes.
3. Fill `price-log.csv`: `price_per_kg_ngn = unit_price_ngn ÷ unit_weight_g × 1000`.
4. Photograph the item and the price if there's a board. Save photos in a shared folder and put the filename in `photo`.
5. Get at least **2 prices per food**, ideally from 2 different places. Their average goes into `data/protein_db.csv`.

## Priority order (the foods the engine suggests most)

1. Soy chunks 2. Beans (brown and white) 3. Moi moi 4. Akara 5. Awara 6. Okpa 7. Groundnuts 8. Kuli-kuli 9. Egusi 10. Iru 11. Soy milk 12. Tigernut 13. Mushrooms 14. Pigeon pea

Also the **meat** the cafeterias use (chicken, beef, fish, egg): we need their price too, to show the cost saving.

## Rules

- Write only what you saw or were told. Date and place on every row.
- A blank is better than a guess.
- Keep receipts and photos: they're our proof if a judge asks.
