const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const PDFMerger = require('pdf-merger-js');
const Jimp = require('jimp');
const forge = require('node-forge');

class PDFService {
    constructor() {
        this.merger = new PDFMerger();
    }

    async loadPDF(filePath) {
        try {
            const pdfBuffer = await fs.readFile(filePath);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            
            return {
                path: filePath,
                document: pdfDoc,
                pageCount: pdfDoc.getPageCount(),
                buffer: pdfBuffer
            };
        } catch (error) {
            throw new Error(`Failed to load PDF: ${error.message}`);
        }
    }

    async savePDF(filePath, pdfData) {
        try {
            let buffer;
            
            if (pdfData.document) {
                buffer = await pdfData.document.save();
            } else {
                buffer = pdfData.buffer;
            }
            
            await fs.writeFile(filePath, buffer);
            return true;
        } catch (error) {
            throw new Error(`Failed to save PDF: ${error.message}`);
        }
    }

    async mergePDFs(filePaths, outputPath) {
        try {
            const merger = new PDFMerger();
            
            for (const filePath of filePaths) {
                await merger.add(filePath);
            }
            
            await merger.save(outputPath);
            return true;
        } catch (error) {
            throw new Error(`Failed to merge PDFs: ${error.message}`);
        }
    }

    async splitPDF(filePath, outputPath, options = {}) {
        try {
            const pdfBuffer = await fs.readFile(filePath);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const totalPages = pdfDoc.getPageCount();
            
            if (options.individual) {
                const outputDir = path.dirname(outputPath);
                const baseName = path.basename(outputPath, '.pdf');
                
                for (let i = 0; i < totalPages; i++) {
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                    newPdf.addPage(copiedPage);
                    
                    const pdfBytes = await newPdf.save();
                    const pageOutputPath = path.join(outputDir, `${baseName}_page_${i + 1}.pdf`);
                    await fs.writeFile(pageOutputPath, pdfBytes);
                }
            } else {
                const fromPage = Math.max(1, options.from || 1) - 1;
                const toPage = Math.min(totalPages, options.to || totalPages) - 1;
                
                const newPdf = await PDFDocument.create();
                const pageIndices = [];
                
                for (let i = fromPage; i <= toPage; i++) {
                    pageIndices.push(i);
                }
                
                const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
                copiedPages.forEach((page) => newPdf.addPage(page));
                
                const pdfBytes = await newPdf.save();
                await fs.writeFile(outputPath, pdfBytes);
            }
            
            return true;
        } catch (error) {
            throw new Error(`Failed to split PDF: ${error.message}`);
        }
    }

    async convertPDF(filePath, format, options = {}, outputPath) {
        try {
            // Use pdf-lib to get page count
            const pdfBuffer = await fs.readFile(filePath);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const numPages = pdfDoc.getPageCount();
            
            const outputDir = path.dirname(outputPath);
            const baseName = path.basename(outputPath, path.extname(outputPath));
            const results = [];
            
            // Create placeholder images for each page using Jimp
            for (let i = 1; i <= numPages; i++) {
                const page = pdfDoc.getPage(i - 1);
                const { width, height } = page.getSize();
                
                // Create an image with page dimensions
                const image = new Jimp(Math.floor(width), Math.floor(height), 0xFFFFFFFF);
                
                // Add page number text (placeholder for actual rendering)
                // In production, you'd use a proper PDF rendering library
                const outputFile = path.join(outputDir, `${baseName}_page_${i}.${format}`);
                
                if (format === 'png') {
                    await image.writeAsync(outputFile);
                } else if (format === 'jpg' || format === 'jpeg') {
                    await image.quality(options.quality || 90).writeAsync(outputFile);
                }
                
                results.push(outputFile);
            }
            
            return results;
        } catch (error) {
            throw new Error(`Failed to convert PDF: ${error.message}`);
        }
    }

    async addPassword(filePath, password, outputPath, options = {}) {
        try {
            const pdfBuffer = await fs.readFile(filePath);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            
            // Set encryption options
            const encryptionOptions = {
                userPassword: password,
                ownerPassword: options.ownerPassword || password,
                permissions: {
                    printing: options.allowPrinting !== false,
                    modifying: options.allowModifying !== false,
                    copying: options.allowCopying !== false,
                    annotating: options.allowAnnotating !== false,
                    fillingForms: options.allowFillingForms !== false,
                    contentAccessibility: options.allowContentAccessibility !== false,
                    documentAssembly: options.allowDocumentAssembly !== false
                }
            };
            
            // Save with encryption
            const pdfBytes = await pdfDoc.save({
                useObjectStreams: false,
                encrypt: encryptionOptions
            });
            
            await fs.writeFile(outputPath, pdfBytes);
            return true;
        } catch (error) {
            throw new Error(`Failed to add password protection: ${error.message}`);
        }
    }

    async removePassword(filePath, password, outputPath) {
        try {
            const pdfBuffer = await fs.readFile(filePath);
            
            // Load PDF with password
            const pdfDoc = await PDFDocument.load(pdfBuffer, {
                password: password
            });
            
            // Save without encryption
            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(outputPath, pdfBytes);
            
            return true;
        } catch (error) {
            throw new Error(`Failed to remove password protection: ${error.message}`);
        }
    }

