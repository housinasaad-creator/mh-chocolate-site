# MH Chocolate

Static website (HTML/CSS/vanilla JS, no build step) for a home chocolatier who makes everything to order.

- Hero: raw-WebGL melted chocolate you stir with a finger, with real-time 3D pieces half-sunk in the liquid (free 360 degree drag).
- Studio: six 3D pieces, each shown whole next to its cut-open half. Four steps (chocolate and shell thickness, filling, crunchy layer, topping) rebuild the cross-section live; tap a layer to see what it is. Live taste meters.
- Time and temperature: a self-running clock, a thermometer and a 3D piece that softens and melts with temperature and time.
- How it is made: a tempering curve that draws as you scroll.
- Bag: no prices, no payment. Checkout builds a ready-to-send WhatsApp message with the whole order, a link that reopens each design, and an order code.
- Performance: every heavy canvas is fully disposed (geometry, materials, textures, WebGL context) when it scrolls far off-screen and rebuilt before it returns; 30 fps cap and a resolution governor on touch devices.

Text and settings (WhatsApp number, Instagram handle, approximate temperature and time tables) live in `js/content.js`. Run locally with any static server, for example `python -m http.server`.

Designed and developed by Muhammed Elhuseyin.
