# MH Chocolate

Static website (HTML/CSS/vanilla JS, no build step) for a home chocolatier who makes everything to order.

- Scroll-story hero: one big chocolate bar standing on a glossy surface with a live reflection over a melted-chocolate backdrop you can stir. Each scroll stop moves it: it snaps in half with crumbs and nuts, a knife cuts a slice that turns to show its layers, it softens into a puddle, and a ruby heart rises with a call to action. Native scrolling (no scroll hijacking); the timeline is a deterministic function of progress so it plays forward and backward.
- Studio: six 3D pieces, each shown whole next to its cut-open half. Four steps (chocolate and shell thickness, filling, crunchy layer, topping) rebuild the cross-section live; tap a layer to see what it is. Hand-rolled cocoa-dusted truffles with irregular shape, creases and powder grain. Free 360 degree drag.
- Time and temperature: a self-running clock, a thermometer and a 3D piece that softens and melts with temperature and time.
- How it is made: a tempering curve that draws as you scroll.
- Bag: no prices, no payment. Checkout builds a ready-to-send WhatsApp message with the whole order, a link that reopens each design, and an order code.
- Performance: every heavy canvas is fully disposed (geometry, materials, textures, WebGL context) when it scrolls far off-screen and rebuilt before it returns; 30 fps cap and a resolution governor on touch devices.

Text and settings (WhatsApp number, Instagram handle, approximate temperature and time tables) live in `js/content.js`. Run locally with any static server, for example `python -m http.server`.

Designed and developed by Muhammed Elhuseyin.
