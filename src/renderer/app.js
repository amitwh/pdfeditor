class PDFEditor {
    constructor() {
        this.currentPDF = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.zoomLevel = 1.0;
        this.undoStack = [];
        this.redoStack = [];
        
        this.initializeEventListeners();
        this.initializeMenuListeners();
    }

    initializeEventListeners() {
        document.getElementById('open-file-btn').addEventListener('click', () => this.openFile());
        document.getElementById('welcome-open-btn').addEventListener('click', () => this.openFile());
        document.getElementById('save-file-btn').addEventListener('click', () => this.saveFile());
        
        document.getElementById('merge-btn').addEventListener('click', () => this.showMergeModal());
        document.getElementById('split-btn').addEventListener('click', () => this.showSplitModal());
        document.getElementById('convert-btn').addEventListener('click', () => this.showConvertModal());
        document.getElementById('password-btn').addEventListener('click', () => this.showPasswordModal());
        
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        
        this.initializeModalListeners();
    }

    initializeMenuListeners() {
        if (window.electronAPI) {
            window.electronAPI.onMenuAction((event, action) => {
                switch(action) {
                    case 'menu-open-file':
                        this.openFile();
                        break;
                    case 'menu-save-file':
                        this.saveFile();
                        break;
                    case 'menu-undo':
                        this.undo();
                        break;
                    case 'menu-redo':
                        this.redo();
                        break;
                    case 'menu-merge-pdfs':
                        this.showMergeModal();
                        break;
                    case 'menu-split-pdf':
                        this.showSplitModal();
                        break;
                    case 'menu-convert-pdf':
                        this.showConvertModal();
                        break;
                    case 'menu-add-password':
                        this.showPasswordModal();
                        break;
                }
            });
        }
    }

    initializeModalListeners() {
        const overlay = document.getElementById('modal-overlay');
        const closeButtons = document.querySelectorAll('.modal-close, .modal-cancel');
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideModal();
            }
        });
        
        document.getElementById('add-merge-files').addEventListener('click', () => this.selectMergeFiles());
        document.getElementById('merge-execute').addEventListener('click', () => this.executeMerge());
        
        document.getElementById('split-execute').addEventListener('click', () => this.executeSplit());
        document.getElementById('convert-execute').addEventListener('click', () => this.executeConvert());
        document.getElementById('password-execute').addEventListener('click', () => this.executePassword());
        
        const passwordRadios = document.querySelectorAll('input[name="password-action"]');
        passwordRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updatePasswordModal());
        });
    }

    async openFile() {
        try {
            const result = await window.electronAPI.openFileDialog([
                { name: 'PDF Files', extensions: ['pdf'] }
            ]);
            
            if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                await this.loadPDF(filePath);
            }
        } catch (error) {
            this.showError('Failed to open file: ' + error.message);
        }
    }

    async loadPDF(filePath) {
        this.updateStatus('Loading PDF...');
        
        try {
            const pdfData = await window.pdfAPI.loadPDF(filePath);
            this.currentPDF = pdfData;
            this.totalPages = pdfData.pageCount;
            this.currentPage = 1;
            
            this.updateUI();
            this.renderPDF();
            this.updateStatus('PDF loaded successfully');
            
            document.getElementById('save-file-btn').disabled = false;
            document.getElementById('split-btn').disabled = false;
            document.getElementById('convert-btn').disabled = false;
            document.getElementById('password-btn').disabled = false;
            
        } catch (error) {
            this.showError('Failed to load PDF: ' + error.message);
        }
    }

    async saveFile() {
        if (!this.currentPDF) return;
        
        try {
            const result = await window.electronAPI.saveFileDialog('document.pdf', [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]);
            
            if (!result.canceled && result.filePath) {
                this.updateStatus('Saving PDF...');
                await window.pdfAPI.savePDF(result.filePath, this.currentPDF);
                this.updateStatus('PDF saved successfully');
            }
        } catch (error) {
            this.showError('Failed to save file: ' + error.message);
        }
    }

    renderPDF() {
        const container = document.getElementById('pdf-container');
        const welcomeMessage = container.querySelector('.welcome-message');
        
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        if (this.currentPDF) {
            container.innerHTML = '<div class="pdf-page"><canvas id="pdf-canvas"></canvas></div>';
            this.renderPage(this.currentPage);
            this.generateThumbnails();
        }
    }

    renderPage(pageNumber) {
        // This would integrate with PDF.js or similar library to render pages
        // For now, we'll create a placeholder
        const canvas = document.getElementById('pdf-canvas');
        if (canvas && this.currentPDF) {
            const ctx = canvas.getContext('2d');
            canvas.width = 600 * this.zoomLevel;
            canvas.height = 800 * this.zoomLevel;
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#333';
            ctx.font = `${20 * this.zoomLevel}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`PDF Page ${pageNumber}`, canvas.width / 2, canvas.height / 2);
            
            ctx.fillStyle = '#666';
            ctx.font = `${14 * this.zoomLevel}px Arial`;
            ctx.fillText(`${this.totalPages} total pages`, canvas.width / 2, canvas.height / 2 + 40);
        }
    }

    generateThumbnails() {
        const container = document.getElementById('page-thumbnails');
        container.innerHTML = '';
        
        for (let i = 1; i <= this.totalPages; i++) {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (i === this.currentPage) thumbnail.classList.add('active');
            
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 160;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Page ${i}`, canvas.width / 2, canvas.height / 2);
            
            thumbnail.appendChild(canvas);
            thumbnail.addEventListener('click', () => this.goToPage(i));
            container.appendChild(thumbnail);
        }
        
        document.getElementById('page-count').textContent = `${this.totalPages} pages`;
    }

    goToPage(pageNumber) {
        this.currentPage = pageNumber;
        this.renderPage(pageNumber);
        
        document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index + 1 === pageNumber);
        });
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.25, 5.0);
        this.updateZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.25, 0.25);
        this.updateZoom();
    }

    updateZoom() {
        document.getElementById('zoom-level').textContent = Math.round(this.zoomLevel * 100) + '%';
        if (this.currentPDF) {
            this.renderPage(this.currentPage);
        }
    }

    showMergeModal() {
        document.getElementById('merge-modal').classList.remove('hidden');
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showSplitModal() {
        if (!this.currentPDF) return;
        
        document.getElementById('split-to').max = this.totalPages;
        document.getElementById('split-to').value = this.totalPages;
        document.getElementById('split-modal').classList.remove('hidden');
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showConvertModal() {
        if (!this.currentPDF) return;
        
        document.getElementById('convert-modal').classList.remove('hidden');
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    showPasswordModal() {
        if (!this.currentPDF) return;
        
        this.updatePasswordModal();
        document.getElementById('password-modal').classList.remove('hidden');
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    updatePasswordModal() {
        const isAdding = document.querySelector('input[name="password-action"]:checked').value === 'add';
        const confirmLabel = document.getElementById('confirm-password-label');
        confirmLabel.style.display = isAdding ? 'block' : 'none';
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    async selectMergeFiles() {
        try {
            const result = await window.electronAPI.openFileDialog([
                { name: 'PDF Files', extensions: ['pdf'] }
            ]);
            
            if (!result.canceled && result.filePaths.length > 0) {
                const fileList = document.getElementById('merge-file-list');
                fileList.innerHTML = '';
                
                result.filePaths.forEach(filePath => {
                    const fileName = filePath.split('/').pop();
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <span class="file-item-name">${fileName}</span>
                        <button class="file-item-remove" onclick="this.parentElement.remove()">Remove</button>
                    `;
                    fileItem.dataset.path = filePath;
                    fileList.appendChild(fileItem);
                });
                
                document.getElementById('merge-execute').disabled = false;
            }
        } catch (error) {
            this.showError('Failed to select files: ' + error.message);
        }
    }

    async executeMerge() {
        const fileItems = document.querySelectorAll('#merge-file-list .file-item');
        const filePaths = Array.from(fileItems).map(item => item.dataset.path);
        
        if (filePaths.length === 0) return;
        
        try {
            this.updateStatus('Merging PDFs...');
            
            const result = await window.electronAPI.saveFileDialog('merged.pdf', [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]);
            
            if (!result.canceled && result.filePath) {
                await window.pdfAPI.mergePDFs(filePaths, result.filePath);
                this.updateStatus('PDFs merged successfully');
                this.hideModal();
            }
        } catch (error) {
            this.showError('Failed to merge PDFs: ' + error.message);
        }
    }

    async executeSplit() {
        const splitType = document.querySelector('input[name="split-type"]:checked').value;
        
        try {
            this.updateStatus('Splitting PDF...');
            
            const result = await window.electronAPI.saveFileDialog('split-page.pdf', [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]);
            
            if (!result.canceled && result.filePath) {
                let options = {};
                
                if (splitType === 'pages') {
                    options.from = parseInt(document.getElementById('split-from').value);
                    options.to = parseInt(document.getElementById('split-to').value);
                } else {
                    options.individual = true;
                }
                
                await window.pdfAPI.splitPDF(this.currentPDF.path, result.filePath, options);
                this.updateStatus('PDF split successfully');
                this.hideModal();
            }
        } catch (error) {
            this.showError('Failed to split PDF: ' + error.message);
        }
    }

    async executeConvert() {
        const format = document.getElementById('convert-format').value;
        const quality = document.getElementById('convert-quality').value;
        
        try {
            this.updateStatus('Converting PDF...');
            
            const result = await window.electronAPI.saveFileDialog(`converted.${format}`, [
                { name: `${format.toUpperCase()} Files`, extensions: [format] }
            ]);
            
            if (!result.canceled && result.filePath) {
                const options = { quality: parseInt(quality) };
                await window.pdfAPI.convertPDF(this.currentPDF.path, format, options, result.filePath);
                this.updateStatus('PDF converted successfully');
                this.hideModal();
            }
        } catch (error) {
            this.showError('Failed to convert PDF: ' + error.message);
        }
    }

    async executePassword() {
        const action = document.querySelector('input[name="password-action"]:checked').value;
        const password = document.getElementById('pdf-password').value;
        
        if (!password) {
            this.showError('Please enter a password');
            return;
        }
        
        if (action === 'add') {
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }
        }
        
        try {
            this.updateStatus(`${action === 'add' ? 'Adding' : 'Removing'} password protection...`);
            
            const result = await window.electronAPI.saveFileDialog('protected.pdf', [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]);
            
            if (!result.canceled && result.filePath) {
                if (action === 'add') {
                    await window.pdfAPI.addPassword(this.currentPDF.path, password, result.filePath);
                } else {
                    await window.pdfAPI.removePassword(this.currentPDF.path, password, result.filePath);
                }
                
                this.updateStatus(`Password ${action === 'add' ? 'added' : 'removed'} successfully`);
                this.hideModal();
            }
        } catch (error) {
            this.showError(`Failed to ${action} password: ` + error.message);
        }
    }

    undo() {
        if (this.undoStack.length > 0) {
            const state = this.undoStack.pop();
            this.redoStack.push(this.currentPDF);
            this.currentPDF = state;
            this.renderPDF();
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop();
            this.undoStack.push(this.currentPDF);
            this.currentPDF = state;
            this.renderPDF();
            this.updateUndoRedoButtons();
        }
    }

    updateUndoRedoButtons() {
        document.getElementById('undo-btn').disabled = this.undoStack.length === 0;
        document.getElementById('redo-btn').disabled = this.redoStack.length === 0;
    }

    updateUI() {
        this.updateUndoRedoButtons();
    }

    updateStatus(message) {
        document.getElementById('status-text').textContent = message;
    }

    async showError(message) {
        if (window.electronAPI) {
            await window.electronAPI.showMessageBox({
                type: 'error',
                title: 'Error',
                message: message
            });
        } else {
            alert('Error: ' + message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PDFEditor();
});