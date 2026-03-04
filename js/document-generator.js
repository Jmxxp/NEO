// ===== SISTEMA DE GERAÇÃO DE DOCUMENTOS =====
// Permite à IA gerar documentos em PDF, TXT, HTML, JSON, CSV, MD

/**
 * Formatos suportados:
 * - pdf: Documento PDF formatado
 * - txt: Arquivo de texto simples
 * - html: Página HTML completa
 * - json: Dados estruturados JSON
 * - csv: Planilha CSV
 * - md: Markdown formatado
 * 
 * Sintaxe para a IA usar:
 * ```document:pdf
 * title: Título do Documento
 * filename: nome-arquivo
 * ---
 * Conteúdo do documento aqui...
 * ```
 */

// Extrair blocos de documento do texto
function extractDocumentBlocks(text) {
    // Usar regex com flag global mas resetar lastIndex
    const documentRegex = /```document:(pdf|txt|html|json|csv|md)\n([\s\S]*?)```/gi;
    const documents = [];
    let cleanedText = text;
    const matches = [];
    let match;

    // Coletar todos os matches primeiro
    while ((match = documentRegex.exec(text)) !== null) {
        matches.push({
            fullMatch: match[0],
            format: match[1].toLowerCase(),
            content: match[2]
        });
    }

    // Processar cada match
    matches.forEach((m, index) => {
        const docId = `doc-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;

        // Parse do conteúdo para extrair metadados
        const parsed = parseDocumentContent(m.content);

        documents.push({
            id: docId,
            format: m.format,
            title: parsed.title || 'Documento',
            filename: parsed.filename || `documento-${Date.now()}`,
            content: parsed.content
        });

        // Substituir por placeholder (apenas a primeira ocorrência)
        cleanedText = cleanedText.replace(m.fullMatch, `%%%DOCUMENT_${docId}%%%`);
    });
    
    // Log apenas se encontrou documentos
    if (documents.length > 0) {
        console.log('📄 [extractDocumentBlocks] Documentos extraídos:', documents.length);
    }

    return { cleanedText, documents };
}

// Parse do conteúdo do documento (separar metadados do conteúdo)
function parseDocumentContent(rawContent) {
    const lines = rawContent.split('\n');
    let title = 'Documento';
    let filename = null;
    let contentStart = 0;

    // Procurar por metadados no início
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('title:')) {
            title = line.substring(6).trim();
            contentStart = i + 1;
        } else if (line.startsWith('filename:')) {
            filename = line.substring(9).trim();
            contentStart = i + 1;
        } else if (line === '---') {
            contentStart = i + 1;
            break;
        } else if (line !== '' && !line.startsWith('title:') && !line.startsWith('filename:')) {
            // Se encontrar conteúdo sem separador, assume que não há metadados
            break;
        }
    }

    const content = lines.slice(contentStart).join('\n').trim();

    return { title, filename, content };
}

// Gerar documento PDF
async function generatePDF(docData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Função para limpar markdown e emojis
    const cleanMarkdownAndEmojis = (text) => {
        return text
            // Remover emojis Unicode
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
            .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
            .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
            .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
            .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
            .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols Extended-A
            .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
            .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media controls
            .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Media controls
            .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
            .replace(/[\u{25B6}]/gu, '')            // Play button
            .replace(/[\u{25C0}]/gu, '')            // Reverse button
            .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
            .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella, Coffee
            .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
            .replace(/[\u{267F}]/gu, '')            // Wheelchair
            .replace(/[\u{2693}]/gu, '')            // Anchor
            .replace(/[\u{26A1}]/gu, '')            // High Voltage
            .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
            .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Sports
            .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Weather
            .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
            .replace(/[\u{26D4}]/gu, '')            // No Entry
            .replace(/[\u{26EA}]/gu, '')            // Church
            .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain, Golf
            .replace(/[\u{26F5}]/gu, '')            // Sailboat
            .replace(/[\u{26FA}]/gu, '')            // Tent
            .replace(/[\u{26FD}]/gu, '')            // Fuel Pump
            // Remover códigos de ícones :nome:
            .replace(/::[\w-]+::|:[\w-]+:/g, '')
            // Remover negrito **texto**
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            // Remover itálico *texto* (cuidado para não pegar listas)
            .replace(/(?<!^|\n)\*([^*\n]+)\*/g, '$1')
            // Remover negrito __texto__
            .replace(/__([^_]+)__/g, '$1')
            // Remover itálico _texto_
            .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
            // Remover código inline `texto`
            .replace(/`([^`]+)`/g, '$1')
            // Remover links [texto](url)
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Limpar espaços duplos
            .replace(/  +/g, ' ')
            .trim();
    };

    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;
    let yPosition = margin;
    let pageCount = 1;

    // Função auxiliar para adicionar nova página se necessário
    const checkPageBreak = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            pageCount++;
            yPosition = margin;
            return true;
        }
        return false;
    };

    // Função para calcular tamanho proporcional do underline
    const getProportionalUnderline = (fieldName) => {
        const baseLength = fieldName.length;
        // Campos curtos (até 5 chars): linha de 15 chars
        // Campos médios (6-15 chars): linha de 20 chars
        // Campos longos (16-25 chars): linha de 25 chars
        // Campos muito longos: linha de 30 chars
        if (baseLength <= 5) return '_'.repeat(15);
        if (baseLength <= 15) return '_'.repeat(20);
        if (baseLength <= 25) return '_'.repeat(25);
        return '_'.repeat(30);
    };

    // Função para desenhar texto com alinhamento
    const drawText = (text, y, options = {}) => {
        const { align = 'left', fontSize = 11, bold = false, indent = 0 } = options;

        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');

        const effectiveWidth = maxWidth - indent;
        const lines = doc.splitTextToSize(text, effectiveWidth);

        lines.forEach((line, i) => {
            let x = margin + indent;

            if (align === 'center') {
                const textWidth = doc.getTextWidth(line);
                x = centerX - (textWidth / 2);
            } else if (align === 'right') {
                const textWidth = doc.getTextWidth(line);
                x = pageWidth - margin - textWidth;
            }

            doc.text(line, x, y + (i * (fontSize * 0.4)));
        });

        return lines.length * (fontSize * 0.4);
    };

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(docData.title, maxWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * 8) + 10;

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Conteúdo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const paragraphs = docData.content.split('\n');

    // Processar parágrafos diretamente
    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];

        // Quebra de página forçada
        if (paragraph.trim() === '---NOVA-PAGINA---' || paragraph.trim() === '---QUEBRA---') {
            doc.addPage();
            pageCount++;
            yPosition = margin;
            continue;
        }

        if (paragraph.trim() === '') {
            yPosition += 4;
            continue;
        }

        // Remover marcadores de alinhamento se existirem (ignorar)
        let processedParagraph = paragraph
            .replace(/^\[(CENTER|CENTRO|RIGHT|DIREITA)\]\s*/i, '');

        // Converter [campo] para linha com underline PROPORCIONAL
        processedParagraph = processedParagraph.replace(/\[([^\]]+)\]/g, (match, fieldName) => {
            const underline = getProportionalUnderline(fieldName);
            return `${fieldName}: ${underline}`;
        });

        // Manter underlines existentes mas não expandir exageradamente
        processedParagraph = processedParagraph.replace(/_{3,}/g, (match) => {
            const len = Math.min(Math.max(match.length, 10), 25);
            return '_'.repeat(len);
        });

        // Verificar se header vai ficar sozinho no fim da página
        if (processedParagraph.startsWith('#')) {
            if (yPosition > pageHeight - margin - 30) {
                doc.addPage();
                pageCount++;
                yPosition = margin;
            }
        }

        // Detectar headers (## ou ###)
        if (processedParagraph.startsWith('### ')) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            const headerText = cleanMarkdownAndEmojis(processedParagraph.substring(4));
            const lines = doc.splitTextToSize(headerText, maxWidth);
            checkPageBreak(lines.length * 6 + 4);
            doc.text(lines, margin, yPosition);
            yPosition += (lines.length * 6) + 4;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
        } else if (processedParagraph.startsWith('## ')) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            const headerText = cleanMarkdownAndEmojis(processedParagraph.substring(3));
            const lines = doc.splitTextToSize(headerText, maxWidth);
            checkPageBreak(lines.length * 7 + 5);
            doc.text(lines, margin, yPosition);
            yPosition += (lines.length * 7) + 5;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
        } else if (processedParagraph.startsWith('# ')) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const headerText = cleanMarkdownAndEmojis(processedParagraph.substring(2));
            const lines = doc.splitTextToSize(headerText, maxWidth);
            checkPageBreak(lines.length * 8 + 6);
            doc.text(lines, margin, yPosition);
            yPosition += (lines.length * 8) + 6;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
        } else if (processedParagraph.startsWith('- ') || processedParagraph.startsWith('* ')) {
            // Lista
            const listText = '• ' + cleanMarkdownAndEmojis(processedParagraph.substring(2));
            const lines = doc.splitTextToSize(listText, maxWidth - 5);
            checkPageBreak(lines.length * 5 + 2);
            doc.text(lines, margin + 5, yPosition);
            yPosition += (lines.length * 5) + 2;
        } else if (/^\d+\.\s/.test(processedParagraph)) {
            // Lista numerada
            const cleanedText = cleanMarkdownAndEmojis(processedParagraph);
            const lines = doc.splitTextToSize(cleanedText, maxWidth - 5);
            checkPageBreak(lines.length * 5 + 2);
            doc.text(lines, margin + 5, yPosition);
            yPosition += (lines.length * 5) + 2;
        } else {
            // Parágrafo normal
            let cleanText = cleanMarkdownAndEmojis(processedParagraph);
            const lines = doc.splitTextToSize(cleanText, maxWidth);
            checkPageBreak(lines.length * 5 + 3);
            doc.text(lines, margin, yPosition);
            yPosition += (lines.length * 5) + 3;
        }
    }

    // Rodapé com data e hora
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado por NEO em ${dateStr} às ${timeStr}`, margin, pageHeight - 10);

    return doc.output('blob');
}

// Gerar arquivo TXT
function generateTXT(docData) {
    let content = `${docData.title}\n${'='.repeat(docData.title.length)}\n\n`;
    content += docData.content;
    content += `\n\n---\nGerado por NEO em ${new Date().toLocaleDateString('pt-BR')}`;

    return new Blob([content], { type: 'text/plain;charset=utf-8' });
}

// Gerar arquivo HTML
function generateHTML(docData) {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(docData.title)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f9f9f9;
        }
        h1 { 
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        h2 { color: #34495e; margin: 25px 0 15px; }
        h3 { color: #7f8c8d; margin: 20px 0 10px; }
        p { margin: 10px 0; text-align: justify; }
        ul, ol { margin: 15px 0; padding-left: 30px; }
        li { margin: 5px 0; }
        code { 
            background: #ecf0f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', monospace;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 15px;
            margin: 15px 0;
            color: #7f8c8d;
            font-style: italic;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #95a5a6;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(docData.title)}</h1>
    ${convertMarkdownToHTML(docData.content)}
    <div class="footer">
        Gerado por NEO em ${new Date().toLocaleDateString('pt-BR')}
    </div>
</body>
</html>`;

    return new Blob([html], { type: 'text/html;charset=utf-8' });
}

