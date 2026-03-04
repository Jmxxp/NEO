// ===== FUNÇÕES UTILITÁRIAS =====

// Remover formatação markdown do texto para cópia limpa
function stripMarkdownFormatting(text) {
    if (!text) return text;
    let cleaned = text;

    // Preservar conteúdo de blocos de código (apenas o código interno)
    const codeBlocks = [];
    cleaned = cleaned.replace(/```[\w]*\n?([\s\S]*?)```/g, (match, code) => {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(code.trim());
        return placeholder;
    });

    // Remover código inline (backticks simples)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    // Remover headers (#)
    cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');

    // Remover negrito e itálico (**texto**, *texto*, __texto__, _texto_)
    cleaned = cleaned.replace(/\*\*\*(.+?)\*\*\*/g, '$1'); // ***texto***
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1'); // **texto**
    cleaned = cleaned.replace(/\*(.+?)\*/g, '$1'); // *texto*
    cleaned = cleaned.replace(/___(.+?)___/g, '$1'); // ___texto___
    cleaned = cleaned.replace(/__(.+?)__/g, '$1'); // __texto__
    cleaned = cleaned.replace(/_(.+?)_/g, '$1'); // _texto_

    // Remover tachado (~~texto~~)
    cleaned = cleaned.replace(/~~(.+?)~~/g, '$1');

    // Remover links markdown [texto](url) - manter só o texto
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remover imagens ![alt](url)
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Remover blockquotes (>)
    cleaned = cleaned.replace(/^>\s*/gm, '');

    // Remover linhas horizontais (---, ***, ___)
    cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');

    // Remover códigos de ícones :nome: e ::nome::
    cleaned = cleaned.replace(/::[\w-]+::|:[\w-]+:/g, '');

    // Restaurar blocos de código (sem as marcações ```)
    codeBlocks.forEach((code, index) => {
        cleaned = cleaned.replace(`__CODE_BLOCK_${index}__`, code);
    });

    // Limpar linhas em branco múltiplas
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
}

// Limpar tags de memória do texto visível
function stripMemoryTags(text) {
    if (!text) return text;
    let cleaned = text;
    
    // Tags antigas [[MEMORY]]
    cleaned = cleaned.replace(/\[\[MEMORY\]\][\s\S]*?\[\[\/MEMORY\]\]/gi, "");
    cleaned = cleaned.replace(/\[\[MEMORY\]\][\s\S]*$/gi, "");
    
    // ===== NOVAS TAGS DE MEMÓRIA (ULTRA AGRESSIVO) =====
    // Pegar QUALQUER coisa que comece com [mem e termine com /mem...]
    // Usar regex que funciona com quebras de linha
    
    // 1. Tags completas [mem.xxx:YYY]...[/mem.xxx] - com setor
    cleaned = cleaned.replace(/\[mem\.(add|remove|edit|clear):[^\]]*\][\s\S]*?\[\/mem\.\1\]/gi, "");
    
    // 2. Tags completas [mem.xxx]...[/mem.xxx] - sem setor
    cleaned = cleaned.replace(/\[mem\.(add|remove|edit|clear)\][\s\S]*?\[\/mem\.\1\]/gi, "");
    
    // 3. Tags INCOMPLETAS durante streaming (só abertura até o fim do texto)
    cleaned = cleaned.replace(/\[mem\.(add|remove|edit|clear)(:[^\]]*)?\][\s\S]*$/gi, "");
    
    // 4. FALLBACK NUCLEAR: qualquer [mem...] até [/mem...]
    cleaned = cleaned.replace(/\[mem[^\]]*\][\s\S]*?\[\/mem[^\]]*\]/gi, "");
    
    // 5. Tags órfãs sobrando
    cleaned = cleaned.replace(/\[mem[^\]]*\]/gi, "");
    cleaned = cleaned.replace(/\[\/mem[^\]]*\]/gi, "");
    
    // Tags de limpeza total
    cleaned = cleaned.replace(/\[(LIMPAR_MEMORIA|CLEAR_MEMORY|APAGAR_TUDO)\]/gi, "");
    
    // Limpar linhas vazias extras no final
    cleaned = cleaned.replace(/\n\s*\n\s*$/g, "\n");

    return cleaned.trim();
}

