# Valise setup guide

Valise shows your bags the way a gallery shows objects: one at a time, in rooms, with museum labels. This guide takes you from install to a store that's ready to sell. Each step says where to click in Shopify admin.

## 1. Install

- **From GitHub**: go to **Online Store → Themes → Add theme → Connect from GitHub** and pick the repository and the `main` branch. Changes pushed to `main` show up automatically.
- **From a zip**: go to **Online Store → Themes → Add theme → Upload zip file**.

If a change doesn't show up on a GitHub-connected theme, open the theme card, click **View logs**, then **Actions → Reset to last commit**.

## 2. Pick a style

Go to **Customize → Theme settings → Theme styles**. Each style is a different exhibition; you can change anything afterwards.

| Style | Look |
| --- | --- |
| Gallery | Plaster walls with sage and clay rooms, oxblood accents, Gloock headings |
| Nocturne | Dark rooms, bone text and brass, for evening and luxury pieces |
| Terracotta | Sand, terracotta and olive rooms |
| Salon | Blush and bordeaux, EB Garamond headings with italic accent words |
| Stone | Warm greys with brass |

## 3. Colors and rooms

**Theme settings → Colors** has six color schemes. In the Gallery style: 1 is the plaster wall, 2 white paper, 3 ink (the announcement bar), 4 the sage room, 5 the clay room and 6 the oxblood accent.

Rooms take their color from a scheme, so changing scheme 4 recolors every sage room on the store. Each Room block also has a **Custom room color** if you want one room in its own color.

**Image tints** sit behind product photos on cards. Photos shot on white or grey blend in when **Blend white photo backgrounds** is on.

## 4. Fonts

**Theme settings → Typography**:

- **Heading font**: Gloock or EB Garamond, or any font from Shopify's library. **Body font**: EB Garamond, or any library font.
- **Arabic headings**: Aref Ruqaa (calligraphic) or Scheherazade New. **Arabic text**: Scheherazade New. They only load when a page shows Arabic.
- **Accent words**: wrap words in *asterisks*, for example `Objects to *carry*`. They show in the accent color, or in italics with **Accent words in headings → Italic** (the Salon style does this).

## 5. Header and the index

In **Customize → Header** the store uses the **Gallery header**:

- **Index** on the left opens a full-screen list of your menu. Collection links show their product count and their photo beside the list as the pointer moves. On phones the Index is the menu.
- The wordmark or logo sits in the center; **Search**, **Account**, **Saved** and **Bag (2)** sit at the sides.
- **Show header over the homepage's first section** lets the header sit over the first room.
- **Index menu**: create it in **Online Store → Navigation**. Link to collections to get photos and counts.
- The index can also show WhatsApp, language and country, and your social links.

The previous header is still available if you prefer it: remove the Gallery header and add **Header**.

## 6. Homepage

The homepage has seven sections, each one can be moved, hidden or removed.

### Rooms

