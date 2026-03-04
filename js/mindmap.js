// ===== SISTEMA DE MAPAS MENTAIS PARA O CHAT =====
// Baseado no sistema de gráficos - usa formato ```mindmap

// Cores para nós do mapa mental
const MINDMAP_COLORS = [
    '#6366f1', '#22c55e', '#3b82f6', '#f59e0b', 
    '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444',
    '#84cc16', '#f97316'
];

// Armazenar dados dos mapas para visualização
const mindMapDataStore = {};

/**
 * Extrai blocos de mapas mentais do texto
 * Formato: ```mindmap ... ```
 */
function extractMindMapBlocks(text) {
    if (!text) return { cleanedText: text, mindmaps: [] };

    const mindmaps = [];
    let cleaned = text;

    // Formato: ```mindmap ... ```
    const regex = /```mindmap\s*\n([\s\S]*?)```/gi;
    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
        const rawData = match[1].trim();
        
        // Gerar ID DETERMINÍSTICO baseado no conteúdo (hash simples)
        // Isso garante o mesmo ID para o mesmo conteúdo entre chamadas
        let hash = 0;
        const contentForHash = rawData.slice(0, 100); // Usa início do conteúdo
        for (let i = 0; i < contentForHash.length; i++) {
            hash = ((hash << 5) - hash) + contentForHash.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        const mapId = 'mindmap-' + Math.abs(hash).toString(36) + '-' + index;
        index++;

        mindmaps.push({
            id: mapId,
            rawData: rawData
        });

        // Substituir por marcador
        cleaned = cleaned.replace(match[0], `\n\n%%%MINDMAP_${mapId}%%%\n\n`);
    }

    return { cleanedText: cleaned, mindmaps };
}

/**
 * Tenta reparar JSON malformado de mapa mental
 */
function repairMindMapJSON(str) {
    if (!str) return null;
    
    let repaired = str;
    
    // 1. Remover caracteres de controle problemáticos
    repaired = repaired.replace(/[\x00-\x1F\x7F]/g, ' ');
    
    // 2. Detectar loops/repetições de estruturas JSON e cortar
    // Padrão: {"text":"X","children":[ repetido
    const loopPatterns = [
        /(\{"text":"[^"]+","children":\[)\1+/g,
        /(\{"text":"[^"]+"\},?)\1{2,}/g,
        /(,"children":\[\{"text":"[^"]+"\})\1{2,}/g
    ];
    
    for (const pattern of loopPatterns) {
        if (pattern.test(repaired)) {
            console.log('[MindMap] Loop detectado e removido');
            repaired = repaired.replace(pattern, '$1');
        }
    }
    
    // 3. Cortar a partir de repetições óbvias (mesmo texto 3+ vezes)
    const textMatches = repaired.match(/"text":"([^"]+)"/g) || [];
    const textCounts = {};
    textMatches.forEach(t => textCounts[t] = (textCounts[t] || 0) + 1);
    
    const repeatedText = Object.entries(textCounts).find(([t, c]) => c >= 4);
    if (repeatedText) {
        console.log('[MindMap] Texto repetitivo detectado:', repeatedText[0]);
        // Encontrar 2ª ocorrência e cortar ali
        const first = repaired.indexOf(repeatedText[0]);
        const second = repaired.indexOf(repeatedText[0], first + 1);
        if (second > first) {
            repaired = repaired.slice(0, second);
        }
    }
    
    // 4. Corrigir chaves/valores sem aspas
    repaired = repaired.replace(/:([a-zA-ZÀ-ú]+)([,}\]])/g, ':"$1"$2');
    repaired = repaired.replace(/([{,])([a-zA-Z]+):/g, '$1"$2":');
    
    // 5. Corrigir vírgulas extras
    repaired = repaired.replace(/,\s*([\]}])/g, '$1');
    repaired = repaired.replace(/\]\s*\[/g, '],[');
    repaired = repaired.replace(/\}\s*\{/g, '},{');
    
    // 6. Balancear chaves e colchetes
    let opens = { '{': 0, '[': 0 };
    let closes = { '}': '{', ']': '[' };
    let balanced = '';
    
    for (const char of repaired) {
        if (char === '{' || char === '[') {
            opens[char]++;
            balanced += char;
        } else if (char === '}' || char === ']') {
            if (opens[closes[char]] > 0) {
                opens[closes[char]]--;
                balanced += char;
            }
        } else {
            balanced += char;
        }
    }
    
    // Fechar o que ficou aberto
    while (opens['['] > 0) { balanced += ']'; opens['[']--; }
    while (opens['{'] > 0) { balanced += '}'; opens['{']--; }
    
    return balanced;
}

/**
 * Parseia dados do mapa mental (JSON) com reparo automático
 */
