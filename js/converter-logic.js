(function() {
    'use strict';
    
    var selectedFile = null;
    var selectedFormat = null;
    var currentCategory = 'all';
    var lastSavedPath = null;
    var lastSavedMimeType = null;
    
    // Funções auxiliares com prefixo converter
    function $(id) { return document.getElementById(id); }
    function $$(sel) { return document.querySelectorAll(sel); }
    
    // Expor função global para abrir o conversor
    window.openConverter = function() {
        console.log('[Converter] Abrindo modal...');
        var modal = $('converterModal');
        if (modal) {
            modal.classList.add('show');
            // Adicionar estado no histórico para botão voltar funcionar
            history.pushState({ converterOpen: true }, '', '');
            initConverter();
        }
    };
    
    // Fechar conversor
    window.closeConverter = function() {
        var modal = $('converterModal');
        if (modal) modal.classList.remove('show');
        clearFile();
    };
    
    // Init quando aberto
    function initConverter() {
        // Voltar
        var backBtn = $('converterBackBtn');
        if (backBtn) backBtn.onclick = window.closeConverter;
        
        // Drop zone
        var dropZone = $('converterDropZone');
        if (dropZone) {
            dropZone.onclick = function() { $('converterFileInput').click(); };
            dropZone.ondragover = function(e) { e.preventDefault(); dropZone.classList.add('dragover'); };
            dropZone.ondragleave = function() { dropZone.classList.remove('dragover'); };
            dropZone.ondrop = function(e) {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
            };
        }
        
        // File input
        var fileInput = $('converterFileInput');
        if (fileInput) {
            fileInput.onchange = function(e) {
                if (e.target.files.length) handleFile(e.target.files[0]);
            };
        }
        
        // Remove file
        var removeBtn = $('converterFileRemove');
        if (removeBtn) removeBtn.onclick = clearFile;
        
        // Category tabs
        var tabs = $$('.converter-category-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].onclick = function() {
                currentCategory = this.dataset.cat;
                var allTabs = $$('.converter-category-tab');
                for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
                this.classList.add('active');
                filterFormats();
            };
        }
        
        // Format buttons
        var btns = $$('.converter-format-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].onclick = function() { selectFormat(this); };
        }
        
        // Convert button
        var convertBtn = $('converterConvertBtn');
        if (convertBtn) convertBtn.onclick = convert;
        
        // Modal buttons
        var openFileBtn = $('converterOpenFileBtn');
        if (openFileBtn) openFileBtn.onclick = openSavedFile;
        
        var closeModalBtn = $('converterCloseModalBtn');
        if (closeModalBtn) closeModalBtn.onclick = function() { 
            $('converterSuccessModal').classList.remove('show'); 
        };
    }
    
    function handleFile(file) {
        selectedFile = file;
        var dropZone = $('converterDropZone');
        if (dropZone) dropZone.style.display = 'none';
        
        var fileInfo = $('converterFileInfo');
        if (fileInfo) fileInfo.classList.add('visible');
        
        var fileName = $('converterFileName');
        if (fileName) fileName.textContent = file.name;
        
        var fileSize = $('converterFileSize');
        if (fileSize) fileSize.textContent = formatSize(file.size);
        
        var icon = $('converterFileIcon');
        var ext = file.name.split('.').pop().toLowerCase();
        
        if (icon) {
            icon.className = 'converter-file-icon';
            if (ext === 'pdf') {
                icon.classList.add('pdf');
                icon.innerHTML = '<i class="fas fa-file-pdf"></i>';
            } else if (['doc', 'docx', 'txt', 'rtf', 'odt'].indexOf(ext) >= 0) {
                icon.classList.add('doc');
                icon.innerHTML = '<i class="fas fa-file-word"></i>';
            } else if (['ppt', 'pptx', 'odp'].indexOf(ext) >= 0) {
                icon.classList.add('ppt');
                icon.innerHTML = '<i class="fas fa-file-powerpoint"></i>';
            } else if (['xls', 'xlsx', 'ods'].indexOf(ext) >= 0) {
                icon.classList.add('xls');
                icon.innerHTML = '<i class="fas fa-file-excel"></i>';
            } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'].indexOf(ext) >= 0) {
                icon.classList.add('img');
                icon.innerHTML = '<i class="fas fa-image"></i>';
            } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].indexOf(ext) >= 0) {
                icon.classList.add('audio');
                icon.innerHTML = '<i class="fas fa-music"></i>';
            } else {
                icon.classList.add('other');
                icon.innerHTML = '<i class="fas fa-file"></i>';
            }
        }
        
        updateCompatibleFormats(ext);
        selectedFormat = null;
        var allBtns = $$('.converter-format-btn');
        for (var i = 0; i < allBtns.length; i++) allBtns[i].classList.remove('selected');
        
        var convertBtn = $('converterConvertBtn');
        if (convertBtn) convertBtn.disabled = true;
    }
    
    function clearFile() {
        selectedFile = null;
        selectedFormat = null;
        
        var dropZone = $('converterDropZone');
        if (dropZone) dropZone.style.display = 'block';
        
        var fileInfo = $('converterFileInfo');
        if (fileInfo) fileInfo.classList.remove('visible');
        
        var fileInput = $('converterFileInput');
        if (fileInput) fileInput.value = '';
        
        var allBtns = $$('.converter-format-btn');
        for (var i = 0; i < allBtns.length; i++) {
            allBtns[i].classList.remove('selected');
            allBtns[i].classList.remove('disabled');
        }
        
        var convertBtn = $('converterConvertBtn');
        if (convertBtn) convertBtn.disabled = true;
    }
    
    function updateCompatibleFormats(sourceExt) {
        var imgFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'];
        var textFormats = ['txt', 'md', 'html', 'json', 'csv', 'xml', 'yaml', 'tsv'];
        var docFormats = ['pdf', 'docx', 'pptx', 'txt', 'html', 'md'];
        
        var btns = $$('.converter-format-btn');
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            var targetFormat = btn.dataset.format;
            var compatible = false;
            
            // Image conversions
            if (imgFormats.indexOf(sourceExt) >= 0 && imgFormats.indexOf(targetFormat) >= 0) compatible = true;
            if (imgFormats.indexOf(sourceExt) >= 0 && targetFormat === 'pdf') compatible = true;
            
            // Text/Data conversions
            if (textFormats.indexOf(sourceExt) >= 0 && textFormats.indexOf(targetFormat) >= 0) compatible = true;
            
            // TXT conversions - to everything
            if (sourceExt === 'txt' && ['docx', 'pdf', 'html', 'md', 'pptx'].indexOf(targetFormat) >= 0) compatible = true;
            
            // DOCX conversions - to all documents
            if (sourceExt === 'docx' && ['txt', 'html', 'md', 'pdf', 'pptx'].indexOf(targetFormat) >= 0) compatible = true;
            
            // PPTX conversions - to all documents
            if (sourceExt === 'pptx' && ['txt', 'md', 'html', 'pdf', 'docx', 'png', 'jpg'].indexOf(targetFormat) >= 0) compatible = true;
            
            // XLSX conversions
            if (sourceExt === 'xlsx' && ['csv', 'json', 'txt', 'tsv', 'html', 'pdf'].indexOf(targetFormat) >= 0) compatible = true;
            if (sourceExt === 'csv' && ['xlsx', 'json', 'xml', 'txt', 'tsv', 'html'].indexOf(targetFormat) >= 0) compatible = true;
            if (sourceExt === 'json' && ['xlsx', 'csv', 'xml', 'yaml', 'txt', 'tsv', 'html'].indexOf(targetFormat) >= 0) compatible = true;
            if (sourceExt === 'tsv' && ['csv', 'json', 'xlsx', 'txt', 'html'].indexOf(targetFormat) >= 0) compatible = true;
            
            // XML/YAML
            if (sourceExt === 'xml' && ['json', 'txt', 'csv', 'html', 'yaml'].indexOf(targetFormat) >= 0) compatible = true;
            if (sourceExt === 'yaml' && ['json', 'txt', 'csv', 'xml', 'html'].indexOf(targetFormat) >= 0) compatible = true;
            
            // MD/HTML - to all documents
            if (sourceExt === 'md' && ['html', 'txt', 'pdf', 'docx', 'pptx'].indexOf(targetFormat) >= 0) compatible = true;
            if (sourceExt === 'html' && ['txt', 'md', 'pdf', 'docx', 'pptx'].indexOf(targetFormat) >= 0) compatible = true;
            
            // PDF conversions - to all documents and images
            if (sourceExt === 'pdf' && ['txt', 'docx', 'html', 'md', 'png', 'jpg', 'pptx'].indexOf(targetFormat) >= 0) compatible = true;
            
            // Don't convert to same format
            if (sourceExt === targetFormat) compatible = false;
            if ((sourceExt === 'jpeg' && targetFormat === 'jpg') || (sourceExt === 'jpg' && targetFormat === 'jpeg')) compatible = false;
            
            if (compatible) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        }
        filterFormats();
    }
    
    function filterFormats() {
        var btns = $$('.converter-format-btn');
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            if (currentCategory === 'all') {
                btn.style.display = '';
            } else {
                btn.style.display = btn.dataset.cat === currentCategory ? '' : 'none';
            }
        }
    }
    
    function selectFormat(btn) {
        if (btn.classList.contains('disabled')) return;
        var allBtns = $$('.converter-format-btn');
        for (var i = 0; i < allBtns.length; i++) allBtns[i].classList.remove('selected');
        btn.classList.add('selected');
        selectedFormat = btn.dataset.format;
        var convertBtn = $('converterConvertBtn');
        if (convertBtn) convertBtn.disabled = !selectedFile;
    }
    
    async function convert() {
        if (!selectedFile || !selectedFormat) return;
        showLoading('Convertendo...');
        
        try {
            var sourceExt = selectedFile.name.split('.').pop().toLowerCase();
            var imgFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'];
            var result = null;
            
            // Image to Image
            if (imgFormats.indexOf(sourceExt) >= 0 && imgFormats.indexOf(selectedFormat) >= 0) {
                result = await convertImage(selectedFile, selectedFormat);
            }
            // Image to PDF
            else if (imgFormats.indexOf(sourceExt) >= 0 && selectedFormat === 'pdf') {
                result = await imageToPDF(selectedFile);
            }
            // DOCX to TXT/HTML/MD
            else if (sourceExt === 'docx' && ['txt', 'html', 'md'].indexOf(selectedFormat) >= 0) {
                result = await docxToText(selectedFile, selectedFormat);
            }
            // DOCX to PDF
            else if (sourceExt === 'docx' && selectedFormat === 'pdf') {
                var textResult = await docxToText(selectedFile, 'txt');
                result = await textToPDF(textResult.text, selectedFile.name.replace('.docx', '.pdf'));
            }
            // TXT to DOCX
            else if (sourceExt === 'txt' && selectedFormat === 'docx') {
                result = await textToDocx(selectedFile);
            }
            // TXT to PDF
            else if (sourceExt === 'txt' && selectedFormat === 'pdf') {
                var text = await selectedFile.text();
                result = await textToPDF(text, selectedFile.name.replace('.txt', '.pdf'));
            }
            // MD to HTML
            else if (sourceExt === 'md' && selectedFormat === 'html') {
                result = await mdToHtml(selectedFile);
            }
            // MD to PDF
            else if (sourceExt === 'md' && selectedFormat === 'pdf') {
                var text = await selectedFile.text();
                var html = markdownToHtml(text);
                var plainText = htmlToPlainText(html);
                result = await textToPDF(plainText, selectedFile.name.replace('.md', '.pdf'));
            }
            // HTML to TXT/MD
            else if (sourceExt === 'html' && ['txt', 'md'].indexOf(selectedFormat) >= 0) {
                result = await htmlToText(selectedFile, selectedFormat);
            }
            // HTML to PDF
            else if (sourceExt === 'html' && selectedFormat === 'pdf') {
                var text = await selectedFile.text();
                var plainText = htmlToPlainText(text);
                result = await textToPDF(plainText, selectedFile.name.replace('.html', '.pdf'));
            }
            // XLSX to CSV/JSON
            else if (sourceExt === 'xlsx' && ['csv', 'json', 'txt'].indexOf(selectedFormat) >= 0) {
                result = await xlsxToData(selectedFile, selectedFormat);
            }
            // CSV to XLSX
            else if (sourceExt === 'csv' && selectedFormat === 'xlsx') {
                result = await csvToXlsx(selectedFile);
            }
            // JSON to XLSX
            else if (sourceExt === 'json' && selectedFormat === 'xlsx') {
                result = await jsonToXlsx(selectedFile);
            }
            // TSV to XLSX
            else if (sourceExt === 'tsv' && selectedFormat === 'xlsx') {
                result = await tsvToXlsx(selectedFile);
            }
            // PPTX to TXT/MD/HTML
            else if (sourceExt === 'pptx' && ['txt', 'md', 'html'].indexOf(selectedFormat) >= 0) {
                result = await pptxToText(selectedFile, selectedFormat);
            }
            // PPTX to PDF
            else if (sourceExt === 'pptx' && selectedFormat === 'pdf') {
                var textResult = await pptxToText(selectedFile, 'txt');
                result = await textToPDF(textResult.text, selectedFile.name.replace('.pptx', '.pdf'));
            }
            // PPTX to DOCX
            else if (sourceExt === 'pptx' && selectedFormat === 'docx') {
                result = await pptxToDocx(selectedFile);
            }
            // PPTX to Image
            else if (sourceExt === 'pptx' && ['png', 'jpg'].indexOf(selectedFormat) >= 0) {
                result = await pptxToImage(selectedFile, selectedFormat);
            }
            // DOCX to PPTX
            else if (sourceExt === 'docx' && selectedFormat === 'pptx') {
                result = await docxToPptx(selectedFile);
            }
            // TXT to PPTX
            else if (sourceExt === 'txt' && selectedFormat === 'pptx') {
                result = await textToPptx(selectedFile);
            }
            // MD to DOCX
            else if (sourceExt === 'md' && selectedFormat === 'docx') {
                result = await mdToDocx(selectedFile);
            }
            // MD to PPTX
            else if (sourceExt === 'md' && selectedFormat === 'pptx') {
                result = await mdToPptx(selectedFile);
            }
            // HTML to DOCX
            else if (sourceExt === 'html' && selectedFormat === 'docx') {
                result = await htmlToDocx(selectedFile);
            }
            // HTML to PPTX
            else if (sourceExt === 'html' && selectedFormat === 'pptx') {
                result = await htmlToPptx(selectedFile);
            }
            // PDF to PPTX
            else if (sourceExt === 'pdf' && selectedFormat === 'pptx') {
                result = await pdfToPptx(selectedFile);
            }
            // XLSX to HTML
            else if (sourceExt === 'xlsx' && selectedFormat === 'html') {
                result = await xlsxToHtml(selectedFile);
            }
            // XLSX to PDF
            else if (sourceExt === 'xlsx' && selectedFormat === 'pdf') {
                var htmlResult = await xlsxToHtml(selectedFile);
                var plainText = htmlToPlainText(await htmlResult.blob.text());
                result = await textToPDF(plainText, selectedFile.name.replace('.xlsx', '.pdf'));
            }
            // Data to HTML
            else if (['csv', 'json', 'tsv', 'xml', 'yaml'].indexOf(sourceExt) >= 0 && selectedFormat === 'html') {
                result = await dataToHtml(selectedFile);
            }
            // JSON/CSV/XML/YAML/TSV conversions
            else if (['json', 'csv', 'xml', 'yaml', 'tsv', 'txt', 'md'].indexOf(sourceExt) >= 0) {
                result = await convertTextData(selectedFile, selectedFormat);
            }
            // PDF to TXT/HTML/MD
            else if (sourceExt === 'pdf' && ['txt', 'html', 'md'].indexOf(selectedFormat) >= 0) {
                result = await pdfToText(selectedFile, selectedFormat);
            }
            // PDF to DOCX
            else if (sourceExt === 'pdf' && selectedFormat === 'docx') {
                result = await pdfToDocx(selectedFile);
            }
            // PDF to Image
            else if (sourceExt === 'pdf' && ['png', 'jpg'].indexOf(selectedFormat) >= 0) {
                result = await pdfToImage(selectedFile, selectedFormat);
            }
            
            if (result && result.blob) {
                await saveToDevice(result.blob, result.name);
            } else {
                toast('Conversão não suportada');
            }
        } catch (err) {
            console.error(err);
            toast('Erro: ' + err.message);
        }
        
        hideLoading();
    }
    
    // ===== IMAGE CONVERSION =====
    function convertImage(file, targetFormat) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext('2d');
                    
                    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);
                    
                    var mimeTypes = { 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif', 'bmp': 'image/bmp' };
                    var mimeType = mimeTypes[targetFormat] || 'image/png';
                    
                    canvas.toBlob(function(blob) {
                        if (blob) {
                            var baseName = file.name.replace(/\.[^/.]+$/, '');
                            resolve({ blob: blob, name: baseName + '.' + targetFormat });
                        } else {
                            reject(new Error('Falha ao converter imagem'));
                        }
                    }, mimeType, 0.92);
                };
                img.onerror = function() { reject(new Error('Erro ao carregar imagem')); };
                img.src = e.target.result;
            };
            reader.onerror = function() { reject(new Error('Erro ao ler arquivo')); };
            reader.readAsDataURL(file);
        });
    }
    
    // ===== IMAGE TO PDF =====
    function imageToPDF(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, img.width, img.height);
                    ctx.drawImage(img, 0, 0);
                    
                    var imgData = canvas.toDataURL('image/jpeg', 0.92);
                    var pdfContent = createImagePDF(imgData, img.width, img.height);
                    var blob = new Blob([pdfContent], { type: 'application/pdf' });
                    var baseName = file.name.replace(/\.[^/.]+$/, '');
                    resolve({ blob: blob, name: baseName + '.pdf' });
                };
                img.onerror = function() { reject(new Error('Erro ao carregar imagem')); };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    function createImagePDF(imgDataUrl, width, height) {
        var maxWidth = 555, maxHeight = 802;
        var scale = Math.min(maxWidth / width, maxHeight / height);
        var pdfWidth = width * scale;
        var pdfHeight = height * scale;
        
        var imgData = imgDataUrl.split(',')[1];
        var binaryData = atob(imgData);
        
        var x = (595 - pdfWidth) / 2;
        var y = (842 - pdfHeight) / 2;
        var stream = 'q ' + pdfWidth.toFixed(2) + ' 0 0 ' + pdfHeight.toFixed(2) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /Im1 Do Q';
        
        var pdf = '%PDF-1.4\n';
        pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
        pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
        pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n';
        pdf += '4 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream\nendobj\n';
        pdf += '5 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + width + ' /Height ' + height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + binaryData.length + ' >>\nstream\n';
        
        var encoder = new TextEncoder();
        var header = encoder.encode(pdf);
        var bytes = new Uint8Array(binaryData.length);
        for (var i = 0; i < binaryData.length; i++) bytes[i] = binaryData.charCodeAt(i);
        var footer = encoder.encode('\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000270 00000 n \n0000000000 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF');
        
        var result = new Uint8Array(header.length + bytes.length + footer.length);
        result.set(header, 0);
        result.set(bytes, header.length);
        result.set(footer, header.length + bytes.length);
        return result;
    }
    
    // ===== TEXT TO PDF =====
    async function textToPDF(text, filename) {
        var lines = text.split('\n');
        var pageHeight = 842;
        var pageWidth = 595;
        var margin = 50;
        var lineHeight = 14;
        var fontSize = 11;
        var maxCharsPerLine = 80;
        var linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
        
        // Word wrap
        var wrappedLines = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.length <= maxCharsPerLine) {
                wrappedLines.push(line);
            } else {
                var words = line.split(' ');
                var currentLine = '';
                for (var j = 0; j < words.length; j++) {
                    var word = words[j];
                    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
                        currentLine = (currentLine + ' ' + word).trim();
                    } else {
                        if (currentLine) wrappedLines.push(currentLine);
                        currentLine = word;
                    }
                }
                if (currentLine) wrappedLines.push(currentLine);
            }
        }
        
        var numPages = Math.ceil(wrappedLines.length / linesPerPage) || 1;
        var objects = [];
        var objNum = 1;
        
        // Catalog
        objects.push({ num: objNum++, content: '<< /Type /Catalog /Pages 2 0 R >>' });
        
        // Pages (will be updated later)
        var pagesObjNum = objNum++;
        var pageRefs = [];
        
        // Font
        var fontObjNum = objNum++;
        objects.push({ num: fontObjNum, content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>' });
        
        // Create pages
        for (var p = 0; p < numPages; p++) {
            var pageObjNum = objNum++;
            var contentObjNum = objNum++;
            pageRefs.push(pageObjNum + ' 0 R');
            
            var startLine = p * linesPerPage;
            var endLine = Math.min(startLine + linesPerPage, wrappedLines.length);
            var pageLines = wrappedLines.slice(startLine, endLine);
            
            var content = 'BT\n/F1 ' + fontSize + ' Tf\n';
            var y = pageHeight - margin;
            for (var l = 0; l < pageLines.length; l++) {
                var escapedLine = pageLines[l]
                    .replace(/\\/g, '\\\\')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)');
                content += margin + ' ' + y + ' Td\n(' + escapedLine + ') Tj\n';
                content += -margin + ' ' + (-lineHeight) + ' Td\n';
                y -= lineHeight;
            }
            content += 'ET';
            
            objects.push({ num: pageObjNum, content: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageWidth + ' ' + pageHeight + '] /Contents ' + contentObjNum + ' 0 R /Resources << /Font << /F1 ' + fontObjNum + ' 0 R >> >> >>' });
            objects.push({ num: contentObjNum, content: '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream' });
        }
        
        // Insert Pages object
        objects.splice(1, 0, { num: pagesObjNum, content: '<< /Type /Pages /Kids [' + pageRefs.join(' ') + '] /Count ' + numPages + ' >>' });
        
        // Build PDF
        var pdf = '%PDF-1.4\n';
        var offsets = [];
        
        for (var i = 0; i < objects.length; i++) {
            offsets[objects[i].num] = pdf.length;
            pdf += objects[i].num + ' 0 obj\n' + objects[i].content + '\nendobj\n';
        }
        
        var xrefStart = pdf.length;
        pdf += 'xref\n0 ' + (objNum) + '\n';
        pdf += '0000000000 65535 f \n';
        for (var i = 1; i < objNum; i++) {
            var offset = offsets[i] || 0;
            pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
        }
        
        pdf += 'trailer\n<< /Size ' + objNum + ' /Root 1 0 R >>\n';
        pdf += 'startxref\n' + xrefStart + '\n%%EOF';
        
        var blob = new Blob([pdf], { type: 'application/pdf' });
        return { blob: blob, name: filename };
    }
    
    // ===== DOCX TO TEXT =====
    async function docxToText(file, targetFormat) {
        var zip = await JSZip.loadAsync(file);
        var docXml = await zip.file('word/document.xml').async('string');
        
        // Extract text from XML
        var text = '';
        var parser = new DOMParser();
        var doc = parser.parseFromString(docXml, 'application/xml');
        
        var paragraphs = doc.getElementsByTagName('w:p');
        for (var i = 0; i < paragraphs.length; i++) {
            var texts = paragraphs[i].getElementsByTagName('w:t');
            var paraText = '';
            for (var j = 0; j < texts.length; j++) {
                paraText += texts[j].textContent;
            }
            text += paraText + '\n';
        }
        
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        var mimeType = 'text/plain';
        var output = text.trim();
        
        if (targetFormat === 'html') {
            output = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title></head><body>';
            var lines = text.trim().split('\n');
            for (var i = 0; i < lines.length; i++) {
                output += '<p>' + escapeHtml(lines[i]) + '</p>';
            }
            output += '</body></html>';
            mimeType = 'text/html';
        } else if (targetFormat === 'md') {
            // Keep as plain text for md
            mimeType = 'text/markdown';
        }
        
        var blob = new Blob([output], { type: mimeType });
        return { blob: blob, name: baseName + '.' + targetFormat, text: text.trim() };
    }
    
    // ===== TEXT TO DOCX =====
    async function textToDocx(file) {
        var text = await file.text();
        var paragraphs = text.split('\n');
        
        var docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        docXml += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n';
        docXml += '<w:body>\n';
        
        for (var i = 0; i < paragraphs.length; i++) {
            var para = escapeXml(paragraphs[i]);
            docXml += '<w:p><w:r><w:t>' + para + '</w:t></w:r></w:p>\n';
        }
        
        docXml += '</w:body>\n</w:document>';
        
        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
        contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n';
        contentTypes += '<Default Extension="xml" ContentType="application/xml"/>\n';
        contentTypes += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n';
        contentTypes += '</Types>';
        
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        rels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        rels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n';
        rels += '</Relationships>';
        
        var zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypes);
        zip.folder('_rels').file('.rels', rels);
        zip.folder('word').file('document.xml', docXml);
        
        var blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        return { blob: blob, name: baseName + '.docx' };
    }
    
    // ===== XLSX TO DATA =====
    async function xlsxToData(file, targetFormat) {
        var zip = await JSZip.loadAsync(file);
        
        // Get shared strings
        var sharedStrings = [];
        var ssFile = zip.file('xl/sharedStrings.xml');
        if (ssFile) {
            var ssXml = await ssFile.async('string');
            var parser = new DOMParser();
            var ssDoc = parser.parseFromString(ssXml, 'application/xml');
            var siElements = ssDoc.getElementsByTagName('si');
            for (var i = 0; i < siElements.length; i++) {
                var tElements = siElements[i].getElementsByTagName('t');
                var text = '';
                for (var j = 0; j < tElements.length; j++) {
                    text += tElements[j].textContent;
                }
                sharedStrings.push(text);
            }
        }
        
        // Get sheet data
        var sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
        var parser = new DOMParser();
        var sheetDoc = parser.parseFromString(sheetXml, 'application/xml');
        
        var rows = [];
        var rowElements = sheetDoc.getElementsByTagName('row');
        for (var i = 0; i < rowElements.length; i++) {
            var row = [];
            var cells = rowElements[i].getElementsByTagName('c');
            var maxCol = 0;
            
            for (var j = 0; j < cells.length; j++) {
                var cell = cells[j];
                var ref = cell.getAttribute('r');
                var colIndex = colToIndex(ref.replace(/[0-9]/g, ''));
                var type = cell.getAttribute('t');
                var vElement = cell.getElementsByTagName('v')[0];
                var value = vElement ? vElement.textContent : '';
                
                if (type === 's' && sharedStrings[parseInt(value)]) {
                    value = sharedStrings[parseInt(value)];
                }
                
                while (row.length < colIndex) row.push('');
                row[colIndex] = value;
                maxCol = Math.max(maxCol, colIndex);
            }
            rows.push(row);
        }
        
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        var output, mimeType;
        
        if (targetFormat === 'csv') {
            output = rows.map(function(row) {
                return row.map(function(cell) {
                    if (cell.indexOf(',') >= 0 || cell.indexOf('"') >= 0 || cell.indexOf('\n') >= 0) {
                        return '"' + cell.replace(/"/g, '""') + '"';
                    }
                    return cell;
                }).join(',');
            }).join('\n');
            mimeType = 'text/csv';
        } else if (targetFormat === 'json') {
            if (rows.length > 0) {
                var headers = rows[0];
                var data = [];
                for (var i = 1; i < rows.length; i++) {
                    var obj = {};
                    for (var j = 0; j < headers.length; j++) {
                        obj[headers[j] || 'col' + j] = rows[i][j] || '';
                    }
                    data.push(obj);
                }
                output = JSON.stringify(data, null, 2);
            } else {
                output = '[]';
            }
            mimeType = 'application/json';
        } else if (targetFormat === 'tsv') {
            output = rows.map(function(row) {
                return row.map(function(cell) {
                    return cell.replace(/\t/g, ' ');
                }).join('\t');
            }).join('\n');
            mimeType = 'text/tab-separated-values';
        } else {
            output = rows.map(function(row) { return row.join('\t'); }).join('\n');
            mimeType = 'text/plain';
        }
        
        var blob = new Blob([output], { type: mimeType });
        return { blob: blob, name: baseName + '.' + targetFormat };
    }
    
    function colToIndex(col) {
        var result = 0;
        for (var i = 0; i < col.length; i++) {
            result = result * 26 + (col.charCodeAt(i) - 64);
        }
        return result - 1;
    }
    
    function indexToCol(index) {
        var result = '';
        index++;
        while (index > 0) {
            index--;
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26);
        }
        return result;
    }
    
    // ===== CSV TO XLSX =====
    async function csvToXlsx(file) {
        var text = await file.text();
        var rows = parseCSV(text);
        return createXlsx(rows, file.name.replace(/\.[^/.]+$/, '') + '.xlsx');
    }
    
    // ===== TSV TO XLSX =====
    async function tsvToXlsx(file) {
        var text = await file.text();
        var rows = parseTSV(text);
        return createXlsx(rows, file.name.replace(/\.[^/.]+$/, '') + '.xlsx');
    }
    
    // ===== JSON TO XLSX =====
    async function jsonToXlsx(file) {
        var text = await file.text();
        var json = JSON.parse(text);
        
        var rows = [];
        if (Array.isArray(json) && json.length > 0) {
            var headers = Object.keys(json[0]);
            rows.push(headers);
            for (var i = 0; i < json.length; i++) {
                var row = [];
                for (var j = 0; j < headers.length; j++) {
                    row.push(String(json[i][headers[j]] || ''));
                }
                rows.push(row);
            }
        }
        
        return createXlsx(rows, file.name.replace(/\.[^/.]+$/, '') + '.xlsx');
    }
    
    // ===== CREATE XLSX =====
    async function createXlsx(rows, filename) {
        // Build shared strings
        var sharedStrings = [];
        var ssMap = {};
        
        for (var i = 0; i < rows.length; i++) {
            for (var j = 0; j < rows[i].length; j++) {
                var val = rows[i][j];
                if (val && isNaN(val) && ssMap[val] === undefined) {
                    ssMap[val] = sharedStrings.length;
                    sharedStrings.push(val);
                }
            }
        }
        
        // Shared strings XML
        var ssXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        ssXml += '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + sharedStrings.length + '" uniqueCount="' + sharedStrings.length + '">\n';
        for (var i = 0; i < sharedStrings.length; i++) {
            ssXml += '<si><t>' + escapeXml(sharedStrings[i]) + '</t></si>\n';
        }
        ssXml += '</sst>';
        
        // Sheet XML
        var sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        sheetXml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';
        sheetXml += '<sheetData>\n';
        
        for (var i = 0; i < rows.length; i++) {
            sheetXml += '<row r="' + (i + 1) + '">\n';
            for (var j = 0; j < rows[i].length; j++) {
                var val = rows[i][j];
                var ref = indexToCol(j) + (i + 1);
                
                if (val === '' || val === null || val === undefined) {
                    // Empty cell
                } else if (!isNaN(val) && val !== '') {
                    sheetXml += '<c r="' + ref + '"><v>' + val + '</v></c>\n';
                } else {
                    sheetXml += '<c r="' + ref + '" t="s"><v>' + ssMap[val] + '</v></c>\n';
                }
            }
            sheetXml += '</row>\n';
        }
        
        sheetXml += '</sheetData>\n</worksheet>';
        
        // Workbook XML
        var workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        workbookXml += '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n';
        workbookXml += '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>\n';
        workbookXml += '</workbook>';
        
        // Content Types
        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
        contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n';
        contentTypes += '<Default Extension="xml" ContentType="application/xml"/>\n';
        contentTypes += '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n';
        contentTypes += '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n';
        contentTypes += '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>\n';
        contentTypes += '</Types>';
        
        // Rels
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        rels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        rels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n';
        rels += '</Relationships>';
        
        var workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        workbookRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        workbookRels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n';
        workbookRels += '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>\n';
        workbookRels += '</Relationships>';
        
        var zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypes);
        zip.folder('_rels').file('.rels', rels);
        zip.folder('xl').file('workbook.xml', workbookXml);
        zip.folder('xl').file('sharedStrings.xml', ssXml);
        zip.folder('xl/_rels').file('workbook.xml.rels', workbookRels);
        zip.folder('xl/worksheets').file('sheet1.xml', sheetXml);
        
        var blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        return { blob: blob, name: filename };
    }
    
    // ===== PPTX TO TEXT =====
    async function pptxToText(file, targetFormat) {
        var zip = await JSZip.loadAsync(file);
        var text = '';
        
        var slideNum = 1;
        while (true) {
            var slideFile = zip.file('ppt/slides/slide' + slideNum + '.xml');
            if (!slideFile) break;
            
            var slideXml = await slideFile.async('string');
            var parser = new DOMParser();
            var slideDoc = parser.parseFromString(slideXml, 'application/xml');
            
            if (targetFormat === 'md') {
                text += '## Slide ' + slideNum + '\n\n';
            } else if (targetFormat === 'html') {
                text += '<h2>Slide ' + slideNum + '</h2>\n';
            } else {
                text += '--- Slide ' + slideNum + ' ---\n\n';
            }
            
            var textElements = slideDoc.getElementsByTagName('a:t');
            for (var i = 0; i < textElements.length; i++) {
                if (targetFormat === 'html') {
                    text += '<p>' + textElements[i].textContent + '</p>\n';
                } else {
                    text += textElements[i].textContent + '\n';
                }
            }
            text += '\n';
            slideNum++;
        }
        
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        var mimeType, output;
        
        if (targetFormat === 'html') {
            output = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title>';
            output += '<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:20px}h2{color:#333;border-bottom:2px solid #ddd;padding-bottom:10px;margin-top:30px}</style>';
            output += '</head><body><h1>' + baseName + '</h1>' + text + '</body></html>';
            mimeType = 'text/html';
        } else {
            output = text.trim();
            mimeType = targetFormat === 'md' ? 'text/markdown' : 'text/plain';
        }
        
        var blob = new Blob([output], { type: mimeType });
        return { blob: blob, name: baseName + '.' + targetFormat, text: output };
    }
    
    // ===== PPTX TO DOCX =====
    async function pptxToDocx(file) {
        var textResult = await pptxToText(file, 'txt');
        var text = textResult.text;
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        
        var zip = new JSZip();
        
        var docContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        docContent += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n';
        docContent += '<w:body>\n';
        
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.indexOf('--- Slide') === 0) {
                docContent += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>' + escapeXml(line) + '</w:t></w:r></w:p>\n';
            } else if (line) {
                docContent += '<w:p><w:r><w:t>' + escapeXml(line) + '</w:t></w:r></w:p>\n';
            }
        }
        
        docContent += '</w:body>\n</w:document>';
        
        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
        contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n';
        contentTypes += '<Default Extension="xml" ContentType="application/xml"/>\n';
        contentTypes += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n';
        contentTypes += '</Types>';
        
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        rels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        rels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n';
        rels += '</Relationships>';
        
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', rels);
        zip.file('word/document.xml', docContent);
        
        var blob = await zip.generateAsync({ 
            type: 'blob', 
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        return { blob: blob, name: baseName + '.docx' };
    }
    
    // ===== PPTX TO IMAGE =====
    async function pptxToImage(file, targetFormat) {
        var textResult = await pptxToText(file, 'txt');
        var text = textResult.text;
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        
        // Create image from text
        var canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        var ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Text
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial, sans-serif';
        
        var lines = text.split('\n');
        var y = 40;
        for (var i = 0; i < lines.length && y < canvas.height - 20; i++) {
            var line = lines[i];
            if (line.indexOf('--- Slide') === 0) {
                ctx.font = 'bold 20px Arial, sans-serif';
                ctx.fillStyle = '#000000';
                y += 30;
            } else {
                ctx.font = '16px Arial, sans-serif';
                ctx.fillStyle = '#333333';
            }
            ctx.fillText(line.substring(0, 80), 30, y);
            y += 24;
        }
        
        var mimeType = targetFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        
        return new Promise(function(resolve) {
            canvas.toBlob(function(blob) {
                resolve({ blob: blob, name: baseName + '.' + targetFormat });
            }, mimeType, 0.92);
        });
    }
    
    // ===== DOCX TO PPTX =====
    async function docxToPptx(file) {
        var textResult = await docxToText(file, 'txt');
        var text = textResult.text;
        return createPptxFromText(text, file.name.replace('.docx', '.pptx'));
    }
    
    // ===== TXT TO PPTX =====
    async function textToPptx(file) {
        var text = await file.text();
        return createPptxFromText(text, file.name.replace('.txt', '.pptx'));
    }
    
    // ===== MD TO DOCX =====
    async function mdToDocx(file) {
        var text = await file.text();
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        
        var zip = new JSZip();
        
        var docContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        docContent += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n';
        docContent += '<w:body>\n';
        
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.startsWith('### ')) {
                docContent += '<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>' + escapeXml(line.substring(4)) + '</w:t></w:r></w:p>\n';
            } else if (line.startsWith('## ')) {
                docContent += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>' + escapeXml(line.substring(3)) + '</w:t></w:r></w:p>\n';
            } else if (line.startsWith('# ')) {
                docContent += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>' + escapeXml(line.substring(2)) + '</w:t></w:r></w:p>\n';
            } else if (line.trim()) {
                docContent += '<w:p><w:r><w:t>' + escapeXml(line) + '</w:t></w:r></w:p>\n';
            }
        }
        
        docContent += '</w:body>\n</w:document>';
        
        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
        contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n';
        contentTypes += '<Default Extension="xml" ContentType="application/xml"/>\n';
        contentTypes += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n';
        contentTypes += '</Types>';
        
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        rels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        rels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n';
        rels += '</Relationships>';
        
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', rels);
        zip.file('word/document.xml', docContent);
        
        var blob = await zip.generateAsync({ 
            type: 'blob', 
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        return { blob: blob, name: baseName + '.docx' };
    }
    
    // ===== MD TO PPTX =====
    async function mdToPptx(file) {
        var text = await file.text();
        return createPptxFromText(text, file.name.replace('.md', '.pptx'));
    }
    
    // ===== HTML TO DOCX =====
    async function htmlToDocx(file) {
        var html = await file.text();
        var text = htmlToPlainText(html);
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        
        var zip = new JSZip();
        
        var docContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        docContent += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n';
        docContent += '<w:body>\n';
        
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim()) {
                docContent += '<w:p><w:r><w:t>' + escapeXml(lines[i]) + '</w:t></w:r></w:p>\n';
            }
        }
        
        docContent += '</w:body>\n</w:document>';
        
        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
        contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n';
        contentTypes += '<Default Extension="xml" ContentType="application/xml"/>\n';
        contentTypes += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n';
        contentTypes += '</Types>';
        
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        rels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        rels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n';
        rels += '</Relationships>';
        
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', rels);
        zip.file('word/document.xml', docContent);
        
        var blob = await zip.generateAsync({ 
            type: 'blob', 
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        return { blob: blob, name: baseName + '.docx' };
    }
    
    // ===== HTML TO PPTX =====
    async function htmlToPptx(file) {
        var html = await file.text();
        var text = htmlToPlainText(html);
        return createPptxFromText(text, file.name.replace('.html', '.pptx'));
    }
    
    // ===== PDF TO PPTX =====
    async function pdfToPptx(file) {
        var textResult = await pdfToText(file, 'txt');
        var text = await textResult.blob.text();
        return createPptxFromText(text, file.name.replace('.pdf', '.pptx'));
    }
    
    // ===== XLSX TO HTML =====
    async function xlsxToHtml(file) {
        var dataResult = await xlsxToData(file, 'csv');
        var csv = await dataResult.blob.text();
        var rows = parseCSV(csv);
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        
        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title>';
        html += '<style>body{font-family:system-ui,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f4}tr:hover{background:#f9f9f9}</style>';
        html += '</head><body><h1>' + baseName + '</h1><table>';
        
        for (var i = 0; i < rows.length; i++) {
            html += '<tr>';
            var tag = i === 0 ? 'th' : 'td';
            for (var j = 0; j < rows[i].length; j++) {
                html += '<' + tag + '>' + escapeXml(rows[i][j] || '') + '</' + tag + '>';
            }
            html += '</tr>';
        }
        
        html += '</table></body></html>';
        
        var blob = new Blob([html], { type: 'text/html' });
        return { blob: blob, name: baseName + '.html' };
    }
    
    // ===== DATA TO HTML =====
    async function dataToHtml(file) {
        var text = await file.text();
        var sourceExt = file.name.split('.').pop().toLowerCase();
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        var rows = [];
        
        if (sourceExt === 'csv') {
            rows = parseCSV(text);
        } else if (sourceExt === 'tsv') {
            rows = parseTSV(text);
        } else if (sourceExt === 'json') {
            var json = JSON.parse(text);
            if (Array.isArray(json) && json.length > 0) {
                var headers = Object.keys(json[0]);
                rows.push(headers);
                for (var i = 0; i < json.length; i++) {
                    rows.push(headers.map(function(h) { return String(json[i][h] || ''); }));
                }
            }
        } else if (sourceExt === 'xml') {
            var parser = new DOMParser();
            var xml = parser.parseFromString(text, 'application/xml');
            var json = xmlToJson(xml);
            // Simple display
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title>';
            html += '<style>body{font-family:system-ui,sans-serif;padding:20px}pre{background:#f4f4f4;padding:15px;border-radius:5px;overflow-x:auto}</style>';
            html += '</head><body><h1>' + baseName + '</h1><pre>' + escapeXml(JSON.stringify(json, null, 2)) + '</pre></body></html>';
            var blob = new Blob([html], { type: 'text/html' });
            return { blob: blob, name: baseName + '.html' };
        } else if (sourceExt === 'yaml') {
            var json = parseYaml(text);
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title>';
            html += '<style>body{font-family:system-ui,sans-serif;padding:20px}pre{background:#f4f4f4;padding:15px;border-radius:5px;overflow-x:auto}</style>';
            html += '</head><body><h1>' + baseName + '</h1><pre>' + escapeXml(JSON.stringify(json, null, 2)) + '</pre></body></html>';
            var blob = new Blob([html], { type: 'text/html' });
            return { blob: blob, name: baseName + '.html' };
        }
        
        if (rows.length > 0) {
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title>';
            html += '<style>body{font-family:system-ui,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f4}</style>';
            html += '</head><body><h1>' + baseName + '</h1><table>';
            
            for (var i = 0; i < rows.length; i++) {
                html += '<tr>';
                var tag = i === 0 ? 'th' : 'td';
                for (var j = 0; j < rows[i].length; j++) {
                    html += '<' + tag + '>' + escapeXml(rows[i][j] || '') + '</' + tag + '>';
                }
                html += '</tr>';
            }
            
            html += '</table></body></html>';
            var blob = new Blob([html], { type: 'text/html' });
            return { blob: blob, name: baseName + '.html' };
        }
        
        return null;
    }
    
    // ===== CREATE PPTX FROM TEXT =====
    async function createPptxFromText(text, filename) {
        var zip = new JSZip();
        
        // Split text into slides (by paragraphs or sections)
        var slides = [];
        var lines = text.split('\n');
        var currentSlide = [];
        var lineCount = 0;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.indexOf('---') === 0 || line.startsWith('# ') || line.startsWith('## ')) {
                if (currentSlide.length > 0) {
                    slides.push(currentSlide.join('\n'));
                    currentSlide = [];
                    lineCount = 0;
                }
            }
            if (line) {
                currentSlide.push(line);
                lineCount++;
            }
            // New slide every ~10 lines
            if (lineCount >= 10) {
                slides.push(currentSlide.join('\n'));
                currentSlide = [];
                lineCount = 0;
            }
        }
        if (currentSlide.length > 0) {
            slides.push(currentSlide.join('\n'));
        }
        if (slides.length === 0) {
            slides.push(text.substring(0, 500));
        }
        
        // Content Types
        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
        contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n';
        contentTypes += '<Default Extension="xml" ContentType="application/xml"/>\n';
        contentTypes += '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>\n';
        for (var i = 0; i < slides.length; i++) {
            contentTypes += '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n';
        }
        contentTypes += '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>\n';
        contentTypes += '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>\n';
        contentTypes += '</Types>';
        
        // Root rels
        var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        rootRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        rootRels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>\n';
        rootRels += '</Relationships>';
        
        // Presentation
        var presentation = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        presentation += '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n';
        presentation += '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>\n';
        presentation += '<p:sldIdLst>\n';
        for (var i = 0; i < slides.length; i++) {
            presentation += '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 2) + '"/>\n';
        }
        presentation += '</p:sldIdLst>\n';
        presentation += '<p:sldSz cx="9144000" cy="6858000"/>\n';
        presentation += '</p:presentation>';
        
        // Presentation rels
        var presRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        presRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        presRels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>\n';
        for (var i = 0; i < slides.length; i++) {
            presRels += '<Relationship Id="rId' + (i + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (i + 1) + '.xml"/>\n';
        }
        presRels += '</Relationships>';
        
        // Slide Master
        var slideMaster = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        slideMaster += '<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n';
        slideMaster += '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>\n';
        slideMaster += '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>\n';
        slideMaster += '</p:sldMaster>';
        
        var slideMasterRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        slideMasterRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        slideMasterRels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>\n';
        slideMasterRels += '</Relationships>';
        
        // Slide Layout
        var slideLayout = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        slideLayout += '<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" type="blank">\n';
        slideLayout += '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>\n';
        slideLayout += '</p:sldLayout>';
        
        var slideLayoutRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        slideLayoutRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        slideLayoutRels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>\n';
        slideLayoutRels += '</Relationships>';
        
        // Create slides
        for (var i = 0; i < slides.length; i++) {
            var slideContent = slides[i];
            var slideXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
            slideXml += '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n';
            slideXml += '<p:cSld><p:spTree>\n';
            slideXml += '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>\n';
            slideXml += '<p:grpSpPr/>\n';
            slideXml += '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Text"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>\n';
            slideXml += '<p:spPr><a:xfrm><a:off x="500000" y="500000"/><a:ext cx="8000000" cy="5500000"/></a:xfrm></p:spPr>\n';
            slideXml += '<p:txBody><a:bodyPr/><a:lstStyle/>\n';
            
            var slideLines = slideContent.split('\n');
            for (var j = 0; j < slideLines.length; j++) {
                slideXml += '<a:p><a:r><a:rPr lang="pt-BR" sz="1800"/><a:t>' + escapeXml(slideLines[j]) + '</a:t></a:r></a:p>\n';
            }
            
            slideXml += '</p:txBody></p:sp>\n';
            slideXml += '</p:spTree></p:cSld>\n';
            slideXml += '</p:sld>';
            
            var slideRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
            slideRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
            slideRels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>\n';
            slideRels += '</Relationships>';
            
            zip.file('ppt/slides/slide' + (i + 1) + '.xml', slideXml);
            zip.file('ppt/slides/_rels/slide' + (i + 1) + '.xml.rels', slideRels);
        }
        
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', rootRels);
        zip.file('ppt/presentation.xml', presentation);
        zip.file('ppt/_rels/presentation.xml.rels', presRels);
        zip.file('ppt/slideMasters/slideMaster1.xml', slideMaster);
        zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', slideMasterRels);
        zip.file('ppt/slideLayouts/slideLayout1.xml', slideLayout);
        zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', slideLayoutRels);
        
        var blob = await zip.generateAsync({ 
            type: 'blob', 
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
        });
        
        return { blob: blob, name: filename };
    }

    // ===== MD TO HTML =====
    async function mdToHtml(file) {
        var text = await file.text();
        var html = markdownToHtml(text);
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        
        var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title>';
        fullHtml += '<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}h1,h2,h3{margin-top:1.5em}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}pre{background:#f4f4f4;padding:15px;border-radius:5px;overflow-x:auto}</style>';
        fullHtml += '</head><body>' + html + '</body></html>';
        
        var blob = new Blob([fullHtml], { type: 'text/html' });
        return { blob: blob, name: baseName + '.html' };
    }
    
    // ===== HTML TO TEXT =====
    async function htmlToText(file, targetFormat) {
        var text = await file.text();
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        var output, mimeType;
        
        if (targetFormat === 'txt') {
            output = htmlToPlainText(text);
            mimeType = 'text/plain';
        } else if (targetFormat === 'md') {
            output = htmlToMarkdown(text);
            mimeType = 'text/markdown';
        }
        
        var blob = new Blob([output], { type: mimeType });
        return { blob: blob, name: baseName + '.' + targetFormat };
    }
    
    // ===== CONVERT TEXT DATA =====
    async function convertTextData(file, targetFormat) {
        var text = await file.text();
        var sourceExt = file.name.split('.').pop().toLowerCase();
        var baseName = file.name.replace(/\.[^/.]+$/, '');
        var output, mimeType;
        
        if (sourceExt === 'json' && targetFormat === 'csv') {
            var json = JSON.parse(text);
            if (Array.isArray(json) && json.length > 0) {
                var headers = Object.keys(json[0]);
                var rows = [headers.join(',')];
                for (var i = 0; i < json.length; i++) {
                    var row = headers.map(function(h) {
                        var val = String(json[i][h] || '');
                        if (val.indexOf(',') >= 0 || val.indexOf('"') >= 0) {
                            return '"' + val.replace(/"/g, '""') + '"';
                        }
                        return val;
                    });
                    rows.push(row.join(','));
                }
                output = rows.join('\n');
            }
            mimeType = 'text/csv';
        } else if (sourceExt === 'csv' && targetFormat === 'json') {
            var rows = parseCSV(text);
            if (rows.length > 0) {
                var headers = rows[0];
                var data = [];
                for (var i = 1; i < rows.length; i++) {
                    var obj = {};
                    for (var j = 0; j < headers.length; j++) {
                        obj[headers[j] || 'col' + j] = rows[i][j] || '';
                    }
                    data.push(obj);
                }
                output = JSON.stringify(data, null, 2);
            }
            mimeType = 'application/json';
        } else if (sourceExt === 'json' && targetFormat === 'xml') {
            var json = JSON.parse(text);
            output = jsonToXml(json);
            mimeType = 'application/xml';
        } else if (sourceExt === 'xml' && targetFormat === 'json') {
            var parser = new DOMParser();
            var xml = parser.parseFromString(text, 'application/xml');
            output = JSON.stringify(xmlToJson(xml), null, 2);
            mimeType = 'application/json';
        } else if (sourceExt === 'json' && targetFormat === 'yaml') {
            var json = JSON.parse(text);
            output = jsonToYaml(json, 0);
            mimeType = 'text/yaml';
        } else if (sourceExt === 'json' && targetFormat === 'tsv') {
            var json = JSON.parse(text);
            if (Array.isArray(json) && json.length > 0) {
                var headers = Object.keys(json[0]);
                var rows = [headers.join('\t')];
                for (var i = 0; i < json.length; i++) {
                    var row = headers.map(function(h) {
                        return String(json[i][h] || '').replace(/\t/g, ' ');
                    });
                    rows.push(row.join('\t'));
                }
                output = rows.join('\n');
            }
            mimeType = 'text/tab-separated-values';
        } else if (sourceExt === 'csv' && targetFormat === 'tsv') {
            var rows = parseCSV(text);
            output = rows.map(function(row) {
                return row.map(function(cell) {
                    return cell.replace(/\t/g, ' ');
                }).join('\t');
            }).join('\n');
            mimeType = 'text/tab-separated-values';
        } else if (sourceExt === 'tsv' && targetFormat === 'csv') {
            var rows = parseTSV(text);
            output = rows.map(function(row) {
                return row.map(function(cell) {
                    if (cell.indexOf(',') >= 0 || cell.indexOf('"') >= 0) {
                        return '"' + cell.replace(/"/g, '""') + '"';
                    }
                    return cell;
                }).join(',');
            }).join('\n');
            mimeType = 'text/csv';
        } else if (sourceExt === 'tsv' && targetFormat === 'json') {
            var rows = parseTSV(text);
            if (rows.length > 0) {
                var headers = rows[0];
                var data = [];
                for (var i = 1; i < rows.length; i++) {
                    var obj = {};
                    for (var j = 0; j < headers.length; j++) {
                        obj[headers[j] || 'col' + j] = rows[i][j] || '';
                    }
                    data.push(obj);
                }
                output = JSON.stringify(data, null, 2);
            }
            mimeType = 'application/json';
        } else if (sourceExt === 'yaml' && targetFormat === 'json') {
            var json = parseYaml(text);
            output = JSON.stringify(json, null, 2);
            mimeType = 'application/json';
        } else if (sourceExt === 'yaml' && targetFormat === 'csv') {
            var json = parseYaml(text);
            if (Array.isArray(json) && json.length > 0) {
                var headers = Object.keys(json[0]);
                var rows = [headers.join(',')];
                for (var i = 0; i < json.length; i++) {
                    var row = headers.map(function(h) {
                        var val = String(json[i][h] || '');
                        if (val.indexOf(',') >= 0 || val.indexOf('"') >= 0) {
                            return '"' + val.replace(/"/g, '""') + '"';
                        }
                        return val;
                    });
                    rows.push(row.join(','));
                }
                output = rows.join('\n');
            } else {
                output = JSON.stringify(json);
            }
            mimeType = 'text/csv';
        } else if (sourceExt === 'yaml' && targetFormat === 'xml') {
            var json = parseYaml(text);
            output = jsonToXml(json);
            mimeType = 'application/xml';
        } else if (sourceExt === 'xml' && targetFormat === 'csv') {
            var parser = new DOMParser();
            var xml = parser.parseFromString(text, 'application/xml');
            var json = xmlToJson(xml);
            if (json && json.root && Array.isArray(json.root)) {
                var arr = json.root;
                var headers = Object.keys(arr[0] || {});
                var rows = [headers.join(',')];
                for (var i = 0; i < arr.length; i++) {
                    var row = headers.map(function(h) {
                        var val = String(arr[i][h] || '');
                        if (val.indexOf(',') >= 0 || val.indexOf('"') >= 0) {
                            return '"' + val.replace(/"/g, '""') + '"';
                        }
                        return val;
                    });
                    rows.push(row.join(','));
                }
                output = rows.join('\n');
            } else {
                output = JSON.stringify(json);
            }
            mimeType = 'text/csv';
        } else {
            output = text;
            mimeType = 'text/plain';
        }
        
        var blob = new Blob([output], { type: mimeType });
        return { blob: blob, name: baseName + '.' + targetFormat };
    }
    
    // ===== HELPERS =====
    
    function parseCSV(text) {
        var lines = text.split('\n');
        var result = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim()) {
                result.push(parseCSVLine(lines[i]));
            }
        }
        return result;
    }
    
    function parseCSVLine(line) {
        var result = [], current = '', inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
            else current += char;
        }
        result.push(current.trim());
        return result;
    }
    
    function parseTSV(text) {
        var lines = text.split('\n');
        var result = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim()) {
                result.push(lines[i].split('\t'));
            }
        }
        return result;
    }
    
    function parseYaml(text) {
        // Simple YAML parser for basic structures
        var lines = text.split('\n');
        var result = {};
        var currentArray = null;
        var arrayKey = null;
        var indent = 0;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            
            if (!trimmed || trimmed.startsWith('#')) continue;
            
            // Check for array item
            if (trimmed.startsWith('- ')) {
                var value = trimmed.substring(2).trim();
                if (arrayKey && Array.isArray(result[arrayKey])) {
                    // Check if it's an object in array
                    if (value.indexOf(':') > 0) {
                        var parts = value.split(':');
                        var obj = {};
                        obj[parts[0].trim()] = parseYamlValue(parts.slice(1).join(':').trim());
                        result[arrayKey].push(obj);
                    } else {
                        result[arrayKey].push(parseYamlValue(value));
                    }
                } else if (!arrayKey) {
                    if (!Array.isArray(result)) result = [];
                    result.push(parseYamlValue(value));
                }
                continue;
            }
            
            // Key: value pair
            var colonIdx = trimmed.indexOf(':');
            if (colonIdx > 0) {
                var key = trimmed.substring(0, colonIdx).trim();
                var val = trimmed.substring(colonIdx + 1).trim();
                
                if (val === '' || val === '|' || val === '>') {
                    // Could be array or multiline
                    result[key] = [];
                    arrayKey = key;
                } else {
                    result[key] = parseYamlValue(val);
                    arrayKey = null;
                }
            }
        }
        
        return result;
    }
    
    function parseYamlValue(val) {
        if (val === 'true') return true;
        if (val === 'false') return false;
        if (val === 'null' || val === '~') return null;
        if (/^-?\d+$/.test(val)) return parseInt(val, 10);
        if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
        // Remove quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            return val.slice(1, -1);
        }
        return val;
    }
    
    function markdownToHtml(md) {
        var html = md;
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
        html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        return '<p>' + html + '</p>';
    }
    
    function htmlToPlainText(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    
    function htmlToMarkdown(html) {
        var result = html;
        result = result.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
        result = result.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
        result = result.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
        result = result.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        result = result.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        result = result.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        result = result.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
        result = result.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
        result = result.replace(/<br\s*\/?>/gi, '\n');
        result = result.replace(/<p[^>]*>/gi, '\n');
        result = result.replace(/<\/p>/gi, '\n');
        result = result.replace(/<[^>]+>/g, '');
        return result.trim();
    }
    
    function jsonToXml(obj) {
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>';
        xml += convertObjToXml(obj, '  ');
        xml += '\n</root>';
        return xml;
    }
    
    function convertObjToXml(data, indent) {
        var result = '';
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                result += '\n' + indent + '<item>';
                result += convertObjToXml(data[i], indent + '  ');
                result += '\n' + indent + '</item>';
            }
        } else if (typeof data === 'object' && data !== null) {
            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var val = data[key];
                var safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                result += '\n' + indent + '<' + safeKey + '>';
                if (typeof val === 'object') {
                    result += convertObjToXml(val, indent + '  ');
                    result += '\n' + indent;
                } else {
                    result += escapeXml(String(val));
                }
                result += '</' + safeKey + '>';
            }
        } else {
            result += escapeXml(String(data));
        }
        return result;
    }
    
    function xmlToJson(xml) {
        var obj = {};
        if (xml.nodeType === 1 && xml.attributes.length > 0) {
            obj['@attributes'] = {};
            for (var i = 0; i < xml.attributes.length; i++) {
                var attr = xml.attributes.item(i);
                obj['@attributes'][attr.nodeName] = attr.nodeValue;
            }
        } else if (xml.nodeType === 3) {
            return xml.nodeValue.trim();
        }
        
        if (xml.hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (nodeName === '#text') {
                    var text = item.nodeValue.trim();
                    if (text) return text;
                    continue;
                }
                if (typeof obj[nodeName] === 'undefined') {
                    obj[nodeName] = xmlToJson(item);
                } else {
                    if (!Array.isArray(obj[nodeName])) obj[nodeName] = [obj[nodeName]];
                    obj[nodeName].push(xmlToJson(item));
                }
            }
        }
        return obj;
    }
    
    function jsonToYaml(obj, indent) {
        var yaml = '';
        var spaces = '  '.repeat(indent);
        
        if (Array.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                var item = obj[i];
                if (typeof item === 'object') {
                    yaml += spaces + '-\n' + jsonToYaml(item, indent + 1);
                } else {
                    yaml += spaces + '- ' + formatYamlValue(item) + '\n';
                }
            }
        } else if (typeof obj === 'object' && obj !== null) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var val = obj[key];
                if (typeof val === 'object') {
                    yaml += spaces + key + ':\n' + jsonToYaml(val, indent + 1);
                } else {
                    yaml += spaces + key + ': ' + formatYamlValue(val) + '\n';
                }
            }
        }
        return yaml;
    }
    
    function formatYamlValue(val) {
        if (typeof val === 'string') {
            if (val.indexOf(':') >= 0 || val.indexOf('#') >= 0 || val.indexOf("'") >= 0) {
                return '"' + val.replace(/"/g, '\\"') + '"';
            }
            return val;
        }
        return String(val);
    }
    
    function escapeXml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    function getMimeType(filename) {
        var ext = filename.split('.').pop().toLowerCase();
        var mimeTypes = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'html': 'text/html',
            'htm': 'text/html',
            'json': 'application/json',
            'xml': 'application/xml',
            'csv': 'text/csv',
            'tsv': 'text/tab-separated-values',
            'md': 'text/markdown',
            'yaml': 'text/yaml',
            'yml': 'text/yaml',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp',
            'ico': 'image/x-icon',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
    
    async function saveToDevice(blob, filename) {
        return new Promise(function(resolve, reject) {
            if (!window.cordova || !window.resolveLocalFileSystemURL) {
                // Fallback para browser - download normal
                downloadFile(blob, filename);
                showSuccessModal(filename, 'Download/' + filename);
                resolve();
                return;
            }
            
            // Salvar na pasta Download do Android
            var storageDir = cordova.file.externalRootDirectory + 'Download/';
            
            window.resolveLocalFileSystemURL(storageDir, function(dirEntry) {
                dirEntry.getFile(filename, { create: true, exclusive: false }, function(fileEntry) {
                    fileEntry.createWriter(function(fileWriter) {
                        fileWriter.onwriteend = function() {
                            lastSavedPath = fileEntry.nativeURL;
                            lastSavedMimeType = getMimeType(filename);
                            showSuccessModal(filename, 'Download/' + filename);
                            resolve();
                        };
                        fileWriter.onerror = function(e) {
                            console.error('Write error:', e);
                            // Fallback
                            downloadFile(blob, filename);
                            showSuccessModal(filename, filename);
                            resolve();
                        };
                        fileWriter.write(blob);
                    }, function(e) {
                        console.error('CreateWriter error:', e);
                        downloadFile(blob, filename);
                        showSuccessModal(filename, filename);
                        resolve();
                    });
                }, function(e) {
                    console.error('GetFile error:', e);
                    downloadFile(blob, filename);
                    showSuccessModal(filename, filename);
                    resolve();
                });
            }, function(e) {
                console.error('ResolveURL error:', e);
                // Tentar pasta de dados do app
                tryAppDataDir(blob, filename, resolve);
            });
        });
    }
    
    function tryAppDataDir(blob, filename, resolve) {
        var appDir = cordova.file.dataDirectory;
        window.resolveLocalFileSystemURL(appDir, function(dirEntry) {
            dirEntry.getFile(filename, { create: true, exclusive: false }, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function() {
                        lastSavedPath = fileEntry.nativeURL;
                        lastSavedMimeType = getMimeType(filename);
                        showSuccessModal(filename, filename);
                        resolve();
                    };
                    fileWriter.onerror = function() {
                        downloadFile(blob, filename);
                        showSuccessModal(filename, filename);
                        resolve();
                    };
                    fileWriter.write(blob);
                });
            });
        }, function() {
            downloadFile(blob, filename);
            showSuccessModal(filename, filename);
            resolve();
        });
    }
    
    function downloadFile(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        lastSavedPath = url;
        lastSavedMimeType = getMimeType(filename);
    }
    
    function showSuccessModal(filename, path) {
        var savedPath = $('converterSavedPath');
        if (savedPath) savedPath.textContent = path;
        var successModal = $('converterSuccessModal');
        if (successModal) successModal.classList.add('show');
    }
    
    function openSavedFile() {
        if (!lastSavedPath) {
            toast('Nenhum arquivo salvo');
            return;
        }
        
        if (window.cordova && cordova.plugins && cordova.plugins.fileOpener2) {
            cordova.plugins.fileOpener2.open(
                lastSavedPath,
                lastSavedMimeType,
                {
                    error: function(e) {
                        console.error('FileOpener error:', e);
                        toast('Não foi possível abrir. Verifique na pasta Download.');
                    },
                    success: function() {
                        console.log('File opened');
                    }
                }
            );
        } else {
            // Fallback - tentar abrir URL
            toast('Arquivo salvo na pasta Download');
        }
        
        var successModal = $('converterSuccessModal');
        if (successModal) successModal.classList.remove('show');
    }
    
    function showLoading(text) {
        var loadingText = $('converterLoadingText');
        if (loadingText) loadingText.textContent = text || 'Convertendo...';
        var loading = $('converterLoading');
        if (loading) loading.classList.add('show');
    }
    
    function hideLoading() {
        var loading = $('converterLoading');
        if (loading) loading.classList.remove('show');
    }
    
    function toast(msg) {
        var el = $('converterToast');
        if (el) {
            el.textContent = msg;
            el.classList.add('show');
            setTimeout(function() { el.classList.remove('show'); }, 3000);
        }
    }
    
    // ===== PDF CONVERSION FUNCTIONS =====
    
    // Configure PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    async function pdfToText(file, targetFormat) {
        var arrayBuffer = await file.arrayBuffer();
        var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        var textContent = [];
        
        for (var i = 1; i <= pdf.numPages; i++) {
            var page = await pdf.getPage(i);
            var content = await page.getTextContent();
            var pageText = content.items.map(function(item) {
                return item.str;
            }).join(' ');
            textContent.push(pageText);
        }
        
        var fullText = textContent.join('\n\n--- Página ' + (textContent.length > 1 ? 'seguinte' : '') + ' ---\n\n');
        var baseName = file.name.replace('.pdf', '');
        var outputName, blob;
        
        if (targetFormat === 'html') {
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + baseName + '</title></head><body>';
            html += '<h1>' + baseName + '</h1>';
            textContent.forEach(function(pageText, idx) {
                html += '<div class="page"><h2>Página ' + (idx + 1) + '</h2><p>' + pageText.replace(/\n/g, '<br>') + '</p></div>';
            });
            html += '</body></html>';
            blob = new Blob([html], { type: 'text/html' });
            outputName = baseName + '.html';
        } else if (targetFormat === 'md') {
            var md = '# ' + baseName + '\n\n';
            textContent.forEach(function(pageText, idx) {
                md += '## Página ' + (idx + 1) + '\n\n' + pageText + '\n\n';
            });
            blob = new Blob([md], { type: 'text/markdown' });
            outputName = baseName + '.md';
        } else {
            blob = new Blob([fullText], { type: 'text/plain' });
            outputName = baseName + '.txt';
        }
        
        return { blob: blob, name: outputName };
    }
    
    async function pdfToDocx(file) {
        var arrayBuffer = await file.arrayBuffer();
        var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        var textContent = [];
        
        for (var i = 1; i <= pdf.numPages; i++) {
            var page = await pdf.getPage(i);
            var content = await page.getTextContent();
            var pageText = content.items.map(function(item) {
                return item.str;
            }).join(' ');
            textContent.push(pageText);
        }
        
        // Create DOCX with extracted text
        var zip = new JSZip();
        
        var docContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        docContent += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n';
        docContent += '<w:body>\n';
        
        textContent.forEach(function(pageText, idx) {
            // Page header
            docContent += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Página ' + (idx + 1) + '</w:t></w:r></w:p>\n';
            // Page content - split into paragraphs
            var paragraphs = pageText.split(/\n+/);
            paragraphs.forEach(function(para) {
                if (para.trim()) {
                    docContent += '<w:p><w:r><w:t>' + escapeXml(para.trim()) + '</w:t></w:r></w:p>\n';
                }
            });
            // Page break
            if (idx < textContent.length - 1) {
                docContent += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n';
            }
        });
        
        docContent += '</w:body>\n</w:document>';
        
        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        contentTypes += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n';
        contentTypes += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n';
        contentTypes += '<Default Extension="xml" ContentType="application/xml"/>\n';
        contentTypes += '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n';
        contentTypes += '</Types>';
        
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        rels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';
        rels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n';
        rels += '</Relationships>';
        
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', rels);
        zip.file('word/document.xml', docContent);
        
        var blob = await zip.generateAsync({ 
            type: 'blob', 
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        return { blob: blob, name: file.name.replace('.pdf', '.docx') };
    }
    
    async function pdfToImage(file, targetFormat) {
        var arrayBuffer = await file.arrayBuffer();
        var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Render first page as image
        var page = await pdf.getPage(1);
        var scale = 2; // Higher scale for better quality
        var viewport = page.getViewport({ scale: scale });
        
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        var mimeType = targetFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        var quality = targetFormat === 'jpg' ? 0.92 : undefined;
        
        return new Promise(function(resolve) {
            canvas.toBlob(function(blob) {
                resolve({
                    blob: blob,
                    name: file.name.replace('.pdf', '.' + targetFormat)
                });
            }, mimeType, quality);
        });
    }
    
    function escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
})();
