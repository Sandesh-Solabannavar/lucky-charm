# Lucky Charm Desktop

Lucky Charm is a cross-platform desktop companion built with Electron and TypeScript.
It renders a small, always-on-top desktop charm overlay plus a separate gallery/settings window.

## What It Does

- Displays a floating charm near the top of the desktop.
- Uses a transparent overlay window for the dangle experience.
- Opens a separate gallery window for charm selection and app sections.
- Supports tray/menu-bar style controls.
- Persists selected charm, overlay visibility, charm position, and gallery bounds.
- Supports keyboard shortcuts for core actions.

## Current Shortcut Defaults

- Toggle charm visibility: Ctrl/Cmd+Shift+D
- Perform ritual: Ctrl/Cmd+Shift+S
- Open gallery: Ctrl/Cmd+Shift+G

## Tech Stack

- Electron
- TypeScript
- pnpm
- Vite Plus pack flow for Electron build outputs

## Project Layout

- [src/main.ts](src/main.ts): Electron entry point
- [src/main.ts](src/main.ts): app bootstrap
- [src/app/DesktopProgram.ts](src/app/DesktopProgram.ts): runtime composition and wiring
- [src/app/LuckyCharmApp.ts](src/app/LuckyCharmApp.ts): charm catalog, selection, ritual state
- [src/ipc/LuckyCharmIpc.ts](src/ipc/LuckyCharmIpc.ts): IPC handlers
- [src/window/DesktopWindow.ts](src/window/DesktopWindow.ts): transparent overlay window behavior
- [src/window/DesktopGalleryWindow.ts](src/window/DesktopGalleryWindow.ts): gallery window lifecycle
- [src/settings/DesktopSettingsStore.ts](src/settings/DesktopSettingsStore.ts): persisted settings
- [src/preload.ts](src/preload.ts): secure renderer bridge
- [assets/charms](assets/charms): local charm PNG assets

## Prerequisites

- Node.js 20+ recommended
- pnpm 9+

## Install

1. Install dependencies:

   pnpm install

## Run in Development

1. Start the desktop app:

   pnpm dev

This runs build output generation, then launches Electron.

## Build

1. Type check:

   pnpm run typecheck

2. Build Electron bundles:

   pnpm run build

## Package

1. Create distributables:

   pnpm run package

Configured targets:

- macOS: dmg, zip
- Windows: portable, nsis

## Settings Storage

App settings are stored in Electron userData as settings.json.

On Windows this is typically:

- %APPDATA%/lucky-charm-desktop/settings.json

## Troubleshooting

### Electron starts as Node and app does not open

If Electron launches with missing app APIs, ensure ELECTRON_RUN_AS_NODE is not set.

PowerShell:

Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

Then rerun:

pnpm dev

## Notes

This project focuses on matching a desktop-first charm overlay experience while keeping the app cross-platform for macOS and Windows.
