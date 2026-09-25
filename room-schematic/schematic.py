"""Room + bed schematic. All dimensions in inches.

Coordinate system: origin at the bottom-left outside corner of the room,
x to the right, y up. Walls are drawn as zero-thickness lines (interior
dimensions as measured).
"""
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle

# ---------------------------------------------------------------- measurements
TOP_WALL = 113            # top wall, full length
BOTTOM_WALL = 139         # bottom wall, full length (includes the 26" jog)
RIGHT_WALL = 107          # right wall, full height

JOG_DEPTH = BOTTOM_WALL - TOP_WALL   # 26: how far the lower-left section sticks out

# Left wall of the main section (top-down): closet, then 5" of wall.
LEFT_CLOSET = 69
LEFT_WALL_BELOW_CLOSET = 5
MAIN_LEFT_WALL = LEFT_CLOSET + LEFT_WALL_BELOW_CLOSET   # 74
LOWER_LEFT_WALL = RIGHT_WALL - MAIN_LEFT_WALL            # 33: left wall of the jog

# Right wall (top-down): 24" wall, window, 9" wall.
RIGHT_WALL_ABOVE_WINDOW = 24
RIGHT_WALL_BELOW_WINDOW = 9
WINDOW = RIGHT_WALL - RIGHT_WALL_ABOVE_WINDOW - RIGHT_WALL_BELOW_WINDOW   # 74

# Bottom wall (right-to-left): 30" wall, then closet.
BOTTOM_WALL_RIGHT_OF_CLOSET = 30
BOTTOM_CLOSET = 41        # NOT MEASURED - estimated from sketch proportions

# Bed (drawn separately, not placed in the room).
BED_W = 62
BED_L = 83


@dataclass
class Opening:
    name: str
    p0: tuple
    p1: tuple


# ------------------------------------------------------------------- geometry
W, H = BOTTOM_WALL, RIGHT_WALL
room_outline = [
    (0, 0),
    (W, 0),
    (W, H),
    (JOG_DEPTH, H),
    (JOG_DEPTH, LOWER_LEFT_WALL),
    (0, LOWER_LEFT_WALL),
]

bc_x1 = W - BOTTOM_WALL_RIGHT_OF_CLOSET
bc_x0 = bc_x1 - BOTTOM_CLOSET
openings = [
    Opening("closet", (JOG_DEPTH, H), (JOG_DEPTH, H - LEFT_CLOSET)),
    Opening("window", (W, H - RIGHT_WALL_ABOVE_WINDOW), (W, RIGHT_WALL_BELOW_WINDOW)),
    Opening("closet", (bc_x0, 0), (bc_x1, 0)),
]
STYLE = {
    "window": dict(color="#2b7bb9", lw=5),
    "closet": dict(color="#c47a1c", lw=5),
}

# ---------------------------------------------------------------- drawing
WALL = dict(color="#222", lw=2.5)
DIM_COLOR = "#555"


def dim(ax, p0, p1, text, offset, fs=9, label_at=None):
    """Dimension line between p0 and p1, shifted perpendicular by `offset`."""
    (x0, y0), (x1, y1) = p0, p1
    horiz = abs(y1 - y0) < abs(x1 - x0)
    ox, oy = (0, offset) if horiz else (offset, 0)
    a, b = (x0 + ox, y0 + oy), (x1 + ox, y1 + oy)
    # extension lines
    for (px, py), (qx, qy) in ((p0, a), (p1, b)):
        ax.plot([px, qx], [py, qy], color=DIM_COLOR, lw=0.6, ls=":")
    ax.annotate("", xy=a, xytext=b,
                arrowprops=dict(arrowstyle="<|-|>", color=DIM_COLOR, lw=0.8,
                                shrinkA=0, shrinkB=0, mutation_scale=8))
    mx, my = label_at or ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    ax.text(mx, my, f'{text}"', ha="center", va="center", fontsize=fs,
            rotation=0 if horiz or label_at else 90, color="#111",
            bbox=dict(fc="white", ec="none", pad=1.2))