// Escape HTML
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ===== SISTEMA DE ÍCONES FONTAWESOME =====
// Mapeamento de códigos para ícones FontAwesome
const ICON_MAP = {
    // ===== STATUS E CONFIRMAÇÃO =====
    'check': 'fa-solid fa-check',
    'check-circle': 'fa-solid fa-circle-check',
    'x': 'fa-solid fa-xmark',
    'x-circle': 'fa-solid fa-circle-xmark',
    'warning': 'fa-solid fa-triangle-exclamation',
    'info': 'fa-solid fa-circle-info',
    'question': 'fa-solid fa-circle-question',
    'exclamation': 'fa-solid fa-circle-exclamation',
    'verified': 'fa-solid fa-circle-check',
    'success': 'fa-solid fa-circle-check',
    'error': 'fa-solid fa-circle-xmark',
    'pending': 'fa-solid fa-hourglass-half',
    'alert': 'fa-solid fa-triangle-exclamation',

    // ===== SETAS E DIREÇÃO =====
    'arrow-right': 'fa-solid fa-arrow-right',
    'arrow-left': 'fa-solid fa-arrow-left',
    'arrow-up': 'fa-solid fa-arrow-up',
    'arrow-down': 'fa-solid fa-arrow-down',
    'chevron-right': 'fa-solid fa-chevron-right',
    'chevron-left': 'fa-solid fa-chevron-left',
    'chevron-up': 'fa-solid fa-chevron-up',
    'chevron-down': 'fa-solid fa-chevron-down',
    'back': 'fa-solid fa-arrow-left',

    // ===== AÇÕES COMUNS =====
    'plus': 'fa-solid fa-plus',
    'minus': 'fa-solid fa-minus',
    'edit': 'fa-solid fa-pen',
    'delete': 'fa-solid fa-trash',
    'save': 'fa-solid fa-floppy-disk',
    'copy': 'fa-solid fa-copy',
    'paste': 'fa-solid fa-paste',
    'cut': 'fa-solid fa-scissors',
    'search': 'fa-solid fa-magnifying-glass',
    'filter': 'fa-solid fa-filter',
    'sort': 'fa-solid fa-sort',
    'refresh': 'fa-solid fa-rotate',
    'sync': 'fa-solid fa-arrows-rotate',
    'download': 'fa-solid fa-download',
    'upload': 'fa-solid fa-upload',
    'share': 'fa-solid fa-share-nodes',
    'link': 'fa-solid fa-link',
    'attach': 'fa-solid fa-paperclip',

    // ===== ARQUIVOS =====
    'file': 'fa-solid fa-file',
    'file-pdf': 'fa-solid fa-file-pdf',
    'file-code': 'fa-solid fa-file-code',
    'file-text': 'fa-solid fa-file-lines',
    'document': 'fa-solid fa-file-lines',
    'folder': 'fa-solid fa-folder',
    'folder-open': 'fa-solid fa-folder-open',
    'image': 'fa-solid fa-image',
    'video': 'fa-solid fa-video',
    'music': 'fa-solid fa-music',
    'camera': 'fa-solid fa-camera',
    'microphone': 'fa-solid fa-microphone',
    'clipboard': 'fa-solid fa-clipboard',

    // ===== PESSOAS =====
    'user': 'fa-solid fa-user',
    'users': 'fa-solid fa-users',
    'user-plus': 'fa-solid fa-user-plus',
    'user-check': 'fa-solid fa-user-check',
    'user-gear': 'fa-solid fa-user-gear',
    'doctor': 'fa-solid fa-user-doctor',
    'nurse': 'fa-solid fa-user-nurse',
    'teacher': 'fa-solid fa-chalkboard-user',
    'student': 'fa-solid fa-user-graduate',
    'police': 'fa-solid fa-user-shield',
    'child': 'fa-solid fa-child',
    'baby': 'fa-solid fa-baby',
    'group': 'fa-solid fa-users',

    // ===== INTERFACE =====
    'home': 'fa-solid fa-house',
    'gear': 'fa-solid fa-gear',
    'settings': 'fa-solid fa-gear',
    'cog': 'fa-solid fa-cog',
    'sliders': 'fa-solid fa-sliders',
    'bars': 'fa-solid fa-bars',
    'menu': 'fa-solid fa-bars',
    'list': 'fa-solid fa-list',
    'grid': 'fa-solid fa-table-cells',
    'expand': 'fa-solid fa-expand',
    'compress': 'fa-solid fa-compress',
    'bell': 'fa-solid fa-bell',
    'dashboard': 'fa-solid fa-gauge',
    'at': 'fa-solid fa-at',

    // ===== TEMPO =====
    'clock': 'fa-solid fa-clock',
    'calendar': 'fa-solid fa-calendar',
    'calendar-check': 'fa-solid fa-calendar-check',
    'hourglass': 'fa-solid fa-hourglass',
    'stopwatch': 'fa-solid fa-stopwatch',
    'history': 'fa-solid fa-clock-rotate-left',

    // ===== SEGURANÇA =====
    'lock': 'fa-solid fa-lock',
    'unlock': 'fa-solid fa-lock-open',
    'key': 'fa-solid fa-key',
    'shield': 'fa-solid fa-shield',
    'shield-check': 'fa-solid fa-shield-halved',
    'eye': 'fa-solid fa-eye',
    'eye-slash': 'fa-solid fa-eye-slash',
    'fingerprint': 'fa-solid fa-fingerprint',

    // ===== SÍMBOLOS =====
    'star': 'fa-solid fa-star',
    'star-half': 'fa-solid fa-star-half-stroke',
    'heart': 'fa-solid fa-heart',
    'broken-heart': 'fa-solid fa-heart-crack',
    'bookmark': 'fa-solid fa-bookmark',
    'flag': 'fa-solid fa-flag',
    'tag': 'fa-solid fa-tag',
    'thumbs-up': 'fa-solid fa-thumbs-up',
    'thumbs-down': 'fa-solid fa-thumbs-down',
    'fire': 'fa-solid fa-fire',
    'bolt': 'fa-solid fa-bolt',
    'zap': 'fa-solid fa-bolt',
    'sparkles': 'fa-solid fa-sparkles',
    'wand': 'fa-solid fa-wand-magic-sparkles',
    'gem': 'fa-solid fa-gem',
    'crown': 'fa-solid fa-crown',
    'trophy': 'fa-solid fa-trophy',
    'medal': 'fa-solid fa-medal',
    'gift': 'fa-solid fa-gift',
    'dice': 'fa-solid fa-dice',

    // ===== DESENVOLVIMENTO =====
    'code': 'fa-solid fa-code',
    'terminal': 'fa-solid fa-terminal',
    'bug': 'fa-solid fa-bug',
    'database': 'fa-solid fa-database',
    'server': 'fa-solid fa-server',
    'cloud': 'fa-solid fa-cloud',
    'globe': 'fa-solid fa-globe',
    'wifi': 'fa-solid fa-wifi',
    'robot': 'fa-solid fa-robot',
    'atom': 'fa-solid fa-atom',

    // ===== DINHEIRO =====
    'dollar': 'fa-solid fa-dollar-sign',
    'money': 'fa-solid fa-money-bill',
    'credit-card': 'fa-solid fa-credit-card',
    'wallet': 'fa-solid fa-wallet',
    'cart': 'fa-solid fa-cart-shopping',
    'receipt': 'fa-solid fa-receipt',
    'percent': 'fa-solid fa-percent',

    // ===== GRÁFICOS =====
    'chart-line': 'fa-solid fa-chart-line',
    'chart-bar': 'fa-solid fa-chart-simple',
    'chart-pie': 'fa-solid fa-chart-pie',
    'chart-area': 'fa-solid fa-chart-area',
    'trending-up': 'fa-solid fa-arrow-trend-up',
    'trending-down': 'fa-solid fa-arrow-trend-down',

    // ===== EDUCAÇÃO =====
    'book': 'fa-solid fa-book',
    'book-open': 'fa-solid fa-book-open',
    'graduation': 'fa-solid fa-graduation-cap',
    'lightbulb': 'fa-solid fa-lightbulb',
    'brain': 'fa-solid fa-brain',
    'atom': 'fa-solid fa-atom',
    'flask': 'fa-solid fa-flask',
    'microscope': 'fa-solid fa-microscope',
    'pencil': 'fa-solid fa-pencil',

    // ===== ALIMENTOS =====
    'apple': 'fa-solid fa-apple-whole',
    'coffee': 'fa-solid fa-mug-hot',
    'beer': 'fa-solid fa-beer-mug-empty',
    'wine': 'fa-solid fa-wine-glass',
    'pizza': 'fa-solid fa-pizza-slice',
    'cake': 'fa-solid fa-cake-candles',
    'hamburger': 'fa-solid fa-burger',
    'fish': 'fa-solid fa-fish',
    'egg': 'fa-solid fa-egg',
    'carrot': 'fa-solid fa-carrot',
    'utensils': 'fa-solid fa-utensils',

    // ===== ANIMAIS =====
    'cat': 'fa-solid fa-cat',
    'dog': 'fa-solid fa-dog',
    'horse': 'fa-solid fa-horse',
    'bird': 'fa-solid fa-dove',
    'spider': 'fa-solid fa-spider',
    'frog': 'fa-solid fa-frog',
    'hippo': 'fa-solid fa-hippo',
    'cow': 'fa-solid fa-cow',
    'paw': 'fa-solid fa-paw',

    // ===== ESPORTES =====
    'basketball': 'fa-solid fa-basketball',
    'football': 'fa-solid fa-football',
    'baseball': 'fa-solid fa-baseball',
    'tennis': 'fa-solid fa-table-tennis-paddle-ball',
    'volleyball': 'fa-solid fa-volleyball',
    'golf': 'fa-solid fa-golf-ball-tee',
    'hockey': 'fa-solid fa-hockey-puck',
    'bowling': 'fa-solid fa-bowling-ball',
    'skateboard': 'fa-solid fa-skateboard',
    'bicycle': 'fa-solid fa-bicycle',
    'dumbbell': 'fa-solid fa-dumbbell',
    'motorcycle': 'fa-solid fa-motorcycle',

    // ===== CLIMA/NATUREZA =====
    'sun': 'fa-solid fa-sun',
    'moon': 'fa-solid fa-moon',
    'cloud': 'fa-solid fa-cloud',
    'cloud-rain': 'fa-solid fa-cloud-rain',
    'cloud-snow': 'fa-solid fa-cloud-snow',
    'wind': 'fa-solid fa-wind',
    'tornado': 'fa-solid fa-tornado',
    'mountain': 'fa-solid fa-mountain',
    'umbrella': 'fa-solid fa-umbrella',
    'snowflake': 'fa-solid fa-snowflake',
    'droplet': 'fa-solid fa-droplet',
    'leaf': 'fa-solid fa-leaf',
    'tree': 'fa-solid fa-tree',

    // ===== EXPRESSÕES =====
    'smile': 'fa-solid fa-face-smile',
    'laugh': 'fa-solid fa-face-grin-squint-tears',
    'sad': 'fa-solid fa-face-frown',
    'angry': 'fa-solid fa-face-angry',
    'shocked': 'fa-solid fa-face-surprise',
    'cool': 'fa-solid fa-face-grin-beam',
    'crying': 'fa-solid fa-face-sad-tear',
    'wink': 'fa-solid fa-face-smile-wink',
    'mask': 'fa-solid fa-mask',

    // ===== CORPO =====
    'hand': 'fa-solid fa-hand',
    'hand-peace': 'fa-solid fa-hand-peace',
    'fist': 'fa-solid fa-hand-fist',
    'clapping': 'fa-solid fa-hands-clapping',
    'heartbeat': 'fa-solid fa-heart-pulse',
    'skull': 'fa-solid fa-skull',
    'bone': 'fa-solid fa-bone',
    'tooth': 'fa-solid fa-tooth',
    'ear': 'fa-solid fa-ear-listen',

    // ===== TRANSPORTE =====
    'car': 'fa-solid fa-car',
    'train': 'fa-solid fa-train',
    'bus': 'fa-solid fa-bus',
    'taxi': 'fa-solid fa-taxi',
    'truck': 'fa-solid fa-truck',
    'helicopter': 'fa-solid fa-helicopter',
    'plane': 'fa-solid fa-plane',
    'ship': 'fa-solid fa-ship',
    'boat': 'fa-solid fa-sailboat',
    'anchor': 'fa-solid fa-anchor',
    'rocket': 'fa-solid fa-rocket',

    // ===== FERRAMENTAS =====
    'hammer': 'fa-solid fa-hammer',
    'wrench': 'fa-solid fa-wrench',
    'screwdriver': 'fa-solid fa-screwdriver',
    'toolbox': 'fa-solid fa-toolbox',
    'magnet': 'fa-solid fa-magnet',

    // ===== LUGARES =====
    'house': 'fa-solid fa-house',
    'apartment': 'fa-solid fa-building',
    'office': 'fa-solid fa-building',
    'hotel': 'fa-solid fa-hotel',
    'hospital': 'fa-solid fa-hospital',
    'church': 'fa-solid fa-place-of-worship',
    'school': 'fa-solid fa-school',
    'bank': 'fa-solid fa-building-columns',
    'shop': 'fa-solid fa-shop',
    'store': 'fa-solid fa-store',
    'factory': 'fa-solid fa-industry',
    'warehouse': 'fa-solid fa-warehouse',

    // ===== OBJETOS =====
    'lamp': 'fa-solid fa-lightbulb',
    'door': 'fa-solid fa-door-open',
    'bath': 'fa-solid fa-bath',
    'shower': 'fa-solid fa-shower',
    'bed': 'fa-solid fa-bed',
    'couch': 'fa-solid fa-couch',
    'chair': 'fa-solid fa-chair',
    'table': 'fa-solid fa-table',
    'television': 'fa-solid fa-tv',
    'radio': 'fa-solid fa-radio',
    'film': 'fa-solid fa-film',
    'compass': 'fa-solid fa-compass',
    'phone': 'fa-solid fa-phone',

    // ===== DIVERSÃO =====
    'gamepad': 'fa-solid fa-gamepad',
    'puzzle': 'fa-solid fa-puzzle-piece',
    'play': 'fa-solid fa-play',
    'pause': 'fa-solid fa-pause',
    'stop': 'fa-solid fa-stop',
    'forward': 'fa-solid fa-forward',
    'backward': 'fa-solid fa-backward',
    'headphones': 'fa-solid fa-headphones',
    'volume': 'fa-solid fa-volume-high',
    'mute': 'fa-solid fa-volume-xmark',

    // ===== COMUNICAÇÃO =====
    'comment': 'fa-solid fa-comment',
    'comments': 'fa-solid fa-comments',
    'message': 'fa-solid fa-message',
    'envelope': 'fa-solid fa-envelope',
    'paper-plane': 'fa-solid fa-paper-plane',

    // ===== EXTRAS ÚTEIS =====
    'location': 'fa-solid fa-location-dot',
    'map': 'fa-solid fa-map',
    'computer': 'fa-solid fa-computer',
    'desktop': 'fa-solid fa-desktop',
    'print': 'fa-solid fa-print',
    'qr-code': 'fa-solid fa-qrcode',
    'battery': 'fa-solid fa-battery-full',
    'plug': 'fa-solid fa-plug',
    'spinner': 'fa-solid fa-spinner',
    'circle': 'fa-solid fa-circle',
    'square': 'fa-solid fa-square'
};

