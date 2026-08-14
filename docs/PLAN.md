# Build a Pixel-Accurate Cross-Platform Lucky Charm-Style Desktop App

You are working inside an existing desktop application repository that already uses:

- Electron
- TypeScript
- pnpm
- Vite

Do **not** replace the existing stack unless absolutely necessary.

Your task is to transform the existing application into a polished, production-quality cross-platform desktop app inspired by the reference application at:

https://luckycharm.app/

The attached reference video shows the intended real-world desktop behavior.

The objective is NOT to build a normal Electron app with a floating window.

The objective is to reproduce the **desktop overlay experience** shown in the reference:

- a small charm hanging from the top edge of the user's screen
- transparent background
- no traditional application window chrome
- charm remains visible above normal applications
- the rest of the transparent overlay must allow mouse input to pass through
- only the actual charm should receive mouse interaction
- the charm should swing naturally when moved/flicked
- the charm can be hidden/shown
- user can configure/select charms
- a gallery/settings application window exists separately
- app should live in the system tray/menu bar
- app should work across macOS, Windows and Linux as far as the platform permits

## 1. First inspect the existing repository

Before writing code:

1. Inspect the complete repository structure.
2. Identify:
   - Electron main process
   - preload
   - renderer
   - Vite configuration
   - TypeScript configuration
   - existing React/components if present
   - current window creation code
   - IPC architecture
   - current packaging/build configuration
   - existing state management
   - existing assets

3. Do not throw away existing working functionality.
4. Reuse the current architecture where possible.
5. Refactor only where necessary.
6. Do not introduce a large framework simply because it is convenient.

After inspection, create a concise internal implementation plan and then implement it.

---

# 2. Understand the reference product correctly

The reference has two fundamentally different experiences.

## A. Desktop charm overlay

This is the most important part.

It should feel like an object physically hanging from the top of the user's desktop rather than an Electron window.

The user should be able to:

- see the charm while using other applications
- move their cursor over normal areas of the overlay without blocking the application underneath
- interact with the charm itself
- drag/flick the charm
- hide it
- bring it back
- trigger a ritual
- move it horizontally along the top edge
- use keyboard shortcuts
- use the tray/menu-bar application to control it

## B. Application/gallery window

This is a separate normal application window used to:

- browse charms
- select a charm
- configure behavior
- configure shortcuts
- view information/about
- manage the application

The reference video's gallery should feel like a native dark desktop utility rather than a web dashboard.

---

# 3. Core desktop architecture

Implement the desktop overlay as a **transparent, frameless Electron BrowserWindow**.

Do NOT use:

- a normal bordered window
- a centered application window
- a fake desktop background
- a full-screen opaque overlay

The overlay should be visually indistinguishable from a transparent desktop layer.

Use an Electron window configured approximately around:

- transparent: true
- frame: false
- resizable: false
- movable: false or controlled manually
- alwaysOnTop: true
- skipTaskbar: true
- focusable: false where appropriate
- hasShadow: false
- backgroundColor: transparent
- show: false until positioned
- appropriate title bar style / hiddenInset behavior on macOS

Use the Electron APIs appropriate for each platform.

Important:

The window is not supposed to behave like a traditional application window.

It is an overlay.

---

# 4. Mouse click-through architecture

This is one of the most important requirements.

The overlay window should occupy enough space to render the charm, but **only the charm itself should intercept mouse events**.

Everything else must behave as if the Electron window does not exist.

For example:

If the charm is near x=700 at the top of the display and the user clicks x=300:

- the underlying application must receive the click.

If the user clicks on the charm:

- the charm must receive the click.

Implement this using Electron's mouse-ignore functionality and IPC/state coordination.

Investigate and use:

`BrowserWindow.setIgnoreMouseEvents(...)`

where appropriate.

The renderer should communicate when the pointer is actually over an interactive charm region.

Use Electron's `forward` option where appropriate so pointer movement can still be detected without permanently intercepting clicks.

Do NOT implement click-through by manually forwarding individual mouse clicks.

The operating system should receive the original input naturally whenever possible.

---