- An optional **opening title** (eyebrow, title and text) comes first.
- Each **Room** block shows one bag on a plinth with a museum label: number, name, caption, price and a View link. The page color melts into the room's color as shoppers scroll, and the bag rises into place.
- **Product**: pick one, or leave it empty and the room uses your products in order (or the section's **Collection for empty rooms**).
- **Image**: a cut-out photo or a photo on a plain background looks best. **Bag size** sets how tall the bag stands.
- **Caption**: defaults to the product type. Write the materials here, for example "Calf leather, brass lock".

The homepage has two Rooms sections: the new season, then small leather goods.

### Other sections

- **Wall text**: a few lines about the collection, written like a gallery's introduction, with a label and a note beside it.
- **Hall**: products hung as a salon wall in mixed sizes. Pick a collection or use all products.
- **A closer look**: a bag photo stays in place while numbered points and labels appear as shoppers scroll. Place each **Point** with **Across the photo** and **Down the photo**.
- **Visitor book**: an email signup. Signups are saved in **Customers** with the tags `newsletter` and `visitor-book`.

## 7. Product cards

**Theme settings → Product cards → Card layout → Museum label** puts a thin rule under the photo, then the number, the product name in the heading font, the type in italics and the price. The photo rises slightly on hover, and the second photo shows if **Hover** is set to second photo. Set the **Product type** of each product so the italic line says something useful, for example "Calf leather".

## 8. Product page

The product template has eight sections:

1. **Product room**: the page opens as a room.
   - The photos show one at a time on a plinth. Roman numerals switch between them on computers; on phones shoppers swipe. Tapping a photo opens it full screen.
   - **Tint the room with the chosen color**: when a shopper picks a color, the room takes a soft tint of it. It uses the color swatches set on your product options (**Products → your product → Options**), or the color name when it's a standard color such as Black or Olive.
   - The museum label holds the blocks: title, price, variant picker, stock, **Initials**, buy buttons, back in stock alert, Save and WhatsApp. Add or reorder blocks here.
2. **Product views**: the other photos, one per room. Write a short caption in each photo's **alt text** (click the photo in the product's media) and it shows beside the photo, for example "Inside. Two slip pockets".
3. **Wall text** shows the product description.
4. **Catalogue entry**: the maker (vendor), type and reference (SKU) beside the **Bag size** block, the accordion and the delivery estimate.
5. Pairs well with, reviews, **In the same room** (a Hall of the product's collection) and recently viewed.

**Bag size**: type numbers only (for example `30`); the unit is added for you. Tick what fits inside and the ways to carry it. The block stays hidden until you fill it in. To give every bag its own sizes, create product metafields in **Settings → Custom data → Products** (for example Width, Height and Depth), then connect them with the **Connect dynamic source** button next to each field.

**Initials**: a checkbox that opens a field for initials with a live preview on a leather tag. Set the most letters, the tag color, the name on the order and optional foil choices. It doesn't change the price; to charge for initials, add a paid product shoppers add too, or use a product options app.

## 9. Collection page

- A **Page intro** shows the collection name, its product count and description.
- **Main collection → Grid style → Salon wall, mixed sizes** hangs the products in mixed sizes on computers. **Show title and description** is off because the intro shows them.
- Filters and sorting work as usual. Set up filters with the **Search & Discovery** app.

## 10. Footer

The **Colophon** footer has an email line ("News of new rooms"), your wordmark and a short text, two menus, and a bottom line with the copyright, social links, language and country, and payment icons. The popup and the mobile tab bar are in the footer group, turned off.

## 11. Before you add photos

**Theme settings → Layout → Missing photos → Bag drawings** shows drawn leather bags on plinths until you add photos. When a product name says the type (tote, backpack, crossbody, clutch, bucket, wallet, weekender or satchel, in English or Arabic), the drawing matches it.

## 12. Cart, WhatsApp, Arabic and EGP

- **Theme settings → Cart**: after adding to the bag, open the drawer, the cart page or checkout.
- **Theme settings → WhatsApp**: turn on the floating button and enter your number with the country code, digits only (for example `201001234567`).
- Add Arabic in **Settings → Languages**. The theme switches to right-to-left automatically. Translate products with **Translate & Adapt**.
- The currency format comes from **Settings → General → Store currency**. **Theme settings → Language and currency** can hide `.00`.

## 13. Store setup checklist

- **Menus**: `main-menu` (the index and the footer's first menu) and `footer`.
- **Search & Discovery** for filters and complementary products (they feed "Pairs well with" and cart upsells).
- **Shipping**: set rates in **Settings → Shipping and delivery**, then write the same times and fees in the Delivery estimate areas.
- **Bundles**: the Bundle section's discount is display only; create a matching automatic discount in **Discounts**.
- **Reviews and cash on delivery**: install a reviews app; stars read the `reviews.rating` metafield. The **Payment note** block has a cash on delivery preset, not used in any template.

## 14. Pages to create

| Page | Template |
| --- | --- |
| About | `about`: page intro, wall text (your page content), A closer look, hall, visitor book |
| Contact | `contact` |
| Reviews | `reviews` |
| Shipping | `shipping`: the delivery areas with time and fee |

## 15. Speed and accessibility

- Fonts are bundled and only the ones in use load. Images are sized responsively and lazy loaded.
- Room colors and rising bags only change while on screen, and visitors who turn on reduced motion see still rooms.
- The index, search, drawers and the product photos work with the keyboard and screen readers.