// Converter códigos de ícones para FontAwesome HTML
// Sistema robusto: remove ícones inválidos em vez de deixar :texto:
function convertIconCodes(text) {
    if (!text) return text;

    // Formato: :icon-name: ou ::icon-name:: 
    // Captura e REMOVE espaços extras após o ícone para normalização
    // O espaçamento é controlado pelo CSS (margin-right no wrapper)
    return text.replace(/::([\w-]+)::(\s*)|:([\w-]+):(\s*)/g, (match, icon1, space1, icon2, space2) => {
        const iconName = icon1 || icon2;
        const iconClass = ICON_MAP[iconName.toLowerCase()];

        if (iconClass) {
            // Wrapper com largura fixa - espaçamento via CSS margin-right
            return `<span class="icon-wrapper"><i class="${iconClass} chat-icon"></i></span>`;
        }

        // Ícone não encontrado - remover completamente
        console.warn(`[ICON] Ícone não registrado removido: :${iconName}:`);
        return '';
    });
}

// Normalizar largura de emojis comuns para alinhamento consistente
// Envolve emojis em spans com largura fixa igual aos ícones FontAwesome
function normalizeEmojiWidth(text) {
    if (!text) return text;
    
    // Lista de emojis comuns que a IA pode usar em listas/comparações
    // Incluindo emojis de check, X, setas, números, etc.
    const emojiPattern = /([✅✓☑️❌✗✘❎⭕⚠️💡🔴🟢🟡🔵⚪⚫🟠🟣🟤➡️⬅️⬆️⬇️↗️↘️↙️↖️➤►▶◀◄●○■□▪▫★☆✨💫🌟⭐📌📍🔹🔸🔷🔶💠🔻🔺▲△▼▽◆◇❖✦✧⦿⊕⊖⊗⊘⊙⊚⊛⊜⊝①②③④⑤⑥⑦⑧⑨⑩❶❷❸❹❺❻❼❽❾❿🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩🔘📎📝📄📃📋📁📂🗂️🗃️🗄️💰💵💴💶💷💸📈📉📊🎯🏆🥇🥈🥉🏅🎖️🎁💎👍👎👉👈👆👇☝️✌️🤞🖐️✋👋🤚🖖👏🤝🙌🤲💪🦾🧠💭🗯️💬🗨️💻🖥️📱📲💾💿📀🔧🔨⚙️🛠️⚡🔋🔌💡🔦🕯️🧲🧰🔬🔭📡🛰️🚀✈️🚁🚂🚃🚄🚅🚆🚇🚈🚉🚊🚋🚌🚍🚎🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🛻🚚🚛🚜🏎️🏍️🛵🚲🛴🛹🚏🛤️⛽🚨🚥🚦🚧⚓⛵🛶🚤🛳️⛴️🛥️🚢])(\s?)/gu;
    
    return text.replace(emojiPattern, (match, emoji, space) => {
        // Envolve o emoji em um span com largura fixa
        return `<span class="emoji-wrapper">${emoji}</span>${space || ' '}`;
    });
}