// Converter Markdown básico para HTML
function convertMarkdownToHTML(markdown) {
    let html = markdown
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold e Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Code
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Blockquote
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // Lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        // Links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        // Paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');

    return `<p>${html}</p>`;
}

// Gerar arquivo JSON
function generateJSON(docData) {
    let jsonContent;

    try {
        // Tentar fazer parse se o conteúdo já for JSON
        jsonContent = JSON.parse(docData.content);
    } catch {
        // Se não for JSON válido, criar estrutura
        jsonContent = {
            title: docData.title,
            content: docData.content,
            generatedAt: new Date().toISOString(),
            generator: 'NEO'
        };
    }

    const formatted = JSON.stringify(jsonContent, null, 2);
    return new Blob([formatted], { type: 'application/json;charset=utf-8' });
}

// Gerar arquivo CSV
function generateCSV(docData) {
    let csvContent = docData.content;

    // Se não parecer CSV, tentar converter tabela markdown
    if (!csvContent.includes(',') && !csvContent.includes(';')) {
        // Tentar converter tabela markdown para CSV
        const lines = csvContent.split('\n');
        const csvLines = [];

        for (const line of lines) {
            if (line.includes('|')) {
                // Linha de tabela markdown
                const cells = line.split('|')
                    .map(cell => cell.trim())
                    .filter(cell => cell && !cell.match(/^[-:]+$/));

                if (cells.length > 0) {
                    // Escapar aspas e envolver em aspas se necessário
                    const csvRow = cells.map(cell => {
                        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                            return `"${cell.replace(/"/g, '""')}"`;
                        }
                        return cell;
                    }).join(',');
                    csvLines.push(csvRow);
                }
            } else if (line.trim()) {
                csvLines.push(line);
            }
        }

        csvContent = csvLines.join('\n');
    }

    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF';
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
}

