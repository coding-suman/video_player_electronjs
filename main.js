const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
const networkInterfaces = os.networkInterfaces();

let mainWindow;
let splash;
let splashStartTime;

// Get the IPv4 address
const ipv4Address = Object.values(networkInterfaces)
  .flat()
  .find((iface) => iface.family === 'IPv4' && !iface.internal)?.address || 'IP not found';

// Path to the media folder within the app directory
const mediaDir = path.join(__dirname, 'media');

// Ensure the media directory exists and is a directory
// if (fs.existsSync(mediaDir)) {
//     if (!fs.lstatSync(mediaDir).isDirectory()) {
//         console.error(`Path exists but is not a directory: ${mediaDir}`);
//         process.exit(1);  // Exit the application if the path is not a directory
//     }
// } else {
//     fs.mkdirSync(mediaDir, { recursive: true });
// }

// Configure multer to save files to the media directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, mediaDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

function createWindow() {
    splash = new BrowserWindow({
        width: 400,
        height: 400,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        icon: path.join(__dirname, './assets/icons/app-icon.png'), // Set the app icon here
    });

    splash.loadFile('./assets/splash/splash.html');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        icon: path.join(__dirname, './assets/icons/app-icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');

    // Show the main window after the splash screen has been displayed for 3 seconds
    mainWindow.once('ready-to-show', () => {
        const splashDuration = 3000; // 3 seconds
        const timeElapsed = Date.now() - splashStartTime;

        if (timeElapsed < splashDuration) {
            setTimeout(() => {
                splash.close();
                mainWindow.show();
            }, splashDuration - timeElapsed);
        } else {
            splash.close();
            mainWindow.show();
        }
    });

    mainWindow.webContents.openDevTools();

    ipcMain.on('toggle-fullscreen', () => {
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        } else {
            mainWindow.setFullScreen(true);
        }
    });

    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('toggle-maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });

    const serverApp = express();
    serverApp.use(cors());

    // Endpoint to handle file uploads
    serverApp.post('/upload', upload.single('file'), (req, res) => {
        const filePath = path.join(mediaDir, req.file.filename);
        const fileName = req.file.originalname;
        console.log(`File received: ${fileName}`);
        mainWindow.webContents.send('file-received', { fileName, filePath });
        res.status(200).send('File uploaded successfully');
    });

    // Endpoint to get the list of files
    serverApp.get('/files', (req, res) => {
        fs.readdir(mediaDir, (err, files) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to retrieve files' });
            }
            const fileList = files.map(file => ({
                name: file,
                url: `http://${req.hostname}:3000/media/${file}`
            }));
            res.json(fileList);
        });
    });

    // Endpoint to delete a file
    serverApp.delete('/delete/:fileName', (req, res) => {
        const fileName = req.params.fileName;
        const filePath = path.join(mediaDir, fileName);
        fs.unlink(filePath, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete file' });
            }
            res.status(200).send('File deleted successfully');
        });
    });

    // Endpoint to get memory information
    serverApp.get('/memory', (req, res) => {
        const freeMemory = os.freemem() / (1024 * 1024); // Convert to MB
        const totalMemory = os.totalmem() / (1024 * 1024); // Convert to MB
        const availableMemory = `${freeMemory.toFixed(2)} MB / ${totalMemory.toFixed(2)} MB`;
        res.json({ memory: availableMemory });
    });

    // Serve media files
    serverApp.use('/media', express.static(mediaDir));

    // Endpoint to handle control commands from Android
    serverApp.get('/control', (req, res) => {
        try {
            const { command } = req.query;
            console.log(`Received command: ${command}`);
            if (command) {
                mainWindow.webContents.send('control-command', command);
                res.status(200).send('Command executed successfully');
            } else {
                res.status(400).send('Command not provided');
            }
        } catch (error) {
            console.error('Error handling /control GET request:', error);
            res.status(500).send('Internal server error');
        }
    });

    serverApp.listen(3000, () => {
        console.log('HTTP server listening on port 3000');
    });

    // Send the IPv4 address to the renderer process
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('ipv4-address', ipv4Address);
    });
}

app.whenReady().then(() => {
    splashStartTime = Date.now();  // Record the time when the splash screen is displayed
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
