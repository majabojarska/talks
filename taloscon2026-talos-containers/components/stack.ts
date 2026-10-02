// Geometry and data for TalosStack: the Talos container stack, drawn bottom-up.
//
// Talos runs *two* containerd instances: the system one (its own services and extension
// services) and the CRI one (Kubernetes). Containers declared via ContainerConfig go on the
// CRI instance, in their own namespace — which is the point the diagram has to make, so the
// two daemons are drawn as separate bands and the namespace columns sit over the right one.

export const W = 880

// Columns, left to right. The system containerd side is narrow; the CRI side carries two.
export const COL_Y = 36
export const COL_H = 160
export const SYSTEM_W = 280
export const CRI_X = 300
export const CRI_W = W - CRI_X
const CRI_COL_W = (CRI_W - 20) / 2

// Rows below the columns.
export const CHIP_Y = 204
export const CHIP_H = 26
export const CONTAINERD_Y = 238
export const CONTAINERD_H = 42
export const KERNEL_Y = 288
export const KERNEL_H = 36
export const PUNCH_Y = 342

// Item boxes inside a column.
const ITEM_Y = COL_Y + 32
export const ITEM_H = 28
const ITEM_GAP = 8

export interface Column {
  /** containerd namespace this column lives in. */
  ns: string
  x: number
  w: number
  /** What runs in it, top to bottom. */
  items: string[]
  /** Where the root filesystem comes from. */
  note: string[]
  /** cgroup root backing it. */
  cgroup: string
  color: string
  /** Click index at which the namespace box appears; items and note follow, one click each. */
  at: number
}

export const columns: Column[] = [
  {
    ns: 'system',
    x: 0,
    w: SYSTEM_W,
    items: ['Talos services', 'extension services'],
    note: ['rootfs baked into the', 'OS image at build time'],
    cgroup: 'system/extensions',
    color: '#723a8b', // --tc-purple
    at: 7,
  },
  {
    ns: 'k8s.io',
    x: CRI_X,
    w: CRI_COL_W,
    items: ['kubelet', 'Kubernetes pods'],
    note: ['Requires the K8s control plane'],
    cgroup: 'kubepods',
    color: '#074c94', // --tc-blue
    at: 2,
  },
  {
    ns: 'taloscontainers',
    x: CRI_X + CRI_COL_W + 20,
    w: CRI_COL_W,
    items: ['MyContainer'],
    note: ['OCI image pulled', 'at runtime'],
    cgroup: 'taloscontainers',
    color: '#e92582', // --tc-pink
    at: 11,
  },
]

/** The two containerd daemons, each spanning the columns above it. */
export const daemons = [
  { label: 'containerd (system)', x: 0, w: SYSTEM_W, at: 6, accent: false },
  { label: 'containerd (CRI)', x: CRI_X, w: CRI_W, at: 1, accent: true },
]

/** Top edge of item j inside a column. */
export function itemY(j: number): number {
  return ITEM_Y + j * (ITEM_H + ITEM_GAP)
}

/** Baseline of note line k, placed under the column's items. */
export function noteY(itemCount: number, k: number): number {
  return itemY(itemCount) + 14 + k * 15
}

/** Click at which item j of a column appears. */
export function itemAt(c: Column, j: number): number {
  return c.at + 1 + j
}

/** Click at which a column's note appears, after its last item. */
export function noteAt(c: Column): number {
  return c.at + 1 + c.items.length
}

export const CHIPS_AT = 14
export const PUNCH_AT = 15