function parseMindMapData(rawData) {
    if (!rawData) return null;

    let str = rawData.trim();
    
    // Encontrar JSON
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    
    if (start === -1 || end === -1 || end <= start) {
        console.error('[MindMap] JSON não encontrado no texto');
        return null;
    }
    
    str = str.substring(start, end + 1);
    
    // Primeira tentativa: parse direto
    try {
        const data = JSON.parse(str);
        if (data && data.text) {
            return data;
        }
    } catch (e) {
        console.warn('[MindMap] Parse inicial falhou, tentando reparo:', e.message);
    }
    
    // Segunda tentativa: reparar e tentar novamente
    try {
        const repaired = repairMindMapJSON(str);
        console.log('[MindMap] JSON reparado:', repaired?.slice(0, 100) + '...');
        const data = JSON.parse(repaired);
        if (data && data.text) {
            console.log('[MindMap] ✅ JSON reparado com sucesso!');
            return data;
        }
    } catch (e2) {
        console.error('[MindMap] Reparo também falhou:', e2.message);
    }
    
    // Terceira tentativa: criar mapa básico de fallback
    const titleMatch = str.match(/"text"\s*:\s*"([^"]+)"/); 
    if (titleMatch) {
        console.log('[MindMap] Criando mapa de fallback com título:', titleMatch[1]);
        return {
            text: titleMatch[1],
            children: [
                { text: 'Erro ao processar' },
                { text: 'Tente novamente' }
            ]
        };
    }
    
    console.error('[MindMap] Não foi possível recuperar o mapa mental');
    return null;
}

/**
 * Conta total de nós no mapa
 */
function countMindMapNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (node.children) {
        node.children.forEach(c => count += countMindMapNodes(c));
    }
    return count;
}

/**
 * Escapa HTML
 */
function escapeMindMapHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Renderiza um mapa mental - GERA PNG E EXIBE NAVEGÁVEL
 */
function renderMindMap(mapId, rawData) {
    const placeholder = document.querySelector(`.mindmap-placeholder[data-mindmap-id="${mapId}"]`);
    if (!placeholder) {
        console.warn('[MindMap] Placeholder não encontrado:', mapId);
        return;
    }

    const data = parseMindMapData(rawData);
    
    if (!data) {
        placeholder.innerHTML = '<div class="mindmap-error"><i class="fa-solid fa-exclamation-triangle"></i> Erro ao processar mapa mental</div>';
        return;
    }

    // Armazenar dados
    mindMapDataStore[mapId] = data;

    // Criar card com loading
    const container = document.createElement('div');
    container.className = 'mindmap-container';
    container.id = mapId;
    container.innerHTML = `
        <div class="mindmap-card-inline">
            <div class="mindmap-card-header-mini">
                <div class="mindmap-header-left">
                    <i class="fa-solid fa-diagram-project"></i>
                    <span>${escapeMindMapHtml(data.text)}</span>
                </div>
                <div class="mindmap-preview-controls">
                    <button type="button" class="mindmap-mini-btn" data-action="zoomout" title="Diminuir">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <button type="button" class="mindmap-mini-btn" data-action="reset" title="Resetar">
                        <i class="fa-solid fa-compress"></i>
                    </button>
                    <button type="button" class="mindmap-mini-btn" data-action="zoomin" title="Aumentar">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <button type="button" class="mindmap-mini-btn" data-action="download" title="Salvar">
                        <i class="fa-solid fa-download"></i>
                    </button>
                </div>
            </div>
            <div class="mindmap-preview-container" id="container-${mapId}">
                <div class="mindmap-loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Gerando mapa...</span>
                </div>
            </div>
        </div>
    `;

    placeholder.replaceWith(container);
    
    // Gerar PNG e exibir
    setTimeout(() => {
        generateAndDisplayPNG(mapId, data);
    }, 50);
}

/**
 * Gera PNG do mapa e exibe como imagem navegável
 */
