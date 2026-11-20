# ChopQuest plan v2: kitchen admin + student adoption engine

Agreed 20 Nov 2026. This replaces the "one user per screen" idea in `README.md`: ChopQuest has **two sides that feed each other**.

## The loop (this is the pitch)

1. **Manager** sets up the kitchen (survey); Chloe recommends which alternative proteins to use and shows the profit evidence.
2. The manager **publishes** a plant dish ("Soya Jollof at Munchbox").
3. **Students** get a quest pointing at that dish, eat it and **scan it with the camera** (no gallery uploads); the AI checks the plant protein is on the plate.
4. They earn points, unlock Dex entries, grow the pet and lift their group on the leaderboard.
5. They **review** the dish, and the Plant Board ranks the cafeteria.
6. Real plant meals logged and "would order again" flow **back to the manager's report**, replacing the assumed switch rate with a measured one.
7. The manager sees real demand and converts more dishes.

Judges' framing: lead with **Challenge 2** (the restaurant tool and its profit evidence). The student side is the **adoption engine that proves the menu changes work**. Every game feature points at a real cafeteria dish.

## Who sees what

| | Students (public) | Managers (kitchen admin) |
|---|---|---|
| Nav | Home (pet + quests), Scan, Where to eat (board + cafeterias), Dex, Leaderboard | `/kitchen`, behind the cafeteria's **access code** |
| Does | Find, eat, scan and review plant dishes; compete as a group | Set up the kitchen, see Chloe's recommendations and the profit report, publish dishes, see where to buy proteins |
| Never sees | Costs, margins, supplier prices | Other cafeterias' costs; no game screens |

## Decisions

- **Access:** one 6-digit code per cafeteria, created by the team, handed to the manager in person. Entered once, remembered on that device. Codes live in the `KITCHEN_CODES` server variable (team only).
- **Proof of eating:** a **camera-only** photo taken in the app (no gallery uploads, so old photos can't be reused). The AI checks the plant protein is on the plate, and the student picks which cafeteria dish it is. Live video is a "next step" slide (cost, privacy, data).
- **Switch rate:** default **25%** until real scans come in.
- **Where to buy:** every alternative protein shows where to buy it, **on campus first, then Bwari**. Each place is labelled **"Confirmed by our team"** (from Jason's survey) or **"Likely, check first"**. We never present an unchecked place as confirmed.

## Switch rate, in plain words (use this wording with managers)

> **Switch rate** is how many of your customers for a dish would pick the plant version instead of the meat one.
> Example: you sell 200 plates of chicken jollof a week. If 1 in 4 customers (25%) switch to soya jollof, that's 50 plates. At ₦480 more profit per plate, that's ₦24,000 more a week.
> Until your plant dish is on sale we can only guess, so we start at 25% and you can change it. Once students start eating and scanning it, ChopQuest replaces the guess with what really happened.

## Manager survey ("Set up your kitchen")

1. **Your cafeteria:** opening days per week, about how many plates a day.
2. **Your menu:** each dish's name, price and whether it's a top seller. Chloe pre-fills the parts and grams and the manager fixes them.
3. **Your costs:** plates sold per week and cost per plate for each dish; what you pay for each protein (unit, price, supplier). Their prices override the market survey.
4. **Your limits:** max extra prep time; foods you can't get or won't use.
5. **Your goal:** keep the price and earn more, or cut the price to attract students.

## What the manager gets

- **Top alternative proteins for your kitchen:** ranked by weekly profit across your menu, how many dishes each fits, and protein kept. Each shows **where to buy it**.
- **Dishes to convert first,** and the top 3 swaps per dish with reasons.
- **Profit report:** cost and margin per plate before and after, weekly and monthly profit at the switch rate, protein kept, extra prep. Later, **real demand**: plant meals logged, rating, would-order-again %, measured switch rate.
- **Download my report** (one page, for the owner).

## Work split

| Who | Work |
|---|---|
| **Marv** | Access codes and kitchen sign-in; manager data (profile, menu stats, own prices); protein sources and where-to-buy; profit report and protein recommendations with the 25% switch rate; plant-meal log (camera scan → AI check → points); real-demand numbers; quests from published dishes |
| **Ola** | Public nav (Home, Scan, Where to eat, Dex, Leaderboard); quest cards pointing at dishes; camera-only scan screen with dish picker; the manager survey, recommendations, where-to-buy and report screens |
| **Pascal** | Survey pre-fill from dish names; the plate check for logged plant meals; plain-language explanations checked against the numbers |
| **Jason** | Fill `data/protein_sources.csv` with **confirmed** places (campus and Bwari: name, landmark, phone, unit, price); real managers through the survey Saturday morning; 15–20 students eating, scanning and reviewing |
