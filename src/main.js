const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const PDFService = require('./services/pdfService');
const isDev = process.argv.includes('--dev');

const pdfService = new PDFService();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'renderer', 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icons/app-icon.png'),
    show: false
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open PDF',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-file');
          }
        },
        {
          label: 'Save PDF',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow.webContents.send('menu-undo');
          }
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          click: () => {
            mainWindow.webContents.send('menu-redo');
          }
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Merge PDFs',
          click: () => {
            mainWindow.webContents.send('menu-merge-pdfs');
          }
        },
        {
          label: 'Split PDF',
          click: () => {
            mainWindow.webContents.send('menu-split-pdf');
          }
        },
        {
          label: 'Convert PDF',
          click: () => {
            mainWindow.webContents.send('menu-convert-pdf');
          }
        },
        {
          label: 'Add Password Protection',
          click: () => {
            mainWindow.webContents.send('menu-add-password');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About PDF Editor',
              message: 'PDF Editor v1.0.0',
              detail: 'Open-source PDF editor by Amit Haridas\\nFeatures: Edit, Merge, Split, Convert, Password Protection'
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('open-file-dialog', async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('save-file-dialog', async (event, defaultPath, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath,
    filters: filters || [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// PDF IPC handlers
ipcMain.handle('pdf-load', async (event, filePath) => {
  try {
    return await pdfService.loadPDF(filePath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-save', async (event, filePath, pdfData) => {
  try {
    return await pdfService.savePDF(filePath, pdfData);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-merge', async (event, filePaths, outputPath) => {
  try {
    return await pdfService.mergePDFs(filePaths, outputPath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-split', async (event, filePath, outputPath, options) => {
  try {
    return await pdfService.splitPDF(filePath, outputPath, options);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-convert', async (event, filePath, format, options, outputPath) => {
  try {
    return await pdfService.convertPDF(filePath, format, options, outputPath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-add-password', async (event, filePath, password, outputPath, options) => {
  try {
    return await pdfService.addPassword(filePath, password, outputPath, options);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-remove-password', async (event, filePath, password, outputPath) => {
  try {
    return await pdfService.removePassword(filePath, password, outputPath);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-add-text', async (event, pdfData, text, x, y, options) => {
  try {
    return await pdfService.addText(pdfData, text, x, y, options);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-add-image', async (event, pdfData, imagePath, x, y, options) => {
  try {
    return await pdfService.addImage(pdfData, imagePath, x, y, options);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-get-metadata', async (event, pdfData) => {
  try {
    return await pdfService.getMetadata(pdfData);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('pdf-set-metadata', async (event, pdfData, metadata) => {
  try {
    return await pdfService.setMetadata(pdfData, metadata);
  } catch (error) {
    throw error;
  }
});