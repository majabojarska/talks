---
theme: ../themes/taloscon2026
title: Talos Containers
author: Maja Bojarska
layout: cover
---

# Talos Containers

Maja Bojarska

Senior Software Engineer @ Sidero Labs

---

# About me

<div class="about-text">

**Maja Bojarska**<br>
Senior Software Engineer @ Sidero Labs

- Joined in May, working on **Talos Linux**
- I'm from **Wrocław, Poland** 
- I have a cat named **Luna** 🐈

</div>

<div class="about-pics">
  <figure>
    <img src="/krasnal.jpg" alt="A Wrocław gnome statue playing a saxophone">
  </figure>
  <figure class="cat">
    <img src="/luna.jpg" alt="Luna, a cream-coloured longhaired cat">
  </figure>
</div>

<style>
.about-text {
  width: 55%;
}
.about-pics {
  position: absolute;
  right: 0;
  top: 20px;
  width: 45%;
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.about-pics figure {
  margin: 0;
}
.about-pics img {
  display: block;
  width: 210px;
  height: 300px;
  border-radius: 8px;
  object-fit: cover;
}
.about-pics figcaption {
  margin-top: 2px;
  font-size: 11px;
  color: var(--tc-muted);
  text-align: center;
}
</style>


---

# Agenda

TODO: Fill this out once the remaining slides are ready

<v-clicks>

</v-clicks>


---
clicks: 17
---

<TalosStack />

---
layout: two-cols-header
---

# Option 1: run it on Kubernetes

::left::

### Pros

- Scheduling, restarts, rollouts
- Secrets, ConfigMaps, Services
- The whole Kubernetes API

::right::

### Cons

- A control plane on the node
- etcd, a CNI, certificates to rotate
- On a single-node appliance you are running **Kubernetes in order to run one container**

<!--

Nobody is arguing against Kubernetes here. If you already run a cluster, run your workload
on the cluster.

The problem is the cases where you don't benefit from it. A single node at the edge. An
appliance. A box whose entire job is to run one long-lived process. There you are paying for
the full machinery — etcd, a CNI, certificate rotation — and getting back scheduling
decisions you don't need, because there is only one place anything can be scheduled.

-->

---
layout: two-cols-header
---

# Option 2: ship an extension service

::left::

### Pros

- Starts with the machine
- Runs on the **system containerd**, beside Talos' own services
- A real Talos service, registered as `ext-<name>`

::right::

### Cons

- Rootfs lives at `/usr/local/lib/containers`
- **Baked into the OS image at build time**
- Always privileged — all grantable capabilities, all devices, host network
- A new one means a new installer image, an upgrade, and a reboot

<!--

The other extreme. Extension services are how we ship things like iscsi-tools or the nvidia
drivers — and they're the right tool for that, because those genuinely are part of the
platform.

Two costs. First, where the rootfs comes from: it's extracted into the image at build time,
and the controller reads that directory exactly once at boot, because services are static. So
"I want to run this container" becomes: build a custom installer through Image Factory,
upgrade the node, reboot. Fine for a driver. Terrible for an application.

Second, the security posture isn't a choice. Extension services get all grantable
capabilities, all devices allowed, and the host network and IPC namespaces. That's
appropriate for a device driver and wildly inappropriate for most workloads.

And note what ExtensionServiceConfig actually lets you configure: just config files and
environment variables, for a service that is already baked in. It can't introduce a container.

-->

---

# Option 3: Talos Containers

<v-clicks>

- Apply a `ContainerConfig` document — the container starts **immediately**. No image rebuild, no reboot
- Runs on the **CRI containerd instance that is already there**, in its own `taloscontainers` namespace
- Its own **cgroup root**, so it cannot starve Kubernetes or Talos itself
- `restricted` by default: no capabilities, no devices, read-only rootfs and sysfs
- Not a Talos service — it won't appear in `talosctl services`. Status comes back as `ContainerStatus`
- Restarted automatically **5 seconds** after it stops

</v-clicks>

<!--

So this is the middle ground, and the design goal was explicitly to make it cheap.

The namespace comment in the source says it well: its own namespace so these containers
neither collide with Kubernetes pods nor depend on Kubernetes being configured. That second
half is the point — this works on a node that has never been told what a cluster is.

Note the default flips relative to extension services: restricted, not privileged. You can
ask for privileged, and you can add or drop individual capabilities, but you have to ask.

They're deliberately not services. We didn't want `talosctl services` to become a dumping
ground for user workloads. The familiar tools do work though — `talosctl containers`, `logs`,
`stats` and `restart` all take `--namespace taloscontainers`, and so does `talosctl image list`.

Caveat if you're presenting before GA: this targets v1.15, and some of the pieces landed
after alpha.0. Check which release is current on the day.

-->

---

# `ContainerConfig`

---
layout: two-cols-header
---

# The full surface

::left::

- `mounts` — three typed sources only: `userVolume`, `tmpfs`, `hostPath`
- `security` — `restricted` / `privileged`, plus capability add/drop
- `network.mode` — `none` or `host`
- `resources.limits` — cgroup v2 `cpu.max` and `memory.max`
- `dependsOn` — paths, networks, clock, other containers

::right::

<div style="--slidev-code-font-size: 12px; --slidev-code-line-height: 17px">

```yaml
mounts:
  - userVolume:
      name: web-content
      destination: /usr/share/nginx/html
      options: [ro]
  - tmpfs:
      destination: /tmp
      size: 64MiB
security:
  profile: restricted
resources:
  limits: { cpu: 1500m, memory: 512MiB }
dependsOn:
  networks: [addresses]
  time: true
```

</div>


---

# None of this is new

<v-clicks>

- Data lives in a **`UserVolumeConfig`** — the same volume machinery the rest of the node uses
- The image comes through the **node's registry configuration** — mirrors, auth, TLS
- Through the same **`ImageCacheConfig`**, so an air-gapped node stays air-gapped
- Under the same **`ImageVerificationConfig`** — write a signature policy once, it covers these too

</v-clicks>

<!--

`ContainerConfig` adds one document, not a subsystem. The image pull goes through the same
internal helper that fetches the kubelet image, the etcd image and the installer image, so
everything already wired into that path applies here on day one, with nothing to opt into.

The next two slides are the same four documents with the YAML attached.

-->

---
layout: two-cols-header
---

# Storage: `UserVolumeConfig`

::left::

```yaml
apiVersion: v1alpha1
kind: UserVolumeConfig
name: app-data
provisioning:
  diskSelector:
    match: disk.transport == "nvme"
  maxSize: 50GiB
filesystem:
  type: xfs
encryption:
  provider: luks2
  keys:
    - slot: 0
      tpm: {}
```

::right::

```yaml
apiVersion: v1alpha1
kind: ContainerConfig
name: app
image: example.com/org/app:1.2.3
mounts:
  - userVolume:
      name: app-data
      destination: /var/lib/app
```

<style>
.tc-content h1 {
  margin-bottom: 16px;
}
.slidev-code {
  --slidev-code-padding: 6px 16px;
  padding: 6px 16px;
}
</style>

<!--

This is the `omni-data` volume the demo mounts, so this slide is also the setup for it.

Nothing on the left is specific to containers. Encrypted, TPM-sealed, provisioned onto an NVMe
disk by a CEL selector — that is just what user volumes already do, and a container referencing
one inherits all of it. `volumeType` is omitted here because partition is the default.

The ordering is the part worth saying out loud: declaring the mount is also declaring the
dependency. The container does not start until the volume is mounted, and once it is running the
volume can't be unmounted out from under it — the controller holds a finalizer for exactly that.

One real limitation if it comes up: `userVolume` resolves `UserVolumeConfig` names only. An
`ExistingVolumeConfig`, an `ExternalVolumeConfig` — NFS or virtiofs — or a `RawVolumeConfig`
can't be named here. You can reach them through `hostPath` once they're mounted on the host, but
you give up the ordering guarantee when you do.

-->

---
layout: two-cols-header
class: tc-wide-code
---

# Images: mirrors, cache, signatures

::left::

- `RegistryMirrorConfig` / `RegistryAuthConfig` / `RegistryTLSConfig` — the puller reads the node's registry configuration, like every other Talos image pull
- `ImageCacheConfig` — once the cache is ready, registryd is injected as the **first mirror for every registry**
- `ImageVerificationConfig` — cosign verification runs **before** the pull, and a verified image is re-pinned to its **digest**
- A `deny` match is **terminal**: no retry, the container never starts

::right::

<div style="--slidev-code-font-size: 11px; --slidev-code-line-height: 15px">

```yaml
apiVersion: v1alpha1
kind: RegistryMirrorConfig
name: ghcr.io
endpoints:
  - url: https://harbor.lan/v2/ghcr
    overridePath: true
---
apiVersion: v1alpha1
kind: ImageCacheConfig
local:
  enabled: true
---
apiVersion: v1alpha1
kind: ImageVerificationConfig
rules:
  - image: ghcr.io/siderolabs/*
    keyless:
      issuer: https://token.actions.githubusercontent.com
      subjectRegex: ^https://github\.com/siderolabs/.*
  - image: docker.io/*
    deny: true
```

</div>

<style>
.slidev-code {
  --slidev-code-padding: 6px 12px;
  padding: 6px 12px;
}
</style>

<!--

Three documents, none of them written for this feature, all of them in force for it.

The cache one is the nicest of the three: when the image cache is ready Talos prepends registryd
as the first mirror endpoint for every registry, so a cached image is served locally and an
air-gapped node stays air-gapped — the container config says nothing about any of this.

Verification happens before the pull starts, not after. If a rule matches and the signature
checks out, the pull is redirected to the digest, so what runs is exactly what was verified. If
the rule denies, that's terminal — no retry, and the container never starts.

Two details if asked. Patterns match on registry and repository only, against the normalized
reference, so `docker.io/library/nginx*` matches `nginx:latest` while `library/nginx*` matches
nothing. And the honest scope caveat: this covers Talos' own pulls — kubelet, etcd, installer,
Talos Containers. Images that kubelet pulls through CRI for Kubernetes pods go around it.

Now the part I find most interesting: what Talos does with that document.
This is a COSI controller chain like everything else in Talos — nothing bespoke.

-->

---
clicks: 5
---

# From document to running container

<ReconcileChain />


---
clicks: 5
---

# Container replacement

<ContainerLifecycle />

---
layout: section
---

# Live demo


---
layout: end
contacts:
  - name: Maja Bojarska
    role: Senior Software Engineer @ Sidero Labs
    email: maja.bojarska@siderolabs.com
    slack: taloscommunity.slack.com
---

# Containers on Talos. <br>No K8s required. 

<!--

Thank you — happy to take questions.

-->
