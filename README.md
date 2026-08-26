# Bangarpet PaniPuri — Website

A static marketing site for Bangarpet PaniPuri (Bangarpet-style chaat & pani puri, New Zealand).

## Files

- `index.html` — page markup (hero, menu, story, contact, footer)
- `style.css` — all styling
- `script.js` — menu tab filtering, mobile nav toggle, footer year
- `photos/` — images and hero video referenced by `index.html` (logo, background, hero video, dish photos)

## "Coming soon" menu message

The **Menu** section has three filter tabs: `All`, `Beverages`, `Combos`. Right now every dish in
`index.html` is tagged `data-category="all"` — no items yet have `data-category="beverages"` or
`data-category="combos"`.

`script.js` filters the `.menu-item-card` elements by the active tab. When a filter matches zero
cards, it reveals the `#menu-empty-state` element in `index.html`, which reads:

> Combos and beverages will update soon! 🎉

So clicking **Beverages** or **Combos** currently shows that message instead of an empty grid.

### Adding real Beverages/Combos items later

When you're ready to add real items to either tab:

1. Duplicate a `<article class="menu-item-card" data-category="all">` block in `index.html`.
2. Change `data-category="all"` to `data-category="beverages"` or `data-category="combos"`.
3. Update the image, name, price and ingredients.

Once at least one card exists for a tab, the "coming soon" message automatically stops showing for
that tab — no JS changes needed.

## Local preview

Just open `index.html` in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```