# 5. Overlay window sizing

Do NOT create one giant invisible window spanning the entire desktop unless necessary.

Prefer a small intelligently positioned overlay window around the charm.

The overlay should dynamically track:

- current display
- display bounds
- work area
- display scale factor / device pixel ratio
- top edge
- display changes
- monitor changes

Use Electron's `screen` API.

Support:

- single monitor
- multiple monitors
- moving between monitors
- different display resolutions
- Retina/high-DPI displays
- mixed-DPI multi-monitor setups

The charm should remain anchored relative to the display's top edge rather than the application's window.

---

# 6. Top-of-screen positioning

The reference experience is a hanging ornament/dangle.

The top of the charm should be visually attached to the top of the screen.

Do not simply center the charm vertically.

The visual hierarchy should be approximately:

```text
┌────────────────────────────────────────────────────────────┐
│                         string                              │
│                          │                                  │
│                          │                                  │
│                        charm                                │
│                                                             │
│                                                             │
│                user's normal desktop/apps                  │
└────────────────────────────────────────────────────────────┘
```

The hanging string should visually touch/terminate at the top screen boundary.

The charm should extend below the top edge.

The transparent window should contain enough vertical area for the entire charm and its animation.

---

# 7. Charm animation

The charm must never feel like a static PNG.

This is critical.

Implement a physically convincing hanging animation.

The charm should behave like a small object attached by a string.

State variables should include concepts such as:

- angle
- angular velocity
- damping
- spring constant
- gravity
- rest angle
- horizontal position
- vertical offset
- drag velocity
- impulse

Use a spring/damped oscillator or a lightweight physics loop.

The animation should:

1. Rest almost completely still.
2. React to pointer interaction.
3. Swing when dragged.
4. Overshoot naturally.
5. Gradually settle.
6. Never feel robotic.
7. Avoid excessive perpetual motion.

The movement should resemble a lightweight hanging object rather than a CSS `rotate()` animation.

Prefer requestAnimationFrame or an equivalent high-frequency animation loop.

Do not make the charm CPU-heavy.

---

# 8. Drag interaction

Dragging the charm should feel physical.

When the user grabs the charm:

- capture pointer
- track pointer movement
- calculate drag velocity
- move the charm
- update rotation based on drag direction
- release into momentum
- allow spring physics to settle it

The user should be able to drag the charm horizontally.

When released, it should swing back naturally.

Do not snap immediately to a fixed position.

---

# 9. Top-edge re-hanging

The reference concept allows the charm to be re-positioned along the top edge.

Implement:

```text
Drag charm horizontally
        ↓
Move hanging position
        ↓
Release
        ↓
Charm remains at that horizontal location
```

Clamp the X position so the charm never goes completely off screen.

Save the position per display.

For multi-monitor configurations, store something similar to:

```ts
type CharmPosition = {
  displayId: string;
  normalizedX: number;
};
```

Prefer normalized coordinates instead of hard-coded screen pixels.

For example:

```text
normalizedX = 0.0 → far left
normalizedX = 0.5 → center
normalizedX = 1.0 → far right
```

This makes the position resilient to resolution changes.

---

# 10. Charm hover behavior

When the mouse approaches the charm:

- subtle visual response
- slightly increased motion
- optional tiny scale/tilt
- cursor should communicate that the charm is interactive

Do not over-animate.

The experience should feel playful and elegant.

Avoid obvious web-style hover effects.

---

# 11. Charm click behavior

Clicking the charm should execute the currently selected ritual.

Examples from the reference concept include:

- flick
- beckon
- spread wings
- repaint guardian
- make a wish
- replace garland
- custom emoji reaction

Create a reusable ritual architecture.

Example:

```ts
interface Charm {
  id: string;
  name: string;
  region: string;
  description: string;
  asset: string;
  ritual: RitualDefinition;
}
```

And:

```ts
interface RitualDefinition {
  id: string;
  duration: number;
  execute(context: RitualContext): void;
}
```

Do not hard-code ritual behavior directly inside UI components.

---

# 12. Charm data model

Create a centralized charm registry.