function generateAndDisplayPNG(mapId, data) {
    const containerEl = document.getElementById(`container-${mapId}`);
    if (!containerEl) return;
    
    try {
        // Config com espaçamento generoso
        const config = {
            fontSize: { center: 18, level1: 14, level2: 12 },
            nodeHeight: { center: 50, level1: 38, level2: 32 },
            levelGap: 220,           // Distância horizontal entre níveis
            minVerticalGap: 50,      // Espaço mínimo entre nós verticais
            paddingX: 20,
            radius: 14,
            lineWidth: 3,
            maxChars: 16
        };
        
        // Calcular layout
        const nodesData = [];
        const connections = [];
        
        const totalHeight = calculateTreeHeight(data, config, 0);
        const maxDepth = calculateMaxDepth(data);
        
        const startX = 120;
        const width = startX + (maxDepth * config.levelGap) + 200;
        const height = Math.max(totalHeight + 120, 500);
        const startY = height / 2;
        
        calculateLayout(data, 0, startY, null, 0, nodesData, connections, config, width, false);
        
        // Calcular bounds com padding generoso
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodesData.forEach(node => {
            minX = Math.min(minX, node.x - node.width / 2);
            maxX = Math.max(maxX, node.x + node.width / 2);
            minY = Math.min(minY, node.y - node.height / 2);
            maxY = Math.max(maxY, node.y + node.height / 2);
        });
        
        // Padding grande para navegação confortável
        const padding = 60;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        const imgWidth = maxX - minX;
        const imgHeight = maxY - minY;
        
        // Criar canvas com resolução 2x para qualidade
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth * scale;
        canvas.height = imgHeight * scale;
        const ctx = canvas.getContext('2d');
        
        // Escalar e transladar
        ctx.scale(scale, scale);
        ctx.translate(-minX, -minY);
        
        // Fundo - mesma cor escura do card (sem transparência)
        ctx.fillStyle = '#0c0c18';
        ctx.fillRect(minX, minY, imgWidth, imgHeight);
        
        // Desenhar conexões
        connections.forEach(conn => {
            ctx.beginPath();
            ctx.strokeStyle = conn.color + 'aa';
            ctx.lineWidth = config.lineWidth;
            ctx.lineCap = 'round';
            
            const midX = (conn.x1 + conn.x2) / 2;
            ctx.moveTo(conn.x1, conn.y1);
            ctx.bezierCurveTo(midX, conn.y1, midX, conn.y2, conn.x2, conn.y2);
            ctx.stroke();
        });
        
        // Desenhar nós
        nodesData.forEach(node => {
            const x = node.x - node.width / 2;
            const y = node.y - node.height / 2;
            
            // Sombra
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3;
            
            // Fundo do nó
            ctx.beginPath();
            ctx.roundRect(x, y, node.width, node.height, config.radius);
            ctx.fillStyle = node.color + '35';
            ctx.fill();
            
            // Resetar sombra para borda
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = node.color;
            ctx.lineWidth = node.level === 0 ? 3.5 : 2;
            ctx.stroke();
            
            // Texto
            const fontSize = node.level === 0 ? config.fontSize.center : 
                             node.level === 1 ? config.fontSize.level1 : config.fontSize.level2;
            
            ctx.font = `${node.level === 0 ? 'bold ' : ''}${fontSize}px "Segoe UI", Arial, sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const lineH = fontSize * 1.35;
            const totalH = node.lines.length * lineH;
            const textStartY = node.y - totalH / 2 + lineH / 2;
            
            node.lines.forEach((line, i) => {
                ctx.fillText(line, node.x, textStartY + i * lineH);
            });
        });
        
        // Converter para PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        
        // Armazenar para download
        mindMapDataStore[mapId].pngDataUrl = pngDataUrl;
        mindMapDataStore[mapId].imgWidth = imgWidth * scale;
        mindMapDataStore[mapId].imgHeight = imgHeight * scale;
        
        // Exibir imagem navegável
        containerEl.innerHTML = `
            <div class="mindmap-img-viewport" id="viewport-${mapId}">
                <img src="${pngDataUrl}" class="mindmap-img" id="img-${mapId}" draggable="false" alt="Mapa Mental">
            </div>
        `;
        
        // Configurar navegação
        setupImageNavigation(mapId);
        
    } catch (err) {
        console.error('[MindMap] Erro ao gerar PNG:', err?.message || err, err?.stack || '');
        containerEl.innerHTML = '<div class="mindmap-error"><i class="fa-solid fa-exclamation-triangle"></i> Erro ao gerar mapa</div>';
    }
}

/**
 * Configura navegação pan/zoom na imagem PNG
 */
function setupImageNavigation(mapId) {
    const viewport = document.getElementById(`viewport-${mapId}`);
    const img = document.getElementById(`img-${mapId}`);
    const card = viewport.closest('.mindmap-card-inline');
    
    if (!viewport || !img || !card) return;
    
    // Calcular scale inicial para caber tudo no viewport
    const viewportRect = viewport.getBoundingClientRect();
    const data = mindMapDataStore[mapId];
    const imgW = data.imgWidth || 800;
    const imgH = data.imgHeight || 600;
    
    // Scale para caber com margem
    const scaleX = (viewportRect.width * 0.9) / imgW;
    const scaleY = (viewportRect.height * 0.9) / imgH;
    const fitScale = Math.min(scaleX, scaleY, 1); // Não maior que 1
    
    // Estado
    let scale = fitScale;
    let panX = 0;
    let panY = 0;
    const initialScale = fitScale;
    
    function updateTransform() {
        img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }
    
    function resetView() {
        scale = initialScale;
        panX = 0;
        panY = 0;
        updateTransform();
    }
    
    function zoomIn() {
        scale = scale * 1.3;
        updateTransform();
    }
    
    function zoomOut() {
        scale = scale / 1.3;
        updateTransform();
    }
    
    // Inicializar
    updateTransform();
    
    // Botões
    card.querySelector('[data-action="zoomin"]').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        zoomIn();
    };
    
    card.querySelector('[data-action="zoomout"]').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        zoomOut();
    };
    
    card.querySelector('[data-action="reset"]').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetView();
    };
    
    card.querySelector('[data-action="download"]').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveMindMapPNG(mapId);
    };
    
    // === TOUCH - Pan e Pinch Zoom ===
    let isPanning = false;
    let startX = 0, startY = 0;
    let startPanX = 0, startPanY = 0;
    let lastPinchDist = 0;
    let lastPinchCenterX = 0;
    let lastPinchCenterY = 0;
    
    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isPanning = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startPanX = panX;
            startPanY = panY;
        } else if (e.touches.length === 2) {
            isPanning = false;
            lastPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            // Centro do pinch
            lastPinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            lastPinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
    }, { passive: true });
    
    viewport.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (e.touches.length === 1 && isPanning) {
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            panX = startPanX + dx;
            panY = startPanY + dy;
            updateTransform();
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            // Centro atual do pinch
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            
            if (lastPinchDist > 0) {
                const delta = dist / lastPinchDist;
                const newScale = scale * delta;
                
                // Calcular posição do centro do pinch relativo ao viewport
                const rect = viewport.getBoundingClientRect();
                const pinchX = centerX - rect.left - rect.width / 2;
                const pinchY = centerY - rect.top - rect.height / 2;
                
                // Ajustar pan para manter o ponto do pinch fixo
                panX = pinchX - (pinchX - panX) * (newScale / scale);
                panY = pinchY - (pinchY - panY) * (newScale / scale);
                
                scale = newScale;
                updateTransform();
            }
            
            lastPinchDist = dist;
            lastPinchCenterX = centerX;
            lastPinchCenterY = centerY;
        }
    }, { passive: false });
    
    viewport.addEventListener('touchend', () => {
        isPanning = false;
        lastPinchDist = 0;
    }, { passive: true });
    
    // === MOUSE - Drag e Wheel Zoom ===
    let isMouseDown = false;
    
    viewport.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startX = e.clientX;
        startY = e.clientY;
        startPanX = panX;
        startPanY = panY;
        viewport.style.cursor = 'grabbing';
    });
    
    viewport.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panX = startPanX + dx;
        panY = startPanY + dy;
        updateTransform();
    });
    
    viewport.addEventListener('mouseup', () => {
        isMouseDown = false;
        viewport.style.cursor = 'grab';
    });
    
    viewport.addEventListener('mouseleave', () => {
        isMouseDown = false;
        viewport.style.cursor = 'grab';
    });
    
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
    }, { passive: false });
    
    viewport.style.cursor = 'grab';
}

/**
 * Salva o PNG na galeria
 */
function saveMindMapPNG(mapId) {
    const data = mindMapDataStore[mapId];
    if (!data || !data.pngDataUrl) {
        if (typeof showToast === 'function') showToast('Aguarde o mapa carregar', 'warning');
        return;
    }
    
    const pngDataUrl = data.pngDataUrl;
    const fileName = `mapa-mental-${Date.now()}.png`;
    
    if (typeof showToast === 'function') showToast('Salvando...', 'info');
    
    // Tentar salvar via Cordova
    if (window.cordova && window.resolveLocalFileSystemURL) {
        try {
            const byteString = atob(pngDataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: 'image/png' });
            
            const storage = cordova.file.externalRootDirectory || cordova.file.externalDataDirectory;
            
            window.resolveLocalFileSystemURL(storage, (dir) => {
                dir.getDirectory('Pictures', { create: true }, (picDir) => {
                    picDir.getDirectory('NeoMaps', { create: true }, (neoDir) => {
                        neoDir.getFile(fileName, { create: true }, (file) => {
                            file.createWriter((writer) => {
                                writer.onwriteend = () => {
                                    if (typeof showToast === 'function') {
                                        showToast('✅ Salvo em Pictures/NeoMaps', 'success');
                                    }
                                    if (window.plugins && window.plugins.MediaScanner) {
                                        window.plugins.MediaScanner.scanFile(file.nativeURL);
                                    }
                                };
                                writer.onerror = () => downloadFallback(pngDataUrl, fileName);
                                writer.write(blob);
                            }, () => downloadFallback(pngDataUrl, fileName));
                        }, () => downloadFallback(pngDataUrl, fileName));
                    }, () => downloadFallback(pngDataUrl, fileName));
                }, () => downloadFallback(pngDataUrl, fileName));
            }, () => downloadFallback(pngDataUrl, fileName));
            return;
        } catch (e) {
            console.error('[MindMap] Erro Cordova:', e);
        }
    }
    
    downloadFallback(pngDataUrl, fileName);
}

/**
 * Download fallback
 */
function downloadFallback(dataUrl, fileName) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof showToast === 'function') showToast('Imagem baixada!', 'success');
}

/**
 * Renderiza todos os mapas mentais pendentes
 */
function renderPendingMindMaps(mindmaps) {
    if (!mindmaps || mindmaps.length === 0) return;

    // Usar requestAnimationFrame + timeout para garantir que o DOM foi atualizado
    requestAnimationFrame(() => {
        setTimeout(() => {
            mindmaps.forEach(map => {
                // Verificar se placeholder existe antes de renderizar
                const placeholder = document.querySelector(`.mindmap-placeholder[data-mindmap-id="${map.id}"]`);
                if (placeholder) {
                    // Evitar re-renderização
                    if (!placeholder.classList.contains('mindmap-rendered')) {
                        placeholder.classList.add('mindmap-rendered');
                        renderMindMap(map.id, map.rawData);
                    }
                } else {
                    console.log('[MindMap] Aguardando placeholder para:', map.id);
                    // Tentar novamente após mais tempo
                    setTimeout(() => {
                        const retry = document.querySelector(`.mindmap-placeholder[data-mindmap-id="${map.id}"]`);
                        if (retry && !retry.classList.contains('mindmap-rendered')) {
                            retry.classList.add('mindmap-rendered');
                            renderMindMap(map.id, map.rawData);
                        }
                    }, 500);
                }
            });
        }, 150);
    });
}

/**
 * Abre o visualizador de mapa mental em fullscreen
 */
function openMindMapViewer(mapId) {
    const data = mindMapDataStore[mapId];
    if (!data) {
        console.error('[MindMap] Dados não encontrados para:', mapId);
        return;
    }

    // Remover viewer existente
    const old = document.getElementById('mindmapViewer');
    if (old) old.remove();

    // Criar overlay
    const viewer = document.createElement('div');
    viewer.id = 'mindmapViewer';
    viewer.className = 'mindmap-viewer';
    viewer.innerHTML = `
        <div class="mindmap-viewer-header">
            <div class="mindmap-viewer-title">
                <i class="fa-solid fa-diagram-project"></i>
                <span>${escapeMindMapHtml(data.text)}</span>
            </div>
            <div class="mindmap-viewer-controls">
                <button class="mindmap-ctrl-btn" id="mmZoomOut" title="Diminuir">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <span class="mindmap-zoom-level" id="mmZoomLevel">100%</span>
                <button class="mindmap-ctrl-btn" id="mmZoomIn" title="Aumentar">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <button class="mindmap-ctrl-btn" id="mmReset" title="Centralizar">
                    <i class="fa-solid fa-compress"></i>
                </button>
                <button class="mindmap-ctrl-btn mindmap-close-btn" id="mmClose" title="Fechar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
        <div class="mindmap-viewer-canvas" id="mmCanvas">
            <svg class="mindmap-svg" id="mmSvg"></svg>
        </div>
    `;

    document.body.appendChild(viewer);

    // Configurar eventos
    let scale = 1, panX = 0, panY = 0;
    let dragging = false, startX, startY;

    const canvas = document.getElementById('mmCanvas');
    const svg = document.getElementById('mmSvg');

    function updateTransform() {
        const g = svg.querySelector('g');
        if (g) {
            g.setAttribute('transform', `translate(${panX},${panY}) scale(${scale})`);
        }
        document.getElementById('mmZoomLevel').textContent = Math.round(scale * 100) + '%';
    }

    function zoom(delta) {
        scale = Math.max(0.3, Math.min(3, scale + delta));
        updateTransform();
    }

    function reset() {
        scale = 1;
        panX = 0;
        panY = 0;
        updateTransform();
    }

    // Botões de controle
    document.getElementById('mmClose').onclick = () => viewer.remove();
    document.getElementById('mmZoomIn').onclick = () => zoom(0.15);
    document.getElementById('mmZoomOut').onclick = () => zoom(-0.15);
    document.getElementById('mmReset').onclick = reset;

    // Fechar ao clicar fora
    viewer.onclick = (e) => {
        if (e.target === viewer) viewer.remove();
    };

    // Mouse pan
    canvas.onmousedown = (e) => {
        dragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        canvas.style.cursor = 'grabbing';
    };

    canvas.onmousemove = (e) => {
        if (!dragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
    };

    canvas.onmouseup = canvas.onmouseleave = () => {
        dragging = false;
        canvas.style.cursor = 'grab';
    };

    // Mouse wheel zoom
    canvas.onwheel = (e) => {
        e.preventDefault();
        zoom(e.deltaY > 0 ? -0.1 : 0.1);
    };

    // Touch pan/zoom
    let lastTouchDist = 0;
    canvas.ontouchstart = (e) => {
        if (e.touches.length === 1) {
            dragging = true;
            startX = e.touches[0].clientX - panX;
            startY = e.touches[0].clientY - panY;
        } else if (e.touches.length === 2) {
            lastTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    };

    canvas.ontouchmove = (e) => {
        if (e.touches.length === 1 && dragging) {
            panX = e.touches[0].clientX - startX;
            panY = e.touches[0].clientY - startY;
            updateTransform();
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            scale = Math.max(0.3, Math.min(3, scale + (dist - lastTouchDist) * 0.005));
            lastTouchDist = dist;
            updateTransform();
        }
    };

    canvas.ontouchend = () => { dragging = false; };

    // Animar entrada e renderizar
    requestAnimationFrame(() => {
        viewer.classList.add('open');
        renderMindMapSVG(svg, data, false);
    });
}

/**
 * Renderiza o mapa mental em SVG - Layout horizontal em árvore
 * @param {SVGElement} svg - Elemento SVG
 * @param {Object} data - Dados do mapa
 * @param {boolean} isPreview - Se é preview (menor) ou fullscreen
 */
function renderMindMapSVG(svg, data, isPreview = false) {
    svg.innerHTML = '';

    // Configurações baseadas no modo
    const config = isPreview ? {
        fontSize: { center: 11, level1: 9, level2: 8 },
        nodeHeight: { center: 26, level1: 20, level2: 18 },
        levelGap: 100,
        minVerticalGap: 26,
        paddingX: 10,
        radius: 10,
        lineWidth: 1.5,
        maxChars: 12
    } : {
        fontSize: { center: 14, level1: 11, level2: 9 },
        nodeHeight: { center: 38, level1: 28, level2: 24 },
        levelGap: 160,
        minVerticalGap: 35,
        paddingX: 14,
        radius: 12,
        lineWidth: 2,
        maxChars: 18
    };

    // Primeiro, calcular todos os nós para saber as dimensões reais
    const nodesData = [];
    const connections = [];
    
    // Calcular altura total da árvore
    const totalHeight = calculateTreeHeight(data, config, 0);
    
    // Calcular profundidade máxima para saber a largura necessária
    const maxDepth = calculateMaxDepth(data);
    
    // Calcular dimensões necessárias
    const startX = isPreview ? 60 : 80;
    const neededWidth = startX + (maxDepth * config.levelGap) + 100;
    const neededHeight = totalHeight + 40;
    
    // Usar dimensões calculadas
    const width = Math.max(neededWidth, isPreview ? 350 : window.innerWidth);
    const height = Math.max(neededHeight, isPreview ? 250 : window.innerHeight - 60);
    
    // Calcular ponto inicial Y centralizado
    const startY = height / 2;
    
    // Calcular layout com as dimensões corretas
    calculateLayout(data, 0, startY, null, 0, nodesData, connections, config, width, isPreview);
    
    // Agora calcular bounding box real baseado nos nós
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodesData.forEach(node => {
        minX = Math.min(minX, node.x - node.width / 2);
        maxX = Math.max(maxX, node.x + node.width / 2);
        minY = Math.min(minY, node.y - node.height / 2);
        maxY = Math.max(maxY, node.y + node.height / 2);
    });
    
    // Adicionar padding ao bounding box
    const padding = isPreview ? 20 : 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const viewWidth = maxX - minX;
    const viewHeight = maxY - minY;
    
    // Definir viewBox baseado no conteúdo real
    svg.setAttribute('viewBox', `${minX} ${minY} ${viewWidth} ${viewHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Criar definições para sombras
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const shadowId = isPreview ? 'shadow-preview' : 'shadow-full';
    defs.innerHTML = `
        <filter id="${shadowId}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.15"/>
        </filter>
    `;
    svg.appendChild(defs);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);
    
    // Desenhar conexões primeiro (ficam atrás)
    connections.forEach(conn => {
        drawConnection(g, conn, config.lineWidth);
    });
    
    // Desenhar nós
    nodesData.forEach(node => {
        drawNode(g, node, config, shadowId);
    });
}

/**
 * Calcula profundidade máxima da árvore
 */
function calculateMaxDepth(node, currentDepth = 0) {
    if (!node) return currentDepth;
    if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
        return currentDepth;
    }
    let maxChildDepth = currentDepth;
    node.children.forEach(child => {
        if (child) {
            maxChildDepth = Math.max(maxChildDepth, calculateMaxDepth(child, currentDepth + 1));
        }
    });
    return maxChildDepth;
}

/**
 * Calcula altura total da árvore para evitar sobreposição
 */
function calculateTreeHeight(node, config, level) {
    if (!node) return config.minVerticalGap || 50;
    if (!node.children || !Array.isArray(node.children) || node.children.length === 0) {
        const nodeHeight = level === 0 ? config.nodeHeight.center : 
                          (level === 1 ? config.nodeHeight.level1 : config.nodeHeight.level2);
        return nodeHeight + config.minVerticalGap;
    }
    
    let totalHeight = 0;
    node.children.forEach(child => {
        if (child) {
            totalHeight += calculateTreeHeight(child, config, level + 1);
        }
    });
    
    return totalHeight || config.minVerticalGap;
}

/**
 * Calcula layout recursivamente - agora com espaçamento correto e tamanhos dinâmicos com quebra de linha
 */
function calculateLayout(node, level, centerY, parent, colorIndex, nodesData, connections, config, width, isPreview) {
    // Validação básica
    if (!node || typeof node !== 'object') return;
    
    // Posição X baseada no nível
    const startX = isPreview ? 50 : 70;
    const x = startX + (level * config.levelGap);
    
    // Tamanho do nó
    const isCenter = level === 0;
    const fontSize = isCenter ? config.fontSize.center : (level === 1 ? config.fontSize.level1 : config.fontSize.level2);
    
    // Texto original (com fallback)
    const text = String(node.text || 'Sem texto').trim();
    
    // Largura máxima antes de quebrar linha
    const maxWidth = isPreview ? 
        (isCenter ? 90 : (level === 1 ? 75 : 65)) :
        (isCenter ? 140 : (level === 1 ? 120 : 100));
    
    // Quebrar texto em linhas se necessário
    const lines = wrapTextForMindMap(text, fontSize, maxWidth);
    const displayLines = lines.slice(0, 3); // Máximo 3 linhas
    
    // Calcular largura baseada na linha mais larga
    let maxLineWidth = 0;
    displayLines.forEach(line => {
        let lineWidth = 0;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if ('mwMW@'.includes(char)) {
                lineWidth += fontSize * 0.75;
            } else if ('iIl1!|.,'.includes(char)) {
                lineWidth += fontSize * 0.3;
            } else if (char === ' ') {
                lineWidth += fontSize * 0.3;
            } else {
                lineWidth += fontSize * 0.55;
            }
        }
        maxLineWidth = Math.max(maxLineWidth, lineWidth);
    });
    
    // Largura mínima baseada no nível
    const minWidth = isCenter ? 60 : (level === 1 ? 45 : 35);
    const nodeWidth = Math.min(Math.max(maxLineWidth + config.paddingX * 2, minWidth), maxWidth + config.paddingX * 2);
    
    // Altura baseada no número de linhas
    const lineHeight = fontSize * 1.3;
    const baseHeight = isCenter ? config.nodeHeight.center : (level === 1 ? config.nodeHeight.level1 : config.nodeHeight.level2);
    const extraHeight = (displayLines.length - 1) * lineHeight;
    const nodeHeight = baseHeight + extraHeight;
    
    const color = MINDMAP_COLORS[colorIndex % MINDMAP_COLORS.length];
    
    // Armazenar dados do nó
    const nodeData = {
        x, y: centerY,
        width: nodeWidth,
        height: nodeHeight,
        text: text,
        lines: displayLines,
        color,
        level,
        isCenter
    };
    nodesData.push(nodeData);
    
    // Criar conexão com o pai
    if (parent) {
        connections.push({
            x1: parent.x + parent.width / 2,
            y1: parent.y,
            x2: x - nodeWidth / 2,
            y2: centerY,
            color
        });
    }
    
    // Processar filhos
    if (node.children && node.children.length > 0) {
        // Calcular altura total dos filhos
        let childrenTotalHeight = 0;
        const childrenHeights = node.children.map(child => {
            const h = calculateTreeHeight(child, config, level + 1);
            childrenTotalHeight += h;
            return h;
        });
        
        // Distribuir filhos verticalmente centrados no pai
        let currentY = centerY - (childrenTotalHeight / 2);
        
        node.children.forEach((child, i) => {
            const childHeight = childrenHeights[i];
            const childCenterY = currentY + (childHeight / 2);
            const childColorIndex = level === 0 ? (i + 1) : colorIndex;
            
            calculateLayout(
                child, 
                level + 1, 
                childCenterY,
                nodeData, 
                childColorIndex, 
                nodesData, 
                connections, 
                config, 
                width,
                isPreview
            );
            
            currentY += childHeight;
        });
    }
}

/**
 * Desenha conexão curva entre nós
 */
function drawConnection(g, conn, lineWidth) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    const { x1, y1, x2, y2, color } = conn;
    
    // Curva bezier suave horizontal
    const controlX1 = x1 + (x2 - x1) * 0.4;
    const controlX2 = x1 + (x2 - x1) * 0.6;
    
    const d = `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
    
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', lineWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.6');
    g.appendChild(path);
}

/**
 * Desenha nó retangular com suporte a múltiplas linhas
 */
function drawNode(g, node, config, shadowId) {
    const { x, y, width, height, lines, color, level, isCenter } = node;
    
    const radius = isCenter ? config.radius : config.radius - 4;
    
    // Retângulo de fundo
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - width / 2);
    rect.setAttribute('y', y - height / 2);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('rx', radius);
    rect.setAttribute('ry', radius);
    rect.setAttribute('fill', isCenter ? color : `${color}18`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', isCenter ? '0' : '1.5');
    rect.setAttribute('filter', `url(#${shadowId})`);
    g.appendChild(rect);
    
    // Texto com múltiplas linhas
    const fontSize = isCenter ? config.fontSize.center : (level === 1 ? config.fontSize.level1 : config.fontSize.level2);
    const lineHeight = fontSize * 1.3;
    const textLines = lines || [node.text];
    const totalTextHeight = textLines.length * lineHeight;
    const startY = y - (totalTextHeight / 2) + (lineHeight / 2);
    
    textLines.forEach((line, i) => {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', startY + (i * lineHeight));
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('dominant-baseline', 'middle');
        textEl.setAttribute('fill', isCenter ? '#fff' : color);
        textEl.setAttribute('font-size', fontSize);
        textEl.setAttribute('font-weight', isCenter ? '600' : '500');
        textEl.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        textEl.textContent = line;
        g.appendChild(textEl);
    });
}

/**
 * Quebra texto em múltiplas linhas (versão para mindmap)
 */
function wrapTextForMindMap(text, fontSize, maxWidth) {
    // Garantir que é string
    const safeText = String(text || '').trim();
    if (!safeText) return [''];
    
    const words = safeText.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        let testWidth = 0;
        
        for (let i = 0; i < testLine.length; i++) {
            const char = testLine[i];
            if ('mwMW@'.includes(char)) {
                testWidth += fontSize * 0.75;
            } else if ('iIl1!|.,'.includes(char)) {
                testWidth += fontSize * 0.3;
            } else if (char === ' ') {
                testWidth += fontSize * 0.3;
            } else {
                testWidth += fontSize * 0.55;
            }
        }
        
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            // Se a palavra sozinha é maior que maxWidth, truncar
            if (testWidth > maxWidth && !currentLine) {
                let truncated = '';
                let w = 0;
                for (let i = 0; i < word.length; i++) {
                    const char = word[i];
                    const charW = 'mwMW@'.includes(char) ? fontSize * 0.75 :
                                  'iIl1!|.,'.includes(char) ? fontSize * 0.3 :
                                  char === ' ' ? fontSize * 0.3 : fontSize * 0.55;
                    if (w + charW > maxWidth - fontSize) {
                        truncated += '..';
                        break;
                    }
                    truncated += char;
                    w += charW;
                }
                currentLine = truncated;
            } else {
                currentLine = word;
            }
        }
    });
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
}