// Gerar arquivo Markdown
function generateMD(docData) {
    let content = `# ${docData.title}\n\n`;
    content += docData.content;
    content += `\n\n---\n*Gerado por NEO em ${new Date().toLocaleDateString('pt-BR')}*`;

    return new Blob([content], { type: 'text/markdown;charset=utf-8' });
}

// Função principal para gerar documento
async function generateDocument(docData) {
    let blob;
    let extension;

    switch (docData.format) {
        case 'pdf':
            blob = await generatePDF(docData);
            extension = 'pdf';
            break;
        case 'txt':
            blob = generateTXT(docData);
            extension = 'txt';
            break;
        case 'html':
            blob = generateHTML(docData);
            extension = 'html';
            break;
        case 'json':
            blob = generateJSON(docData);
            extension = 'json';
            break;
        case 'csv':
            blob = generateCSV(docData);
            extension = 'csv';
            break;
        case 'md':
            blob = generateMD(docData);
            extension = 'md';
            break;
        default:
            blob = generateTXT(docData);
            extension = 'txt';
    }

    return { blob, extension, filename: `${docData.filename}.${extension}` };
}

// Variável para guardar o último arquivo baixado
let lastDownloadedFilePath = null;

// Função para salvar arquivo no dispositivo usando Cordova
async function saveFileToDevice(blob, filename) {
    return new Promise((resolve, reject) => {
        // Verificar se estamos no Cordova (ou na versão web)
        if (window.IS_WEB_VERSION || typeof cordova === 'undefined' || !window.resolveLocalFileSystemURL) {
            // Fallback para navegador
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
            resolve(null); // null indica que foi pelo navegador
            return;
        }

        // Usar diretório de Downloads no Android
        let storageDir = cordova.file.externalRootDirectory + 'Download/';

        // Fallback se não tiver acesso ao storage externo
        if (!cordova.file.externalRootDirectory) {
            storageDir = cordova.file.externalDataDirectory || cordova.file.dataDirectory;
        }

        window.resolveLocalFileSystemURL(storageDir, function (dirEntry) {
            dirEntry.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function () {
                        console.log('Arquivo salvo:', fileEntry.nativeURL);
                        resolve(fileEntry.nativeURL);
                    };
                    fileWriter.onerror = function (e) {
                        console.error('Erro ao escrever arquivo:', e);
                        reject(e);
                    };
                    fileWriter.write(blob);
                }, reject);
            }, reject);
        }, function (err) {
            console.error('Erro ao acessar diretório:', err);
            // Tentar diretório de dados do app como fallback
            const fallbackDir = cordova.file.dataDirectory;
            window.resolveLocalFileSystemURL(fallbackDir, function (dirEntry) {
                dirEntry.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function () {
                            resolve(fileEntry.nativeURL);
                        };
                        fileWriter.onerror = reject;
                        fileWriter.write(blob);
                    }, reject);
                }, reject);
            }, reject);
        });
    });
}