Initial charms should include the concepts shown in the reference:

- Nazar boncuğu
- Hamsa
- Nimbu-mirchi
- Drishti bommai
- Daruma
- Maneki-neko
- Horseshoe
- Scarab
- Emoji/custom charm

Use clean structured data.

Example:

```ts
const charms: Charm[] = [
  {
    id: "nazar-boncugu",
    name: "Nazar boncuğu",
    region: "Turkey and the Mediterranean",
    description: "...",
    asset: "...",
    ritual: ...
  }
];
```

Keep all text/data separate from rendering code.

---

# 13. Asset architecture

Do NOT bury asset paths throughout components.

Create a dedicated asset system:

```text
src/
  assets/
    charms/
      nazar/
      hamsa/
      nimbu-mirchi/
      drishti-bommai/
      daruma/
      maneki-neko/
      horseshoe/
      scarab/
```

Every charm needs:

- hanging/string visual
- charm body
- optional animation states
- optional ritual-specific assets

Prefer transparent PNG/WebP/SVG assets where appropriate.

The visual assets should have enough resolution for Retina displays.

Do not upscale low-resolution assets.

If reference artwork is not supplied, create a clean placeholder architecture and make the assets trivially replaceable.

Do not use copyrighted/proprietary artwork from the reference unless it is provided or licensed for use. Match the geometry, layout, interaction and animation, but keep the implementation legally replaceable with original assets.

---

# 14. Gallery window

Create a separate gallery/settings window.

The reference gallery is a dark, polished desktop UI.

It should have:

- dark background
- rounded cards
- subtle borders
- compact spacing
- soft shadows
- restrained blue accent
- icon-based top navigation
- charm cards in a multi-column grid

The visual tone should be:

```text
native desktop utility
+
dark modern UI
+
slightly playful
```

Not:

```text
generic SaaS dashboard
```

Do NOT use giant headings.

Do NOT use excessive gradients.

Do NOT use huge empty spaces.

Do NOT make cards look like Material UI admin components.

---

# 15. Gallery navigation

The reference shows a top navigation concept similar to:

```text
Gallery      General      About
```

Implement:

### Gallery

Shows all charms.

### General

Controls:

- show/hide charm
- launch at startup
- animation intensity
- charm position
- selected charm
- keyboard shortcuts
- overlay behavior

### About

Contains:

- app name
- version
- brief description
- credits
- links
- license information

---

# 16. Gallery cards

Each charm card should contain approximately:

```text
┌──────────────────────────────┐
│                              │
│        charm artwork         │
│                              │
│       Charm Name             │
│                              │
│ [Region badge]               │
│                              │
│ Short description            │
│                              │
│                 Select       │
└──────────────────────────────┘
```

However, match the reference proportions rather than blindly following this wireframe.

Cards should have:

- consistent dimensions
- subtle rounded corners
- thin border
- dark background
- highlighted selected state
- blue accent around the active card
- centered charm artwork
- compact typography

The selected charm card should be visually obvious without looking like a bright dashboard button.

---

# 17. Gallery scrolling

The gallery should scroll smoothly.

Do not create a page that becomes excessively tall.

Keep the application window compact enough that the gallery feels like a utility window.

The charm grid should adapt to window size.

Test at:

- 1280×800
- 1440×900
- 1920×1080
- Retina displays

---

# 18. System tray / menu bar

This is an essential feature.

The application should behave as a background utility.

On macOS:

- show a menu bar/tray icon
- do not rely on a normal Dock application window
- application should remain running when the gallery closes

On Windows:

- use the system tray
- gallery can be reopened from the tray

On Linux:

- use the system tray where supported
- gracefully degrade where the desktop environment does not support all functionality

Create tray menu items such as:

```text
Lucky Charm

Show / Hide Charm
Perform Ritual
Choose Charm
Open Gallery
Settings
Quit
```

Do not terminate the entire application when the settings/gallery window closes.

---

# 19. No normal dock/taskbar application behavior

The overlay experience should not feel like a normal application window.

The charm window should:

- not appear as a normal taskbar item
- not appear as a normal Dock window
- remain independent of the gallery window