/**
 * Baixa o mapa mental como PNG
 */
function downloadMindMapPNG(mapId) {
    const data = mindMapDataStore[mapId];
    if (!data) {
        console.error('[MindMap] Dados não encontrados para download:', mapId);
        if (typeof showToast === 'function') {
            showToast('Erro ao baixar mapa mental', 'error');
        }
        return;
    }
    
    // Criar SVG temporário maior para melhor qualidade
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.style.position = 'absolute';
    tempSvg.style.left = '-9999px';
    document.body.appendChild(tempSvg);
    
    // Renderizar em tamanho grande
    renderMindMapSVG(tempSvg, data, false);
    
    // Pegar o viewBox para saber as dimensões
    const viewBox = tempSvg.getAttribute('viewBox').split(' ').map(Number);
    const svgWidth = viewBox[2];
    const svgHeight = viewBox[3];
    
    // Escala para boa resolução
    const scale = 2;
    const canvasWidth = svgWidth * scale;
    const canvasHeight = svgHeight * scale;
    
    // Serializar SVG
    const svgData = new XMLSerializer().serializeToString(tempSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // Criar imagem
    const img = new Image();
    img.onload = function() {
        // Criar canvas
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // Fundo escuro
        ctx.fillStyle = '#0c0c14';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Desenhar imagem
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        // Converter para PNG e baixar
        canvas.toBlob(function(blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `mapa-mental-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            URL.revokeObjectURL(url);
            document.body.removeChild(tempSvg);
            
            if (typeof showToast === 'function') {
                showToast('Mapa mental baixado!', 'success');
            }
        }, 'image/png');
    };
    
    img.onerror = function() {
        console.error('[MindMap] Erro ao carregar SVG para conversão');
        URL.revokeObjectURL(url);
        document.body.removeChild(tempSvg);
        if (typeof showToast === 'function') {
            showToast('Erro ao gerar imagem', 'error');
        }
    };
    
    img.src = url;
}

// Funções antigas mantidas para compatibilidade
function drawMindMapLine(g, x1, y1, x2, y2, color) {
    drawConnection(g, { x1, y1, x2, y2, color }, 2);
}

function drawMindMapNode(g, x, y, text, color, size, isCenter) {
    const config = { fontSize: { center: 14, level1: 12, level2: 10 }, radius: 14 };
    drawNode(g, { x, y, width: 100, height: 36, text, color, level: isCenter ? 0 : 1, isCenter }, config, 'shadow-full');
}

// Expor funções globalmente
window.extractMindMapBlocks = extractMindMapBlocks;
window.renderPendingMindMaps = renderPendingMindMaps;
window.renderMindMap = renderMindMap;
window.openMindMapViewer = openMindMapViewer;
window.downloadMindMapPNG = downloadMindMapPNG;