// Função para abrir arquivo no dispositivo
function openFile(filePath, mimeType) {
    if (!filePath) return;

    if (!window.IS_WEB_VERSION && typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.fileOpener2) {
        cordova.plugins.fileOpener2.open(filePath, mimeType, {
            error: function (e) {
                console.error('Erro ao abrir arquivo:', e);
                alert('Não foi possível abrir o arquivo. Verifique se há um aplicativo instalado para abrir este tipo de arquivo.');
            },
            success: function () {
                console.log('Arquivo aberto com sucesso');
            }
        });
    } else {
        // Fallback - tentar abrir no navegador
        window.open(filePath, '_system');
    }
}

// Mimetypes dos formatos
const MIME_TYPES = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    html: 'text/html',
    json: 'application/json',
    csv: 'text/csv',
    md: 'text/markdown'
};

// Download do documento (só baixa)
async function handleDocumentDownload(button, docData) {
    const originalContent = button.innerHTML;
    const icon = button.querySelector('i');
    const textSpan = button.querySelector('span');

    try {
        // Estado: Baixando
        button.disabled = true;
        icon.className = 'fa-solid fa-spinner fa-spin';
        textSpan.textContent = 'Baixando...';
        button.style.opacity = '0.8';

        const { blob, extension } = await generateDocument(docData);

        // Adicionar timestamp ao nome para evitar conflito
        const timestamp = Date.now();
        const filename = `${docData.filename}-${timestamp}.${extension}`;

        // Salvar arquivo
        await saveFileToDevice(blob, filename);

        // Estado: Baixado
        icon.className = 'fa-solid fa-check';
        textSpan.textContent = 'Baixado!';
        button.style.background = '#27ae60';
        button.style.opacity = '1';

        // Voltar ao normal após 2 segundos
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
            button.style.background = '';
        }, 2000);

        return true;
    } catch (error) {
        console.error('Erro ao gerar documento:', error);

        // Estado: Erro
        icon.className = 'fa-solid fa-xmark';
        textSpan.textContent = 'Erro';
        button.style.background = '#e74c3c';
        button.style.opacity = '1';

        // Voltar ao normal após 2 segundos
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
            button.style.background = '';
        }, 2000);

        return false;
    }
}

