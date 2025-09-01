# PDF Editor

An open-source, cross-platform PDF editor built with Electron that provides comprehensive PDF manipulation capabilities.

## Features

- ✅ **PDF Editing**: Add text, images, and annotations to PDF documents
- ✅ **PDF Export**: Export PDFs to various formats (PNG, JPG, JPEG)
- ✅ **PDF Merging**: Combine multiple PDF files into a single document
- ✅ **PDF Splitting**: Extract specific pages or split into individual pages
- ✅ **PDF Conversion**: Convert PDFs to image formats with customizable quality
- ✅ **Password Protection**: Add or remove password protection from PDFs
- ✅ **Cross-Platform**: Builds available for Linux, macOS, and Windows

## Technology Stack

- **Framework**: Electron (Node.js + Chromium)
- **PDF Libraries**: 
  - PDF-lib (PDF manipulation)
  - PDF-merger-js (PDF merging)
  - PDF2pic (PDF to image conversion)
  - Node-forge (encryption/password protection)
- **Build System**: Electron Builder

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Development Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:amitwh/pdfeditor.git
   cd pdfeditor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

## Building

### Build for all platforms:
```bash
npm run build:all
```

### Build for specific platforms:
```bash
npm run build:linux    # Linux (AppImage, deb)
npm run build:mac      # macOS (dmg, zip)
npm run build:windows  # Windows (nsis, portable)
```

## Platform-Specific Branches

The project maintains separate branches for platform-specific optimizations:

- `linux` - Linux-specific builds and configurations
- `mac` - macOS-specific builds and configurations  
- `windows` - Windows-specific builds and configurations

## Usage

### Opening a PDF
1. Click "Open PDF" or use Ctrl+O (Cmd+O on Mac)
2. Select a PDF file from your system
3. The PDF will load in the viewer with page thumbnails in the sidebar

### Merging PDFs
1. Click the "Merge" button in the toolbar
2. Select multiple PDF files to merge
3. Choose the output location
4. The merged PDF will be saved to your specified location

### Splitting PDFs
1. Open a PDF document
2. Click the "Split" button
3. Choose to split by page range or into individual pages
4. Select the output location

### Converting PDFs
1. Open a PDF document
2. Click the "Convert" button
3. Choose the output format (PNG, JPG, JPEG) and quality
4. Select the output location

### Password Protection
1. Open a PDF document
2. Click the "Password" button
3. Choose to add or remove password protection
4. Enter the password and confirm
5. Save the protected/unprotected PDF

## Development

### Project Structure
```
src/
├── main.js                 # Main Electron process
├── services/
│   └── pdfService.js      # PDF manipulation service
└── renderer/
    ├── index.html         # Main UI
    ├── styles.css         # Application styles
    ├── app.js            # Frontend application logic
    └── preload.js        # Electron preload script
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Amit Haridas**
- Email: amit.wh@gmail.com
- GitHub: [@amitwh](https://github.com/amitwh)

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- PDF manipulation powered by [PDF-lib](https://pdf-lib.js.org/)
- PDF merging using [PDF-merger-js](https://github.com/nbesli/pdf-merger-js)
- PDF to image conversion with [PDF2pic](https://github.com/yakovmeister/pdf2pic)
- Encryption support via [Node-forge](https://github.com/digitalbazaar/forge)

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/amitwh/pdfeditor/issues) on GitHub.