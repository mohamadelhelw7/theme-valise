# Valise setup guide

This guide takes you from install to a store that's ready to sell. Each step says where to click in Shopify admin.

## 1. Install

- **From GitHub**: go to **Online Store → Themes → Add theme → Connect from GitHub** and pick the repository and the `main` branch. Changes pushed to `main` show up automatically.
- **From a zip**: go to **Online Store → Themes → Add theme → Upload zip file**.

If a change doesn't show up on a GitHub-connected theme, open the theme card, click **View logs**, then **Actions → Reset to last commit**.

## 2. Pick a style

Go to **Customize → Theme settings → Theme styles** and choose a starting point. You can change anything afterwards.

| Style | Made for | Look |
| --- | --- | --- |
| Valise | Handbags and accessories | White and soft grey with black, thin Josefin Sans capitals, square corners, badges as small text |
| Cognac | Leather goods and heritage brands | Ivory and cognac brown, Marcellus capitals, a cognac color band |
| Noir | Evening bags and luxury pieces | Black and bone with an oxblood band, photos filling the cards |
| Voyage | Backpacks, travel bags and luggage | Canvas beige and olive, bolder capitals, white product cards |
| Bordeaux | Handbags with a softer feel | Bone white and bordeaux, Newsreader headings with italic accent words |

## 3. Colors

**Theme settings → Colors** has six color schemes. Every section has a **Color scheme** setting. Change a scheme once and every section that uses it updates.

- In Valise: scheme 1 is the white page, 2 the soft grey band, 3 the dark band (slideshow, footer and announcement bar), 4 warm stone, 5 sand and 6 the leather brown band.
- Cards and panels use a scheme's **Cards and panels** color.
- **Badges** and **Image tints** are at the bottom of the Colors panel. The tints sit behind product photos, so photos shot on white or grey blend in.

## 4. Fonts

**Theme settings → Typography**:

- **Heading font**: Josefin Sans, Newsreader, Marcellus, or any font from Shopify's library. **Heading letter spacing** gives the wide, airy capitals of the Valise style.
- **Body font**: Figtree, or any font from Shopify's library.
- **Labels, prices and buttons**: the body font or the heading font.
- **Arabic headings**: IBM Plex Sans Arabic or Markazi Text. **Arabic text**: IBM Plex Sans Arabic. They only load when a page shows Arabic, and Arabic text never gets letter spacing.
- **Accent words in headings**: wrap words in *asterisks*, for example `The everyday *tote*`. They show in the accent color, or in italics when **Accent words in headings** is set to italic (the Bordeaux style does this).

**Theme settings → Layout** sets page width, margins and section spacing. **Corners and buttons** sets corner radius and the button shape.

## 5. Effects

**Theme settings → Animations**:

- Sections fade up as shoppers reach them, and photos can wipe in.
- **Page transitions**: pages fade into each other instead of flashing white. **Product photo flies from the card to the product page** makes the tapped photo grow into place. They work in Chrome, Edge and Safari; other browsers change pages normally.
- **Back to top button with scroll progress**: a round button in the bottom corner whose ring fills as shoppers scroll.
- Scrambling headings, a custom cursor, film grain and hard shadows are in the theme too. They're off in every Valise style because they suit louder brands; turn them on if you like.

Visitors who turn on reduced motion on their device see a still version of every effect.

## 6. Header and menus

1. Create your menus in **Online Store → Navigation**. The theme uses `main-menu` for the header and `footer` for the footer.
2. In **Customize → Header**:
   - Logo image, or a text logo with **Text logo style → Spaced capitals**.
   - **Logo position**: in the center with the menu at the start (the Valise default), at the start, or in the center with the menu below.
   - **Show header over the homepage's first section**: the header sits over the slideshow in white and turns solid when shoppers scroll or hover. Upload a light logo if yours is dark.
   - **Show country and currency selector on desktop**: appears when you sell in more than one country (**Settings → Markets**).
   - Search, account, saved items and cart icons, a mega menu with an image, and mobile menu extras (WhatsApp, language and country, social icons).
   - **Typed hints** for the search field, separated by commas, for example `tote, crossbody, backpack, wallet`.

## 7. Announcement bar

- **Motion**: a scrolling ticker, one message at a time, static, or **Message at the start, countdown at the end**.
- Add **Announcement** blocks for messages, with an optional link.
- Add a **Countdown message** block for a live timer, for example to the end of a sale. Set the date, time and time zone (Egypt uses UTC+2 in winter and UTC+3 in summer). **Clock style → Labels under the numbers** shows days, hours, minutes and seconds in columns. When it ends, your message shows instead.

## 8. Product cards

