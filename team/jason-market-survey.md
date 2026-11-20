# Jason: market survey and evidence

You own every real number in the pitch: menus, prices, where to buy, and the feedback from managers and students. Without your data the AI has nothing true to work with, and the judges score evidence.

Everything you need is in [market-survey/](market-survey/). The spreadsheets are CSV files: open them in Excel or Google Sheets, or edit them on GitHub's website.

## Friday (today)

1. **Cafeteria menus** (`cafeteria-menus.csv`). Visit Ase Cafe, Bush Cafe, Munchbox, First Cafe and Second Cafe. For each: every dish, its student price, the main protein, and whether it's a top seller (ask the cashier: "What are your 5 best sellers?"). Photograph the menu board. Target: 30 to 40 dishes.
2. **Plant-protein prices** (`price-log.csv`), using `alt-proteins-checklist.csv` as your shopping list. Check campus shops first, then the nearest market (see the market README). Weigh one unit of each food on a kitchen scale, or ask the seller.
3. **Suppliers** (`suppliers.csv`): who sells each food, where exactly, phone number, whether they deliver, minimum order.
4. **Plate photos:** if a cafeteria lets you, photograph 3 plates from above (jollof with chicken, a beef dish, fried rice). Pascal uses them for the demo.

## Friday night

5. **Hand breakdowns** (`eval-dishes.csv`) for 15 dishes: for each plate, the parts and grams (weigh a takeaway pack if you can). This is the "truth" Pascal's AI is tested against.
6. **Add-on map** (`addon-map.csv`): for each common dish, which plant proteins fit it, how well (1 to 3) and the extra prep time. Ask a cafeteria cook if possible.
7. Put the average price per kg for each food into `data/protein_db.csv` (`price_ngn_per_kg`), then tell Marv to re-run `npm run seed`.

## Saturday morning (before 10:30)

8. **Manager feedback** (`manager-interview.md`): show 5 to 10 swaps from the app to at least 2 managers. Record yes, maybe or no for each, and their exact words. Try to get one "I would put this on my menu" in writing or on a photo.
9. **Student reviews:** get 10 to 15 students to rate the swapped dishes in the app (real reviews on the board). Use the questions in `student-survey.md`.
10. **Evidence table** for the deck: dishes tested, share with a swap within budget, average protein kept, average cost change (from Marv), AI accuracy (from Pascal), manager yes count, student "would order" %.

## Rules

- **Write down only what you saw or were told.** Date, place and source for every price. No guessing. A blank is better than a made-up number.
- Note the unit exactly (mudu, derica, paint rubber, sachet, piece, wrap) and its weight, because prices are per unit and we need ₦ per kg.
- Take photos of price boards and receipts as proof.

---

## Plan v2 (20 Nov): where-to-buy is now in the app, so fill `data/protein_sources.csv`

Managers see **where to buy every alternative protein, campus first, then Bwari**. The app reads `data/protein_sources.csv` on every boot. It has a starting row for all 21 proteins, all marked `likely` (where it is usually sold, **not checked**).

When you **confirm** a place: fill `place_name`, `landmark`, `contact`, `unit`, `price_ngn`, `unit_weight_g`, `last_checked` (date), set `status` to `confirmed` and `source` to your name. Add new rows for extra places. Never mark a place `confirmed` unless you visited or called it.

Also on Saturday morning: walk at least 2 managers through the kitchen survey with their **real** plates per week and what they pay for chicken, beef or fish. That is our profit evidence.
