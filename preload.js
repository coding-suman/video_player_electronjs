const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    toggleMaximize: () => ipcRenderer.send('toggle-maximize'),
    closeWindow: () => ipcRenderer.send('close-window')
});