// ID fixo para o placeholder de gráfico durante streaming
const STREAMING_CHART_PLACEHOLDER_ID = 'streaming-chart-placeholder';

// Formatação Markdown
function formatMarkdown(text, bubbleElement = null) {
    if (!text) return "";

    // Detectar blocos INCOMPLETOS (streaming) e substituir por placeholder
    let processedText = text;
    let hasStreamingChart = false;
    let hasStreamingDocument = false;
    let hasStreamingMindMap = false;

    // Contar quantas vezes ``` aparece para saber se há bloco aberto
    const backtickMatches = processedText.match(/```/g) || [];
    const hasOpenBlock = backtickMatches.length % 2 !== 0;

    // Verificar se o bloco aberto é chart, document ou mindmap
    if (hasOpenBlock) {
        const lastChartIndex = processedText.lastIndexOf('```chart');
        const lastDocIndex = processedText.lastIndexOf('```document');
        const lastMindMapIndex = processedText.lastIndexOf('```mindmap');

        // Encontrar qual é o último bloco aberto
        const lastIndexes = [
            { type: 'chart', index: lastChartIndex, offset: 8 },
            { type: 'document', index: lastDocIndex, offset: 11 },
            { type: 'mindmap', index: lastMindMapIndex, offset: 10 }
        ].filter(t => t.index !== -1).sort((a, b) => b.index - a.index);

        if (lastIndexes.length > 0) {
            const last = lastIndexes[0];
            const afterBlock = processedText.substring(last.index + last.offset);
            
            if (!afterBlock.includes('```')) {
                // Bloco incompleto
                if (last.type === 'mindmap') {
                    hasStreamingMindMap = true;
                    processedText = processedText.substring(0, last.index) + '\n\n%%%STREAMING_MINDMAP%%%\n\n';
                } else if (last.type === 'document') {
                    hasStreamingDocument = true;
                    processedText = processedText.substring(0, last.index) + '\n\n%%%STREAMING_DOCUMENT%%%\n\n';
                } else if (last.type === 'chart') {
                    hasStreamingChart = true;
                    processedText = processedText.substring(0, last.index) + '\n\n%%%STREAMING_CHART%%%\n\n';
                }
            }
        }
    }

    // Extrair blocos de gráficos COMPLETOS (substitui por marcadores temporários)
    let chartData = { cleanedText: processedText, charts: [] };
    if (typeof extractChartBlocks === 'function') {
        chartData = extractChartBlocks(processedText);
    }
    processedText = chartData.cleanedText;

    // Extrair blocos de documentos (substitui por marcadores temporários)
    let documentData = { cleanedText: processedText, documents: [] };
    if (typeof extractDocumentBlocks === 'function') {
        documentData = extractDocumentBlocks(processedText);
    }
    processedText = documentData.cleanedText;

    // Extrair blocos de mapas mentais COMPLETOS
    let mindmapData = { cleanedText: processedText, mindmaps: [] };
    if (typeof extractMindMapBlocks === 'function') {
        mindmapData = extractMindMapBlocks(processedText);
    }
    processedText = mindmapData.cleanedText;

    // ===== PRESERVAR CARROSSÉIS DE IMAGENS =====
    // Extrair carrosséis HTML antes do marked para não serem modificados
    const imageCarousels = [];
    processedText = processedText.replace(/<div class="topic-images-carousel"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, (match) => {
        const id = 'CAROUSEL_' + imageCarousels.length;
        imageCarousels.push({ id, html: match });
        return `\n%%%${id}%%%\n`;
    });
    // ===== FIM PRESERVAR CARROSSÉIS =====

    // Segurar linhas em branco (fora de bloco de código) pra não sumirem
    let inCodeFence = false;
    const preservedBlankLines = processedText
        .split("\n")
        .map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith("```")) {
                inCodeFence = !inCodeFence;
                return line;
            }
            if (!inCodeFence && trimmed === "") {
                return "&nbsp;";
            }
            return line;
        })
        .join("\n");

    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    // Renderer customizado: links mostram a URL em azul, sem esconder atrás de texto markdown
    const renderer = new marked.Renderer();
    renderer.link = function(href, title, text) {
        // Se href é objeto (marked v4+), extrair propriedades
        var url = typeof href === 'object' ? href.href : href;
        var linkText = typeof href === 'object' ? href.text : text;
        // Mostrar sempre a URL como texto do link
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    };

    let html = marked.parse(preservedBlankLines, { renderer: renderer });

    // ===== RESTAURAR CARROSSÉIS DE IMAGENS =====
    // Restaurar HTML dos carrosséis preservados
    for (const carousel of imageCarousels) {
        html = html.replace(new RegExp(`(<p>)?%%%${carousel.id}%%%(<\\/p>)?`, 'g'), carousel.html);
    }
    // ===== FIM RESTAURAR CARROSSÉIS =====

    // Converter marcador de streaming chart para placeholder HTML estático
    if (hasStreamingChart) {
        html = html.replace(/%%%STREAMING_CHART%%%|<p>%%%STREAMING_CHART%%%<\/p>/g,
            `<div id="${STREAMING_CHART_PLACEHOLDER_ID}" class="chart-placeholder chart-generating"><div class="chart-loading-static"><i class="fa-solid fa-chart-column"></i><span>Gerando gráfico...</span></div></div>`);
    }

    // Converter marcador de streaming document para placeholder HTML estático
    if (hasStreamingDocument) {
        html = html.replace(/%%%STREAMING_DOCUMENT%%%|<p>%%%STREAMING_DOCUMENT%%%<\/p>/g,
            `<div class="document-placeholder document-generating"><div class="document-loading"><i class="fa-solid fa-file-lines fa-beat-fade"></i><span>Gerando documento...</span></div></div>`);
    }

    // Converter marcador de streaming mindmap para placeholder HTML estático
    if (hasStreamingMindMap) {
        html = html.replace(/%%%STREAMING_MINDMAP%%%|<p>%%%STREAMING_MINDMAP%%%<\/p>/g,
            `<div class="mindmap-placeholder mindmap-generating"><div class="mindmap-loading"><i class="fa-solid fa-diagram-project fa-beat-fade"></i><span>Gerando mapa mental...</span></div></div>`);
    }

    // Converter marcadores de gráfico COMPLETO para placeholders HTML estáticos
    html = html.replace(/%%%CHART_(chart-[\w-]+)%%%/g, '<div class="chart-placeholder" data-chart-id="$1"><div class="chart-loading-static"><i class="fa-solid fa-chart-column"></i><span>Carregando gráfico...</span></div></div>');

    // Converter marcadores de mapa mental COMPLETO para placeholders HTML estáticos
    html = html.replace(/%%%MINDMAP_(mindmap-[\w-]+)%%%/g, '<div class="mindmap-placeholder" data-mindmap-id="$1"><div class="mindmap-loading"><i class="fa-solid fa-diagram-project"></i><span>Carregando mapa mental...</span></div></div>');

    // Limpar tags <p> extras ao redor dos placeholders
    html = html.replace(/<p>\s*(<div class="chart-placeholder"[^>]*>[\s\S]*?<\/div>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<div class="mindmap-placeholder"[^>]*>[\s\S]*?<\/div>)\s*<\/p>/g, '$1');

    // Adicionar header aos blocos de código
    html = html.replace(
        /<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g,
        function (match, lang, code) {
            const displayLang = lang || "texto";
            const codeId = "code-" + Math.random().toString(36).substr(2, 9);
            return `
                <div style="position: relative;">
                    <div class="code-header">
                        <span class="code-lang">${escapeHtml(displayLang)}</span>
                        <button type="button" class="copy-code-btn" data-code-id="${codeId}" onclick="copyCodeBlock('${codeId}')">
                            <i class="fa-regular fa-copy"></i> copiar
                        </button>
                    </div>
                    <pre id="${codeId}"><code class="hljs language-${escapeHtml(lang)}">${code}</code></pre>
                </div>
            `;
        }
    );

    // Envolver tabelas em div com scroll horizontal
    html = html.replace(/(<table[^>]*>[\s\S]*?<\/table>)/g, '<div style="overflow-x: auto;">$1</div>');

    // Highlight syntax
    setTimeout(() => {
        document.querySelectorAll("pre code.hljs").forEach(block => {
            hljs.highlightElement(block);
        });
    }, 0);

    // Renderizar gráficos pendentes
    if (chartData.charts.length > 0 && typeof renderPendingCharts === 'function') {
        setTimeout(() => {
            renderPendingCharts(chartData.charts);
        }, 150);
    }

    // Renderizar mapas mentais pendentes
    if (mindmapData.mindmaps.length > 0 && typeof renderPendingMindMaps === 'function') {
        setTimeout(() => {
            renderPendingMindMaps(mindmapData.mindmaps);
        }, 150);
    }

    // Converter marcadores de documento para placeholders HTML
    html = html.replace(/%%%DOCUMENT_(doc-[\w-]+)%%%|<p>%%%DOCUMENT_(doc-[\w-]+)%%%<\/p>/g,
        (match, id1, id2) => {
            const docId = id1 || id2;
            return `<div class="document-placeholder" data-doc-id="${docId}"><div class="document-loading"><i class="fa-solid fa-file-lines"></i><span>Preparando documento...</span></div></div>`;
        }
    );

    // Renderizar documentos pendentes
    if (documentData.documents.length > 0 && typeof renderDocuments === 'function') {
        console.log('📝 [utils] ✅ Renderizando', documentData.documents.length, 'documentos!');
        // Usar array local para evitar acúmulo e duplicação
        const docsToRender = [...documentData.documents];

        setTimeout(() => {
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer && docsToRender.length > 0) {
                console.log('📝 [utils] Container encontrado, renderizando docs...');
                docsToRender.forEach(docData => {
                    console.log('📝 [utils] Buscando placeholder para:', docData.id);
                    const placeholder = messagesContainer.querySelector(`[data-doc-id="${docData.id}"]`);
                    if (placeholder && !placeholder.classList.contains('doc-rendered')) {
                        console.log('📝 [utils] ✅ Criando card para:', docData.title);
                        placeholder.classList.add('doc-rendered');
                        const card = createDocumentCard(docData);
                        placeholder.replaceWith(card);
                    } else {
                        console.log('📝 [utils] ❌ Placeholder não encontrado ou já renderizado');
                    }
                });
            }
        }, 200);
    } else {
        if (documentData.documents.length > 0) {
            console.log('📝 [utils] ❌ renderDocuments não disponível!');
        }
    }

    // Converter códigos de ícones para FontAwesome
    html = convertIconCodes(html);
    
    // Normalizar largura de emojis para alinhamento consistente
    html = normalizeEmojiWidth(html);

    // Converter URLs em links clicáveis azuis
    // 1) URLs dentro de <code> inline: tirar o <code> e transformar em <a>
    html = html.replace(/<code>(https?:\/\/[^\s<]+?)<\/code>/gi, function(m, url) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });
    // 2) URLs soltas (não dentro de href/src/a)
    html = html.replace(/(?<!href="|src="|">)(https?:\/\/[^\s<>"]+)(?![^<]*<\/a>)/g, function(m, url) {
        var clean = url.replace(/[.,;:!?)]+$/, '');
        return '<a href="' + clean + '" target="_blank" rel="noopener noreferrer">' + clean + '</a>';
    });

    return html;
}

