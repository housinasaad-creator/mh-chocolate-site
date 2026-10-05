# MH Chocolate

Static website (HTML/CSS/vanilla JS, no build step) for a home chocolatier who makes everything to order.

- Hero: a raw-WebGL fragment shader of swirling melted chocolate you can stir with a finger, with a real-time 3D chocolate piece on top (three.js r172, vendored).
- Studio: six 3D pieces, switch chocolate type and add real 3D toppings, then add to the bag.
- Bag: no prices and no payment. Checkout builds a ready-to-send WhatsApp message with the whole order, a link that reopens each 3D design, and an order code.
- Performance: every heavy canvas (liquid, hero piece, studio piece) is fully disposed when it scrolls far off-screen and rebuilt before it comes back. Touch devices are capped at 30 fps and a resolution governor lowers quality on slow devices.

Text and settings (WhatsApp number, Instagram handle) live in `js/content.js`. Run locally with any static server (ES modules need one), for example `python -m http.server`.

Designed and developed by Muhammed Elhuseyin.