**Theme settings → Product cards**:

- **Image fit → Show the whole photo** and **Padding around photo** show the whole bag on a soft tint, like a studio shot. **Blend white photo backgrounds** removes the white box around photos shot on white.
- **Hover**: show the second photo (for example the inside of the bag, or the bag on a model), browse up to four photos, or zoom.
- **Show color swatches**: pointing at a swatch shows that color's photo, and tapping it picks that color. Set which option names count as colors in **Color option names**, for example `Color, Colour, اللون`.
- **Badge style → Text only** shows Sale, New and Sold out as small capitals above the photo, like a boutique label.
- **Quick add** and **Quick view**: products without options go straight to the bag; the others open a quick view.
- **Play the product video on hover**: products with a video play it when the pointer is over the card. Computers only.
- **Show sizes on product cards** is off. Turn it on if your bags come in sizes (Mini, Small, Large) and you want them as buttons on the card.

## 8b. Saved items

**Theme settings → Saved items**: a heart on product cards and a **Save button** block for the product page. Saved bags show in the **Saved** drawer, opened from the header. The list is kept on the shopper's device, so it works without an account.

## 8c. Before you add photos

**Theme settings → Layout → Missing photos**:

- **Frames without a photo**: **Bag drawings** shows a fine line drawing of a bag in soft studio light, with stitching and a floor shadow. When the product name says the type (tote, backpack, crossbody, clutch, bucket, wallet, weekender or satchel, in English or Arabic), the drawing matches it. Wide frames show a shelf with three bags. **Plain tint** shows an empty tinted frame instead.
- **Show heroes as text only when they have no photo**: Hero, Drop hero and Image with text drop the empty photo and show only the text. In the theme editor a note says so.
- Sections that use store products fill with your product photos on their own once your products have photos.

## 9. Homepage sections

Every section can be moved, hidden or removed. The homepage comes with eighteen.

### Slideshow

The first section, full screen, with the header over it.

- **Slide change**: **Zoom reveal** (the new photo settles from a close zoom while the old one dips to dark), fade, or vertical blinds.
- **Text style → In a thin frame**: the eyebrow, heading, text and buttons sit in a thin frame that draws itself, line by line, when the slide appears, and the heading opens from the center. **Plain** puts the text at the bottom.
- **Slide controls → Next button with a timer ring**: a round button at the bottom with the slide number. Its ring fills while the slide plays; tapping it shows the next slide. A pause button sits beside it. Dots are available too.
- Each **Slide** block: **One photo** (with an optional photo for phones) or **Two photos side by side** (portrait photos work best; on phones they stack). Up to two buttons, each solid, dark or outline. Empty photos use your products.
- **Image darkening** keeps white text readable on bright photos.

### Featured products

**Tab style → Large words**: the tabs become big underlined words, for example New in, All bags and On sale, and replace the heading. Each tab can show a collection or all products, newest first or on sale only. **View all link position → Button under the products** adds a centered button under the grid.

### A closer look

A bag photo stays in place while numbered points appear one by one as shoppers scroll, each with a thin line and a label.

- **Image**: a cut-out photo or a photo on a plain background works best. Without one, it uses the picked product's photo (or on product pages, that product).
- Add up to six **Point** blocks. Set **Across the photo** and **Down the photo** to place each point, then write a short title and text, for example the handle, the hardware, the stitching and the base. The label goes to the left or right automatically, or you can choose.
- **Scroll length** sets how far shoppers scroll while the points appear. On phones and tablets the photo shows all points at once, with a numbered list under it.
- Selecting a point in the theme editor scrolls the page to it.

### Other homepage sections

- **Campaign hero**: a full-screen photo with the text at the bottom start that frames into a card as shoppers scroll.
- **Collection list** ("Shop by style"): your collections as tiles. Empty slots use your store's collections.
- **Featured product**: one bag with its photos, options and buy buttons.
- **Scroll collage**: two words on either side of a photo that grows to fill the screen, on the leather brown band.
- **Horizontal lookbook**: scrolling down moves a row of looks sideways. Phones get a swipe row.
- **Shop the look**: a lifestyle photo with product dots.
- **Image with text**, **Scrolling words** (big words that stay in place while their photo passes) and the **Curved gallery** ("Explore by style").
- **Countdown banner**: set the end date in the Countdown block.
- **Reviews**: a photo mosaic. Paste real reviews only.
- **Marquee**, **Blog posts**, **Newsletter** and **Social gallery**.

## 10. Product page

The product template has twelve sections: details, a marquee, A closer look (with this product), the product story ("Why you'll love it"), Look inside, frequently bought together, shop the look, reviews, FAQ, you might also like, more from this collection and recently viewed.