// Baixar e abrir documento
async function handleDocumentOpen(button, docData) {
    const originalContent = button.innerHTML;
    const icon = button.querySelector('i');
    const textSpan = button.querySelector('span');

    try {
        // Estado: Abrindo
        button.disabled = true;
        icon.className = 'fa-solid fa-spinner fa-spin';
        textSpan.textContent = 'Abrindo...';
        button.style.opacity = '0.8';

        const { blob, extension } = await generateDocument(docData);

        // Adicionar timestamp ao nome para evitar conflito
        const timestamp = Date.now();
        const filename = `${docData.filename}-${timestamp}.${extension}`;

        // Salvar arquivo
        const filePath = await saveFileToDevice(blob, filename);

        // Abrir arquivo
        if (filePath) {
            openFile(filePath, MIME_TYPES[docData.format] || 'application/octet-stream');
        }

        // Estado: Aberto
        icon.className = 'fa-solid fa-check';
        textSpan.textContent = 'Aberto!';
        button.style.opacity = '1';

        // Voltar ao normal após 1.5 segundos
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
        }, 1500);

        return true;
    } catch (error) {
        console.error('Erro ao abrir documento:', error);

        // Estado: Erro
        icon.className = 'fa-solid fa-xmark';
        textSpan.textContent = 'Erro';
        button.style.background = '#e74c3c';
        button.style.opacity = '1';

        // Voltar ao normal após 2 segundos
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
            button.style.background = '';
        }, 2000);

        return false;
    }
}
// Download do documento (função legacy)
async function downloadDocument(docData) {
    try {
        const { blob, filename } = await generateDocument(docData);

        // Criar URL do blob
        const url = URL.createObjectURL(blob);

        // Criar link de download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Limpar URL
        setTimeout(() => URL.revokeObjectURL(url), 100);

        return true;
    } catch (error) {
        console.error('Erro ao gerar documento:', error);
        return false;
    }
}

// Criar card de documento na mensagem
function createDocumentCard(docData) {
    const card = document.createElement('div');
    card.className = 'document-card';
    card.id = docData.id;

    const formatIcons = {
        pdf: 'fa-file-pdf',
        txt: 'fa-file-lines',
        html: 'fa-file-code',
        json: 'fa-file-code',
        csv: 'fa-file-excel',
        md: 'fa-file-lines'
    };

    const formatColors = {
        pdf: '#e74c3c',
        txt: '#3498db',
        html: '#e67e22',
        json: '#f39c12',
        csv: '#27ae60',
        md: '#9b59b6'
    };

    card.innerHTML = `
        <div class="document-card-header" style="border-left-color: ${formatColors[docData.format] || '#3498db'}">
            <div class="document-card-icon" style="color: ${formatColors[docData.format] || '#3498db'}">
                <i class="fa-solid ${formatIcons[docData.format] || 'fa-file'}"></i>
            </div>
            <div class="document-card-info">
                <div class="document-card-title">${escapeHtml(docData.title)}</div>
                <div class="document-card-format">${docData.format.toUpperCase()} • ${docData.filename}.${docData.format}</div>
            </div>
            <div class="document-card-buttons">
                <button class="document-download-btn" data-doc-id="${docData.id}">
                    <i class="fa-solid fa-download"></i>
                    <span>Baixar</span>
                </button>
                <button class="document-open-btn" data-doc-id="${docData.id}">
                    <i class="fa-solid fa-folder-open"></i>
                    <span>Abrir</span>
                </button>
            </div>
        </div>
    `;

    // Adicionar evento de click no botão Baixar
    const downloadBtn = card.querySelector('.document-download-btn');
    downloadBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await handleDocumentDownload(downloadBtn, docData);
    });

    // Adicionar evento de click no botão Abrir
    const openBtn = card.querySelector('.document-open-btn');
    openBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await handleDocumentOpen(openBtn, docData);
    });

    return card;
}

