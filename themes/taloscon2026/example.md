---
theme: ./
title: TalosCon 2026 theme
layout: cover
---

# Talk title goes here

Subtitle or speaker name

Speaker role, Sidero Labs

---

# Title and body

Body text is Manrope 18pt, the title is Manrope SemiBold 28pt.

- First bullet point
- Second bullet with `inline code` and a [link](https://talos.dev)
  - Nested bullet
- Third bullet point

---

# Code

```yaml
machine:
  install:
    disk: /dev/sda
  kubelet:
    extraArgs:
      rotate-server-certificates: true
cluster:
  network:
    cni:
      name: none
```

---
layout: two-cols-header
---

# Two columns with a title

::left::

### Before

- Mutable OS
- SSH access
- Configuration drift

::right::

### After

- Immutable OS
- API-driven
- Declarative config

---
layout: two-cols
---

# Two columns

Default slot is the left column, `::right::` is the right one.

::right::

```bash
talosctl get members
```

---
layout: image-right
image: https://cover.sli.dev
backgroundSize: cover
---

# Image right

Frontmatter `image:` goes on the right half.

---
layout: center
---

# Centered

Anything short and important.

---
layout: section
---

# Section title

Optional section description

---
layout: end
contacts:
  - name: Jane Doe
    role: Principal Engineer
    email: jane@siderolabs.com
  - name: John Doe
    role: Developer Advocate
    email: john@siderolabs.com
---
