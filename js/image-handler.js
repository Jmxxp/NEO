// ===== IMAGE HANDLER - Gerenciamento de imagens anexadas =====
// As imagens são enviadas diretamente para o Gemini (suporte nativo)
// O DeepSeek não suporta imagens, então uma mensagem informativa é exibida

// Estado das imagens anexadas
let attachedImages = [];

// ===== FUNÇÕES DE UI =====
function renderImagePreview() {
    // Usa a função unificada do pdf-handler.js
    if (typeof renderAttachmentPreview === 'function') {
        renderAttachmentPreview();
    }
}

function removeImageAttachment(index) {
    attachedImages.splice(index, 1);
    renderImagePreview();
    // Atualizar estado do botão enviar/call
    if (typeof window.updateSendCallBtn === 'function') {
        window.updateSendCallBtn();
    }
}

function clearAllImageAttachments() {
    attachedImages = [];
    renderImagePreview();
    // Atualizar estado do botão enviar/call
    if (typeof window.updateSendCallBtn === 'function') {
        window.updateSendCallBtn();
    }
}

function openImagePreview(dataUrl, filename) {
    // Usar nome padrão se não fornecido
    const displayName = filename || 'Imagem gerada';
    const downloadName = filename || 'imagem.jpg';

    // Criar modal de preview da imagem
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="image-preview-backdrop"></div>
        <div class="image-preview-header">
            <button class="image-preview-download" aria-label="Baixar imagem">
                <i class="fa-solid fa-download download-icon"></i>
                <i class="fa-solid fa-check check-icon" style="display: none;"></i>
            </button>
            <button class="image-preview-close" aria-label="Fechar">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="image-preview-content">
            <img src="${dataUrl}" alt="${displayName}" class="image-preview-full" />
        </div>
    `;
    document.body.appendChild(modal);

    // Handler de download
    const downloadBtn = modal.querySelector('.image-preview-download');
    downloadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await downloadPreviewImage(dataUrl, downloadName, downloadBtn);
    });

    // Fechar ao clicar no backdrop ou no botão
    modal.querySelector('.image-preview-backdrop').addEventListener('click', () => {
        modal.remove();
    });
    modal.querySelector('.image-preview-close').addEventListener('click', () => {
        modal.remove();
    });

    // Fechar com ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Botão voltar do Android - tratado no handleBackButton global

    // Limpar listeners quando modal for removido
    const observer = new MutationObserver(() => {
        if (!document.body.contains(modal)) {
            document.removeEventListener('keydown', escHandler);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true });

    // Animação de entrada
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });
}

// Função de download para o preview de imagem
async function downloadPreviewImage(dataUrl, filename, btn) {
    try {
        console.log("📥 Iniciando download da imagem do preview...");
        
        // Mostrar que está processando
        if (btn) {
            btn.disabled = true;
        }

        // Verificar se está no Cordova
        if (window.cordova && window.resolveLocalFileSystemURL) {
            // Salvar na galeria do dispositivo
            await savePreviewImageToGallery(dataUrl, filename);
        } else {
            // Fallback para navegador
            await downloadPreviewImageBrowser(dataUrl, filename);
        }

        // Mostrar feedback visual no botão (check verde)
        if (btn) {
            const downloadIcon = btn.querySelector('.download-icon');
            const checkIcon = btn.querySelector('.check-icon');

            if (downloadIcon && checkIcon) {
                downloadIcon.style.display = 'none';
                checkIcon.style.display = 'block';
                btn.style.background = 'rgba(76, 175, 80, 0.8)';

                // Voltar ao normal depois de 2.5 segundos
                setTimeout(() => {
                    downloadIcon.style.display = 'block';
                    checkIcon.style.display = 'none';
                    btn.style.background = '';
                    btn.disabled = false;
                }, 2500);
            }
        }

        console.log("✅ Imagem salva com sucesso!");

    } catch (error) {
        console.error("❌ Erro ao baixar imagem:", error);
        if (btn) {
            btn.disabled = false;
        }
        // Fallback: tenta abrir em nova aba
        try {
            window.open(dataUrl, '_system');
        } catch (e) {
            console.error("Fallback também falhou:", e);
        }
    }
}

// Salvar imagem do preview na galeria (Cordova/Android)
async function savePreviewImageToGallery(dataUrl, filename) {
    return new Promise((resolve, reject) => {
        try {
            console.log("📱 Salvando imagem na galeria...");

            // Extrair base64 do dataUrl
            let base64Data;
            if (dataUrl.startsWith('data:')) {
                base64Data = dataUrl.split(',')[1];
            } else {
                // Se for URL externa, precisa fazer fetch primeiro
                fetch(dataUrl)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            base64Data = reader.result.split(',')[1];
                            doSaveToGallery(base64Data, filename, resolve, reject);
                        };
                        reader.onerror = () => reject(reader.error);
                        reader.readAsDataURL(blob);
                    })
                    .catch(reject);
                return;
            }

            doSaveToGallery(base64Data, filename, resolve, reject);

        } catch (error) {
            console.error("❌ Erro no savePreviewImageToGallery:", error);
            reject(error);
        }
    });
}

function doSaveToGallery(base64Data, filename, resolve, reject) {
    // Determinar diretório de destino
    const storageDir = cordova.file.externalRootDirectory || cordova.file.dataDirectory;
    const picturesPath = 'Pictures/Neo/';

    window.resolveLocalFileSystemURL(storageDir,
        (dirEntry) => {
            dirEntry.getDirectory(picturesPath, { create: true, exclusive: false },
                (picturesDir) => {
                    // Nome do arquivo
                    const safeName = (filename || 'imagem_' + Date.now()).replace(/[^a-zA-Z0-9_.-]/g, '_');
                    const finalName = safeName.endsWith('.png') || safeName.endsWith('.jpg') || safeName.endsWith('.jpeg') 
                        ? safeName 
                        : safeName + '.png';

                    // Criar arquivo
                    picturesDir.getFile(finalName, { create: true, exclusive: false },
                        (fileEntry) => {
                            fileEntry.createWriter(
                                (writer) => {
                                    writer.onwriteend = () => {
                                        console.log("✅ Imagem salva:", fileEntry.nativeURL);

                                        // Notificar galeria (Android)
                                        if (window.cordova && window.cordova.plugins && window.cordova.plugins.MediaScannerPlugin) {
                                            window.cordova.plugins.MediaScannerPlugin.scanFile(
                                                fileEntry.nativeURL,
                                                () => console.log("📷 Galeria atualizada"),
                                                (err) => console.log("⚠️ Erro ao atualizar galeria:", err)
                                            );
                                        }

                                        resolve(fileEntry.nativeURL);
                                    };
                                    writer.onerror = (e) => {
                                        console.error("❌ Erro ao escrever arquivo:", e);
                                        reject(e);
                                    };

                                    // Converter base64 para blob e escrever
                                    const byteCharacters = atob(base64Data);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const writeBlob = new Blob([byteArray], { type: 'image/png' });
                                    writer.write(writeBlob);
                                },
                                (e) => {
                                    console.error("❌ Erro ao criar writer:", e);
                                    reject(e);
                                }
                            );
                        },
                        (e) => {
                            console.error("❌ Erro ao criar arquivo:", e);
                            reject(e);
                        }
                    );
                },
                (e) => {
                    console.error("❌ Erro ao criar diretório:", e);
                    // Tentar salvar no dataDirectory
                    doSaveToDataDirectory(base64Data, filename, resolve, reject);
                }
            );
        },
        (e) => {
            console.error("❌ Erro ao acessar storage:", e);
            // Fallback para dataDirectory
            doSaveToDataDirectory(base64Data, filename, resolve, reject);
        }
    );
}

function doSaveToDataDirectory(base64Data, filename, resolve, reject) {
    const safeName = (filename || 'imagem_' + Date.now()).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const finalName = safeName.endsWith('.png') || safeName.endsWith('.jpg') ? safeName : safeName + '.png';

    window.resolveLocalFileSystemURL(cordova.file.dataDirectory,
        (dirEntry) => {
            dirEntry.getFile(finalName, { create: true, exclusive: false },
                (fileEntry) => {
                    fileEntry.createWriter(
                        (writer) => {
                            writer.onwriteend = () => {
                                console.log("✅ Imagem salva em dataDirectory:", fileEntry.nativeURL);
                                resolve(fileEntry.nativeURL);
                            };
                            writer.onerror = (e) => reject(e);

                            const byteCharacters = atob(base64Data);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const writeBlob = new Blob([byteArray], { type: 'image/png' });
                            writer.write(writeBlob);
                        },
                        (e) => reject(e)
                    );
                },
                (e) => reject(e)
            );
        },
        (e) => reject(e)
    );
}

// Download no navegador (fallback)
async function downloadPreviewImageBrowser(dataUrl, filename) {
    let blobUrl;
    
    if (dataUrl.startsWith('data:')) {
        // Converter data URL para blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
    } else {
        // Baixar URL externa
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
    }

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'imagem.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    console.log("✅ Imagem baixada com sucesso (browser)");
}

// ===== PROCESSAMENTO DE IMAGEM =====

// Comprimir imagem para envio mais rápido à API
async function compressImageForAPI(dataUrl, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Redimensionar se necessário
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Converter para JPEG comprimido (mais leve que PNG)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(dataUrl); // Fallback para original
        img.src = dataUrl;
    });
}

async function processImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const originalDataUrl = e.target.result;

            // Comprimir imagem para API (max 1024px, 80% qualidade)
            const compressedDataUrl = await compressImageForAPI(originalDataUrl, 1024, 0.8);
            const compressedBase64 = compressedDataUrl.split(',')[1];

            // Manter original para preview, usar comprimida para API
            const originalBase64 = originalDataUrl.split(',')[1];

            console.log(`📷 Imagem comprimida: ${(originalBase64.length / 1024).toFixed(1)}KB → ${(compressedBase64.length / 1024).toFixed(1)}KB`);

            resolve({
                filename: file.name,
                dataUrl: originalDataUrl, // Original para preview
                base64: compressedBase64, // Comprimida para API
                mimeType: 'image/jpeg', // Sempre JPEG após compressão
                fileSize: file.size
            });
        };

        reader.onerror = (e) => {
            reject(new Error('Erro ao ler arquivo de imagem'));
        };

        reader.readAsDataURL(file);
    });
}

async function handleImageSelection(files) {
    const maxImages = 3;
    const maxSizeMB = 20;

    for (let file of files) {
        // Verificar limite de imagens
        if (attachedImages.length >= maxImages) {
            showPremiumAlert('Limite atingido', `Máximo de ${maxImages} imagens por mensagem.`, 'warning');
            break;
        }

        // Verificar se é uma imagem
        if (!file.type.startsWith('image/')) {
            showPremiumAlert('Arquivo inválido', `"${file.name}" não é uma imagem válida.`, 'error');
            continue;
        }

        // Verificar tamanho
        if (file.size > maxSizeMB * 1024 * 1024) {
            showPremiumAlert('Arquivo grande', `"${file.name}" excede ${maxSizeMB}MB.`, 'error');
            continue;
        }

        try {
            const imageData = await processImageFile(file);
            attachedImages.push(imageData);
            console.log('Imagem processada:', file.name);
        } catch (err) {
            console.error('Erro ao processar imagem:', err);
            showPremiumAlert('Erro', `Não foi possível processar "${file.name}".`, 'error');
        }
    }

    renderImagePreview();

    // Atualizar estado do botão enviar/call
    if (typeof window.updateSendCallBtn === 'function') {
        window.updateSendCallBtn();
    }
}

// ===== OBTER IMAGENS ANEXADAS =====
function getAttachedImages() {
    return attachedImages.length > 0 ? [...attachedImages] : null;
}

// ===== CRIAR CONTAINER DE IMAGENS PREMIUM PARA MENSAGENS =====
function createImageBubblesContainer(images) {
    const container = document.createElement('div');
    container.classList.add('image-gallery-container');

    // Se for apenas uma imagem, mostrar maior
    if (images.length === 1) {
        container.classList.add('single-image');
    } else if (images.length === 2) {
        container.classList.add('two-images');
    } else {
        container.classList.add('multi-images');
    }

    images.forEach((img, index) => {
        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('image-gallery-item');

        // Verificar se a imagem tem dataUrl válido
        const hasValidImage = img.dataUrl && img.dataUrl.startsWith('data:');

        if (hasValidImage) {
            // Imagem normal com preview
            const imgElement = document.createElement('img');
            imgElement.src = img.dataUrl;
            imgElement.alt = img.filename || 'Imagem';
            imgElement.classList.add('image-gallery-thumb');
            imgElement.loading = 'lazy';
            
            // Handler para erro de carregamento
            imgElement.onerror = () => {
                imgElement.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.classList.add('image-placeholder');
                placeholder.innerHTML = `
                    <i class="fa-solid fa-image"></i>
                    <span>${img.filename || 'Imagem'}</span>
                `;
                imageWrapper.insertBefore(placeholder, imageWrapper.firstChild);
            };

            imageWrapper.appendChild(imgElement);

            // Overlay com nome do arquivo
            const overlay = document.createElement('div');
            overlay.classList.add('image-gallery-overlay');
            overlay.innerHTML = `
                <span class="image-gallery-name">${img.filename || 'Imagem'}</span>
                <i class="fa-solid fa-expand image-gallery-expand"></i>
            `;
            imageWrapper.appendChild(overlay);

            // Clicar abre o preview em tela cheia
            imageWrapper.addEventListener('click', () => {
                openImagePreview(img.dataUrl, img.filename);
            });
        } else {
            // Placeholder para imagem que não foi salva (muito grande)
            imageWrapper.classList.add('image-unavailable');
            const placeholder = document.createElement('div');
            placeholder.classList.add('image-placeholder');
            placeholder.innerHTML = `
                <i class="fa-solid fa-image"></i>
                <span>${img.filename || 'Imagem'}</span>
                <small>Analisada pela IA</small>
            `;
            imageWrapper.appendChild(placeholder);
        }

        container.appendChild(imageWrapper);
    });

    // Se houver mais de 4 imagens, mostrar contador
    if (images.length > 4) {
        const moreIndicator = container.querySelector('.image-gallery-item:nth-child(4)');
        if (moreIndicator) {
            const moreOverlay = document.createElement('div');
            moreOverlay.classList.add('image-gallery-more');
            moreOverlay.innerHTML = `<span>+${images.length - 4}</span>`;
            moreIndicator.appendChild(moreOverlay);
        }
    }

    return container;
}

// ===== INICIALIZAR LISTENERS DE IMAGEM =====
function initImageHandlers() {
    // Não precisa mais de listener próprio - o pdf-handler.js já cuida disso
    // Este método existe apenas para compatibilidade
    console.log('Image handlers initialized');
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initImageHandlers();
});
