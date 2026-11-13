# Valise, a Shopify theme

A premium Online Store 2.0 theme for handbag and leather goods brands that presents every bag like an object in a gallery. The homepage is a walk through rooms, one bag per screen on a plinth with a museum label, and the page takes the color of each room as you scroll. The product page is a room of its own whose color follows the color the shopper picks. It has bag-specific blocks, Arabic and right-to-left support, Egyptian delivery features, and selling tools that usually need apps.

- **Setup guide:** [docs/setup-guide.md](docs/setup-guide.md)
- **دليل الإعداد بالعربية:** [docs/setup-guide.ar.md](docs/setup-guide.ar.md)
- **Changes:** [CHANGELOG.md](CHANGELOG.md)

## Install

- **GitHub (recommended):** Online Store → Themes → Add theme → Connect from GitHub → this repo, `main` branch.
- **Zip:** `shopify theme package` in this folder, then Online Store → Themes → Add theme → Upload zip.
- **Local preview:** `shopify theme dev --store your-store.myshopify.com`

## What's included

**Five style presets, each an exhibition:** Gallery (plaster with sage and clay rooms), Nocturne (dark rooms and brass), Terracotta (sand, terracotta and olive), Salon (blush, bordeaux and EB Garamond italics) and Stone (warm greys and brass).

**Gallery sections**
- **Rooms:** an opening title, then one bag per screen on a plinth with a numbered museum label. The page color melts into each room's color as shoppers scroll. Empty rooms fill with your products.
- **Product room:** the product page opens as a room. The label holds the title, price, options and buy buttons; the photos change with roman numerals or a swipe; the room takes a soft tint of the color the shopper picks.
- **Product views:** the product's other photos, one per room, with their alt text as captions.
- **Wall text:** a gallery-style introduction, or the product, collection or page description.
- **Catalogue entry:** maker, type and reference beside the bag's measurements, care and delivery.
- **Hall:** products hung as a salon wall in mixed sizes, with label cards.
- **Page intro**, **Visitor book** (email signup) and the **Colophon** footer.
- **Gallery header:** an Index button that opens a full-screen list of your collections with their photos and product counts, the wordmark in the center, and Bag (2).
- **A closer look:** a pinned bag photo whose numbered points and labels appear one by one as shoppers scroll.

**Made for bags**
- Museum label product cards: a number, the name in the display serif, the type in italics and the price, under a photo on a soft tint.
- Bag size block: measurements with a drawing, what fits inside and ways to carry, all ready for metafields.
- Initials block with a live leather tag preview and foil choices, saved on the order.
- Salon wall option for collection pages.

**Before photos are added:** drawn leather bags standing on plinths, matched to the product name when it says the bag type.

**Also included:** every section from the shared engine (slideshow, campaign hero, scroll collage, lookbook, set builder, product finder, reels and more), quick view, sticky add to cart bar, frequently bought together, cart upsells, free shipping bar, countdowns, predictive search, saved items, back in stock alerts, delivery estimate with an Egyptian governorate picker, WhatsApp, full Arabic with right-to-left layout, and price formats for EGP.

**Technical:** theme blocks everywhere, no external libraries or remote assets. Bundled fonts: Gloock, EB Garamond, Aref Ruqaa and Scheherazade New. Effects only run on screen and turn off for visitors who prefer reduced motion.

## Versioning

`theme_version` in `config/settings_schema.json` goes up with every change, and `shopify theme package` names the zip after it.