The gallery is the normal user-facing window.

The overlay is the background desktop layer.

---

# 20. Keyboard shortcuts

Implement configurable global shortcuts.

Reference examples include shortcuts for toggling and performing rituals.

Create defaults such as:

```text
Toggle Charm
Perform Ritual
Open Gallery
```

But do NOT hard-code the reference shortcuts permanently.

Store configuration:

```ts
type ShortcutConfig = {
  toggleCharm: string;
  performRitual: string;
  openGallery: string;
};
```

Use Electron's global shortcut API.

Handle:

- shortcut registration conflicts
- invalid accelerators
- unregistering on shutdown
- changing shortcuts dynamically

If registration fails, surface a clear error in General settings.

---

# 21. Deep-link / custom protocol

Implement a custom protocol concept similar to:

```text
luckycharm://bless
```

The protocol should allow another application/script to trigger the charm ritual.

For example:

```bash
open "luckycharm://bless"
```

macOS equivalent should use the registered custom URL scheme.

Windows and Linux should register the application as a protocol handler where supported.

When the application receives:

```text
luckycharm://bless
```

it should:

1. ensure the app is running
2. show/bring the charm forward if hidden
3. move/fade the charm into visibility if needed
4. execute the ritual
5. return to its previous state where appropriate

Implement protocol handling through Electron's app lifecycle APIs.

Pay special attention to:

- second application instance
- forwarding protocol URL from second instance to the primary instance
- application startup from protocol
- protocol handling when the app is already open

---

# 22. Visibility/show/hide state

Implement clear state:

```ts
type CharmVisibility = "visible" | "hidden";
```

Hidden means the overlay should effectively disappear from the desktop without destroying application state.

Do not close the main Electron process.

When restored:

- charm should animate into place
- retain its previous position
- retain its selected charm

---

# 23. Charm entrance animation

When the user shows the charm:

Do not simply make it instantly appear.

Use:

```text
hidden
  ↓
small drop-in
  ↓
overshoot
  ↓
settle
```

A subtle spring animation should make it feel like the object is physically being released from above the screen.

---

# 24. Ritual system

Every charm should have a unique small ritual.

Create the rituals as independent implementations.

For example:

```text
Nazar
→ quick flick/swing

Hamsa
→ protective movement

Nimbu-mirchi
→ subtle swinging/replacement animation

Drishti bommai
→ color/repaint sequence

Daruma
→ eye-paint interaction

Maneki-neko
→ paw movement

Horseshoe
→ swing

Scarab
→ wing expansion

Emoji
→ customizable animation
```

These should be stylized and concise.

The ritual should usually be less than a few seconds.

The app should return naturally to idle afterwards.

---

# 25. Performance requirements

This is a desktop utility.

It should NOT continuously consume excessive CPU.

Target:

- idle CPU: minimal
- idle GPU usage: minimal
- animation CPU: reasonable
- no memory leaks
- no runaway requestAnimationFrame loops
- no duplicate listeners

Pause expensive animation when:

- charm is hidden
- application is backgrounded where possible
- gallery is closed
- ritual is not active

But continue only the lightweight physics needed for the visible charm.

---

# 26. State persistence

Persist:

- selected charm
- charm X position per display
- visibility
- launch-at-startup setting
- animation preference
- shortcuts
- selected theme
- gallery window size/position if appropriate

Use a simple robust local persistence layer.

Do not add a database.

A JSON/preferences-based solution is sufficient.

Create a versioned settings schema so future updates can migrate settings.

Example:

```ts
interface AppSettings {
  version: number;
  selectedCharmId: string;
  charmPositions: Record<string, number>;
  visible: boolean;
  launchAtStartup: boolean;
  animationIntensity: number;
  shortcuts: ShortcutConfig;
}
```

---

# 27. Multi-monitor behavior

This must be tested.

Requirements:

- detect displays
- identify display containing the current charm
- preserve position relative to display
- handle display connect/disconnect
- avoid placing charm outside usable bounds
- move charm gracefully when its display disappears

Use Electron `screen` display APIs.

