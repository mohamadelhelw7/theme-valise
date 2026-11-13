# Valise, a Shopify theme

A premium Online Store 2.0 theme for handbag, leather goods and travel bag brands, built on theme blocks. It's quiet and refined: thin, widely spaced capitals, square corners, product photos on soft grey, and a full-screen slideshow whose text sits in a thin frame that draws itself. It has bag-specific product blocks, Arabic and right-to-left support, Egyptian delivery features, and selling tools that usually need apps.

- **Setup guide:** [docs/setup-guide.md](docs/setup-guide.md)
- **دليل الإعداد بالعربية:** [docs/setup-guide.ar.md](docs/setup-guide.ar.md)
- **Changes:** [CHANGELOG.md](CHANGELOG.md)

## Install

- **GitHub (recommended):** Online Store → Themes → Add theme → Connect from GitHub → this repo, `main` branch.
- **Zip:** `shopify theme package` in this folder, then Online Store → Themes → Add theme → Upload zip.
- **Local preview:** `shopify theme dev --store your-store.myshopify.com`

## What's included

**Five style presets:** Valise (white and soft grey with black, thin Josefin Sans capitals), Cognac (ivory and cognac leather, Marcellus capitals), Noir (black, bone and oxblood), Voyage (canvas and olive, for backpacks and travel) and Bordeaux (bone and bordeaux, Newsreader with italic accents).

**Signature sections**
- Slideshow: full-screen slides with a zoom reveal between them, text in a thin frame that draws itself as each slide appears, slides with two photos side by side, up to two buttons, and a next button whose ring fills while the slide plays.
- A closer look: a bag photo stays in place while numbered points, lines and labels appear one by one as shoppers scroll. Made for showing the handle, hardware, stitching and base.
- Featured products with large underlined words as tabs, for example New in, All bags and On sale, and a button under the products.
- Plus every section from the shared engine: campaign hero, scroll collage, horizontal lookbook, scrolling words, curved gallery, shop the look, stacking stories, hover list, bento grid, drag gallery, reels, countdown banner, photo mosaic reviews, product finder, set builder, video, newsletter, blog posts, social gallery, recently viewed and a popup.

**Made for bags**
- Bag size block: width, height, depth, strap drop, capacity and weight, with a measured drawing. Ticks for what fits inside (phone, wallet, tablet, A4 documents, 13 or 15 inch laptop and more) and the ways to carry it. Every value can come from a product metafield.
- Initials block: shoppers add initials with a live preview on a leather tag, and optional foil choices. Saved on the order.
- Color swatches on product cards that switch the photo, and a hover photo for the inside or the bag on a model.
- Saved items, back in stock alerts, quick view and quick add.

**Before photos are added**
- Frames without a photo show fine line drawings of bags in soft studio light, with stitching and a floor shadow. A product called "Canvas backpack" gets a backpack drawing, in English or Arabic.
- Heroes with no photo switch to a text-only layout.

**Header and announcement bar**
- Logo in the center, menu at the start and icons at the end, see-through over the slideshow and solid on scroll.
- Country and currency selector in the header.
- Announcement bar with a message at the start and a countdown at the end.

**Selling features**
- Quick view, sticky add to cart bar, frequently bought together, set builder, cart upsells and a free shipping bar.
- Countdown timers, sale, new and sold out badges (as small text or boxes), and stock status.
- Load more button or loading as shoppers scroll on collection pages.
- Delivery date estimate and an Egyptian governorate delivery picker.
- Predictive search with typed hints.

**Local features**
- Full Arabic translation with automatic right-to-left layout and bundled Arabic fonts (IBM Plex Sans Arabic and Markazi Text).
- Floating WhatsApp button and an Ask on WhatsApp product button.
- Price format options for EGP.

**Technical**
- Theme blocks everywhere, with app blocks in product and content sections.
- No external libraries or remote assets. Bundled fonts: Josefin Sans, Newsreader, Marcellus, Figtree, IBM Plex Sans Arabic and Markazi Text.
- Every effect only runs while its section is on screen and turns off for visitors who prefer reduced motion.

## Versioning

`theme_version` in `config/settings_schema.json` goes up with every change, and `shopify theme package` names the zip after it.
