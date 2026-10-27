# China Guide

English country guide. Public pages are JSON records rendered by shared templates.

This tree is the site shell: navigation, the paper and lacquer visual system, empty content collections, and the content check. It has no place, region, attraction, food, guide, or itinerary records.

## Scripts

- `npm run check:content` checks collection records, partner links, photo credits, and shell rules.
- `npm run build` runs that check, builds the static site, then checks the size budget.

Affiliate URLs belong in `src/lib/partners.ts`. Every value stays null until the owner pastes a URL.