Do not assume display ID `0`.

---

# 28. OS differences

Create a platform abstraction layer.

Example:

```text
src/main/platform/
  platform.ts
  macos.ts
  windows.ts
  linux.ts
```

Platform-specific behavior should not be scattered throughout unrelated UI components.

Examples of platform-specific responsibilities:

- startup behavior
- tray/menu bar
- window level
- protocol registration
- global shortcuts where necessary
- login launch
- dock/taskbar behavior

---

# 29. Electron security

Do NOT weaken Electron security to make the implementation easier.

Use:

- `contextIsolation: true`
- `nodeIntegration: false`
- preload bridge
- strict IPC contracts

Do not expose the entire `ipcRenderer` object to the renderer.

Expose only specific functions, for example:

```ts
window.electronAPI.toggleCharm()
window.electronAPI.performRitual()
window.electronAPI.getSettings()
window.electronAPI.updateSettings(...)
window.electronAPI.setCharmPosition(...)
window.electronAPI.openGallery()
```

Use strongly typed IPC contracts.

---

# 30. React/Vite architecture

Keep UI components separated from Electron main-process logic.

Suggested structure:

```text
src/
  main/
    main.ts
    windows/
      charm-window.ts
      gallery-window.ts
    tray/
      tray.ts
    shortcuts/
      shortcuts.ts
    protocol/
      protocol.ts
    displays/
      displays.ts
    settings/
      settings-store.ts
    platform/
      platform.ts
      macos.ts
      windows.ts
      linux.ts

  preload/
    preload.ts
    api.ts

  renderer/
    charm/
      CharmApp.tsx
      CharmCanvas.tsx
      CharmPhysics.ts
      rituals/
    gallery/
      GalleryApp.tsx
      components/
      pages/
    shared/
      types/
      constants/
      utils/

  assets/
    charms/
```

Adjust this to fit the existing repository rather than mechanically creating this exact structure.

---

# 31. Charm rendering strategy

Prefer the simplest rendering technology that can achieve the visual quality.

Evaluate:

1. normal DOM/SVG
2. CSS transforms
3. Canvas
4. lightweight animation library

Do NOT add Three.js/WebGL unless it is genuinely required.

This UI does not need a 3D engine.

A high-quality transparent PNG/WebP/SVG plus physics-based transforms should be sufficient for most charms.

Use CSS transforms or canvas transforms to rotate the charm around the correct attachment point.

The transform origin is important.

The charm must appear to rotate from the hanging string, not from its geometric center.

---

# 32. The string

The hanging string is part of the visual illusion.

It should:

- attach exactly to the top
- remain visually connected to the charm
- rotate naturally with the charm
- have a physically believable length
- not visibly detach when the charm moves

Use either:

- SVG
- CSS
- canvas
- a layered DOM structure

For example:

```text
CharmOverlay
 ├── String
 └── Charm
```

Both must share the same rotation/physics state.

---

# 33. Visual design

Reference visual language:

- transparent desktop background
- small colorful charm against the desktop
- minimal chrome
- dark utility/gallery window
- blue accent color
- subtle borders
- compact typography
- playful but restrained animation

Avoid:

- generic startup-app appearance
- giant buttons
- gradients everywhere
- excessive glassmorphism
- huge drop shadows
- oversized text
- dashboard-style navigation
- unnecessary dialogs

The goal is to feel like a tiny premium desktop utility.

---

# 34. Gallery window dimensions

Start with a compact utility-style size.

Approximately:

```text
1000 × 700
```

but make it responsive.

Use a minimum size that keeps the cards readable.

Do not make the gallery full-screen by default.

The screenshot in the reference video shows a desktop utility window with a dark interface and a multi-column charm gallery.

---

# 35. Window behavior

Gallery:

- normal focused application window
- movable
- resizable within reasonable bounds
- can be minimized
- can be closed
- closing it should NOT quit the app

Charm overlay:

- transparent
- borderless
- no taskbar/dock presence
- always on top
- click-through outside charm
- independently controlled from gallery/tray

---

# 36. Startup sequence

On application launch:

