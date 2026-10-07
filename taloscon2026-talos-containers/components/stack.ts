// Geometry and data for TalosStack: the Talos container stack, drawn bottom-up.
//
// Talos runs *two* containerd instances: the system one (its own services and extension
// services) and the CRI one (Kubernetes). Containers declared via ContainerConfig go on the
// CRI instance, in their own namespace — which is the point the diagram has to make, so the
// two daemons are drawn as separate bands and the namespace columns sit over the right one.
//
// One schedule, two slides. The click numbers below run unbroken from 0 to 17, but the deck cuts
// them in half after the `system` column's cgroup roots (click 12): the first slide builds the
// stack as it exists today, then Options 1 and 2 argue the case for a third namespace, and a
// second mount of TalosStack resumes at click 12 (its `from` prop) to reveal `taloscontainers`.
// Clicks 13-17, including PUNCH_AT, therefore belong to that second slide.

export const W = 880;

/** One corner radius for every box in the stack, so the rows read as one family. */
export const R = 8;

/** Left gutter reserved for the rotated row captions. */
export const GUTTER = 30;
/** Drawable width to the right of the gutter. */
export const CONTENT_W = W - GUTTER;

// Columns, left to right: the CRI containerd carries two of them, the system containerd one.
// The CRI side leads because that is the half the talk builds on.
export const COL_Y = 36;
export const COL_H = 160;
const GAP = 20;
/** Three equal columns share the content width. */
const COL_W = (CONTENT_W - 2 * GAP) / 3;
export const CRI_X = GUTTER;
export const CRI_W = 2 * COL_W + GAP;
export const SYSTEM_X = CRI_X + CRI_W + GAP;
export const SYSTEM_W = COL_W;

// Rows below the columns, stacked downwards with an 8px gap between bands.
export const CHIP_Y = 204;
export const CHIP_H = 40;
export const CONTAINERD_Y = 252;
export const CONTAINERD_H = 42;
export const KERNEL_Y = 302;
export const KERNEL_H = 36;
export const PUNCH_Y = 352;

// Item boxes inside a column.
const ITEM_Y = COL_Y + 32;
export const ITEM_H = 28;
const ITEM_GAP = 8;

export interface Column {
  /** containerd namespace this column lives in. */
  ns: string;
  x: number;
  w: number;
  /** What runs in it, top to bottom. */
  items: string[];
  /** Where the root filesystem comes from. */
  note: string[];
  /** cgroup roots backing it; several are drawn side by side across the column. */
  cgroup: string[];
  color: string;
  /** Click index at which the namespace box appears; items and note follow, one click each. */
  at: number;
}

export const columns: Column[] = [
  {
    ns: "system",
    x: SYSTEM_X,
    w: SYSTEM_W,
    items: ["Talos services", "Extension services"],
    note: ["Baked into the OS", "In-memory"],
    cgroup: ["system/*"],
    color: "#723a8b", // --tc-purple
    at: 8,
  },
  {
    ns: "k8s.io",
    x: CRI_X,
    w: COL_W,
    items: ["K8s control plane", "K8s Pods"],
    note: ["Deployed via kube-apiserver", "or as static Pods"],
    cgroup: ["kubepods", "podruntime/*"],
    color: "#074c94", // --tc-blue
    at: 2,
  },
  {
    ns: "taloscontainers",
    x: CRI_X + COL_W + GAP,
    w: COL_W,
    items: ["MyContainer"],
    note: ["Pulled at runtime", "Dynamic"],
    cgroup: ["taloscontainers/<id>"],
    color: "#e92582", // --tc-pink
    at: 13,
  },
];

/** The two containerd daemons, each spanning the columns above it. */
export const daemons = [
  {
    label: "containerd (system)",
    x: SYSTEM_X,
    w: SYSTEM_W,
    at: 7,
    accent: false,
  },
  { label: "containerd (CRI)", x: CRI_X, w: CRI_W, at: 1, accent: true },
];

/** Top edge of item j inside a column. */
export function itemY(j: number): number {
  return ITEM_Y + j * (ITEM_H + ITEM_GAP);
}

/** Baseline of note line k, placed under the column's items. */
export function noteY(itemCount: number, k: number): number {
  return itemY(itemCount) + 14 + k * 15;
}

/** Click at which item j of a column appears. */
export function itemAt(c: Column, j: number): number {
  return c.at + 1 + j;
}

/** Click at which a column's note appears, after its last item. */
export function noteAt(c: Column): number {
  return c.at + 1 + c.items.length;
}

/** Click at which a column's cgroup chips appear, one step after its note. */
export function chipAt(c: Column): number {
  return noteAt(c) + 1;
}

/** Gap between two cgroup chips sharing one column. */
const CHIP_GAP = 8;

/** Width of one chip when a column's cgroup roots split its width evenly. */
export function chipW(c: Column): number {
  return (c.w - (c.cgroup.length - 1) * CHIP_GAP) / c.cgroup.length;
}

/** Left edge of chip i inside a column. */
export function chipX(c: Column, i: number): number {
  return c.x + i * (chipW(c) + CHIP_GAP);
}

/** First cgroup chip of the whole diagram — when the "cgroups" caption earns its place. */
export const CHIPS_AT = Math.min(...columns.map(chipAt));
export const PUNCH_AT = 17;

/** Horizontal centre of the gutter. */
export const CAPTION_X = GUTTER / 2;

/**
 * Rotated captions in the left gutter, one per labelled row. Each y is derived from the row it
 * labels, so a caption cannot drift out of alignment when the row moves.
 */
export const captions = [
  // Appears with the first namespace box (k8s.io, click 2).
  { label: "namespaces", y: COL_Y + COL_H / 2, at: 2 },
  { label: "cgroups", y: CHIP_Y + CHIP_H / 2, at: CHIPS_AT },
];