// Renderizar documentos após o markdown ser processado
function renderDocuments(container, documents) {
    if (!documents || documents.length === 0) return;

    documents.forEach(docData => {
        const placeholder = container.querySelector(`[data-contains-doc="${docData.id}"]`) ||
            Array.from(container.childNodes).find(node =>
                node.textContent && node.textContent.includes(`%%%DOCUMENT_${docData.id}%%%`)
            );

        if (placeholder) {
            const card = createDocumentCard(docData);
            if (placeholder.nodeType === Node.TEXT_NODE) {
                const span = document.createElement('span');
                span.appendChild(card);
                placeholder.parentNode.replaceChild(span, placeholder);
            } else {
                placeholder.innerHTML = '';
                placeholder.appendChild(card);
            }
        } else {
            // Se não encontrar placeholder, procurar no HTML
            const html = container.innerHTML;
            if (html.includes(`%%%DOCUMENT_${docData.id}%%%`)) {
                const card = createDocumentCard(docData);
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(card);
                container.innerHTML = html.replace(
                    `%%%DOCUMENT_${docData.id}%%%`,
                    tempDiv.innerHTML
                );
            }
        }
    });
}

// Adicionar estilos CSS para os cards de documento
function addDocumentStyles() {
    if (document.getElementById('document-generator-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'document-generator-styles';
    styles.textContent = `
        .document-card {
            background: var(--bg-tertiary, #1e1e1e);
            border-radius: 12px;
            padding: 12px 14px;
            margin: 6px 0;
            border: 1px solid var(--border-color, #333);
            transition: all 0.2s ease;
            overflow: hidden;
        }

        .document-card:hover {
            border-color: var(--accent-color, #3498db);
        }

        .document-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-left: 12px;
            border-left: 3px solid #3498db;
            flex-wrap: nowrap;
            min-height: 48px;
        }

        .document-card-icon {
            font-size: 24px;
            opacity: 0.9;
            flex-shrink: 0;
        }

        .document-card-info {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }

        .document-card-title {
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary, #fff);
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Modo claro - título preto */
        body.theme-light .document-card-title {
            color: #1a1a1a;
        }

        .document-card-format {
            font-size: 11px;
            color: var(--text-secondary, #888);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .document-card-buttons {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .document-download-btn,
        .document-open-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 14px;
            color: white !important;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .document-download-btn {
            background: #3498db;
        }

        .document-download-btn:hover {
            background: #2980b9;
        }

        .document-open-btn {
            background: #27ae60;
        }

        .document-open-btn:hover {
            background: #219a52;
        }

        .document-download-btn:active,
        .document-open-btn:active {
            transform: scale(0.98);
        }

        .document-download-btn:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        .document-download-btn i,
        .document-download-btn span,
        .document-open-btn i,
        .document-open-btn span {
            color: white !important;
            flex-shrink: 0;
        }

        .document-download-btn i,
        .document-open-btn i {
            font-size: 12px;
        }

        /* Placeholder de carregamento */
        .document-placeholder {
            background: var(--bg-tertiary, #1e1e1e);
            border-radius: 12px;
            padding: 20px;
            margin: 12px 0;
            border: 1px dashed var(--border-color, #444);
        }

        .document-generating {
            border-color: #3498db;
            background: linear-gradient(135deg, var(--bg-tertiary, #1e1e1e) 0%, rgba(52, 152, 219, 0.1) 100%);
        }

        .document-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: var(--text-secondary, #888);
        }

        .document-loading i {
            font-size: 20px;
            color: #3498db;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        /* Temas claros */
        [data-theme="light"] .document-card {
            background: #f8f9fa;
            border-color: #e0e0e0;
        }

        [data-theme="light"] .document-placeholder {
            background: #f8f9fa;
            border-color: #ddd;
        }
    `;
    document.head.appendChild(styles);
}

// Inicializar estilos
addDocumentStyles();

// Exportar funções globalmente
window.extractDocumentBlocks = extractDocumentBlocks;
window.renderDocuments = renderDocuments;
window.downloadDocument = downloadDocument;
window.generateDocument = generateDocument;
window.createDocumentCard = createDocumentCard;