def draw_room(ax):
    ax.add_patch(Polygon(room_outline, closed=True, fc="#f4f1ea", ec="none"))
    xs, ys = zip(*(room_outline + room_outline[:1]))
    ax.plot(xs, ys, **WALL, solid_capstyle="projecting")
    for o in openings:
        ax.plot([o.p0[0], o.p1[0]], [o.p0[1], o.p1[1]], **STYLE[o.name],
                solid_capstyle="butt")
    ax.text(W * 0.55, H * 0.55, "ROOM", ha="center", va="center",
            fontsize=16, color="#888", weight="bold")
    ax.text(JOG_DEPTH + 3, H - LEFT_CLOSET / 2, "closet", rotation=90,
            ha="left", va="center", fontsize=9, color=STYLE["closet"]["color"])
    ax.text(W - 3, RIGHT_WALL_BELOW_WINDOW + WINDOW / 2, "window", rotation=90,
            ha="right", va="center", fontsize=9, color=STYLE["window"]["color"])
    ax.text((bc_x0 + bc_x1) / 2, 3, "closet (width est.)", ha="center",
            va="bottom", fontsize=9, color=STYLE["closet"]["color"])

    # overall
    dim(ax, (JOG_DEPTH, H), (W, H), TOP_WALL, 10)
    dim(ax, (0, 0), (W, 0), BOTTOM_WALL, -22)
    dim(ax, (W, 0), (W, H), RIGHT_WALL, 24)
    # right wall breakdown
    dim(ax, (W, H - RIGHT_WALL_ABOVE_WINDOW), (W, H), RIGHT_WALL_ABOVE_WINDOW, 10)
    dim(ax, (W, RIGHT_WALL_BELOW_WINDOW), (W, H - RIGHT_WALL_ABOVE_WINDOW), WINDOW, 10)
    dim(ax, (W, 0), (W, RIGHT_WALL_BELOW_WINDOW), RIGHT_WALL_BELOW_WINDOW, 10)
    # bottom wall breakdown
    dim(ax, (0, 0), (bc_x0, 0), bc_x0, -10)
    dim(ax, (bc_x0, 0), (bc_x1, 0), f"~{BOTTOM_CLOSET}", -10)
    dim(ax, (bc_x1, 0), (W, 0), BOTTOM_WALL_RIGHT_OF_CLOSET, -10)
    # left side
    dim(ax, (JOG_DEPTH, H - LEFT_CLOSET), (JOG_DEPTH, H), LEFT_CLOSET, -10)
    dim(ax, (JOG_DEPTH, LOWER_LEFT_WALL), (JOG_DEPTH, H - LEFT_CLOSET),
        LEFT_WALL_BELOW_CLOSET, 6,
        label_at=(JOG_DEPTH + 11, LOWER_LEFT_WALL + LEFT_WALL_BELOW_CLOSET / 2))
    dim(ax, (0, 0), (0, LOWER_LEFT_WALL), LOWER_LEFT_WALL, -10)
    dim(ax, (0, LOWER_LEFT_WALL), (JOG_DEPTH, LOWER_LEFT_WALL), JOG_DEPTH, -8)


def draw_bed(ax, x0, y0):
    ax.add_patch(Rectangle((x0, y0), BED_W, BED_L, fc="#e3ecf5", ec="#222", lw=2))
    ax.text(x0 + BED_W / 2, y0 + BED_L / 2, "BED", ha="center", va="center",
            fontsize=14, color="#888", weight="bold")
    dim(ax, (x0, y0 + BED_L), (x0 + BED_W, y0 + BED_L), BED_W, 8)
    dim(ax, (x0, y0), (x0, y0 + BED_L), BED_L, -10)


def main(out=Path(__file__).with_name("schematic.png")):
    fig, ax = plt.subplots(figsize=(11, 11))
    draw_room(ax)
    draw_bed(ax, x0=(W - BED_W) / 2 + 10, y0=-50 - BED_L)
    ax.set_aspect("equal")
    ax.set_xlim(-30, W + 45)
    ax.set_ylim(-50 - BED_L - 15, H + 25)
    ax.axis("off")
    ax.set_title("Room & bed schematic (inches, to scale)", fontsize=13)
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor="white")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
