import { app, globalShortcut } from 'electron';

export class ElectronApp {
  readonly metadata = {
    isPackaged: app.isPackaged,
    version: app.getVersion(),
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    platform: process.platform,
  } as const;

  whenReady() {
    return app.whenReady();
  }

  quit() {
    app.quit();
  }

  requestSingleInstanceLock() {
    return app.requestSingleInstanceLock();
  }

  setAsDefaultProtocolClient(protocol: string) {
    return app.setAsDefaultProtocolClient(protocol);
  }

  getPath(name: Parameters<typeof app.getPath>[0]) {
    return app.getPath(name);
  }

  setAccessoryActivationPolicyOnMac() {
    if (process.platform === 'darwin') {
      app.setActivationPolicy('accessory');
    }
  }

  on<Args extends unknown[]>(eventName: string, listener: (...args: Args) => void) {
    (app as unknown as { on: (event: string, handler: (...args: unknown[]) => void) => void }).on(
      eventName,
      listener as (...args: unknown[]) => void,
    );
  }

  unregisterAllShortcuts() {
    globalShortcut.unregisterAll();
  }

  registerShortcut(accelerator: string, handler: () => void) {
    return globalShortcut.register(accelerator, handler);
  }
}