```text
Electron starts
   ↓
load settings
   ↓
initialize platform
   ↓
register protocol
   ↓
register shortcuts
   ↓
create tray/menu bar
   ↓
detect displays
   ↓
create charm overlay
   ↓
position charm
   ↓
show charm if configured visible
```

The gallery should not automatically open unless explicitly configured.

---

# 37. Handling app relaunch

Make the Electron app single-instance.

If the application launches a second time:

- focus/reuse the existing process
- do not create duplicate tray icons
- do not create duplicate overlays
- forward protocol URLs and commands to the primary process

This is especially important for:

```text
luckycharm://bless
```

---

# 38. Exactness requirement

Do not stop after implementing a functional prototype.

The result must be **visually and behaviorally compared against the reference video**.

After implementation, perform an explicit visual refinement pass.

Compare:

### Overlay

- charm size
- string length
- top offset
- horizontal position
- rotation
- swing speed
- damping
- spring behavior
- entrance animation
- hover response
- drag behavior
- idle motion

### Gallery

- window size
- card dimensions
- card spacing
- typography
- badge shape
- border radius
- border opacity
- selected-card outline
- background color
- navigation spacing
- icon size
- artwork scale
- artwork vertical alignment
- scrollbar appearance
- footer placement

Do NOT simply say "looks close."

Iterate until it visually matches the reference as closely as possible.

---

# 39. Important implementation constraint

A common incorrect implementation is:

```text
transparent Electron window
        ↓
full-screen
        ↓
charm rendered inside
        ↓
window receives all mouse events
```

Do NOT implement that.

The correct mental model is:

```text
desktop

        transparent overlay
               │
               │
             string
               │
             charm   ← only interactive region

everything else → underlying application receives input
```

The overlay should behave almost like an invisible layer with a single interactive object.

---

# 40. Testing requirements

Create a manual test matrix.

## macOS

Test:

- Apple Silicon
- Retina
- non-Retina if available
- menu bar
- global shortcuts
- launch at startup
- protocol URL
- multi-monitor
- full-screen applications
- Finder
- browser
- terminal
- IDE
- dragging charm
- click-through

## Windows

Test:

- Windows 10/11
- system tray
- multi-monitor
- DPI scaling
- global shortcuts
- click-through
- always-on-top
- startup
- protocol URL

## Linux

Test:

- supported desktop environments
- system tray behavior
- multi-monitor
- click-through
- protocol handling

Document platform limitations when the OS genuinely prevents identical behavior.

---

# 41. Build and packaging

Preserve the existing packaging setup if it already exists.

Ensure the project can produce:

```text
macOS
Windows
Linux
```

Do not introduce a second packaging system unnecessarily.

Make sure:

- production builds work
- development mode works
- overlay works in packaged builds
- assets resolve correctly after packaging
- protocol registration uses packaged executable paths
- tray icons resolve correctly
- relative paths do not break in production

---

# 42. Developer experience

Add useful scripts to package.json only when required.

For example:

```text
pnpm dev
pnpm build
pnpm package
pnpm lint
pnpm typecheck
```

Do not remove existing useful scripts.

The application should be easy to run locally.

---

# 43. Error handling

Handle gracefully:

- invalid shortcut
- display disappearing
- protocol called before initialization
- missing charm asset
- failed tray creation
- duplicate protocol invocation
- unsupported platform API
- corrupted settings
- migration failure

Never crash the entire application because a single charm asset or setting is invalid.

---

# 44. Logging

Create development-friendly logs for:

- overlay creation
- display detection
- selected display
- charm positioning
- shortcut registration
- protocol invocation
- settings load/save
- window creation/destruction

Do not spam logs every animation frame.

---

# 45. Accessibility

The gallery must still be usable with:

- keyboard navigation
- visible focus states
- accessible labels
- sensible button semantics

The charm itself is an interactive visual object, so expose an accessible name such as:

```text
Lucky charm — Nazar boncuğu
```

---

# 46. Architecture for future charms

Adding another charm should require mostly adding data/assets/ritual code.

I should NOT have to rewrite:

