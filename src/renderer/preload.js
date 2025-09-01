const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (filters) => ipcRenderer.invoke('open-file-dialog', filters),
  saveFileDialog: (defaultPath, filters) => ipcRenderer.invoke('save-file-dialog', defaultPath, filters),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  onMenuAction: (callback) => {
    const menuActions = [
      'menu-open-file',
      'menu-save-file', 
      'menu-undo',
      'menu-redo',
      'menu-merge-pdfs',
      'menu-split-pdf',
      'menu-convert-pdf',
      'menu-add-password'
    ];
    
    menuActions.forEach(action => {
      ipcRenderer.on(action, callback);
    });
  },

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners();
  }
});

contextBridge.exposeInMainWorld('pdfAPI', {
  loadPDF: (filePath) => ipcRenderer.invoke('pdf-load', filePath),
  savePDF: (filePath, pdfData) => ipcRenderer.invoke('pdf-save', filePath, pdfData),
  mergePDFs: (filePaths) => ipcRenderer.invoke('pdf-merge', filePaths),
  splitPDF: (filePath, pages) => ipcRenderer.invoke('pdf-split', filePath, pages),
  convertPDF: (filePath, format, options) => ipcRenderer.invoke('pdf-convert', filePath, format, options),
  addPassword: (filePath, password, options) => ipcRenderer.invoke('pdf-add-password', filePath, password, options),
  removePassword: (filePath, password) => ipcRenderer.invoke('pdf-remove-password', filePath, password)
});