# Baghdad, City of Peace

A one-minute cut-paper animation showing everyday life in Baghdad during the golden age of the Abbasid Caliphate.

**To run it, open `index.html` in a browser.** It needs no build step and no server.

## Scenes

1. **Dawn over the Round City.** The palace's Green Dome, lamp-lit houses with wind-catchers, and a coracle (quffa) crossing the Tigris.
2. **Bayt al-Ḥikma, the House of Wisdom.** One scholar reads a codex on a rahla stand. Letters drift across the room and change from Greek to Arabic as a second scholar writes, right to left.
3. **Rooftop observatory.** An astrolabe and an armillary sphere. The Summer Triangle is traced and labelled with its Arabic star names.
4. **The souq.** Stalls sell spices, silk and paper, and glazed pottery. A camel caravan arrives.
5. **Palace garden.** A fountain, an oud player, a poet, cypresses and a pomegranate tree.
6. **Dusk on the Tigris.** Lateen-sailed boats, a pontoon bridge, and windows lighting up across the city.
7. **Closing card.** An eight-pointed star rosette.

## Controls

- **Space / K**: play or pause
- **← / →**: seek back or forward 5 seconds
- **R**: restart
- `index.html?t=24&paused`: open at a given second, paused

## How it's made

- Everything is drawn on a single `<canvas>` with plain JavaScript. There are no dependencies.
- Shapes are polygons with torn, slightly "boiling" edges that update 6 times per second. Each one has a flat drop shadow, and a paper-grain layer sits over the whole frame.
- Each scene is a pure function of time, so scrubbing works at any point.
- The fonts are Amiri and Cormorant Garamond from Google Fonts. Offline, the page falls back to system serif fonts.