- Electron window handling
- gallery layout
- mouse interaction
- physics
- tray integration

The architecture should make adding:

```text
new charm
```

cheap.

---

# 47. First milestone

Before implementing every charm, build the complete foundation with ONE charm.

The first milestone must demonstrate:

1. transparent overlay
2. charm attached to top edge
3. click-through outside charm
4. interactive charm
5. physics-based swinging
6. drag/flick
7. tray/menu bar
8. hide/show
9. gallery opens
10. selecting the charm updates overlay
11. settings persist

Only after this foundation is correct should you add the remaining charms.

This is important because the overlay/window behavior is much more difficult than the gallery UI.

---

# 48. Visual validation workflow

After implementation:

1. Start the application.
2. Move it over a normal desktop.
3. Open Chrome/browser.
4. Open terminal.
5. Open an IDE.
6. Verify clicks outside the charm go through.
7. Drag the charm.
8. Flick the charm.
9. Hide and show it.
10. Change charm.
11. Open gallery.
12. Change settings.
13. Restart the app.
14. Test a second monitor.
15. Trigger the custom protocol.
16. Compare the behavior against the supplied video.

Take screenshots during development and inspect them.

Do not rely solely on DOM correctness.

The target is perceived visual/interaction fidelity.

---

# 49. Do not over-engineer

Do NOT build:

- backend
- cloud infrastructure
- authentication
- database
- web server
- unnecessary REST API
- unnecessary state-management framework
- unnecessary animation engine
- unnecessary 3D engine

This is primarily a local desktop utility.

Keep the architecture simple.

---

# 50. Final acceptance criteria

The implementation is complete only when all of the following are true:

### Overlay

- [ ] Charm hangs from top of screen
- [ ] Background is fully transparent
- [ ] Charm is always visible above normal windows when enabled
- [ ] Overlay does not show as a normal taskbar/Dock window
- [ ] Only charm captures mouse events
- [ ] Everything outside charm clicks through
- [ ] Charm can be dragged
- [ ] Charm swings naturally
- [ ] Charm settles naturally
- [ ] Charm can be repositioned horizontally
- [ ] Position persists
- [ ] Multi-monitor behavior works
- [ ] Hide/show works

### Gallery

- [ ] Separate application window
- [ ] Dark desktop-style UI
- [ ] Gallery tab
- [ ] General tab
- [ ] About tab
- [ ] Charm grid
- [ ] Selected charm state
- [ ] Responsive layout
- [ ] Correct visual hierarchy
- [ ] Compact utility-window proportions

### App integration

- [ ] Tray/menu bar icon
- [ ] Tray menu
- [ ] Global shortcuts
- [ ] Custom protocol
- [ ] Single-instance application
- [ ] Persistent settings
- [ ] Launch-at-startup support where platform permits

### Engineering

- [ ] TypeScript type-safe
- [ ] Secure Electron IPC
- [ ] No nodeIntegration in renderer
- [ ] contextIsolation enabled
- [ ] no obvious memory leaks
- [ ] no excessive CPU usage
- [ ] production build succeeds
- [ ] assets work in packaged app
- [ ] cross-platform code separated where necessary

---

# 51. Most important instruction

Do not optimize for "it technically works."

Optimize for:

> "When I run this next to the reference video, it feels like the same product."

The hardest and most important part is the **desktop overlay + click-through + physical hanging animation + top-edge positioning**.

Prioritize those before polishing secondary settings.

Do not settle for a normal Electron floating window.

The charm must feel like a real object attached to the top of the user's desktop.

---

# 52. Deliverables from the coding agent

At the end:

1. Implement the complete feature.
2. Show the final repository structure.
3. Explain which existing files were modified.
4. Explain any new dependencies.
5. Explain platform-specific behavior.
6. Provide exact commands to run in development.
7. Provide exact commands to build/package.
8. List any remaining limitations honestly.
9. Include a final manual test checklist.
10. Do not claim pixel-perfect parity unless you actually verified it visually.

Before declaring completion, run:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

and fix all errors caused by your implementation.

Do not leave TODOs in the core overlay/window behavior.
