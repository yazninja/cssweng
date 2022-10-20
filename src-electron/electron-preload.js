/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */
import { ipcRenderer, contextBridge } from 'electron'
console.log('Preload script loaded')
contextBridge.exposeInMainWorld('ipcRenderer', {
    send: async (channel, data) => ipcRenderer.send(channel, data),
    receive: async (channel, func) => {
        let validChannels = ['loadXlsxReply', 'theme-changed', 'notify']
        if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender`
          console.log('ipcRenderer.receive', channel, func);
          ipcRenderer.on(channel, (event, ...args) => func(...args))
        }
    },
    getThemeMode: async () => ipcRenderer.invoke('getThemeMode'),
    getAppVersion: async () => ipcRenderer.invoke('getAppVersion'),
    invoke: async (channel, data) => ipcRenderer.invoke(channel, data)
})
contextBridge.exposeInMainWorld('version', {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    platform: `${process.platform} (${process.getSystemVersion()})`,
    arch: process.arch,
    appVersion:  `${process.env.npm_package_productName ? `${process.env.npm_package_productName} v${process.env.npm_package_version} ${process.env.NODE_ENV.toUpperCase()}` : 'null'}`,
    process: process,
})