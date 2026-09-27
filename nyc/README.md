# Manhattan sunset

Your bedroom (the same geometry as `../bedroom-3d`), moved to the 62nd floor of a Manhattan
tower at sunset. The window looks west down a cross street to the Hudson and New Jersey. Low
sunlight comes through the panes: the window's shadow falls across the bed and floor and up the
closet wall, and dust drifts in the light shafts. The bed can still be moved. There are no
measurements.

**Quest 3:** open `https://mrsaad.github.io/opus-experiments/nyc/` in the Quest Browser and tap
**Enter mixed reality**. WebXR needs HTTPS (GitHub Pages) or `localhost`. To run it locally, use
`python3 -m http.server 8000` with `adb reverse tcp:8000 tcp:8000` and open `http://localhost:8000/nyc/`.

**Desktop:** open `index.html`. It needs an internet connection for three.js.

## In the headset
- **Passthrough** (the default): you see your real room with a dusky tint, the sunlight
  painted onto your real walls, floor and ceiling, and Manhattan in place of your window.
  **Virtual room** swaps the whole room for the model.
- **Align room** once, so the virtual window sits on your real one. Point at the floor corner
  where the mirror-closet wall meets the window wall and pull the trigger. Then do the same at
  the other end of the window wall. The alignment is saved as a persistent anchor. It is shared
  with `bedroom-3d`, so if you already aligned there, it's restored automatically.
- **Trigger** on the bed drags it along the floor. **Grip** on the bed turns it.
  **Thumbstick ←/→** turns it 15°. Line it up with your real bed.
- **Thumbstick ↑/↓** moves the time of day, from golden hour through sunset to dusk, when the
  city lights come on. The **Earlier/Later** buttons do the same.
- **A/B/X/Y** bring the panel back in front of you. To move the panel, grab its background.
- **Sound** plays a synthesised city hum and wind.

## On desktop
Drag to look around. Drag the bed to move it, Shift+drag to turn it. Arrow keys nudge it,
Q/E rotate it. `[` and `]` change the time of day. **Into the light** looks back at the
sunlit wall. **Overview** orbits the room from above.
