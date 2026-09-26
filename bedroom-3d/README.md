# Bedroom planner 3D

A three.js model of the bedroom from the schematic, with a movable, rotatable bed
and live clearance measurements to the walls on all four sides.

**Run it:** double-click `index.html`. No build step or server needed. three.js loads
from the jsDelivr CDN, so you need an internet connection.

## Controls
- Drag the bed to move it. Shift+drag the bed to rotate it.
- Drag empty space to orbit, right-drag to pan, scroll to zoom. The **Top view** button switches to a to-scale plan view. **Photo 1 view** and **Photo 2 view** put the camera roughly where the two room photos were taken; the ceiling and bulkhead show whenever the camera is inside the room.
- Arrow keys nudge the bed 1″ (Shift = 6″). Q/E rotate 5°, R rotates 90°.
- The panel lets you type an exact X/Y (bed centre, measured from the schematic's left/bottom edges) and angle.

## Meta Quest 3 (mixed reality)
Open the page in the Quest Browser and tap **Enter mixed reality**. The bed appears at 1:1
scale on your real floor, with a wireframe of the modelled room and a floating control panel.
WebXR needs HTTPS, or `localhost`, so opening the file directly won't work. Either:
- host the folder over HTTPS (e.g. GitHub Pages), or
- serve it locally and forward the port to the headset over USB:
  `python3 -m http.server 8000`, then `adb reverse tcp:8000 tcp:8000`, and open `http://localhost:8000` on the Quest.

Controls in the headset (controllers or hand pinch):
- **Trigger** on the bed: drag it along the floor. **Grip** on the bed: drag to rotate.
- **Thumbstick left/right**: rotate 15°. **A/B/X/Y**: bring the panel in front of you.
- **Move the panel**: point at its background (anywhere but a button), hold the trigger or grip, and drag.
- **Align room**: point at the floor corner where the mirror-closet wall meets the window
  wall and pull the trigger, then do the same at the other end of the window wall. The model
  snaps onto your real room and the panel shows the wall length you measured against the plan.
  The alignment is saved as a Quest persistent anchor and restored automatically next time,
  so you only need to align once. Aligning again replaces it. Private browsing or clearing the
  site's data forgets it.
  Before the first alignment, the model assumes you started the session just inside the entry door, facing into the room.
- **Show walls** swaps the wireframe for the solid modelled walls.

## What the numbers mean
For each direction (top, right, bottom, left, as drawn on the schematic), the clearance is
how far the bed can slide straight that way before it touches a wall. This handles the
L-shaped alcove and rotated beds. The panel also names which wall it would hit.

## Model assumptions
- Room and bed sizes come from the schematic (bed 62″ × 83″ including the headboard).
- Ceiling height (102″), wall thickness, door, closet and window heights are estimates from the photos.
- The entry door is on the left wall of the alcove. It swings into the room, hinged on the bottom side (dashed arc).
- The default layout puts the headboard against the top wall, as in the photos.