// Copiar bloco de código
window.copyCodeBlock = function (codeId) {
    const codeBlock = document.getElementById(codeId);
    if (!codeBlock) return;

    const text = codeBlock.innerText;
    const button = document.querySelector(`[data-code-id="${codeId}"]`);

    if (!navigator.clipboard) {
        const tmp = document.createElement("textarea");
        tmp.value = text;
        tmp.style.position = "fixed";
        tmp.style.left = "-9999px";
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        document.body.removeChild(tmp);
    } else {
        navigator.clipboard.writeText(text).catch(err => console.error(err));
    }

    if (button) {
        button.classList.add("copied");
        setTimeout(() => {
            button.classList.remove("copied");
        }, 900);
    }
};

// Atualizar bubble preservando placeholders de streaming (gráficos, documentos, mapas mentais)
function updateBubbleContent(bubble, text) {
    if (!bubble) return;
    
    // Registrar para background e acumular texto
    if (typeof window.registerBackgroundMessageTarget === 'function') {
        // Registrar o bubble apenas uma vez
        if (!bubble._registeredForBackground) {
            window.registerBackgroundMessageTarget(bubble.closest('.message-row'));
            bubble._registeredForBackground = true;
        }
    }
    
    // Acumular texto para background
    if (typeof window.appendBackgroundToken === 'function') {
        bubble._lastText = text;
    }
    
    // Se estamos em background, pular atualização visual (será feita no resume)
    if (typeof window.isInBackground === 'function' && window.isInBackground()) {
        console.log('📱 Em background, acumulando texto...');
        return;
    }

    const html = formatMarkdown(text);

    // Verificar se já existe um placeholder de streaming no bubble
    const existingPlaceholder = bubble.querySelector('#' + STREAMING_CHART_PLACEHOLDER_ID);

    if (existingPlaceholder && html.includes(STREAMING_CHART_PLACEHOLDER_ID)) {
        // Preservar o placeholder existente para manter a animação
        // Criar um container temporário para o novo HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Encontrar o novo placeholder no HTML gerado
        const newPlaceholder = temp.querySelector('#' + STREAMING_CHART_PLACEHOLDER_ID);

        if (newPlaceholder) {
            // Substituir o novo placeholder pelo existente (para manter animação)
            newPlaceholder.replaceWith(existingPlaceholder);
        }

        bubble.innerHTML = temp.innerHTML;
    } else {
        // Não há placeholder ou é a primeira vez - atualizar normalmente
        bubble.innerHTML = html;
    }
}

