# Manual Test Matrix

Run these checks on every packaged platform before release.

## Overlay

- Confirm the charm is transparent, always-on-top, and absent from the taskbar.
- Click outside the charm and verify the underlying app receives the click.
- Drag the charm horizontally, release it, restart the app, and confirm its position persists.
- Hide and show the charm from the tray and the global shortcut.
- Change the selected charm and perform its ritual from the overlay, tray, and shortcut.

## Desktop integration

- Try each configured shortcut while another application has focus; verify failures are logged when a shortcut is already claimed.
- Launch `luckycharm://bless` when the app is closed and when it is already running; verify only one app instance remains and the ritual runs.
- Disconnect the display holding the gallery, then reopen it; verify the window is visible on an available display.
- Verify the gallery closes without quitting the background utility and can be reopened from the overlay or shortcut.

## Platform coverage

- Windows 10/11: tray, DPI scaling, protocol launch, and multiple monitors.
- macOS: menu bar, full-screen workspaces, protocol launch, and Retina display.
- Linux: tray support and global-shortcut behaviour on the target desktop environment.