    async addText(pdfData, text, x, y, options = {}) {
        try {
            const pdfDoc = pdfData.document;
            const pages = pdfDoc.getPages();
            const pageIndex = options.pageIndex || 0;
            
            if (pageIndex >= pages.length) {
                throw new Error('Page index out of range');
            }
            
            const page = pages[pageIndex];
            const fontSize = options.fontSize || 12;
            const color = options.color || rgb(0, 0, 0);
            
            let font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            if (options.fontFamily) {
                try {
                    font = await pdfDoc.embedFont(options.fontFamily);
                } catch (e) {
                    // Fallback to default font if custom font fails
                }
            }
            
            page.drawText(text, {
                x: x,
                y: y,
                size: fontSize,
                font: font,
                color: color
            });
            
            return {
                ...pdfData,
                document: pdfDoc
            };
        } catch (error) {
            throw new Error(`Failed to add text: ${error.message}`);
        }
    }

    async addImage(pdfData, imagePath, x, y, options = {}) {
        try {
            const pdfDoc = pdfData.document;
            const pages = pdfDoc.getPages();
            const pageIndex = options.pageIndex || 0;
            
            if (pageIndex >= pages.length) {
                throw new Error('Page index out of range');
            }
            
            const page = pages[pageIndex];
            const imageBuffer = await fs.readFile(imagePath);
            const ext = path.extname(imagePath).toLowerCase();
            
            let image;
            if (ext === '.jpg' || ext === '.jpeg') {
                image = await pdfDoc.embedJpg(imageBuffer);
            } else if (ext === '.png') {
                image = await pdfDoc.embedPng(imageBuffer);
            } else {
                throw new Error('Unsupported image format. Use JPG or PNG.');
            }
            
            const width = options.width || image.width;
            const height = options.height || image.height;
            
            page.drawImage(image, {
                x: x,
                y: y,
                width: width,
                height: height
            });
            
            return {
                ...pdfData,
                document: pdfDoc
            };
        } catch (error) {
            throw new Error(`Failed to add image: ${error.message}`);
        }
    }

    async addPage(pdfData, options = {}) {
        try {
            const pdfDoc = pdfData.document;
            const width = options.width || 595.28; // A4 width
            const height = options.height || 841.89; // A4 height
            
            const page = pdfDoc.addPage([width, height]);
            
            if (options.backgroundColor) {
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    color: options.backgroundColor
                });
            }
            
            return {
                ...pdfData,
                document: pdfDoc,
                pageCount: pdfDoc.getPageCount()
            };
        } catch (error) {
            throw new Error(`Failed to add page: ${error.message}`);
        }
    }

    async deletePage(pdfData, pageIndex) {
        try {
            const pdfDoc = pdfData.document;
            const pages = pdfDoc.getPages();
            
            if (pageIndex < 0 || pageIndex >= pages.length) {
                throw new Error('Page index out of range');
            }
            
            pdfDoc.removePage(pageIndex);
            
            return {
                ...pdfData,
                document: pdfDoc,
                pageCount: pdfDoc.getPageCount()
            };
        } catch (error) {
            throw new Error(`Failed to delete page: ${error.message}`);
        }
    }

    async rotatePage(pdfData, pageIndex, degrees) {
        try {
            const pdfDoc = pdfData.document;
            const pages = pdfDoc.getPages();
            
            if (pageIndex < 0 || pageIndex >= pages.length) {
                throw new Error('Page index out of range');
            }
            
            const page = pages[pageIndex];
            const rotation = page.getRotation();
            page.setRotation(rotation.angle + degrees);
            
            return {
                ...pdfData,
                document: pdfDoc
            };
        } catch (error) {
            throw new Error(`Failed to rotate page: ${error.message}`);
        }
    }

    async getMetadata(pdfData) {
        try {
            const pdfDoc = pdfData.document;
            const title = pdfDoc.getTitle() || '';
            const author = pdfDoc.getAuthor() || '';
            const subject = pdfDoc.getSubject() || '';
            const keywords = pdfDoc.getKeywords() || '';
            const creator = pdfDoc.getCreator() || '';
            const producer = pdfDoc.getProducer() || '';
            const creationDate = pdfDoc.getCreationDate();
            const modificationDate = pdfDoc.getModificationDate();
            
            return {
                title,
                author,
                subject,
                keywords,
                creator,
                producer,
                creationDate,
                modificationDate,
                pageCount: pdfDoc.getPageCount()
            };
        } catch (error) {
            throw new Error(`Failed to get metadata: ${error.message}`);
        }
    }

    async setMetadata(pdfData, metadata) {
        try {
            const pdfDoc = pdfData.document;
            
            if (metadata.title) pdfDoc.setTitle(metadata.title);
            if (metadata.author) pdfDoc.setAuthor(metadata.author);
            if (metadata.subject) pdfDoc.setSubject(metadata.subject);
            if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
            if (metadata.creator) pdfDoc.setCreator(metadata.creator);
            if (metadata.producer) pdfDoc.setProducer(metadata.producer);
            
            return {
                ...pdfData,
                document: pdfDoc
            };
        } catch (error) {
            throw new Error(`Failed to set metadata: ${error.message}`);
        }
    }
}

module.exports = PDFService;