// Expor globalmente
window.updateBubbleContent = updateBubbleContent;

// ===== AUTO-SCROLL =====
let shouldAutoScroll = true;
let autoScrollRAF = null;

function isNearBottom() {
    if (!contentEl) return true;
    const threshold = 80;
    return (contentEl.scrollHeight - contentEl.clientHeight - contentEl.scrollTop) <= threshold;
}

function scrollMessagesToBottom(force = false) {
    if (!contentEl) return;
    if (!force && !shouldAutoScroll) return;

    if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = requestAnimationFrame(() => {
        contentEl.scrollTop = contentEl.scrollHeight;
        autoScrollRAF = null;
    });
}

// Scroll forçado para o fim do chat ao abrir uma conversa
function scrollChatToEnd() {
    const scrollToLastMessage = () => {
        // Buscar a última mensagem e fazer scrollIntoView
        const messages = document.querySelectorAll(".message-row");
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            lastMessage.scrollIntoView({ behavior: "instant", block: "end" });
        }
    };

    // Executar várias vezes para garantir
    scrollToLastMessage();
    requestAnimationFrame(scrollToLastMessage);
    setTimeout(scrollToLastMessage, 0);
    setTimeout(scrollToLastMessage, 50);
    setTimeout(scrollToLastMessage, 100);
    setTimeout(scrollToLastMessage, 300);
    setTimeout(scrollToLastMessage, 500);
}