Blocks in the details:

- **Bag size**: width, height, depth, strap or handle drop, capacity and weight, with a measured drawing. Type numbers only (for example `30`); the unit is added for you. Tick what fits inside (phone, wallet, keys, sunglasses, water bottle, tablet, A4 documents, 13 inch or 15 to 16 inch laptop) and the ways to carry it. The block stays hidden until you fill something in, so it never shows made-up sizes.
  - **One size per product with metafields**: go to **Settings → Custom data → Products → Add definition** and create, for example, Width, Height and Depth (single line text or number). Fill them in on each product. Then in the block, click the **Connect dynamic source** button next to each field and pick the metafield.
- **Initials**: a checkbox that opens a field for initials, with a live preview on a leather tag. Set the most letters, the tag color and the name shown on the order (Initials by default). **Foil choices** adds options such as Gold, Silver or Blind, which change the preview and are saved on the order too. If the box is ticked, shoppers can't add to the bag without typing the initials.
  - The block doesn't change the price. To charge for initials, write the fee in **Price note** and add a paid product (for example "Initials") that shoppers add too, or use a product options app.
- **Back in stock alert**: shows only when the chosen color is sold out. Shoppers leave their email and are saved in **Customers** with the tags `restock` and `restock:product-handle:variant`. When the bag is back, filter your customers by that tag and email them.
- **Save button**, title, rating, price, variant picker with color swatches, stock status, buy buttons, description, delivery estimate (with the 27 Egyptian governorates in five areas), an accordion (materials and care, shipping and returns), icons, payment icons and WhatsApp.
- **Size guide**, **Fit note** (for example "Shown on a 170 cm model") and **Size finder** blocks are available too.

## 11. Collection page

- **Let shoppers change columns**: buttons above the grid switch between 2, 3 and 4 columns.
- **Promo tile**: a photo or colored tile with a heading and button, placed between products.
- **More products**: a **Load more** button with a progress line, loading as shoppers scroll, or page numbers.
- Filters and sorting. Set up filters in the **Search & Discovery** app (for example by color, material and price).

## 12. Footer and popup

The footer has a brand column, menus, a newsletter and a closing band with your store name in large letters.

The popup is in **Customize → Footer → Popup**. In Valise it's a small card in the bottom corner that asks shoppers to join your list after they scroll part of the page. You can change when it appears, how often, on which pages, its position and style, and add a discount code that shows after signup (create the code in **Discounts** first). Signups are saved as customers with the tags `newsletter` and `popup`.

A **Mobile tab bar** (Home, Shop, Search, Saved and Bag at the bottom of the screen on phones) is in the footer, turned off. Turn it on in **Footer → Mobile tab bar** if you like it.

## 13. Cart, WhatsApp, Arabic and EGP

- **Theme settings → Cart** sets what happens after adding to the bag: drawer, cart page or checkout.
- **Theme settings → WhatsApp**: turn on the floating button and enter your number with the country code, digits only (for example `201001234567`).
- Add Arabic in **Settings → Languages**. The theme switches to right-to-left automatically, including the slideshow, sliders and drawers. Translate products with **Translate & Adapt**.
- The currency format comes from **Settings → General → Store currency**. **Theme settings → Language and currency** can hide `.00`.

## 14. Store setup checklist

- **Menus**: `main-menu` and `footer` in **Online Store → Navigation**.
- **Filters and complementary products**: install **Search & Discovery**. Complementary products feed "Frequently bought together" and the cart upsells.
- **Languages**: **Settings → Languages**, then **Translate & Adapt** for products and pages.
- **Bundles**: the Bundle section shows a discount for display only. Create a matching automatic discount in **Discounts**.
- **Shipping**: set your rates in **Settings → Shipping and delivery**, then write the same times and fees in the Delivery estimate block's areas.
- **Reviews and cash on delivery**: install a reviews app (stars read the standard `reviews.rating` metafield) and, if you offer it, a cash on delivery app. The **Payment note** block has a cash on delivery preset; it isn't in any template until you add it.

## 15. Pages to create

| Page | Template |
| --- | --- |
| About | `about`: campaign hero, statement, stacking stories, A closer look, video, social gallery |
| Contact | `contact` |
| Reviews | `reviews` |
| Shipping | `shipping`: lists the delivery areas with time and fee |

## 16. Speed and accessibility

- Fonts are bundled and only the ones in use load. Images are sized responsively and lazy loaded.
- Effects only run while their section is on screen. Visitors who turn on reduced motion see a still version of every effect.
- Menus, drawers, tabs, sliders and accordions work with the keyboard and screen readers. The slideshow's timer ring has a pause button.
