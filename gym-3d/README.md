# Gym walkthrough (three.js + WebXR)

A walkable 1:1 model of the building gym from the phone video: the lobby with the dark
tiled elevator wall, the harbour-map mural, the locker-room corridor, and the gym itself with
the glass curtain wall, concrete columns, treadmills, ellipticals, bikes and the stretching corner.
The long wall opposite the treadmills is a working full-height mirror, and you can see yourself in it
as a simple avatar (head, body and hands that follow your headset and controllers).

It's a static site with no build step. three.js loads from the jsDelivr CDN, and every texture
is drawn procedurally on a canvas, so the folder has no binary assets.

## Running it

WebXR only works over HTTPS (or `localhost`), so opening `index.html` from disk won't give you VR.

- **GitHub Pages:** enable Pages for the repo and open `https://<user>.github.io/<repo>/gym-3d/`
  in the Quest 3 browser, then press **Enter VR**.
- **Local:** `python3 -m http.server 8000` in this folder, then open `http://localhost:8000` on desktop.
  For the headset, connect it over USB and run `adb reverse tcp:8000 tcp:8000`, then open
  `http://localhost:8000` in the Quest browser.

## Controls

VRChat-style locomotion. You move relative to where you're looking.

| Quest 3 | |
|---|---|
| Left stick | walk |
| Left stick click | toggle sprint |
| Right stick left/right | snap turn 30° |
| Right stick click | switch between snap and smooth turning |
| A / X | jump |
| B / Y | respawn |

Room-scale walking works as well. Walls and equipment block stick movement.

| Desktop | |
|---|---|
| Click, then mouse | look (Esc releases the mouse) |
| W A S D / arrows | walk |
| Shift | run |
| Space | jump |
| R | respawn |
| Touch | left half of the screen moves, right half looks |

## How it's built

- `js/world.js`: the layout and all the geometry. Coordinates are in metres: +x runs east
  along the treadmill row and +z runs south, so the mirror is the plane z = 0. Primitives are merged into one
  mesh per material (`js/builder.js`), which keeps the whole scene to a few dozen draw calls.
- `js/mirror.js`: the mirror is a stencil-masked, reflected copy of the gym rather than a
  render-to-texture reflector. It's correct per eye in stereo and costs no extra render passes,
  which matters on a standalone headset. The lights are placed symmetrically about the mirror,
  so the reflection is lit exactly like the room.
- `js/avatar.js`: the avatar exists only in the reflected world, so it never blocks your view.
- `js/main.js`: renderer, lights, desktop and XR input, collisions, jumping.
- `js/textures.js`: canvas textures for the rubber floor, slate tiles, dark wall tiles, mural and night skyline.

## Approximations

The model was reconstructed by eye from a 0.5× (ultra-wide) walkthrough, so the proportions are estimates.
The gym is about 17 × 7.5 m with a 4.3 m ceiling, and the lobby ceiling is 3.2 m. Equipment is modelled from
simple shapes, and the mural and the city outside are stylised stand-ins.