// ===== AUTO-RESIZE TEXTAREA =====
function autoResize() {
    // Constantes baseadas no CSS
    const baseHeight = 24; // altura inicial do CSS (height: 24px)
    const textareaPadding = 4; // padding-top do textarea
    const tolerance = baseHeight + textareaPadding + 2; // tolerância para 1 linha
    const maxHeight = Math.floor(window.innerHeight * 0.30);
    const wrapperMinHeight = 52;
    const wrapperPadding = 28;

    // Se vazio, manter altura base do CSS
    if (!input.value) {
        input.style.height = baseHeight + 'px';
        input.style.overflowY = 'hidden';
        inputWrapper.style.height = wrapperMinHeight + 'px';
        inputWrapper.style.borderRadius = '40px';
        // Botão cancelar edição acima da barra (altura da barra + padding + margem de 3px)
        document.documentElement.style.setProperty('--cancel-edit-bottom', (wrapperMinHeight + 25) + 'px');
        return;
    }

    // Resetar para altura base para medir
    input.style.height = baseHeight + 'px';

    // Obter altura necessária diretamente do scrollHeight
    const scrollH = input.scrollHeight;

    // Se cabe na altura base (com tolerância para padding), não expandir
    if (scrollH <= tolerance) {
        input.style.height = baseHeight + 'px';
        input.style.overflowY = 'hidden';
        inputWrapper.style.height = wrapperMinHeight + 'px';
        inputWrapper.style.borderRadius = '40px';
        // Atualizar posição do botão cancelar edição também neste caso
        document.documentElement.style.setProperty('--cancel-edit-bottom', (wrapperMinHeight + 25) + 'px');
        return;
    }

    // Usar scrollHeight diretamente (já é o valor exato necessário)
    let finalHeight = scrollH;

    // Aplicar limite máximo
    if (finalHeight > maxHeight) finalHeight = maxHeight;

    // Aplicar altura
    input.style.height = finalHeight + 'px';

    // Overflow só quando atingir máximo
    input.style.overflowY = finalHeight >= maxHeight ? 'auto' : 'hidden';

    // Ajustar wrapper
    const wrapperHeight = Math.max(wrapperMinHeight, finalHeight + wrapperPadding);
    inputWrapper.style.height = wrapperHeight + 'px';

    // Border radius - mais de 1 linha quando scrollH > tolerance
    inputWrapper.style.borderRadius = scrollH > tolerance ? '24px' : '40px';
    
    // Atualizar posição do botão cancelar edição - acima da barra com 3px de margem
    document.documentElement.style.setProperty('--cancel-edit-bottom', (wrapperHeight + 25) + 'px');
}

