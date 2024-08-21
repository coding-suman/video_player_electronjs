const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    toggleMaximize: () => ipcRenderer.send('toggle-maximize'),
    onControlCommand: (callback) => ipcRenderer.on('control-command', (event, command) => callback(command)),
    onIPv4Address: (callback) => ipcRenderer.on('ipv4-address', callback),
    onFileReceived: (callback) => ipcRenderer.on('file-received', callback)
});
