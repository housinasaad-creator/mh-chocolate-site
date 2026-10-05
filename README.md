# MH Chocolate

Static website (HTML/CSS/vanilla JS, no build step) for a home chocolatier in Gaziantep, Türkiye, who makes everything to order.

- Scroll-story hero: one big chocolate bar standing on a glossy surface with a live reflection over a melted-chocolate backdrop you can stir. Each scroll stop moves it: it snaps in half with crumbs and nuts, a knife cuts a slice that turns to show its layers, it softens into a puddle, and a ruby heart rises with a call to action. Native scrolling (no scroll hijacking); the timeline is a deterministic function of progress so it plays forward and backward. Each chapter carries a short line for chocolate lovers.
- Studio: six 3D pieces, each shown whole next to its cut-open half, with callouts naming the shell, filling, crunch and coating. Free 360 degree trackball drag (up, down, left, right) with inertia, an idle spin and a smooth return to upright. Thumbnails of the pieces are rendered from the same 3D models. Previous / next buttons flip through the pieces. Four steps (chocolate and shell thickness, filling, crunchy layer, topping) rebuild the cross-section live; tap a layer to see what it is. Truffles are rolled in coconut shreds or nuts, placed over the whole surface.
- Time and temperature: a self-running clock, a thermometer and a 3D piece that softens and melts with temperature and time.
- How it is made: a tempering curve that draws as you scroll.
- Quotes: a short rotating set of lines about chocolate, only animated while on screen.
- Look and sound: marbled chocolate section backgrounds with dripping edges, a chocolate-bead mouse cursor with a trail (fine pointers only), and synthesized chocolate sounds (snap, knife, melt, tick, seal) behind a header on/off button; off by default and remembered.
- Bag: no prices, no payment. Checkout builds a ready-to-send WhatsApp message with the whole order, a link that reopens each design, and an order code.
- Performance: every heavy canvas is fully disposed (geometry, materials, textures, WebGL context) when it scrolls far off-screen and rebuilt before it returns; 30 fps cap and a resolution governor on touch devices.

Text and settings (WhatsApp number, Instagram handle, address, approximate temperature and time tables) live in `js/content.js`. Run locally with any static server, for example `python -m http.server`.

Designed and developed by Muhammed Elhuseyin.