// ===== CONVERSÃO DE CORES =====
function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ===== REDE =====
function isNetworkOnline() {
    try {
        if (isCordovaReady && navigator.connection && typeof navigator.connection.type !== "undefined") {
            const type = navigator.connection.type;
            if (type === navigator.connection.NONE || type === "none") {
                return false;
            }
        }
        if (typeof navigator.onLine === "boolean" && !navigator.onLine) {
            return false;
        }
    } catch (e) {
        console.warn("Falha ao checar estado da rede:", e);
    }
    return true;
}

// ===== LINK PREVIEW CARDS =====

// Extrair domínio de uma URL
function extractDomain(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

// Obter favicon de um site (tamanho grande)
function getFaviconUrl(domain, size = 32) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

// Criar HTML do card de link preview - design simples e limpo
function createLinkPreviewCard(url, title) {
    const domain = extractDomain(url);
    const displayTitle = title || domain;
    const faviconLarge = getFaviconUrl(domain, 64);
    const faviconSmall = getFaviconUrl(domain, 32);
    
    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="link-preview-card">' +
        '<div class="link-preview-icon">' +
            '<img src="' + faviconLarge + '" alt="" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"/>' +
            '<div class="link-icon-fallback"><i class="fa-solid fa-link"></i></div>' +
        '</div>' +
        '<div class="link-preview-info">' +
            '<div class="link-preview-title">' + escapeHtml(displayTitle) + '</div>' +
            '<div class="link-preview-domain">' +
                '<img src="' + faviconSmall + '" alt=""/>' +
                '<span>' + domain + '</span>' +
                '<i class="fa-solid fa-arrow-up-right-from-square"></i>' +
            '</div>' +
        '</div>' +
    '</a>';
}

// Converter links markdown [texto](url) em cards de preview
function convertLinksToPreviewCards(html) {
    // PASSO 1: Converter <li> inteiros que contêm um link (label + link → card limpo)
    // Captura: <li> ... <a href="URL">TEXT</a> ... </li>
    html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, function(fullMatch, inner) {
        // Verificar se esse <li> contém um link HTTP
        var linkMatch = inner.match(/<a\s+href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>/);
        if (!linkMatch) {
            // Tentar link markdown puro
            var mdMatch = inner.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
            if (!mdMatch) return fullMatch; // sem link, manter original
            var card = createLinkPreviewCard(mdMatch[2], mdMatch[1]);
            return '<li style="list-style:none;padding:0;margin:0 0 4px 0">' + card + '</li>';
        }
        var card = createLinkPreviewCard(linkMatch[1], linkMatch[2] || null);
        return '<li style="list-style:none;padding:0;margin:0 0 4px 0">' + card + '</li>';
    });
    
    // PASSO 2: Converter links markdown puros [texto](url) fora de <li>
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, function(match, text, url) {
        return createLinkPreviewCard(url, text);
    });
    
    // PASSO 3: Converter <a> tags restantes (mas NÃO os que já são cards)
    html = html.replace(/<a\s+href="(https?:\/\/[^"]+)"(?![^>]*link-preview-card)[^>]*>([^<]+)<\/a>/g, function(match, url, text) {
        return createLinkPreviewCard(url, text);
    });
    
    // PASSO 4: Converter URLs soltas
    html = html.replace(/(?<!href="|src="|">)(https?:\/\/[^\s<>"]+)(?![^<]*<\/a>)/g, function(match, url) {
        var cleanUrl = url.replace(/[.,;:!?)]+$/, '');
        return createLinkPreviewCard(cleanUrl, null);
    });
    
    return html;
}

// Expor globalmente
window.createLinkPreviewCard = createLinkPreviewCard;
window.convertLinksToPreviewCards = convertLinksToPreviewCards;
window.extractDomain = extractDomain;
