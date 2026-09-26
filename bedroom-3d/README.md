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

## What the numbers mean
For each direction (top, right, bottom, left, as drawn on the schematic), the clearance is
how far the bed can slide straight that way before it touches a wall. This handles the
L-shaped alcove and rotated beds. The panel also names which wall it would hit.

## Model assumptions
- Room and bed sizes come from the schematic (bed 62″ × 83″ including the headboard).
- Ceiling height (102″), wall thickness, door, closet and window heights are estimates from the photos.
- The entry door is on the left wall of the alcove. It swings into the room, hinged on the bottom side (dashed arc).
- The default layout puts the headboard against the top wall, as in the photos.
