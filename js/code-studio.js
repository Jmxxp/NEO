// ===== CODE STUDIO - IDE Completa com IA =====

// Função para limpar marcadores de código markdown que podem vazar para o output
function cleanCodeMarkers(code) {
    if (!code) return code;
    
    // Remove marcadores de abertura no início (```html, ```css, ```javascript, ```js, etc.)
    code = code.replace(/^```(?:html|css|javascript|js|typescript|ts)?\s*\n?/i, '');
    
    // Remove marcadores de fechamento no final (```)
    code = code.replace(/\n?```\s*$/i, '');
    
    // Remove marcadores que podem estar em qualquer lugar (mais agressivo)
    code = code.replace(/^['"`]{3}(?:html|css|javascript|js)?\s*$/gim, '');
    
    // Remove linhas que são apenas ```
    code = code.replace(/^```\s*$/gm, '');
    
    // Remove aspas triplas no início e fim (variação)
    code = code.replace(/^['"]{3}(?:html|css|javascript|js)?\s*\n?/i, '');
    code = code.replace(/\n?['"]{3}\s*$/i, '');
    
    return code.trim();
}

var codeStudioState = {
    html: '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Code Studio</title>\n</head>\n<body>\n  <div class="app">\n    <div class="header">\n      <span class="logo">💻</span>\n      <h1>Code Studio</h1>\n    </div>\n    \n    <div class="card">\n      <h2>🚀 Bem-vindo!</h2>\n      <p>Seu editor de código com IA integrada</p>\n    </div>\n    \n    <div class="features">\n      <div class="feature">\n        <span>✍️</span>\n        <p>Edite HTML, CSS e JS</p>\n      </div>\n      <div class="feature">\n        <span>🤖</span>\n        <p>Peça ajuda à IA</p>\n      </div>\n      <div class="feature">\n        <span>⚡</span>\n        <p>Preview em tempo real</p>\n      </div>\n    </div>\n    \n    <button id="btn">Começar a Criar</button>\n    <p class="hint">Use o chat abaixo para pedir à IA</p>\n  </div>\n</body>\n</html>',
    css: '* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n  background: linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%);\n  min-height: 100vh;\n  color: #fff;\n}\n\n.app {\n  padding: 24px 20px;\n  max-width: 400px;\n  margin: 0 auto;\n}\n\n.header {\n  text-align: center;\n  margin-bottom: 24px;\n}\n\n.logo {\n  font-size: 40px;\n  display: block;\n  margin-bottom: 8px;\n}\n\nh1 {\n  font-size: 24px;\n  font-weight: 700;\n  background: linear-gradient(135deg, #60a5fa, #a78bfa);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n\n.card {\n  background: rgba(255,255,255,0.05);\n  border: 1px solid rgba(255,255,255,0.1);\n  border-radius: 16px;\n  padding: 24px;\n  text-align: center;\n  margin-bottom: 24px;\n}\n\n.card h2 {\n  font-size: 20px;\n  margin-bottom: 8px;\n}\n\n.card p {\n  color: rgba(255,255,255,0.7);\n  font-size: 14px;\n}\n\n.features {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  margin-bottom: 24px;\n}\n\n.feature {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  background: rgba(255,255,255,0.05);\n  border-radius: 12px;\n  padding: 14px 16px;\n}\n\n.feature span {\n  font-size: 20px;\n}\n\n.feature p {\n  color: rgba(255,255,255,0.9);\n  font-size: 14px;\n}\n\nbutton {\n  width: 100%;\n  background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n  color: #fff;\n  border: none;\n  padding: 16px;\n  border-radius: 12px;\n  font-size: 16px;\n  font-weight: 600;\n  cursor: pointer;\n  margin-bottom: 16px;\n}\n\nbutton:active {\n  transform: scale(0.98);\n  opacity: 0.9;\n}\n\n.hint {\n  text-align: center;\n  color: rgba(255,255,255,0.5);\n  font-size: 12px;\n}',
    js: '// Code Studio - Seu editor com IA!\n\nconst btn = document.getElementById("btn");\n\nbtn.onclick = () => {\n  btn.textContent = "🎉 Vamos lá!";\n  btn.style.background = "linear-gradient(135deg, #10b981, #3b82f6)";\n  \n  setTimeout(() => {\n    alert("Dica: Use o chat abaixo para pedir à IA criar ou modificar seu código!");\n  }, 300);\n};',
    currentLang: 'html',
    projectName: 'Meu Projeto',
    savedProjects: [],
    isProcessingAI: false,
    consoleHistory: [],
    autoRun: true,
    fullscreenLang: 'html',
    // Sistema de confirmação de alterações
    pendingChanges: null,
    previousState: null
};

// Carregar estado salvo do localStorage
function loadCodeStudioState() {
    try {
        // Versão do código default - incrementar para forçar reset
        const CODE_VERSION = 4;
        const savedVersion = localStorage.getItem('codeStudioVersion');
        
        // Se versão mudou, limpar estado antigo
        if (savedVersion !== String(CODE_VERSION)) {
            localStorage.removeItem('codeStudioState');
            localStorage.setItem('codeStudioVersion', String(CODE_VERSION));
            return; // Usa código default
        }
        
        const saved = localStorage.getItem('codeStudioState');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(codeStudioState, parsed);
        }
        const projects = localStorage.getItem('codeStudioProjects');
        if (projects) {
            codeStudioState.savedProjects = JSON.parse(projects);
        }
    } catch (e) {
        console.log('Erro ao carregar estado:', e);
    }
}

// Salvar estado no localStorage
function saveCodeStudioState() {
    try {
        const toSave = {
            html: codeStudioState.html,
            css: codeStudioState.css,
            js: codeStudioState.js,
            projectName: codeStudioState.projectName,
            autoRun: codeStudioState.autoRun
        };
        localStorage.setItem('codeStudioState', JSON.stringify(toSave));
    } catch (e) {
        console.log('Erro ao salvar estado:', e);
    }
}

function openCodeStudio() {
    console.log('openCodeStudio chamado!');
    if (typeof closeToolsMenu === 'function') {
        closeToolsMenu();
    }
    
    loadCodeStudioState();
    
    var modal = document.getElementById('codeStudioModal');
    if (modal) {
        modal.classList.add('show');
        // Adicionar estado no histórico para botão voltar funcionar
        history.pushState({ codeStudioOpen: true }, '', '');
        initCodeStudio();
    }
}

function closeCodeStudio() {
    // Se estiver editando mensagem, cancela a edição em vez de fechar
    if (codeStudioState.isEditing) {
        cancelEditMessage();
        return;
    }
    
    saveCodeStudioCurrentCode();
    saveCodeStudioState();
    var modal = document.getElementById('codeStudioModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Expor funções globalmente para acesso do back button
window.openCodeStudio = openCodeStudio;
window.closeCodeStudio = closeCodeStudio;

function initCodeStudio() {
    var backBtn = document.getElementById('codeStudioBackBtn');
    var downloadBtn = document.getElementById('codeStudioDownloadBtn');
    var editor = document.getElementById('codeStudioEditor');
    var langTabs = document.querySelectorAll('.code-studio-lang-tab');
    var headerTabs = document.querySelectorAll('.code-studio-header-tab');
    var sendBtn = document.getElementById('codeStudioSendBtn');
    var chatInput = document.getElementById('codeStudioChatInput');
    var clearConsoleBtn = document.getElementById('csClearConsole');
    var fullscreenCodeBtn = document.getElementById('csExpandCode');
    var fullscreenPreviewBtn = document.getElementById('csExpandPreview');
    
    // Limpar console
    codeStudioState.consoleHistory = [];
    updateCodeStudioConsole();
    codeStudioLog('info', 'Code Studio pronto! Digite seu código ou peça ajuda à IA.');
    
    // Verificar e mostrar status da API no chat (usando modelo selecionado em Configurações > Avançado > Modelo de IA)
    var apiProvider = localStorage.getItem('neo_selected_provider') || localStorage.getItem('apiProvider') || 'gemini';
    var apiKey = '';
    
    // Usar getNextValidApiKey se disponível (gerencia múltiplas chaves e fallbacks)
    if (typeof getNextValidApiKey === 'function') {
        apiKey = getNextValidApiKey(apiProvider) || '';
    }
    
    // Fallback para localStorage com chaves conhecidas
    if (!apiKey) {
        var fallbackKeys = {
            'gemini': ['neo_user_api_key', 'geminiApiKey'],
            'openai': ['neo_api_openai', 'openaiApiKey'],
            'anthropic': ['neo_api_anthropic', 'anthropicApiKey'],
            'deepseek': ['neo_api_deepseek', 'deepseekApiKey'],
            'groq': ['neo_api_groq', 'groqApiKey'],
            'openrouter': ['neo_api_openrouter', 'openrouterApiKey']
        };
        var keys = fallbackKeys[apiProvider] || fallbackKeys['gemini'];
        for (var i = 0; i < keys.length; i++) {
            var val = localStorage.getItem(keys[i]);
            if (val && val.trim()) {
                apiKey = val.trim();
                break;
            }
        }
    }
    
    // Obter nome do modelo selecionado para exibição
    var selectedModel = localStorage.getItem('neo_selected_model') || 'gemini-2.5-flash';
    var modelDisplayName = selectedModel.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    console.log('[CodeStudio Init] Provider:', apiProvider, 'Model:', selectedModel, 'Key:', apiKey ? 'Configurada' : 'NÃO CONFIGURADA');
    
    var chatMessages = document.getElementById('codeStudioChatMessages');
    if (chatMessages) {
        if (apiKey) {
            chatMessages.innerHTML = '<div class="code-studio-chat-message ai">✅ IA pronta! (' + modelDisplayName + ') - Peça para criar ou modificar código</div>';
        } else {
            chatMessages.innerHTML = '<div class="code-studio-chat-message ai">⚠️ Configure uma API Key em Configurações para usar a IA</div>';
        }
    }
    
    // Back button
    backBtn.onclick = closeCodeStudio;
    
    // Project name input
    var projectNameInput = document.getElementById('codeStudioProjectName');
    if (projectNameInput) {
        projectNameInput.value = codeStudioState.projectName || 'Meu Projeto';
        projectNameInput.oninput = function() {
            codeStudioState.projectName = this.value || 'Meu Projeto';
            saveCodeStudioState();
        };
    }
    
    // Load current code
    loadCodeStudioCode(codeStudioState.currentLang);
    
    // Atualizar aba ativa
    langTabs.forEach(function(t) {
        t.classList.toggle('active', t.dataset.lang === codeStudioState.currentLang);
    });
    
    // Language tabs
    langTabs.forEach(function(tab) {
        tab.onclick = function() {
            saveCodeStudioCurrentCode();
            langTabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            codeStudioState.currentLang = tab.dataset.lang;
            loadCodeStudioCode(codeStudioState.currentLang);
        };
    });
    
    // Header tab (Projeto)
    headerTabs.forEach(function(tab) {
        tab.onclick = function() {
            handleCodeStudioHeaderTab(tab.dataset.tab);
        };
    });
    
    // Download button
    if (downloadBtn) downloadBtn.onclick = openDownloadAppModal;
    
    // Clear console
    if (clearConsoleBtn) {
        clearConsoleBtn.onclick = function() {
            codeStudioState.consoleHistory = [];
            updateCodeStudioConsole();
        };
    }
    
    // Fullscreen buttons
    if (fullscreenCodeBtn) {
        fullscreenCodeBtn.onclick = openFullscreenCode;
    }
    if (fullscreenPreviewBtn) {
        fullscreenPreviewBtn.onclick = openFullscreenPreview;
    }
    
    // Close fullscreen buttons
    var closeCodeFS = document.getElementById('csCloseFullscreenCode');
    var closePreviewFS = document.getElementById('csCloseFullscreenPreview');
    if (closeCodeFS) closeCodeFS.onclick = closeFullscreenCode;
    if (closePreviewFS) closePreviewFS.onclick = closeFullscreenPreview;
    
    // Fullscreen code tabs
    document.querySelectorAll('.cs-fs-tab').forEach(function(tab) {
        tab.onclick = function() {
            document.querySelectorAll('.cs-fs-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            codeStudioState.fullscreenLang = tab.dataset.lang;
            updateFullscreenCode();
        };
    });
    
    // Editor events - input com highlight
    editor.oninput = function() {
        saveCodeStudioCurrentCode();
        updateLineNumbers();
        updateSyntaxHighlight();
        if (codeStudioState.autoRun) {
            clearTimeout(window.codeStudioRunTimeout);
            window.codeStudioRunTimeout = setTimeout(runCodeStudio, 800);
        }
    };
    
    // Sincronizar scroll entre editor, highlight e line numbers
    editor.onscroll = function() {
        var lineNumbers = document.getElementById('codeStudioLineNumbers');
        var highlight = document.getElementById('codeStudioHighlight');
        if (lineNumbers) {
            lineNumbers.scrollTop = editor.scrollTop;
        }
        if (highlight) {
            highlight.scrollTop = editor.scrollTop;
            highlight.scrollLeft = editor.scrollLeft;
        }
    };
    
    // Tab key support in editor
    editor.onkeydown = function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 2;
            saveCodeStudioCurrentCode();
            updateSyntaxHighlight();
        }
    };
    
    // Chat send com IA
    sendBtn.onclick = handleCodeStudioAIRequest;
    
    chatInput.onkeypress = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    };
    
    // Botão de limpar chat
    var clearChatBtn = document.getElementById('codeStudioClearChatBtn');
    if (clearChatBtn) {
        clearChatBtn.onclick = clearChatMessages;
    }
    
    // Initial line numbers and syntax highlight
    updateLineNumbers();
    updateSyntaxHighlight();
    
    // Executar código inicial
    setTimeout(runCodeStudio, 100);
}

// ===== SYNTAX HIGHLIGHTING =====
function highlightHTML(code) {
    // Escapar caracteres especiais
    var escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Usar marcadores temporários para não conflitar
    var result = '';
    var i = 0;
    
    while (i < escaped.length) {
        // Comentários HTML
        if (escaped.substr(i, 7) === '&lt;!--') {
            var endComment = escaped.indexOf('--&gt;', i);
            if (endComment !== -1) {
                result += '<span class="hl-comment">' + escaped.substring(i, endComment + 6) + '</span>';
                i = endComment + 6;
                continue;
            }
        }
        
        // Doctype
        if (escaped.substr(i, 10).toLowerCase() === '&lt;!docty') {
            var endDoctype = escaped.indexOf('&gt;', i);
            if (endDoctype !== -1) {
                result += '<span class="hl-doctype">' + escaped.substring(i, endDoctype + 4) + '</span>';
                i = endDoctype + 4;
                continue;
            }
        }
        
        // Tags
        if (escaped.substr(i, 4) === '&lt;') {
            var tagEnd = escaped.indexOf('&gt;', i);
            if (tagEnd !== -1) {
                var tagContent = escaped.substring(i + 4, tagEnd);
                var isClosing = tagContent.charAt(0) === '/';
                if (isClosing) tagContent = tagContent.substring(1);
                
                // Extrair nome da tag
                var tagNameMatch = tagContent.match(/^([\w-]+)/);
                if (tagNameMatch) {
                    var tagName = tagNameMatch[1];
                    var rest = tagContent.substring(tagName.length);
                    
                    // Processar atributos
                    var attrsHtml = rest.replace(/([\w-]+)\s*=\s*"([^"]*)"/g, '<span class="hl-attr">$1</span>=<span class="hl-string">"$2"</span>');
                    attrsHtml = attrsHtml.replace(/([\w-]+)\s*=\s*'([^']*)'/g, '<span class="hl-attr">$1</span>=<span class="hl-string">\'$2\'</span>');
                    
                    result += '<span class="hl-bracket">&lt;' + (isClosing ? '/' : '') + '</span>';
                    result += '<span class="hl-tag">' + tagName + '</span>';
                    result += attrsHtml;
                    result += '<span class="hl-bracket">&gt;</span>';
                    i = tagEnd + 4;
                    continue;
                }
            }
        }
        
        result += escaped.charAt(i);
        i++;
    }
    
    return result;
}

function highlightCSS(code) {
    var escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    var result = '';
    var lines = escaped.split('\n');
    
    for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        
        // Comentários de linha completa
        if (line.trim().indexOf('/*') === 0 || line.indexOf('*/') !== -1 || (line.indexOf('/*') === -1 && line.indexOf('*/') === -1 && result.indexOf('/*') > result.lastIndexOf('*/'))) {
            // Simplificado: colorir comentários inline
        }
        
        // @rules
        line = line.replace(/(@[\w-]+)/g, '<span class="hl-media">$1</span>');
        
        // Propriedade: valor;
        line = line.replace(/^(\s*)([\w-]+)(\s*:\s*)([^;]+)(;?)$/gm, function(match, indent, prop, colon, value, semi) {
            var coloredValue = value
                .replace(/(\d+\.?\d*)(px|em|rem|%|vh|vw|vmin|vmax|deg|s|ms|fr)/g, '<span class="hl-number">$1</span><span class="hl-unit">$2</span>')
                .replace(/(#[0-9a-fA-F]{3,8})/g, '<span class="hl-value">$1</span>')
                .replace(/\b(none|auto|inherit|flex|grid|block|inline|absolute|relative|fixed|center|left|right|solid|bold|italic|nowrap|pointer|hidden|visible|transparent)\b/g, '<span class="hl-value">$1</span>');
            return indent + '<span class="hl-property">' + prop + '</span>' + colon + coloredValue + (semi ? ';' : '');
        });
        
        // Seletores (linhas com { no final)
        line = line.replace(/^([^{}:]+)(\{)\s*$/gm, '<span class="hl-selector">$1</span>$2');
        
        // Comentários inline
        line = line.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
        
        result += line + (li < lines.length - 1 ? '\n' : '');
    }
    
    return result;
}

function highlightJS(code) {
    var escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Proteger strings (guardar e substituir por marcadores)
    var strings = [];
    escaped = escaped.replace(/"(?:[^"\\]|\\.)*"/g, function(m) { strings.push(m); return '\x00STR' + (strings.length-1) + '\x00'; });
    escaped = escaped.replace(/'(?:[^'\\]|\\.)*'/g, function(m) { strings.push(m); return '\x00STR' + (strings.length-1) + '\x00'; });
    escaped = escaped.replace(/`(?:[^`\\]|\\.)*`/g, function(m) { strings.push(m); return '\x00STR' + (strings.length-1) + '\x00'; });
    
    // Comentários
    escaped = escaped.replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
    
    // Keywords
    escaped = escaped.replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|delete|void)\b/g, '<span class="hl-keyword">$1</span>');
    
    // Booleanos e especiais
    escaped = escaped.replace(/\b(true|false)\b/g, '<span class="hl-boolean">$1</span>');
    escaped = escaped.replace(/\b(null|undefined|NaN|Infinity)\b/g, '<span class="hl-null">$1</span>');
    escaped = escaped.replace(/\b(this|super)\b/g, '<span class="hl-this">$1</span>');
    
    // Built-ins
    escaped = escaped.replace(/\b(console|document|window|Array|Object|String|Number|Boolean|Date|Math|JSON|Promise|Map|Set|Error|setTimeout|setInterval|fetch|localStorage)\b/g, '<span class="hl-class">$1</span>');
    
    // Métodos (depois de .)
    escaped = escaped.replace(/\.([\w$]+)\s*\(/g, '.<span class="hl-method">$1</span>(');
    
    // Funções
    escaped = escaped.replace(/\b([a-zA-Z_$][\w$]*)\s*\(/g, '<span class="hl-function">$1</span>(');
    
    // Números
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    
    // Arrow
    escaped = escaped.replace(/(=&gt;)/g, '<span class="hl-operator">$1</span>');
    
    // Restaurar strings
    for (var i = 0; i < strings.length; i++) {
        escaped = escaped.replace('\x00STR' + i + '\x00', '<span class="hl-string">' + strings[i] + '</span>');
    }
    
    return escaped;
}

function updateLineNumbers() {
    var editor = document.getElementById('codeStudioEditor');
    var lineNumbers = document.getElementById('codeStudioLineNumbers');
    if (!editor || !lineNumbers) return;
    
    var lines = editor.value.split('\n').length;
    var html = '';
    for (var i = 1; i <= lines; i++) {
        html += i + '\n';
    }
    lineNumbers.textContent = html;
}

function updateSyntaxHighlight() {
    var editor = document.getElementById('codeStudioEditor');
    var highlight = document.getElementById('codeStudioHighlight');
    if (!editor || !highlight) return;
    
    var code = editor.value;
    var lang = codeStudioState.currentLang;
    var highlighted = '';
    
    if (lang === 'html') {
        highlighted = highlightHTML(code);
    } else if (lang === 'css') {
        highlighted = highlightCSS(code);
    } else if (lang === 'js') {
        highlighted = highlightJS(code);
    } else {
        highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    // Add extra line at end to match textarea scroll
    highlight.innerHTML = highlighted + '\n';
}

// ===== FULLSCREEN VIEWS =====
function openFullscreenCode() {
    saveCodeStudioCurrentCode();
    var modal = document.getElementById('csFullscreenCodeModal');
    if (modal) {
        modal.classList.add('show');
        codeStudioState.fullscreenLang = codeStudioState.currentLang;
        document.querySelectorAll('.cs-fs-tab').forEach(function(t) {
            t.classList.toggle('active', t.dataset.lang === codeStudioState.fullscreenLang);
        });
        updateFullscreenCode();
    }
}

function closeFullscreenCode() {
    var modal = document.getElementById('csFullscreenCodeModal');
    if (modal) modal.classList.remove('show');
}

function updateFullscreenCode() {
    var content = document.getElementById('csFullscreenCodeContent');
    var lineNumbers = document.getElementById('csFullscreenLineNumbers');
    if (!content) return;
    
    var code = '';
    var lang = codeStudioState.fullscreenLang;
    
    if (lang === 'html') code = codeStudioState.html;
    else if (lang === 'css') code = codeStudioState.css;
    else if (lang === 'js') code = codeStudioState.js;
    
    // Aplicar syntax highlighting igual ao editor
    var highlighted = '';
    if (lang === 'html') {
        highlighted = highlightHTML(code);
    } else if (lang === 'css') {
        highlighted = highlightCSS(code);
    } else if (lang === 'js') {
        highlighted = highlightJS(code);
    } else {
        highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    content.innerHTML = highlighted;
    
    // Update line numbers
    if (lineNumbers) {
        var lines = code.split('\n').length;
        var nums = '';
        for (var i = 1; i <= lines; i++) {
            nums += i + '\n';
        }
        lineNumbers.textContent = nums;
    }
}

function openFullscreenPreview() {
    saveCodeStudioCurrentCode();
    var modal = document.getElementById('csFullscreenPreviewModal');
    var iframe = document.getElementById('csFullscreenPreviewIframe');
    if (modal && iframe) {
        modal.classList.add('show');
        
        // Build full HTML (com limpeza de marcadores)
        var fullHTML = cleanCodeMarkers(codeStudioState.html);
        var cleanCSS = cleanCodeMarkers(codeStudioState.css);
        var cleanJS = cleanCodeMarkers(codeStudioState.js);
        
        if (cleanCSS.trim()) {
            if (fullHTML.includes('</head>')) {
                fullHTML = fullHTML.replace('</head>', '<style>\n' + cleanCSS + '\n</style>\n</head>');
            } else {
                fullHTML = '<style>\n' + cleanCSS + '\n</style>\n' + fullHTML;
            }
        }
        
        if (cleanJS.trim()) {
            if (fullHTML.includes('</body>')) {
                fullHTML = fullHTML.replace('</body>', '<script>\n' + cleanJS + '\n<\/script>\n</body>');
            } else {
                fullHTML += '\n<script>\n' + cleanJS + '\n<\/script>';
            }
        }
        
        iframe.srcdoc = fullHTML;
    }
}

function closeFullscreenPreview() {
    var modal = document.getElementById('csFullscreenPreviewModal');
    if (modal) modal.classList.remove('show');
}

function handleCodeStudioHeaderTab(tabName) {
    if (tabName === 'project') {
        showCodeStudioProjectMenu();
    } else if (tabName === 'files') {
        showCodeStudioFilesMenu();
    } else if (tabName === 'settings') {
        showCodeStudioSettingsMenu();
    }
}

function showCodeStudioProjectMenu() {
    var actions = [
        { label: '📄 Novo Projeto', action: 'new' },
        { label: '💾 Salvar Projeto', action: 'save' },
        { label: '📂 Carregar Projeto', action: 'load' },
        { label: ' Exportar HTML', action: 'export' },
        { label: '📋 Copiar Código Completo', action: 'copy' }
    ];
    
    showCodeStudioActionMenu('Projeto: ' + codeStudioState.projectName, actions, function(action) {
        if (action === 'new') newCodeStudioProject();
        else if (action === 'save') saveCodeStudioProject();
        else if (action === 'load') loadCodeStudioProjectList();
        else if (action === 'download') downloadCodeStudioProject();
        else if (action === 'export') exportCodeStudioHTML();
        else if (action === 'copy') copyCodeStudioCode();
    });
}

function showCodeStudioFilesMenu() {
    var files = [
        { label: '📄 index.html', lang: 'html', size: codeStudioState.html.length },
        { label: '🎨 style.css', lang: 'css', size: codeStudioState.css.length },
        { label: '⚡ script.js', lang: 'js', size: codeStudioState.js.length }
    ];
    
    var html = '<div class="code-studio-files-list">';
    files.forEach(function(f) {
        var active = codeStudioState.currentLang === f.lang ? ' active' : '';
        html += '<div class="code-studio-file-item' + active + '" data-lang="' + f.lang + '">';
        html += '<span class="file-icon">' + f.label.split(' ')[0] + '</span>';
        html += '<span class="file-name">' + f.label.split(' ')[1] + '</span>';
        html += '<span class="file-size">' + formatBytes(f.size) + '</span>';
        html += '</div>';
    });
    html += '</div>';
    
    showCodeStudioPopup('Arquivos do Projeto', html, function(popup) {
        popup.querySelectorAll('.code-studio-file-item').forEach(function(item) {
            item.onclick = function() {
                var lang = this.dataset.lang;
                saveCodeStudioCurrentCode();
                codeStudioState.currentLang = lang;
                loadCodeStudioCode(lang);
                document.querySelectorAll('.code-studio-lang-tab').forEach(function(t) {
                    t.classList.toggle('active', t.dataset.lang === lang);
                });
                closeCodeStudioPopup();
            };
        });
    });
}

function showCodeStudioSettingsMenu() {
    var html = '<div class="code-studio-settings">';
    html += '<label class="code-studio-setting">';
    html += '<span>Auto-executar ao digitar</span>';
    html += '<input type="checkbox" id="csAutoRun" ' + (codeStudioState.autoRun ? 'checked' : '') + '>';
    html += '</label>';
    html += '<label class="code-studio-setting">';
    html += '<span>Nome do Projeto</span>';
    html += '<input type="text" id="csProjectName" value="' + escapeHtml(codeStudioState.projectName) + '">';
    html += '</label>';
    html += '<div class="code-studio-setting-info">';
    html += '<p>💡 Use o chat para pedir à IA:</p>';
    html += '<ul>';
    html += '<li>"Crie um jogo da velha"</li>';
    html += '<li>"Adicione um botão de dark mode"</li>';
    html += '<li>"Corrija o erro no meu código"</li>';
    html += '</ul>';
    html += '</div>';
    html += '</div>';
    
    showCodeStudioPopup('Configurações', html, function(popup) {
        popup.querySelector('#csAutoRun').onchange = function() {
            codeStudioState.autoRun = this.checked;
            saveCodeStudioState();
        };
        popup.querySelector('#csProjectName').onchange = function() {
            codeStudioState.projectName = this.value || 'Meu Projeto';
            saveCodeStudioState();
        };
    });
}

function showCodeStudioActionMenu(title, actions, callback) {
    var html = '<div class="code-studio-action-menu">';
    actions.forEach(function(a) {
        html += '<button class="code-studio-action-btn" data-action="' + a.action + '">' + a.label + '</button>';
    });
    html += '</div>';
    
    showCodeStudioPopup(title, html, function(popup) {
        popup.querySelectorAll('.code-studio-action-btn').forEach(function(btn) {
            btn.onclick = function() {
                closeCodeStudioPopup();
                callback(this.dataset.action);
            };
        });
    });
}

function showCodeStudioPopup(title, content, onMount) {
    closeCodeStudioPopup();
    
    var popup = document.createElement('div');
    popup.className = 'code-studio-popup';
    popup.innerHTML = '<div class="code-studio-popup-overlay"></div>' +
        '<div class="code-studio-popup-content">' +
        '<div class="code-studio-popup-header">' +
        '<h3>' + title + '</h3>' +
        '<button class="code-studio-popup-close"><i class="fas fa-times"></i></button>' +
        '</div>' +
        '<div class="code-studio-popup-body">' + content + '</div>' +
        '</div>';
    
    document.getElementById('codeStudioModal').appendChild(popup);
    
    popup.querySelector('.code-studio-popup-overlay').onclick = closeCodeStudioPopup;
    popup.querySelector('.code-studio-popup-close').onclick = closeCodeStudioPopup;
    
    if (onMount) onMount(popup);
    
    setTimeout(function() { popup.classList.add('show'); }, 10);
}

function closeCodeStudioPopup() {
    var popup = document.querySelector('.code-studio-popup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(function() { popup.remove(); }, 200);
    }
}

function newCodeStudioProject() {
    if (confirm('Criar novo projeto? O código atual será perdido se não salvar.')) {
        // Zerar todos os códigos
        codeStudioState.html = '';
        codeStudioState.css = '';
        codeStudioState.js = '';
        codeStudioState.projectName = 'Novo Projeto';
        codeStudioState.currentLang = 'html';
        codeStudioState.previousState = null;
        
        // Limpar chat
        var chat = document.getElementById('codeStudioChatMessages');
        if (chat) chat.innerHTML = '<div class="code-studio-chat-empty">Chat com IA para criar e editar código</div>';
        
        loadCodeStudioCode('html');
        document.querySelectorAll('.code-studio-lang-tab').forEach(function(t) {
            t.classList.toggle('active', t.dataset.lang === 'html');
        });
        runCodeStudio();
        codeStudioLog('success', 'Projeto criado!');
    }
}

function saveCodeStudioProject() {
    saveCodeStudioCurrentCode();
    var name = prompt('Nome do projeto:', codeStudioState.projectName);
    if (!name) return;
    
    var project = {
        name: name,
        html: codeStudioState.html,
        css: codeStudioState.css,
        js: codeStudioState.js,
        date: new Date().toISOString()
    };
    
    // Verificar se já existe
    var existingIndex = codeStudioState.savedProjects.findIndex(function(p) { return p.name === name; });
    if (existingIndex >= 0) {
        codeStudioState.savedProjects[existingIndex] = project;
    } else {
        codeStudioState.savedProjects.push(project);
    }
    
    localStorage.setItem('codeStudioProjects', JSON.stringify(codeStudioState.savedProjects));
    codeStudioState.projectName = name;
    saveCodeStudioState();
    codeStudioLog('success', 'Projeto "' + name + '" salvo!');
}

// Baixar projeto no celular como arquivo ZIP
function downloadCodeStudioProject() {
    saveCodeStudioCurrentCode();
    
    var projectName = codeStudioState.projectName.replace(/[^a-zA-Z0-9]/g, '_') || 'projeto';
    
    // Criar HTML completo
    var fullHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${codeStudioState.projectName}</title>
    <style>
${codeStudioState.css}
    </style>
</head>
<body>
${codeStudioState.html.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '').replace(/<head[\s\S]*?<\/head>/i, '').replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '').trim()}
    <script>
${codeStudioState.js}
    <\/script>
</body>
</html>`;
    
    // Criar blob e fazer download
    var blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    
    var a = document.createElement('a');
    a.href = url;
    a.download = projectName + '.html';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    codeStudioLog('success', 'Arquivo "' + projectName + '.html" baixado!');
}

function loadCodeStudioProjectList() {
    if (codeStudioState.savedProjects.length === 0) {
        codeStudioLog('warning', 'Nenhum projeto salvo. Use "Salvar Projeto" primeiro.');
        return;
    }
    
    var html = '<div class="code-studio-projects-list">';
    codeStudioState.savedProjects.forEach(function(p, i) {
        var date = new Date(p.date).toLocaleDateString('pt-BR');
        html += '<div class="code-studio-project-item" data-index="' + i + '">';
        html += '<div class="project-info"><span class="project-name">' + escapeHtml(p.name) + '</span>';
        html += '<span class="project-date">' + date + '</span></div>';
        html += '<button class="project-delete" data-index="' + i + '"><i class="fas fa-trash"></i></button>';
        html += '</div>';
    });
    html += '</div>';
    
    showCodeStudioPopup('Projetos Salvos', html, function(popup) {
        popup.querySelectorAll('.code-studio-project-item').forEach(function(item) {
            item.onclick = function(e) {
                if (e.target.closest('.project-delete')) return;
                var idx = parseInt(this.dataset.index);
                loadCodeStudioProject(idx);
                closeCodeStudioPopup();
            };
        });
        popup.querySelectorAll('.project-delete').forEach(function(btn) {
            btn.onclick = function(e) {
                e.stopPropagation();
                var idx = parseInt(this.dataset.index);
                if (confirm('Excluir projeto "' + codeStudioState.savedProjects[idx].name + '"?')) {
                    codeStudioState.savedProjects.splice(idx, 1);
                    localStorage.setItem('codeStudioProjects', JSON.stringify(codeStudioState.savedProjects));
                    closeCodeStudioPopup();
                    loadCodeStudioProjectList();
                }
            };
        });
    });
}

function loadCodeStudioProject(index) {
    var project = codeStudioState.savedProjects[index];
    if (!project) return;
    
    codeStudioState.html = project.html;
    codeStudioState.css = project.css;
    codeStudioState.js = project.js;
    codeStudioState.projectName = project.name;
    codeStudioState.currentLang = 'html';
    
    loadCodeStudioCode('html');
    document.querySelectorAll('.code-studio-lang-tab').forEach(function(t) {
        t.classList.toggle('active', t.dataset.lang === 'html');
    });
    runCodeStudio();
    codeStudioLog('success', 'Projeto "' + project.name + '" carregado!');
}

function exportCodeStudioHTML() {
    saveCodeStudioCurrentCode();
    
    var fullHTML = codeStudioState.html;
    
    // Inserir CSS
    if (codeStudioState.css.trim()) {
        if (fullHTML.includes('</head>')) {
            fullHTML = fullHTML.replace('</head>', '<style>\n' + codeStudioState.css + '\n</style>\n</head>');
        } else {
            fullHTML = '<style>\n' + codeStudioState.css + '\n</style>\n' + fullHTML;
        }
    }
    
    // Inserir JS
    if (codeStudioState.js.trim()) {
        if (fullHTML.includes('</body>')) {
            fullHTML = fullHTML.replace('</body>', '<script>\n' + codeStudioState.js + '\n<\/script>\n</body>');
        } else {
            fullHTML += '\n<script>\n' + codeStudioState.js + '\n<\/script>';
        }
    }
    
    // Download
    var blob = new Blob([fullHTML], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (codeStudioState.projectName || 'projeto') + '.html';
    a.click();
    URL.revokeObjectURL(url);
    
    codeStudioLog('success', 'Arquivo HTML exportado!');
}

function copyCodeStudioCode() {
    saveCodeStudioCurrentCode();
    
    var fullCode = '<!-- HTML -->\n' + codeStudioState.html + '\n\n';
    fullCode += '/* CSS */\n' + codeStudioState.css + '\n\n';
    fullCode += '// JavaScript\n' + codeStudioState.js;
    
    navigator.clipboard.writeText(fullCode).then(function() {
        codeStudioLog('success', 'Código copiado para a área de transferência!');
    }).catch(function() {
        codeStudioLog('error', 'Erro ao copiar código');
    });
}

// ========== DOWNLOAD APP (WEB VERSION - Download HTML) ==========
var downloadAppState = { iconDataUrl: null };

function openDownloadAppModal() {
    // Na versão web, simplesmente baixar o projeto como HTML
    downloadCodeStudioProject();
}

function selectAppIcon() {
    document.getElementById('appIconInput').click();
}

function handleAppIconSelect(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            downloadAppState.iconDataUrl = e.target.result;
            var preview = document.getElementById('appIconPreview');
            preview.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function buildRealApk() {
    var appName = document.getElementById('appNameInput').value || 'Meu App';
    var packageId = document.getElementById('appPackageInput').value || 'com.codestudio.app';
    var iconUrl = downloadAppState.iconDataUrl || generateDefaultIcon(appName);
    
    // Validar package ID
    if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(packageId)) {
        codeStudioLog('error', 'Package ID inválido! Use formato: com.exemplo.app');
        return;
    }
    
    saveCodeStudioCurrentCode();
    
    // Mostrar status
    var statusDiv = document.getElementById('apkBuildStatus');
    var statusText = document.getElementById('apkStatusText');
    var progressBar = document.getElementById('apkProgressBar');
    var buildBtn = document.getElementById('buildApkBtn');
    
    statusDiv.style.display = 'block';
    buildBtn.disabled = true;
    buildBtn.textContent = 'Gerando...';
    
    function updateStatus(text, percent) {
        statusText.textContent = text;
        progressBar.style.width = percent + '%';
    }
    
    try {
        updateStatus('Preparando arquivos...', 10);
        
        // Chamar o plugin nativo para gerar APK
        if (window.BuildApk && window.BuildApk.build) {
            updateStatus('Gerando projeto...', 30);
            
            // Combinar HTML, CSS e JS em um arquivo único (com limpeza de marcadores)
            var cleanedHtml = cleanCodeMarkers(codeStudioState.html || '');
            var cleanedCss = cleanCodeMarkers(codeStudioState.css || '');
            var cleanedJs = cleanCodeMarkers(codeStudioState.js || '');
            var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + appName + '</title><style>' + cleanedCss + '</style></head><body>' + cleanedHtml + '<script>' + cleanedJs + '<\/script></body></html>';
            
            var appData = {
                name: appName,
                packageId: packageId,
                icon: iconUrl,
                html: fullHtml
            };
            
            window.BuildApk.build(appData, 
                function(result) {
                    updateStatus('APK gerado!', 100);
                    buildBtn.textContent = '✓ Concluído';
                    
                    setTimeout(function() {
                        document.getElementById('downloadAppModal')?.remove();
                        codeStudioLog('success', 'APK instalado: ' + appName);
                    }, 1000);
                },
                function(error) {
                    updateStatus('Erro: ' + error, 0);
                    buildBtn.disabled = false;
                    buildBtn.textContent = '🔨 Tentar Novamente';
                    codeStudioLog('error', 'Erro ao gerar APK: ' + error);
                },
                function(progress) {
                    updateStatus(progress.message, progress.percent);
                }
            );
        } else {
            // Fallback: usar servidor externo ou WebView standalone
            updateStatus('Criando app standalone...', 50);
            await createStandaloneApp(appName, packageId, iconUrl);
        }
        
    } catch(e) {
        updateStatus('Erro: ' + e.message, 0);
        buildBtn.disabled = false;
        buildBtn.textContent = '🔨 Tentar Novamente';
        codeStudioLog('error', 'Erro: ' + e.message);
    }
}

async function createStandaloneApp(appName, packageId, iconUrl) {
    var statusText = document.getElementById('apkStatusText');
    var progressBar = document.getElementById('apkProgressBar');
    
    statusText.textContent = 'Criando WebView App...';
    progressBar.style.width = '60%';
    
    // Gerar HTML completo
    var fullHtml = generateFullAppHtml(appName, iconUrl);
    
    // Salvar como arquivo e criar atalho via intent
    if (window.cordova && cordova.file) {
        var dir = cordova.file.externalDataDirectory || cordova.file.dataDirectory;
        
        return new Promise(function(resolve, reject) {
            window.resolveLocalFileSystemURL(dir, function(dirEntry) {
                // Criar pasta para o app
                dirEntry.getDirectory(packageId.replace(/\./g, '_'), { create: true }, function(appDir) {
                    appDir.getFile('index.html', { create: true }, function(fileEntry) {
                        fileEntry.createWriter(function(writer) {
                            writer.onwriteend = function() {
                                statusText.textContent = 'Instalando...';
                                progressBar.style.width = '80%';
                                
                                // Criar atalho usando intent
                                installAppShortcut(appName, iconUrl, fileEntry.nativeURL, function() {
                                    statusText.textContent = 'App instalado!';
                                    progressBar.style.width = '100%';
                                    
                                    setTimeout(function() {
                                        document.getElementById('downloadAppModal')?.remove();
                                        codeStudioLog('success', 'App "' + appName + '" instalado na tela inicial!');
                                    }, 1000);
                                    resolve();
                                });
                            };
                            writer.write(new Blob([fullHtml], { type: 'text/html' }));
                        });
                    }, reject);
                }, reject);
            }, reject);
        });
    }
}

function installAppShortcut(appName, iconDataUrl, fileUrl, callback) {
    // Converter ícone para bitmap se necessário
    var canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    var ctx = canvas.getContext('2d');
    
    var img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 192, 192);
        var iconBitmap = canvas.toDataURL('image/png');
        
        // Usar cordova-plugin-shortcuts ou intent
        if (window.plugins && window.plugins.Shortcuts) {
            window.plugins.Shortcuts.supportsPinned(function(supported) {
                if (supported) {
                    window.plugins.Shortcuts.setDynamic([{
                        id: 'app_' + Date.now(),
                        shortLabel: appName,
                        longLabel: appName,
                        iconBitmap: iconBitmap.split(',')[1],
                        intent: {
                            action: 'android.intent.action.VIEW',
                            data: fileUrl,
                            flags: 268435456
                        }
                    }], function() {
                        // Tentar fixar na tela inicial
                        requestPinShortcut(appName, iconBitmap, fileUrl, callback);
                    }, callback);
                } else {
                    callback();
                }
            }, callback);
        } else {
            // Fallback: abrir arquivo
            if (cordova.InAppBrowser) {
                cordova.InAppBrowser.open(fileUrl, '_system');
            }
            callback();
        }
    };
    img.onerror = callback;
    img.src = iconDataUrl;
}

function requestPinShortcut(appName, iconBitmap, fileUrl, callback) {
    if (window.plugins && window.plugins.Shortcuts && window.plugins.Shortcuts.addPinned) {
        window.plugins.Shortcuts.addPinned({
            id: 'pinned_' + Date.now(),
            shortLabel: appName,
            longLabel: appName,
            iconBitmap: iconBitmap.split(',')[1],
            intent: {
                action: 'android.intent.action.VIEW', 
                data: fileUrl,
                flags: 268435456
            }
        }, callback, callback);
    } else {
        callback();
    }
}

function generateFullAppHtml(appName, iconUrl) {
    saveCodeStudioCurrentCode();
    
    var userHtml = cleanCodeMarkers(codeStudioState.html || '');
    var cleanedCss = cleanCodeMarkers(codeStudioState.css || '');
    var cleanedJs = cleanCodeMarkers(codeStudioState.js || '');
    
    // Extrair apenas o body
    var bodyMatch = userHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    var bodyContent = bodyMatch ? bodyMatch[1] : userHtml.replace(/<(!DOCTYPE|html|head|\/head|\/html)[^>]*>/gi, '');
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#1a1a2e">
    <title>${appName}</title>
    <link rel="icon" href="${iconUrl}">
    <link rel="apple-touch-icon" href="${iconUrl}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { width: 100%; height: 100%; overflow: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        ${cleanedCss}
    </style>
</head>
<body>
${bodyContent}
<script>
${cleanedJs}
<\/script>
</body>
</html>`;
}

function createAndDownloadApp() {
    // Redirecionar para o novo builder
    buildRealApk();
    
    // Fechar modal
    var modal = document.getElementById('downloadAppModal');
    if (modal) modal.remove();
    
    codeStudioLog('info', 'Criando app...');
    
    // Usar compartilhamento nativo - sempre funciona
    try {
        var blob = new Blob([pwaHtml], { type: 'text/html' });
        var file = new File([blob], fileName, { type: 'text/html' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                title: appName,
                text: 'App criado no Code Studio',
                files: [file]
            }).then(function() {
                codeStudioLog('success', 'App compartilhado! Salve o arquivo e abra no navegador para adicionar à tela inicial.');
            }).catch(function(e) {
                console.log('Share error:', e);
                fallbackSaveApp(appName, pwaHtml, fileName);
            });
        } else {
            fallbackSaveApp(appName, pwaHtml, fileName);
        }
    } catch(e) {
        console.log('Create app error:', e);
        fallbackSaveApp(appName, pwaHtml, fileName);
    }
}

function fallbackSaveApp(appName, pwaHtml, fileName) {
    // Salvar nos arquivos do app
    if (window.cordova && cordova.file) {
        var dir = cordova.file.externalDataDirectory || cordova.file.dataDirectory;
        
        window.resolveLocalFileSystemURL(dir, function(dirEntry) {
            dirEntry.getFile(fileName, { create: true }, function(fileEntry) {
                fileEntry.createWriter(function(writer) {
                    writer.onwriteend = function() {
                        var path = fileEntry.nativeURL;
                        codeStudioLog('success', 'App salvo!');
                        
                        // Mostrar opções
                        showAppOptions(appName, path, pwaHtml, fileName);
                    };
                    writer.onerror = function(e) {
                        codeStudioLog('error', 'Erro: ' + e.toString());
                    };
                    writer.write(new Blob([pwaHtml], { type: 'text/html' }));
                });
            }, function(e) {
                codeStudioLog('error', 'Erro arquivo: ' + JSON.stringify(e));
            });
        }, function(e) {
            codeStudioLog('error', 'Erro acesso: ' + JSON.stringify(e));
        });
    } else {
        // Web fallback
        var blob = new Blob([pwaHtml], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        codeStudioLog('success', 'App baixado!');
    }
}

function showAppOptions(appName, filePath, pwaHtml, fileName) {
    var old = document.getElementById('appOptionsModal');
    if (old) old.remove();
    
    var modal = document.createElement('div');
    modal.id = 'appOptionsModal';
    modal.className = 'cs-confirm-overlay';
    modal.innerHTML = `
        <div class="cs-app-modal">
            <div class="cs-app-title">✅ App Criado!</div>
            <div class="cs-app-form">
                <p style="color:#aaa;font-size:13px;margin-bottom:15px;">Escolha como deseja usar o app:</p>
                <button class="cs-option-btn" onclick="openAppInBrowser('${filePath}')">
                    <i class="fas fa-globe"></i> Abrir no Navegador
                </button>
                <button class="cs-option-btn" onclick="shareAppFile('${appName}', '${fileName}')">
                    <i class="fas fa-share-alt"></i> Compartilhar
                </button>
                <button class="cs-option-btn" onclick="runAppFullscreen()">
                    <i class="fas fa-expand"></i> Rodar em Tela Cheia
                </button>
            </div>
            <div class="cs-confirm-btns" style="margin-top:15px;">
                <button class="cs-confirm-cancel" onclick="this.closest('.cs-confirm-overlay').remove()">Fechar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    
    // Guardar o HTML para rodar em tela cheia
    window.lastCreatedApp = { name: appName, html: pwaHtml };
}

function openAppInBrowser(path) {
    document.getElementById('appOptionsModal')?.remove();
    if (window.cordova && cordova.InAppBrowser) {
        cordova.InAppBrowser.open(path, '_system');
    } else {
        window.open(path, '_blank');
    }
    codeStudioLog('info', 'Aberto! No navegador, use menu → "Adicionar à tela inicial"');
}

function shareAppFile(appName, fileName) {
    document.getElementById('appOptionsModal')?.remove();
    if (window.lastCreatedApp && window.plugins && window.plugins.socialsharing) {
        window.plugins.socialsharing.share(
            'App: ' + appName,
            appName,
            null,
            null
        );
    } else if (navigator.share) {
        var blob = new Blob([window.lastCreatedApp.html], { type: 'text/html' });
        var file = new File([blob], fileName, { type: 'text/html' });
        navigator.share({ files: [file], title: appName }).catch(function() {
            codeStudioLog('error', 'Não foi possível compartilhar');
        });
    }
}

function runAppFullscreen() {
    document.getElementById('appOptionsModal')?.remove();
    if (!window.lastCreatedApp) return;
    
    // Criar tela cheia com o app
    var fs = document.createElement('div');
    fs.id = 'appFullscreenRun';
    fs.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#000;';
    fs.innerHTML = `
        <div style="position:absolute;top:10px;right:10px;z-index:100000;">
            <button onclick="document.getElementById('appFullscreenRun').remove()" 
                    style="background:rgba(0,0,0,0.7);color:#fff;border:none;padding:10px 15px;border-radius:20px;font-size:14px;">
                ✕ Fechar
            </button>
        </div>
        <iframe id="appFullscreenIframe" style="width:100%;height:100%;border:none;"></iframe>`;
    document.body.appendChild(fs);
    
    var iframe = document.getElementById('appFullscreenIframe');
    iframe.srcdoc = window.lastCreatedApp.html;
    
    codeStudioLog('success', 'App rodando em tela cheia!');
}

function generateDefaultIcon(name) {
    var canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    var ctx = canvas.getContext('2d');
    
    // Gradient background
    var gradient = ctx.createLinearGradient(0, 0, 192, 192);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, 192, 192, 32);
    ctx.fill();
    
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), 96, 96);
    
    return canvas.toDataURL('image/png');
}

function generatePWAHtml(appName, iconDataUrl) {
    saveCodeStudioCurrentCode();
    
    var manifest = {
        name: appName,
        short_name: appName.substring(0, 12),
        start_url: '.',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#667eea',
        icons: [{ src: iconDataUrl, sizes: '192x192', type: 'image/png' }]
    };
    
    // Extrair apenas o conteúdo do body do HTML do usuário
    var userBody = codeStudioState.html || '';
    userBody = userBody.replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
        .replace(/<head[\s\S]*?<\/head>/gi, '').replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '').trim();
    if (!userBody) userBody = '<div id="app"></div>';
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="${appName}">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#667eea">
    <title>${appName}</title>
    <link rel="apple-touch-icon" href="${iconDataUrl}">
    <link rel="icon" href="${iconDataUrl}">
    <link rel="manifest" href="data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: auto; }
        ${codeStudioState.css || ''}
    </style>
</head>
<body>
${userBody}
<script>
${codeStudioState.js || ''}

// Registrar Service Worker para PWA offline
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript,' + encodeURIComponent('self.addEventListener("fetch", e => e.respondWith(fetch(e.request).catch(() => new Response("Offline"))));')).catch(() => {});
}
<\/script>
</body>
</html>`;
}

function runCodeStudio() {
    saveCodeStudioCurrentCode();
    
    var iframe = document.getElementById('codeStudioPreview');
    if (!iframe) return;
    
    // Montar HTML completo com interceptação de console
    // Limpar possíveis marcadores de código que vazaram
    var fullHTML = cleanCodeMarkers(codeStudioState.html);
    var cleanCSS = cleanCodeMarkers(codeStudioState.css);
    var cleanJS = cleanCodeMarkers(codeStudioState.js);
    
    // Script para capturar console e erros apenas
    var consoleInterceptor = `
<script>
(function() {
    var originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };
    
    function sendToParent(type, args) {
        try {
            var message = Array.from(args).map(function(a) {
                if (typeof a === 'object') {
                    try { return JSON.stringify(a, null, 2); }
                    catch(e) { return String(a); }
                }
                return String(a);
            }).join(' ');
            window.parent.postMessage({ type: 'console', level: type, message: message }, '*');
        } catch(e) {}
    }
    
    console.log = function() { sendToParent('log', arguments); originalConsole.log.apply(console, arguments); };
    console.error = function() { sendToParent('error', arguments); originalConsole.error.apply(console, arguments); };
    console.warn = function() { sendToParent('warn', arguments); originalConsole.warn.apply(console, arguments); };
    console.info = function() { sendToParent('info', arguments); originalConsole.info.apply(console, arguments); };
    
    window.onerror = function(msg, url, line, col, error) {
        window.parent.postMessage({ type: 'console', level: 'error', message: 'Erro: ' + msg + ' (linha ' + line + ')' }, '*');
        return false;
    };
})();
<\/script>`;
    
    // Inserir CSS
    if (cleanCSS.trim()) {
        if (fullHTML.includes('</head>')) {
            fullHTML = fullHTML.replace('</head>', '<style>\n' + cleanCSS + '\n</style>\n</head>');
        } else if (fullHTML.includes('<body')) {
            fullHTML = fullHTML.replace(/<body/i, '<style>\n' + cleanCSS + '\n</style>\n<body');
        } else {
            fullHTML = '<style>\n' + cleanCSS + '\n</style>\n' + fullHTML;
        }
    }
    
    // Inserir console interceptor no head
    if (fullHTML.includes('<head>')) {
        fullHTML = fullHTML.replace('<head>', '<head>\n' + consoleInterceptor);
    } else if (fullHTML.includes('<!DOCTYPE')) {
        fullHTML = fullHTML.replace(/<!DOCTYPE[^>]*>/i, '$&\n<head>' + consoleInterceptor + '</head>');
    } else {
        fullHTML = consoleInterceptor + fullHTML;
    }
    
    // Inserir JS
    if (cleanJS.trim()) {
        if (fullHTML.includes('</body>')) {
            fullHTML = fullHTML.replace('</body>', '<script>\n' + cleanJS + '\n<\/script>\n</body>');
        } else {
            fullHTML += '\n<script>\n' + cleanJS + '\n<\/script>';
        }
    }
    
    iframe.srcdoc = fullHTML;
}

// Listener para mensagens do iframe (console)
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'console') {
        codeStudioLog(event.data.level, event.data.message);
    }
});

function codeStudioLog(level, message) {
    var colors = {
        log: '#e6e6e6',
        info: '#2196F3',
        success: '#4CAF50',
        warn: '#ff9800',
        error: '#f44336',
        ai: '#9c27b0'
    };
    
    var icons = {
        log: '>',
        info: 'ℹ',
        success: '✓',
        warn: '⚠',
        error: '✕',
        ai: '🤖'
    };
    
    var entry = {
        level: level,
        message: message,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    
    codeStudioState.consoleHistory.push(entry);
    
    // Limitar histórico
    if (codeStudioState.consoleHistory.length > 100) {
        codeStudioState.consoleHistory.shift();
    }
    
    updateCodeStudioConsole();
}

function updateCodeStudioConsole() {
    var output = document.getElementById('codeStudioOutput');
    if (!output) return;
    
    var colors = {
        log: '#e6e6e6',
        info: '#2196F3',
        success: '#4CAF50',
        warn: '#ff9800',
        error: '#f44336',
        ai: '#9c27b0'
    };
    
    var icons = {
        log: '&gt;',
        info: 'ℹ',
        success: '✓',
        warn: '⚠',
        error: '✕',
        ai: '🤖'
    };
    
    var html = codeStudioState.consoleHistory.map(function(entry) {
        var color = colors[entry.level] || '#e6e6e6';
        var icon = icons[entry.level] || '>';
        var escapedMsg = escapeHtml(entry.message);
        return '<div class="console-entry"><span style="color:#666;font-size:10px;">[' + entry.time + ']</span> <span style="color:' + color + ';">' + icon + '</span> ' + escapedMsg + '</div>';
    }).join('');
    
    output.innerHTML = html || '<span style="color:#666;">Console vazio</span>';
    output.scrollTop = output.scrollHeight;
}

function saveCodeStudioCurrentCode() {
    var editor = document.getElementById('codeStudioEditor');
    if (!editor) return;
    
    if (codeStudioState.currentLang === 'html') codeStudioState.html = editor.value;
    else if (codeStudioState.currentLang === 'css') codeStudioState.css = editor.value;
    else if (codeStudioState.currentLang === 'js') codeStudioState.js = editor.value;
}

function loadCodeStudioCode(lang) {
    var editor = document.getElementById('codeStudioEditor');
    var highlight = document.getElementById('codeStudioHighlight');
    if (!editor) return;
    
    if (lang === 'html') editor.value = codeStudioState.html;
    else if (lang === 'css') editor.value = codeStudioState.css;
    else if (lang === 'js') editor.value = codeStudioState.js;
    
    // Scroll to top and update line numbers + syntax highlight
    editor.scrollTop = 0;
    if (highlight) highlight.scrollTop = 0;
    updateLineNumbers();
    updateSyntaxHighlight();
}

// Função para trocar aba durante streaming
function switchCodeTab(lang) {
    saveCodeStudioCurrentCode();
    codeStudioState.currentLang = lang;
    
    // Atualizar UI das abas
    var langTabs = document.querySelectorAll('.code-studio-lang-tab');
    langTabs.forEach(function(t) {
        t.classList.toggle('active', t.dataset.lang === lang);
    });
    
    loadCodeStudioCode(lang);
}

// ===== FUNÇÕES DE CHAT UI =====
function formatChatMessage(text) {
    if (!text) return '';
    
    // Escapar HTML primeiro
    var escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Formatação de markdown
    return escaped
        // Blocos de código (``` ... ```)
        .replace(/```([\s\S]*?)```/g, '<pre style="background:#1e1e1e;padding:8px;border-radius:4px;overflow-x:auto;font-size:12px;"><code>$1</code></pre>')
        // Código inline
        .replace(/`([^`]+)`/g, '<code style="background:#333;padding:2px 5px;border-radius:3px;font-size:12px;">$1</code>')
        // Negrito **texto** ou __texto__
        .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff;">$1</strong>')
        .replace(/__([^_]+)__/g, '<strong style="color:#fff;">$1</strong>')
        // Itálico *texto* ou _texto_
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        // Bullet points
        .replace(/^[\s]*[•\-\*]\s+(.+)$/gm, '<div style="padding-left:12px;">• $1</div>')
        // Listas numeradas
        .replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<div style="padding-left:12px;">$1. $2</div>')
        // Quebras de linha
        .replace(/\n/g, '<br>');
}

function addChatMessage(type, message) {
    // Se streaming foi usado para mensagem da IA, não duplicar
    if (type === 'ai' && streamingUsed) {
        streamingUsed = false;
        return; // Mensagem já foi adicionada pelo streaming
    }
    
    var messagesContainer = document.getElementById('codeStudioChatMessages');
    if (!messagesContainer) return;
    
    // Remove empty placeholder
    var empty = messagesContainer.querySelector('.code-studio-chat-empty');
    if (empty) empty.remove();
    
    var msgDiv = document.createElement('div');
    msgDiv.className = 'code-studio-chat-message ' + type;
    
    // Aplicar formatação para mensagens da IA
    if (type === 'ai') {
        msgDiv.innerHTML = formatChatMessage(message);
    } else if (type === 'user') {
        // Mensagem do usuário - clique para editar
        msgDiv.textContent = message;
        msgDiv.style.cursor = 'pointer';
        msgDiv.onclick = function() {
            editUserMessage(msgDiv, message);
        };
    } else {
        msgDiv.textContent = message;
    }
    
    messagesContainer.appendChild(msgDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ========== STREAMING VISUAL EM TEMPO REAL ==========
var streamingMessageDiv = null;
var streamingContent = '';
var streamingUsed = false; // Flag para evitar mensagem duplicada

function createStreamingMessage() {
    // NÃO criar mensagem no chat - código vai direto para os editores
    // O indicador "CODIFICANDO" já existe na UI
    streamingUsed = true;
    streamingContent = '';
    streamingMessageDiv = null; // Não usa div no chat
    return null;
}

function updateStreamingMessage(newText) {
    streamingContent += newText;
    
    // Atualizar EDITORES e PREVIEW em tempo real (sem mensagem no chat)
    if (codeStudioState.mode === 'edit') {
        updatePreviewFromStreaming(streamingContent);
    }
}

function finalizeStreamingMessage() {
    var result = streamingContent;
    streamingContent = '';
    streamingMessageDiv = null;
    return result;
}

function updatePreviewFromStreaming(content) {
    // Tentar extrair código parcial durante streaming
    // Suporta tanto ---HTML--- quanto ```html
    
    var htmlMatch = content.match(/---HTML---([\s\S]*?)(?:---\/HTML---|$)/) ||
                    content.match(/```html\s*([\s\S]*?)(?:```|$)/i);
    var cssMatch = content.match(/---CSS---([\s\S]*?)(?:---\/CSS---|$)/) ||
                   content.match(/```css\s*([\s\S]*?)(?:```|$)/i);
    var jsMatch = content.match(/---JS---([\s\S]*?)(?:---\/JS---|$)/) ||
                  content.match(/```(?:javascript|js)\s*([\s\S]*?)(?:```|$)/i);
    
    // Atualizar editores em tempo real
    var editor = document.getElementById('codeStudioEditor');
    var currentLang = codeStudioState.currentLang;
    
    // Extrair código limpo
    var streamingHtml = htmlMatch ? cleanCodeMarkers(htmlMatch[1]) : null;
    var streamingCss = cssMatch ? cleanCodeMarkers(cssMatch[1]) : null;
    var streamingJs = jsMatch ? cleanCodeMarkers(jsMatch[1]) : null;
    
    // Debug
    if (streamingHtml || streamingCss || streamingJs) {
        console.log('[Streaming] Detectou código - HTML:', !!streamingHtml, 'CSS:', !!streamingCss, 'JS:', !!streamingJs);
    }
    
    // Atualizar editor com o código sendo gerado
    if (editor && (streamingHtml || streamingCss || streamingJs)) {
        // Detectar qual linguagem está sendo escrita AGORA (mais recente no conteúdo)
        var htmlPos = content.lastIndexOf('---HTML---');
        var cssPos = content.lastIndexOf('---CSS---');
        var jsPos = content.lastIndexOf('---JS---');
        
        // Fallback para markdown
        if (htmlPos < 0) htmlPos = content.lastIndexOf('```html');
        if (cssPos < 0) cssPos = content.lastIndexOf('```css');
        if (jsPos < 0) jsPos = Math.max(content.lastIndexOf('```javascript'), content.lastIndexOf('```js'));
        
        // Descobrir qual está sendo escrita agora (maior posição = mais recente)
        var maxPos = Math.max(htmlPos, cssPos, jsPos);
        
        if (maxPos === jsPos && streamingJs && jsPos > 0) {
            if (currentLang !== 'js') switchCodeTab('js');
            editor.value = streamingJs;
        } else if (maxPos === cssPos && streamingCss && cssPos > 0) {
            if (currentLang !== 'css') switchCodeTab('css');
            editor.value = streamingCss;
        } else if (streamingHtml) {
            if (currentLang !== 'html') switchCodeTab('html');
            editor.value = streamingHtml;
        }
        
        updateLineNumbers();
        updateSyntaxHighlight();
    }
    
    // Atualizar preview em tempo real
    var previewFrame = document.getElementById('codeStudioPreview');
    if (!previewFrame) return;
    
    var previewHtml = streamingHtml || codeStudioState.html || '';
    var previewCss = streamingCss || codeStudioState.css || '';
    var previewJs = streamingJs || codeStudioState.js || '';
    
    // Só atualizar se tiver HTML válido
    if (previewHtml.length > 30 && previewHtml.includes('<')) {
        try {
            var combined = previewHtml;
            
            // Inserir CSS antes de </head> ou no início
            if (previewCss) {
                if (combined.includes('</head>')) {
                    combined = combined.replace('</head>', '<style>' + previewCss + '</style></head>');
                } else {
                    combined = '<style>' + previewCss + '</style>' + combined;
                }
            }
            
            // Inserir JS antes de </body> ou no final
            if (previewJs) {
                if (combined.includes('</body>')) {
                    combined = combined.replace('</body>', '<script>' + previewJs + '<\/script></body>');
                } else {
                    combined = combined + '<script>' + previewJs + '<\/script>';
                }
            }
            
            previewFrame.srcdoc = combined;
        } catch(e) {
            console.log('[Streaming] Erro ao atualizar preview:', e);
        }
    }
}

// Editar mensagem do usuário e reenviar
function editUserMessage(msgDiv, originalText) {
    var chatInput = document.getElementById('codeStudioChatInput');
    var inputContainer = document.querySelector('.code-studio-chat-input');
    if (!chatInput || !inputContainer) return;
    
    // Guardar mensagens para restaurar se cancelar
    var messagesContainer = document.getElementById('codeStudioChatMessages');
    var messages = Array.from(messagesContainer.children);
    var msgIndex = messages.indexOf(msgDiv);
    
    // Salvar HTML das mensagens que serão removidas
    codeStudioState.editingMessages = [];
    for (var i = msgIndex; i < messages.length; i++) {
        codeStudioState.editingMessages.push(messages[i].outerHTML);
    }
    codeStudioState.isEditing = true;
    
    // Colocar texto no input
    chatInput.value = originalText;
    chatInput.focus();
    
    // Remover da mensagem editada em diante
    for (var i = messages.length - 1; i >= msgIndex; i--) {
        messages[i].remove();
    }
}

// Cancelar edição e restaurar mensagens (chamado pelo botão voltar)
function cancelEditMessage() {
    var chatInput = document.getElementById('codeStudioChatInput');
    var messagesContainer = document.getElementById('codeStudioChatMessages');
    
    // Limpar input
    if (chatInput) chatInput.value = '';
    
    // Restaurar mensagens
    if (codeStudioState.editingMessages && messagesContainer) {
        codeStudioState.editingMessages.forEach(function(html) {
            messagesContainer.insertAdjacentHTML('beforeend', html);
        });
        
        // Re-adicionar onclick nas mensagens do usuário restauradas
        var userMsgs = messagesContainer.querySelectorAll('.code-studio-chat-message.user');
        userMsgs.forEach(function(msg) {
            msg.style.cursor = 'pointer';
            msg.onclick = function() {
                editUserMessage(msg, msg.textContent);
            };
        });
    }
    
    // Limpar estado
    codeStudioState.editingMessages = null;
    codeStudioState.isEditing = false;
}

// ========== SELETOR DE MODO (Edit/Ask/Agent) ==========
codeStudioState.mode = 'edit'; // Modo padrão

function toggleModeSelector() {
    var selector = document.getElementById('csModeSelector');
    if (selector) {
        selector.classList.toggle('show');
    }
}

function selectMode(mode) {
    codeStudioState.mode = mode;
    
    // Atualizar UI
    var modeBtn = document.getElementById('csModeBtn');
    var modeIcon = document.getElementById('csModeIcon');
    var modeName = document.getElementById('csModeName');
    
    var icons = {
        'edit': 'fa-pen',
        'ask': 'fa-comments',
        'agent': 'fa-robot'
    };
    
    if (modeIcon) {
        modeIcon.className = 'fas ' + icons[mode];
    }
    
    // Atualizar opções ativas
    var options = document.querySelectorAll('.cs-mode-option');
    options.forEach(function(opt) {
        opt.classList.toggle('active', opt.dataset.mode === mode);
    });
    
    // Fechar seletor
    var selector = document.getElementById('csModeSelector');
    if (selector) {
        selector.classList.remove('show');
    }
    
    // Atualizar placeholder do input baseado no modo
    var chatInput = document.getElementById('codeStudioChatInput');
    if (chatInput) {
        var placeholders = {
            'edit': 'Peça para a IA criar ou modificar código...',
            'ask': 'Faça uma pergunta sobre o código...',
            'agent': 'Descreva a tarefa para o agente autônomo...'
        };
        chatInput.placeholder = placeholders[mode];
    }
}

// Fechar seletor ao clicar fora
document.addEventListener('click', function(e) {
    var selector = document.getElementById('csModeSelector');
    var modeBtn = document.getElementById('csModeBtn');
    if (selector && modeBtn && !selector.contains(e.target) && !modeBtn.contains(e.target)) {
        selector.classList.remove('show');
    }
});

// ===== SISTEMA DE EDIÇÃO EFICIENTE COM NAVEGAÇÃO POR SEÇÕES =====

// Padrões de comentários de seção (obrigatórios no código)
var SECTION_PATTERNS = [
    /\/\/\s*[═=]{3,}\s*(.+?)\s*[═=]{3,}/i,           // // ═══ SEÇÃO ═══
    /\/\/\s*[-]{3,}\s*(.+?)\s*[-]{3,}/i,             // // --- SEÇÃO ---
    /\/\/\s*[#]{2,}\s*(.+)/i,                         // // ## SEÇÃO
    /\/\*\s*[═=]{3,}\s*(.+?)\s*[═=]{3,}\s*\*\//i,   // /* ═══ SEÇÃO ═══ */
    /\/\*\s*[-]{3,}\s*(.+?)\s*[-]{3,}\s*\*\//i,     // /* --- SEÇÃO --- */
    /<!--\s*[═=]{3,}\s*(.+?)\s*[═=]{3,}\s*-->/i,    // <!-- ═══ SEÇÃO ═══ -->
    /<!--\s*[-]{3,}\s*(.+?)\s*[-]{3,}\s*-->/i       // <!-- --- SEÇÃO --- -->
];

// Extrair índice de seções do código
function extractSectionIndex(code, type) {
    if (!code) return { sections: [], hasValidSections: false };
    
    var lines = code.split('\n');
    var sections = [];
    var currentSection = null;
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var sectionName = null;
        
        // Tentar cada padrão de seção
        for (var p = 0; p < SECTION_PATTERNS.length; p++) {
            var match = line.match(SECTION_PATTERNS[p]);
            if (match) {
                sectionName = match[1].trim();
                break;
            }
        }
        
        if (sectionName) {
            // Fechar seção anterior
            if (currentSection) {
                currentSection.endLine = i;
                sections.push(currentSection);
            }
            
            // Iniciar nova seção
            currentSection = {
                name: sectionName,
                startLine: i + 1, // Linha após o comentário
                endLine: null,
                lineNumber: i + 1 // Número da linha (1-indexed)
            };
        }
    }
    
    // Fechar última seção
    if (currentSection) {
        currentSection.endLine = lines.length;
        sections.push(currentSection);
    }
    
    // Verificar se tem seções válidas suficientes
    var hasValidSections = sections.length >= 2;
    
    return { sections: sections, hasValidSections: hasValidSections, totalLines: lines.length };
}

// Gerar índice formatado para enviar à IA
function generateSectionIndex(html, css, js) {
    var index = '📑 ÍNDICE DE SEÇÕES DO CÓDIGO:\n\n';
    
    var htmlIndex = extractSectionIndex(html, 'html');
    var cssIndex = extractSectionIndex(css, 'css');
    var jsIndex = extractSectionIndex(js, 'js');
    
    if (htmlIndex.sections.length > 0) {
        index += '📄 HTML (' + htmlIndex.totalLines + ' linhas):\n';
        htmlIndex.sections.forEach(function(s) {
            index += '  • L' + s.lineNumber + '-' + s.endLine + ': ' + s.name + '\n';
        });
        index += '\n';
    }
    
    if (cssIndex.sections.length > 0) {
        index += '🎨 CSS (' + cssIndex.totalLines + ' linhas):\n';
        cssIndex.sections.forEach(function(s) {
            index += '  • L' + s.lineNumber + '-' + s.endLine + ': ' + s.name + '\n';
        });
        index += '\n';
    }
    
    if (jsIndex.sections.length > 0) {
        index += '⚡ JS (' + jsIndex.totalLines + ' linhas):\n';
        jsIndex.sections.forEach(function(s) {
            index += '  • L' + s.lineNumber + '-' + s.endLine + ': ' + s.name + '\n';
        });
    }
    
    return {
        index: index,
        hasValidStructure: htmlIndex.hasValidSections || cssIndex.hasValidSections || jsIndex.hasValidSections,
        htmlSections: htmlIndex.sections,
        cssSections: cssIndex.sections,
        jsSections: jsIndex.sections
    };
}

// Extrair seções específicas do código por nome ou número de linha
function extractSections(code, requestedSections) {
    // requestedSections pode ser: ["HEADER", "FOOTER"] ou [{start: 10, end: 50}]
    if (!code || !requestedSections || requestedSections.length === 0) return code;
    
    var lines = code.split('\n');
    var result = [];
    var allSections = extractSectionIndex(code, '').sections;
    
    requestedSections.forEach(function(req) {
        if (typeof req === 'string') {
            // Buscar por nome
            var found = allSections.find(function(s) {
                return s.name.toLowerCase().includes(req.toLowerCase());
            });
            if (found) {
                result.push('// ═══ ' + found.name + ' (L' + found.startLine + '-' + found.endLine + ') ═══');
                for (var i = found.startLine - 1; i < found.endLine && i < lines.length; i++) {
                    result.push(lines[i]);
                }
                result.push('');
            }
        } else if (req.start && req.end) {
            // Buscar por range de linhas
            result.push('// ═══ LINHAS ' + req.start + '-' + req.end + ' ═══');
            for (var i = req.start - 1; i < req.end && i < lines.length; i++) {
                result.push(lines[i]);
            }
            result.push('');
        }
    });
    
    return result.join('\n');
}

// Parser para resposta da IA pedindo seções específicas
function parseRequestedSections(response) {
    // Formato: ---REQUEST_SECTIONS---
    // HTML: HEADER, FOOTER
    // CSS: BUTTONS, HEADER
    // JS: INIT, LOGIN
    // ---END_REQUEST---
    
    var match = response.match(/---REQUEST_SECTIONS---([\s\S]*?)---END_REQUEST---/);
    if (!match) return null;
    
    var content = match[1];
    var requests = {
        html: [],
        css: [],
        js: []
    };
    
    var htmlMatch = content.match(/HTML:\s*(.+)/i);
    var cssMatch = content.match(/CSS:\s*(.+)/i);
    var jsMatch = content.match(/JS:\s*(.+)/i);
    
    if (htmlMatch) {
        requests.html = htmlMatch[1].split(',').map(function(s) { return s.trim(); });
    }
    if (cssMatch) {
        requests.css = cssMatch[1].split(',').map(function(s) { return s.trim(); });
    }
    if (jsMatch) {
        requests.js = jsMatch[1].split(',').map(function(s) { return s.trim(); });
    }
    
    return requests;
}

// Detectar automaticamente quais seções são relevantes para o prompt
function detectRelevantSections(prompt, sectionData) {
    var result = { html: [], css: [], js: [] };
    var promptLower = prompt.toLowerCase();
    
    // Mapeamento de palavras-chave para tipos de seção
    var keywordMap = {
        // HTML
        'header': ['header', 'cabeçalho', 'topo', 'navbar', 'menu', 'navegação'],
        'footer': ['footer', 'rodapé', 'bottom'],
        'sidebar': ['sidebar', 'lateral', 'menu lateral'],
        'form': ['form', 'formulário', 'input', 'campo'],
        'content': ['conteúdo', 'principal', 'main', 'body'],
        'head': ['head', 'meta', 'title', 'título'],
        'modal': ['modal', 'popup', 'dialog'],
        
        // CSS
        'button': ['botão', 'botao', 'button', 'btn'],
        'color': ['cor', 'cores', 'color', 'background', 'fundo'],
        'font': ['fonte', 'font', 'texto', 'text', 'tipografia'],
        'layout': ['layout', 'grid', 'flex', 'posição', 'position'],
        'responsive': ['responsivo', 'responsive', 'mobile', 'media', 'tela'],
        'animation': ['animação', 'animation', 'transition', 'efeito'],
        'variable': ['variável', 'variable', 'var', 'tema', 'theme'],
        
        // JS
        'init': ['init', 'inicialização', 'startup', 'load', 'carregar'],
        'event': ['evento', 'event', 'click', 'listener', 'handler'],
        'function': ['função', 'function', 'método', 'method'],
        'state': ['estado', 'state', 'data', 'dados'],
        'api': ['api', 'fetch', 'request', 'ajax', 'servidor'],
        'config': ['config', 'configuração', 'settings', 'opções']
    };
    
    // Verificar cada seção do índice
    function checkSections(sections, targetArray) {
        sections.forEach(function(section) {
            var sectionNameLower = section.name.toLowerCase();
            
            // Verificar se nome da seção aparece no prompt
            if (promptLower.includes(sectionNameLower)) {
                targetArray.push(section.name);
                return;
            }
            
            // Verificar palavras-chave relacionadas
            for (var key in keywordMap) {
                var keywords = keywordMap[key];
                var sectionMatches = keywords.some(function(kw) { 
                    return sectionNameLower.includes(kw); 
                });
                var promptMatches = keywords.some(function(kw) { 
                    return promptLower.includes(kw); 
                });
                
                if (sectionMatches && promptMatches) {
                    targetArray.push(section.name);
                    return;
                }
            }
        });
    }
    
    checkSections(sectionData.htmlSections || [], result.html);
    checkSections(sectionData.cssSections || [], result.css);
    checkSections(sectionData.jsSections || [], result.js);
    
    // Se não encontrou nada, pegar primeira seção de cada
    if (result.html.length === 0 && sectionData.htmlSections && sectionData.htmlSections.length > 0) {
        result.html.push(sectionData.htmlSections[0].name);
    }
    if (result.css.length === 0 && sectionData.cssSections && sectionData.cssSections.length > 0) {
        result.css.push(sectionData.cssSections[0].name);
    }
    
    return result;
}

// Detectar se é uma edição complexa que precisa de mais contexto
function detectComplexEdit(prompt) {
    var complexKeywords = [
        'refatorar', 'refactor', 'reescrever', 'rewrite',
        'redesenhar', 'redesign', 'mudar tudo', 'change all',
        'novo visual', 'new design', 'layout completo', 'tema', 'theme',
        'criar jogo', 'criar aplicativo', 'criar sistema',
        'do zero', 'from scratch', 'completamente novo'
    ];
    
    var lowerPrompt = prompt.toLowerCase();
    
    for (var i = 0; i < complexKeywords.length; i++) {
        if (lowerPrompt.includes(complexKeywords[i])) {
            return true;
        }
    }
    
    return false;
}

// Gerar template de comentários de seção para código novo
function generateSectionTemplate(type) {
    if (type === 'html') {
        return '<!-- ═══ HEAD E META ═══ -->\n\n<!-- ═══ HEADER ═══ -->\n\n<!-- ═══ CONTEÚDO PRINCIPAL ═══ -->\n\n<!-- ═══ FOOTER ═══ -->\n';
    } else if (type === 'css') {
        return '/* ═══ RESET E VARIÁVEIS ═══ */\n\n/* ═══ ESTRUTURA BASE ═══ */\n\n/* ═══ HEADER ═══ */\n\n/* ═══ CONTEÚDO ═══ */\n\n/* ═══ BOTÕES ═══ */\n\n/* ═══ RESPONSIVO ═══ */\n';
    } else if (type === 'js') {
        return '// ═══ CONSTANTES E CONFIGURAÇÃO ═══\n\n// ═══ ESTADO DA APLICAÇÃO ═══\n\n// ═══ INICIALIZAÇÃO ═══\n\n// ═══ FUNÇÕES PRINCIPAIS ═══\n\n// ═══ EVENT LISTENERS ═══\n';
    }
    return '';
}

// Resumir código para enviar menos tokens (versão simples - fallback)
function summarizeCode(code, type) {
    if (!code || code.length < 500) return code;
    
    var lines = code.split('\n');
    var summary = [];
    
    // Primeiras 20 linhas
    summary.push('// --- INÍCIO ---');
    for (var i = 0; i < Math.min(20, lines.length); i++) {
        summary.push(lines[i]);
    }
    
    if (lines.length > 40) {
        summary.push('');
        summary.push('// ... (' + (lines.length - 40) + ' linhas omitidas) ...');
        summary.push('');
        
        // Últimas 20 linhas
        summary.push('// --- FIM ---');
        for (var i = Math.max(20, lines.length - 20); i < lines.length; i++) {
            summary.push(lines[i]);
        }
    } else {
        // Se tem menos de 40 linhas, mostra tudo
        for (var i = 20; i < lines.length; i++) {
            summary.push(lines[i]);
        }
    }
    
    return summary.join('\n');
}

// Parsear resposta no formato EDIT
function parseEditResponse(response) {
    var edits = [];
    
    // Regex para encontrar blocos ---EDIT LANG---
    var editRegex = /---EDIT\s+(HTML|CSS|JS)---\s*<<<SEARCH>>>([\s\S]*?)<<<REPLACE>>>([\s\S]*?)---\/EDIT\s+\1---/gi;
    
    var match;
    while ((match = editRegex.exec(response)) !== null) {
        edits.push({
            lang: match[1].toLowerCase(),
            search: match[2].trim(),
            replace: match[3].trim()
        });
    }
    
    return edits;
}

// Aplicar edições cirúrgicas ao código
function applyEdits(edits) {
    var changes = [];
    var newHtml = codeStudioState.html;
    var newCss = codeStudioState.css;
    var newJs = codeStudioState.js;
    var htmlChanged = false, cssChanged = false, jsChanged = false;
    
    edits.forEach(function(edit) {
        var target, current;
        
        if (edit.lang === 'html') {
            target = newHtml;
        } else if (edit.lang === 'css') {
            target = newCss;
        } else if (edit.lang === 'js') {
            target = newJs;
        }
        
        if (!target) return;
        
        // Tentar encontrar e substituir
        var searchNormalized = edit.search.replace(/\s+/g, ' ').trim();
        var targetNormalized = target.replace(/\s+/g, ' ');
        
        // Busca exata primeiro
        if (target.includes(edit.search)) {
            target = target.replace(edit.search, edit.replace);
        } 
        // Busca com espaços normalizados
        else {
            // Tentar encontrar linha por linha
            var searchLines = edit.search.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
            var found = false;
            
            if (searchLines.length > 0) {
                var targetLines = target.split('\n');
                
                for (var i = 0; i < targetLines.length - searchLines.length + 1; i++) {
                    var matches = true;
                    for (var j = 0; j < searchLines.length; j++) {
                        if (targetLines[i + j].trim() !== searchLines[j]) {
                            matches = false;
                            break;
                        }
                    }
                    
                    if (matches) {
                        // Encontrou! Substituir
                        var before = targetLines.slice(0, i);
                        var after = targetLines.slice(i + searchLines.length);
                        var replaceLines = edit.replace.split('\n');
                        target = before.concat(replaceLines).concat(after).join('\n');
                        found = true;
                        break;
                    }
                }
            }
            
            if (!found) {
                console.warn('[EDIT] Não encontrou:', edit.search.substring(0, 50));
            }
        }
        
        // Atualizar
        if (edit.lang === 'html' && target !== newHtml) {
            newHtml = target;
            htmlChanged = true;
        } else if (edit.lang === 'css' && target !== newCss) {
            newCss = target;
            cssChanged = true;
        } else if (edit.lang === 'js' && target !== newJs) {
            newJs = target;
            jsChanged = true;
        }
    });
    
    // Criar changes
    if (htmlChanged) {
        var diff = calculateDiff(codeStudioState.html, newHtml);
        changes.push({ lang: 'html', code: newHtml, added: diff.added, removed: diff.removed });
    }
    if (cssChanged) {
        var diff = calculateDiff(codeStudioState.css, newCss);
        changes.push({ lang: 'css', code: newCss, added: diff.added, removed: diff.removed });
    }
    if (jsChanged) {
        var diff = calculateDiff(codeStudioState.js, newJs);
        changes.push({ lang: 'js', code: newJs, added: diff.added, removed: diff.removed });
    }
    
    return changes;
}

// Calcular linhas adicionadas e removidas usando DiffEngine (LCS)
function calculateDiff(oldCode, newCode) {
    // Se DiffEngine estiver disponível, usar algoritmo LCS eficiente
    if (window.DiffEngine) {
        var diffResult = window.DiffEngine.diff(oldCode, newCode);
        return {
            added: diffResult.stats.added + diffResult.stats.modified,
            removed: diffResult.stats.removed + diffResult.stats.modified,
            modified: diffResult.stats.modified,
            unchanged: diffResult.stats.unchanged,
            operations: diffResult.operations // Incluir operações para aplicação incremental
        };
    }
    
    // Fallback para método antigo se DiffEngine não estiver disponível
    oldCode = (oldCode || '').trim();
    newCode = (newCode || '').trim();
    
    var oldLines = oldCode ? oldCode.split('\n') : [];
    var newLines = newCode ? newCode.split('\n') : [];
    
    var oldCount = oldLines.length;
    var newCount = newLines.length;
    
    var added = 0;
    var removed = 0;
    
    if (newCount > oldCount) {
        added = newCount - oldCount;
    } else if (oldCount > newCount) {
        removed = oldCount - newCount;
    }
    
    var minLen = Math.min(oldCount, newCount);
    var modified = 0;
    for (var i = 0; i < minLen; i++) {
        if (oldLines[i] !== newLines[i]) {
            modified++;
        }
    }
    
    if (modified > 0 && added === 0 && removed === 0) {
        added = modified;
    }
    
    return { added: added, removed: removed };
}

// Mostrar mudanças aplicadas com cards e botões de confirmar/desfazer
function showPendingChanges(explanation, changes) {
    var messagesContainer = document.getElementById('codeStudioChatMessages');
    if (!messagesContainer) return;
    
    // Remove empty placeholder
    var empty = messagesContainer.querySelector('.code-studio-chat-empty');
    if (empty) empty.remove();
    
    // Salvar estado anterior para poder reverter
    var oldHtml = codeStudioState.html || '';
    var oldCss = codeStudioState.css || '';
    var oldJs = codeStudioState.js || '';
    
    codeStudioState.previousState = {
        html: oldHtml,
        css: oldCss,
        js: oldJs
    };
    
    // APLICAR as mudanças IMEDIATAMENTE (com limpeza de marcadores)
    changes.forEach(function(change) {
        var cleanedCode = cleanCodeMarkers(change.code);
        if (change.lang === 'html') {
            codeStudioState.html = cleanedCode;
        } else if (change.lang === 'css') {
            codeStudioState.css = cleanedCode;
        } else if (change.lang === 'js') {
            codeStudioState.js = cleanedCode;
        }
    });
    
    // Atualizar editor e preview
    loadCodeStudioCode(codeStudioState.currentLang);
    runCodeStudio();
    
    // Mostrar explicação no chat
    addChatMessage('ai', explanation);
    
    // Mostrar barra de diff fixa acima do input
    var newHtml = codeStudioState.html || '';
    var newCss = codeStudioState.css || '';
    var newJs = codeStudioState.js || '';
    
    if (typeof window.showCodeDiffBar === 'function') {
        window.showCodeDiffBar(oldHtml, oldCss, oldJs, newHtml, newCss, newJs);
    }
    
    // Guardar mudanças pendentes
    codeStudioState.pendingChanges = changes;
}

// Confirmar mudanças (mantém as alterações já aplicadas)
window.acceptChanges = function acceptChanges() {
    // Salvar estado atual (já foi aplicado)
    saveCodeStudioState();
    
    // Limpar highlight de diff primeiro
    if (typeof window.clearDiffHighlight === 'function') {
        window.clearDiffHighlight();
    }
    
    // Esconder barra de diff
    if (typeof window.hideCodeDiffBar === 'function') {
        window.hideCodeDiffBar();
    }
    
    // Limpar estado anterior (não pode mais desfazer)
    codeStudioState.previousState = null;
    codeStudioState.pendingChanges = null;
    
    // Atualizar syntax highlight sem diff
    updateSyntaxHighlight();
    
    addChatMessage('ai', '✅ Alterações confirmadas!');
}

// Rejeitar mudanças (desfaz - ctrl+z)
window.rejectChanges = function rejectChanges() {
    console.log('[rejectChanges] Chamado! previousState:', codeStudioState.previousState);
    
    if (codeStudioState.previousState) {
        // Restaurar estado anterior
        codeStudioState.html = codeStudioState.previousState.html;
        codeStudioState.css = codeStudioState.previousState.css;
        codeStudioState.js = codeStudioState.previousState.js;
        
        console.log('[rejectChanges] Estado restaurado');
        
        // Atualizar editor e preview
        loadCodeStudioCode(codeStudioState.currentLang);
        runCodeStudio();
    } else {
        console.log('[rejectChanges] Sem previousState para restaurar!');
    }
    
    // Esconder barra de diff
    if (typeof window.hideCodeDiffBar === 'function') {
        window.hideCodeDiffBar();
    }
    
    // Limpar estado
    codeStudioState.previousState = null;
    codeStudioState.pendingChanges = null;
    
    addChatMessage('ai', '↩️ Alterações desfeitas');
}

// Desfazer última alteração (Ctrl+Z)
function undoLastChange() {
    if (!codeStudioState.previousState) {
        addChatMessage('ai', 'Nada para desfazer');
        return;
    }
    
    // Restaurar estado anterior
    codeStudioState.html = codeStudioState.previousState.html;
    codeStudioState.css = codeStudioState.previousState.css;
    codeStudioState.js = codeStudioState.previousState.js;
    
    loadCodeStudioCode(codeStudioState.currentLang);
    runCodeStudio();
    saveCodeStudioState();
    
    addChatMessage('ai', '↩️ Alteração desfeita');
    
    codeStudioState.previousState = null;
}

function clearChatMessages() {
    showClearChatConfirm();
}

function showClearChatConfirm() {
    var old = document.getElementById('clearChatModal');
    if (old) old.remove();
    
    var overlay = document.createElement('div');
    overlay.id = 'clearChatModal';
    overlay.className = 'cs-confirm-overlay';
    overlay.innerHTML = '<div class="cs-confirm-box">' +
        '<div class="cs-confirm-title">Limpar Chat</div>' +
        '<div class="cs-confirm-msg">Apagar todo o histórico?</div>' +
        '<div class="cs-confirm-btns">' +
        '<button class="cs-confirm-cancel" onclick="this.closest(\'.cs-confirm-overlay\').remove()">Cancelar</button>' +
        '<button class="cs-confirm-ok" onclick="doClearChat()">Apagar</button>' +
        '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

function doClearChat() {
    var modal = document.getElementById('clearChatModal');
    if (modal) modal.remove();
    var chat = document.getElementById('codeStudioChatMessages');
    if (chat) chat.innerHTML = '<div class="code-studio-chat-empty">Chat com IA para criar e editar código</div>';
}

// Mostrar animação premium de processamento
function showProcessingAnimation() {
    var messagesContainer = document.getElementById('codeStudioChatMessages');
    if (!messagesContainer) return;
    
    var processingDiv = document.createElement('div');
    processingDiv.className = 'code-studio-processing';
    processingDiv.id = 'csProcessingMsg';
    
    // Criar spans para os números binários
    var binarySpans = '';
    for (var i = 0; i < 20; i++) {
        binarySpans += '<span>' + (Math.random() > 0.5 ? '1' : '0') + '</span>';
    }
    
    processingDiv.innerHTML = `
        <span class="code-studio-processing-text">codificando</span>
        <div class="code-studio-processing-binary" id="csBinaryContainer">${binarySpans}</div>
    `;
    
    messagesContainer.appendChild(processingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Animar os números binários mudando aleatoriamente
    codeStudioState.binaryInterval = setInterval(function() {
        var container = document.getElementById('csBinaryContainer');
        if (!container) {
            clearInterval(codeStudioState.binaryInterval);
            return;
        }
        var spans = container.querySelectorAll('span');
        spans.forEach(function(span) {
            if (Math.random() > 0.7) {
                span.textContent = Math.random() > 0.5 ? '1' : '0';
            }
        });
    }, 100);
}

// Remover animação de processamento
function hideProcessingAnimation() {
    if (codeStudioState.binaryInterval) {
        clearInterval(codeStudioState.binaryInterval);
        codeStudioState.binaryInterval = null;
    }
    var processingMsg = document.getElementById('csProcessingMsg');
    if (processingMsg) processingMsg.remove();
}

// Restaurar botão enviar ao estado normal
function restoreSendButton() {
    var sendBtn = document.getElementById('codeStudioSendBtn');
    if (sendBtn) {
        sendBtn.classList.remove('stop-btn');
        sendBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i>';
        sendBtn.onclick = handleCodeStudioAIRequest;
    }
    codeStudioState.isProcessingAI = false;
    
    // Remover botão de cancelar edição se existir
    var cancelBtn = document.getElementById('csEditCancelBtn');
    if (cancelBtn) cancelBtn.remove();
    codeStudioState.isEditing = false;
    codeStudioState.editingMessages = null;
}

// Parar geração e desfazer
function stopCodeStudioGeneration() {
    console.log('[CodeStudio] ⏹️ STOP CLICADO - Parando geração...');
    
    codeStudioState.isCancelled = true;
    codeStudioState.isProcessingAI = false;
    
    // Parar LLM local se estiver ativo
    if (typeof window.localLlmState !== 'undefined' && window.localLlmState) {
        window.localLlmState.isCancelled = true;
        // Abortar fetch se existir
        if (window.localLlmState.abortController) {
            try { window.localLlmState.abortController.abort(); } catch(e) {}
        }
    }
    
    // Abortar requisição fetch em andamento
    if (codeStudioState.abortController) {
        try { 
            codeStudioState.abortController.abort(); 
            console.log('[CodeStudio] Fetch abortado');
        } catch(e) {}
        codeStudioState.abortController = null;
    }
    
    // Remover animação
    hideProcessingAnimation();
    
    // Remover thinking do agent se existir
    removeAgentThinking();
    
    // Restaurar botão IMEDIATAMENTE
    restoreSendButton();
    
    addChatMessage('ai', '⏹️ Geração cancelada');
}

// ===== IA PARA CODE STUDIO - SISTEMA REESCRITO =====
// EDIT: Processa código completo, retorna código completo
// AGENT: Passo a passo com navegação por seções
// ASK: Analisa código e responde

async function handleCodeStudioAIRequest() {
    var chatInput = document.getElementById('codeStudioChatInput');
    var sendBtn = document.getElementById('codeStudioSendBtn');
    var prompt = chatInput.value.trim();
    
    if (!prompt || codeStudioState.isProcessingAI) return;
    
    // Checar modo atual
    var currentMode = codeStudioState.mode || 'edit';
    console.log('[CodeStudio] Modo:', currentMode, '| Prompt:', prompt);
    
    codeStudioState.isProcessingAI = true;
    codeStudioState.isCancelled = false;
    
    // Transformar em botão STOP
    sendBtn.classList.add('stop-btn');
    sendBtn.innerHTML = '<i class="fas fa-stop"></i>';
    sendBtn.onclick = stopCodeStudioGeneration;
    
    chatInput.value = '';
    
    // Adiciona mensagem do usuário no chat
    addChatMessage('user', prompt);
    
    // Mostrar animação
    showProcessingAnimation();
    saveCodeStudioCurrentCode();
    
    try {
        // Verificar se LLM local está ativo (usa função automática que considera internet)
        // IMPORTANTE: Só usa LLM local se:
        // 1. O modo offline está habilitado E não tem internet
        // 2. OU o modo online está desabilitado E offline está habilitado
        // 3. E já tem modelo CARREGADO na memória (para não esquentar o celular)
        var useLocalLLM = false;
        if (typeof isLocalLlmActive === 'function' && isLocalLlmActive()) {
            // Verificar se modelo já está carregado (não forçar carregamento)
            if (window.localLlmState && window.localLlmState.engine) {
                useLocalLLM = true;
                console.log('[CodeStudio] Usando LLM LOCAL (modelo já carregado)');
            } else {
                console.log('[CodeStudio] LLM local ativo mas modelo não carregado - usando API online');
            }
        }
        
        var response;
        
        // ═══════════════════════════════════════════════════════════════
        // ███ MODO ASK - Analisa código completo e responde ███
        // ═══════════════════════════════════════════════════════════════
        if (currentMode === 'ask') {
            var askPrompt = `Você é um assistente expert em desenvolvimento web. 
Analise o código e responda a pergunta do usuário de forma clara em português.

CÓDIGO DO PROJETO:

=== HTML ===
${codeStudioState.html || '(vazio)'}

=== CSS ===
${codeStudioState.css || '(vazio)'}

=== JS ===
${codeStudioState.js || '(vazio)'}

PERGUNTA: ${prompt}

Responda de forma útil e educativa.`;

            response = useLocalLLM 
                ? await callLocalLLMForAsk('Assistente de código web. Responda perguntas sobre o código.', askPrompt)
                : await callCodeStudioWithMainAI('Assistente de código web. Responda perguntas sobre o código.', askPrompt);
            
            if (codeStudioState.isCancelled) return;
            
            hideProcessingAnimation();
            addChatMessage('ai', response);
            restoreSendButton();
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ███ MODO AGENT - Passo a passo com seções ███
        // ═══════════════════════════════════════════════════════════════
        if (currentMode === 'agent') {
            await handleAgentModeNew(prompt, useLocalLLM);
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════
        // ███ MODO EDIT - Edições cirúrgicas incrementais (SEARCH/REPLACE) ███
        // ═══════════════════════════════════════════════════════════════
        
        // Verificar se é uma mudança pequena ou grande
        var isSmallEdit = prompt.length < 100 && !prompt.match(/crie|novo|projeto|do zero|completo|inteiro/i);
        var htmlLen = (codeStudioState.html || '').length;
        var cssLen = (codeStudioState.css || '').length;
        var jsLen = (codeStudioState.js || '').length;
        var totalCodeLen = htmlLen + cssLen + jsLen;
        
        // Se código é pequeno (<2000 chars) ou é pedido complexo, usar modo completo
        var useIncrementalEdit = isSmallEdit && totalCodeLen > 2000;
        
        var editPrompt;
        
        if (useIncrementalEdit) {
            // MODO INCREMENTAL - Só envia o que precisa mudar
            editPrompt = `Você é um desenvolvedor web expert. Faça APENAS as edições necessárias.

PEDIDO: ${prompt}

CÓDIGO ATUAL:

---HTML---
${codeStudioState.html || ''}
---/HTML---

---CSS---
${codeStudioState.css || ''}
---/CSS---

---JS---
${codeStudioState.js || ''}
---/JS---

IMPORTANTE: Retorne APENAS as edições necessárias no formato:

---EDIT HTML---
<<<SEARCH>>>
(trecho exato do código atual que será substituído)
<<<REPLACE>>>
(novo código que substitui o trecho)
---/EDIT HTML---

---EDIT CSS---
<<<SEARCH>>>
(trecho exato do CSS atual)
<<<REPLACE>>>
(novo CSS)
---/EDIT CSS---

---EDIT JS---
<<<SEARCH>>>
(trecho exato do JS atual)
<<<REPLACE>>>
(novo JS)
---/EDIT JS---

REGRAS:
- Use <<<SEARCH>>> com código EXATAMENTE como está no original (incluindo espaços)
- Faça o MÍNIMO de edições necessárias
- Se um arquivo não precisa mudar, NÃO inclua bloco EDIT para ele
- Depois das edições, explique brevemente o que fez`;

        } else {
            // MODO COMPLETO - Para código pequeno ou mudanças grandes
            editPrompt = `Você é um desenvolvedor web expert. Faça o que foi pedido.

PEDIDO: ${prompt}

REGRAS DE FORMATAÇÃO CSS (SEMPRE APLICAR):
- Use * { margin: 0; padding: 0; box-sizing: border-box; }
- Use body { padding: 20px; min-height: 100vh; }
- Cores escuras de fundo (#1a1a2e, #16213e, #0f0f23)
- Texto claro (#fff, #e0e0e0)
- Botões com border-radius: 12px e padding: 14px 24px
- Use flexbox ou grid para layouts
- Fontes: font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

CÓDIGO ATUAL:

---HTML---
${codeStudioState.html || ''}
---/HTML---

---CSS---
${codeStudioState.css || ''}
---/CSS---

---JS---
${codeStudioState.js || ''}
---/JS---

Retorne o código COMPLETO modificado:
---HTML---
(html completo)
---/HTML---

---CSS---
(css completo)
---/CSS---

---JS---
(js completo)
---/JS---

Depois uma explicação breve.`;
        }

        response = useLocalLLM 
            ? await callLocalLLMForCodeStudio(editPrompt)
            : await callCodeStudioWithMainAI('Desenvolvedor web. Aplique edições.', editPrompt);
        
        if (codeStudioState.isCancelled) return;
        
        // ═══ PROCESSAR RESPOSTA DO MODO EDIT ═══
        var changes = [];
        var usedIncrementalEdit = false;
        
        // PRIMEIRO: Tentar modo incremental (SEARCH/REPLACE)
        var edits = parseEditResponse(response);
        if (edits.length > 0) {
            console.log('[CodeStudio] Aplicando ' + edits.length + ' edições incrementais');
            changes = applyEdits(edits);
            usedIncrementalEdit = true;
        }
        
        // SEGUNDO: Se não encontrou edits incrementais, tentar modo completo
        if (changes.length === 0) {
            var htmlMatch = response.match(/---HTML---([\s\S]*?)---\/HTML---/);
            var cssMatch = response.match(/---CSS---([\s\S]*?)---\/CSS---/);
            var jsMatch = response.match(/---JS---([\s\S]*?)---\/JS---/);
            
            var newHtml = htmlMatch && htmlMatch[1].trim() ? cleanCodeMarkers(htmlMatch[1].trim()) : null;
            var newCss = cssMatch && cssMatch[1].trim() ? cleanCodeMarkers(cssMatch[1].trim()) : null;
            var newJs = jsMatch && jsMatch[1].trim() ? cleanCodeMarkers(jsMatch[1].trim()) : null;
            
            if (newHtml) {
                var diff = calculateDiff(codeStudioState.html || '', newHtml);
                changes.push({ lang: 'html', code: newHtml, added: diff.added, removed: diff.removed });
            }
            if (newCss) {
                var diff = calculateDiff(codeStudioState.css || '', newCss);
                changes.push({ lang: 'css', code: newCss, added: diff.added, removed: diff.removed });
            }
            if (newJs) {
                var diff = calculateDiff(codeStudioState.js || '', newJs);
                changes.push({ lang: 'js', code: newJs, added: diff.added, removed: diff.removed });
            }
        }
        
        hideProcessingAnimation();
        
        if (changes.length > 0) {
            // Extrair explicação (texto fora dos blocos de código)
            var explanation = response
                .replace(/---HTML---[\s\S]*?---\/HTML---/g, '')
                .replace(/---CSS---[\s\S]*?---\/CSS---/g, '')
                .replace(/---JS---[\s\S]*?---\/JS---/g, '')
                .replace(/---EDIT\s+\w+---[\s\S]*?---\/EDIT\s+\w+---/gi, '')
                .trim();
            
            if (explanation.length > 500) {
                explanation = explanation.substring(0, 500) + '...';
            }
            
            // Adicionar indicador de modo usado
            var modeIndicator = usedIncrementalEdit ? '🔧 ' : '';
            showPendingChanges(modeIndicator + (explanation || 'Alterações aplicadas.'), changes);
        } else {
            // Não conseguiu extrair código formatado - tentar extrair de outra forma
            // Procurar blocos de código markdown
            var htmlAlt = response.match(/```html\s*([\s\S]*?)```/i);
            var cssAlt = response.match(/```css\s*([\s\S]*?)```/i);
            var jsAlt = response.match(/```(?:javascript|js)\s*([\s\S]*?)```/i);
            
            var altChanges = [];
            if (htmlAlt && htmlAlt[1].trim()) {
                altChanges.push({ lang: 'html', code: cleanCodeMarkers(htmlAlt[1].trim()), added: 1, removed: 0 });
            }
            if (cssAlt && cssAlt[1].trim()) {
                altChanges.push({ lang: 'css', code: cleanCodeMarkers(cssAlt[1].trim()), added: 1, removed: 0 });
            }
            if (jsAlt && jsAlt[1].trim()) {
                altChanges.push({ lang: 'js', code: cleanCodeMarkers(jsAlt[1].trim()), added: 1, removed: 0 });
            }
            
            if (altChanges.length > 0) {
                showPendingChanges('Código extraído:', altChanges);
            } else {
                // Último recurso - mostrar resposta e pedir para reformular
                addChatMessage('ai', response + '\n\n⚠️ Não consegui extrair o código formatado. Tente novamente sendo mais específico.');
            }
        }
        
    } catch (error) {
        if (codeStudioState.isCancelled) {
            console.log('[CodeStudio] Cancelado');
        } else {
            hideProcessingAnimation();
            console.error('[CodeStudio] Erro:', error);
            addChatMessage('ai', 'Erro ao processar: ' + error.message);
        }
    }
    
    restoreSendButton();
}

// ═══════════════════════════════════════════════════════════════════════════
// ███ MODO AGENT - Sistema Copilot com Múltiplas Iterações ███
// ═══════════════════════════════════════════════════════════════════════════
// 
// FLUXO ITERATIVO (como o Copilot real):
// 1. ANÁLISE    → Entender o pedido e o código atual
// 2. PLANO      → Dividir em subtarefas
// 3. EXECUÇÃO   → Para cada subtarefa: editar → validar → corrigir se necessário
// 4. VERIFICAR  → Código funciona? Tarefa completa?
// 5. ITERAR     → Se não completo, fazer mais edições
// 6. FINALIZAR  → Mostrar resultado
// ═══════════════════════════════════════════════════════════════════════════

async function handleAgentModeNew(task, useLocalLLM) {
    console.log('[AGENT] Iniciando:', task);
    hideProcessingAnimation();
    
    // Estado do agente
    var agentState = {
        currentCode: {
            html: codeStudioState.html || '',
            css: codeStudioState.css || '',
            js: codeStudioState.js || ''
        },
        edits: [],
        iteration: 0,
        maxIterations: 5,
        subtasks: [],
        completedSubtasks: [],
        summary: []
    };
    
    // ═══════════════════════════════════════════════════════════════════
    // FERRAMENTAS DE EDIÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    function replaceInFile(fileType, oldText, newText) {
        var code = agentState.currentCode[fileType] || '';
        if (code.includes(oldText)) {
            agentState.currentCode[fileType] = code.replace(oldText, newText);
            agentState.edits.push({ file: fileType, action: 'replace', desc: oldText.substring(0, 30) + '...' });
            return true;
        }
        return false;
    }
    
    function appendToFile(fileType, newCode) {
        agentState.currentCode[fileType] = (agentState.currentCode[fileType] || '') + '\n' + newCode;
        agentState.edits.push({ file: fileType, action: 'append', desc: '+' + newCode.split('\n').length + ' linhas' });
        return true;
    }
    
    function insertAfterPattern(fileType, pattern, newCode) {
        var code = agentState.currentCode[fileType] || '';
        var idx = code.indexOf(pattern);
        if (idx !== -1) {
            var end = idx + pattern.length;
            agentState.currentCode[fileType] = code.slice(0, end) + '\n' + newCode + code.slice(end);
            agentState.edits.push({ file: fileType, action: 'insert', desc: 'após ' + pattern.substring(0, 20) });
            return true;
        }
        return false;
    }
    
    function validateCode() {
        var errors = [];
        var html = agentState.currentCode.html;
        var js = agentState.currentCode.js;
        
        // HTML: tags balanceadas
        var openTags = (html.match(/<[a-z][^/>]*>/gi) || []).length;
        var closeTags = (html.match(/<\/[a-z]+>/gi) || []).length;
        if (Math.abs(openTags - closeTags) > 3) errors.push('HTML: tags desbalanceadas');
        
        // JS: chaves e parênteses
        var ob = (js.match(/\{/g) || []).length, cb = (js.match(/\}/g) || []).length;
        var op = (js.match(/\(/g) || []).length, cp = (js.match(/\)/g) || []).length;
        if (ob !== cb) errors.push('JS: {} desbalanceados');
        if (op !== cp) errors.push('JS: () desbalanceados');
        
        return errors;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FASE 1: ANÁLISE E PLANEJAMENTO
    // ═══════════════════════════════════════════════════════════════════
    addAgentSection('planning', 'search', 'Analisando pedido');
    addAgentThinking('Entendendo a tarefa...');
    
    var analyzePrompt = `Analise esta tarefa e crie um plano de execução:

**TAREFA:** ${task}

**CÓDIGO ATUAL:**
HTML (${agentState.currentCode.html.split('\n').length} linhas): ${agentState.currentCode.html.substring(0, 600)}
CSS (${agentState.currentCode.css.split('\n').length} linhas): ${agentState.currentCode.css.substring(0, 400)}
JS (${agentState.currentCode.js.split('\n').length} linhas): ${agentState.currentCode.js.substring(0, 400)}

Responda neste formato:

**ENTENDIMENTO:**
[O que o usuário quer em 1-2 frases]

**SUBTAREFAS:**
1. [subtarefa específica]
2. [subtarefa específica]
3. [subtarefa específica]
(máximo 5)

**ARQUIVOS AFETADOS:**
[html, css, js - quais serão modificados]`;

    var analysis;
    try {
        analysis = await callAgentLLM(analyzePrompt, useLocalLLM);
    } catch (e) {
        analysis = `**ENTENDIMENTO:** Implementar ${task}\n\n**SUBTAREFAS:**\n1. Criar estrutura HTML\n2. Estilizar com CSS\n3. Adicionar funcionalidade JS`;
    }
    
    if (codeStudioState.isCancelled) { restoreSendButton(); return; }
    
    removeAgentThinking();
    addAgentContent(analysis);
    
    // Extrair subtarefas
    var subtaskMatch = analysis.match(/\*\*SUBTAREFAS:\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (subtaskMatch) {
        var lines = subtaskMatch[1].split('\n');
        for (var i = 0; i < lines.length; i++) {
            var m = lines[i].match(/^\s*\d+\.\s*(.+)/);
            if (m && m[1].trim().length > 3) {
                agentState.subtasks.push(m[1].trim());
            }
        }
    }
    if (agentState.subtasks.length === 0) {
        agentState.subtasks = ['Implementar: ' + task];
    }
    
    addAgentChecklist(agentState.subtasks);
    await delay(300);
    
    // ═══════════════════════════════════════════════════════════════════
    // FASE 2: EXECUTAR SUBTAREFAS (LOOP ITERATIVO)
    // ═══════════════════════════════════════════════════════════════════
    
    for (var t = 0; t < agentState.subtasks.length; t++) {
        if (codeStudioState.isCancelled) { restoreSendButton(); return; }
        
        var subtask = agentState.subtasks[t];
        updateChecklistItem(t, 'progress');
        addAgentSection('task', 'cog', 'Passo ' + (t + 1) + ': ' + subtask.substring(0, 40));
        
        // ── PASSO A: GERAR EDIÇÕES PARA ESTA SUBTAREFA ──
        addAgentThinking('Gerando edições...');
        
        var editPrompt = `Execute esta subtarefa fazendo EDIÇÕES CIRÚRGICAS:

**SUBTAREFA:** ${subtask}
**CONTEXTO GERAL:** ${task}

**CÓDIGO ATUAL:**
---HTML---
${agentState.currentCode.html}
---/HTML---

---CSS---
${agentState.currentCode.css}
---/CSS---

---JS---
${agentState.currentCode.js}
---/JS---

Use este formato para CADA edição:

===EDIT===
FILE: html | css | js
ACTION: replace | append | insert_after
SEARCH: [texto a buscar - para replace ou insert_after]
CODE:
[código novo]
===END===

Faça quantas edições forem necessárias. Seja PRECISO no SEARCH - deve corresponder EXATAMENTE ao código existente.`;

        var editResponse;
        try {
            editResponse = await callAgentLLM(editPrompt, useLocalLLM);
        } catch (e) {
            removeAgentThinking();
            addAgentContent('❌ Erro ao gerar edições');
            updateChecklistItem(t, 'error');
            continue;
        }
        
        if (codeStudioState.isCancelled) { restoreSendButton(); return; }
        removeAgentThinking();
        
        // ── PASSO B: PARSEAR E APLICAR EDIÇÕES ──
        var editBlocks = editResponse.split(/===EDIT===/i).slice(1);
        var editsDone = 0;
        
        for (var e = 0; e < editBlocks.length && e < 6; e++) {
            var block = editBlocks[e].split(/===END===/i)[0];
            
            var fileMatch = block.match(/FILE:\s*(html|css|js)/i);
            var actionMatch = block.match(/ACTION:\s*(replace|append|insert_after)/i);
            var searchMatch = block.match(/SEARCH:\s*([^\n]+(?:\n(?!CODE:)[^\n]+)*)/i);
            var codeMatch = block.match(/CODE:\s*([\s\S]*?)(?=\n===|$)/i);
            
            if (!fileMatch || !actionMatch || !codeMatch) continue;
            
            var file = fileMatch[1].toLowerCase();
            var action = actionMatch[1].toLowerCase();
            var search = searchMatch ? searchMatch[1].trim() : '';
            var code = codeMatch[1].trim();
            
            var success = false;
            
            if (action === 'replace' && search) {
                success = replaceInFile(file, search, code);
            } else if (action === 'append') {
                success = appendToFile(file, code);
            } else if (action === 'insert_after' && search) {
                success = insertAfterPattern(file, search, code);
            }
            
            if (success) {
                editsDone++;
                addAgentContent(`✓ ${action.toUpperCase()} em ${file.toUpperCase()}`);
            }
        }
        
        // Se não conseguiu parsear edições, tentar extrair código completo
        if (editsDone === 0) {
            var fallback = parseCodeResponse(editResponse);
            if (fallback.html) { agentState.currentCode.html = fallback.html; editsDone++; }
            if (fallback.css) { agentState.currentCode.css = fallback.css; editsDone++; }
            if (fallback.js) { agentState.currentCode.js = fallback.js; editsDone++; }
            if (editsDone > 0) addAgentContent(`✓ Código atualizado (${editsDone} arquivos)`);
        }
        
        // ── PASSO C: VALIDAR ──
        addAgentThinking('Validando...');
        await delay(200);
        
        var errors = validateCode();
        removeAgentThinking();
        
        if (errors.length > 0) {
            addAgentValidation('warning', errors.join(', '));
            
            // Tentar corrigir
            addAgentThinking('Corrigindo erros...');
            
            var fixPrompt = `ERROS ENCONTRADOS: ${errors.join(', ')}

Corrija o código:

---HTML---
${agentState.currentCode.html}
---/HTML---

---CSS---
${agentState.currentCode.css}
---/CSS---

---JS---
${agentState.currentCode.js}
---/JS---

Retorne código CORRIGIDO no mesmo formato.`;

            try {
                var fixResp = await callAgentLLM(fixPrompt, useLocalLLM);
                var fixed = parseCodeResponse(fixResp);
                if (fixed.html) agentState.currentCode.html = fixed.html;
                if (fixed.css) agentState.currentCode.css = fixed.css;
                if (fixed.js) agentState.currentCode.js = fixed.js;
                removeAgentThinking();
                addAgentContent('🔧 Corrigido');
            } catch (e) {
                removeAgentThinking();
            }
        } else {
            addAgentValidation('success', '✓ OK');
        }
        
        updateChecklistItem(t, 'done');
        agentState.completedSubtasks.push(subtask);
        agentState.summary.push('• ' + subtask);
        
        await delay(200);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FASE 3: VERIFICAÇÃO FINAL
    // ═══════════════════════════════════════════════════════════════════
    addAgentSection('review', 'clipboard-check', 'Verificação final');
    addAgentThinking('Verificando se tudo está correto...');
    
    var verifyPrompt = `Verifique se a tarefa foi completada corretamente:

**TAREFA ORIGINAL:** ${task}

**SUBTAREFAS EXECUTADAS:**
${agentState.summary.join('\n')}

**CÓDIGO FINAL:**
HTML: ${agentState.currentCode.html.substring(0, 1500)}
CSS: ${agentState.currentCode.css.substring(0, 800)}
JS: ${agentState.currentCode.js.substring(0, 800)}

Responda:
1. **COMPLETO?** sim/não
2. **O QUE FOI FEITO:**
   • [item 1]
   • [item 2]
3. **FALTA ALGO?** [se sim, o que]`;

    var verify;
    try {
        verify = await callAgentLLM(verifyPrompt, useLocalLLM);
    } catch (e) {
        verify = '**COMPLETO?** sim\n**O QUE FOI FEITO:**\n' + agentState.summary.join('\n');
    }
    
    if (codeStudioState.isCancelled) { restoreSendButton(); return; }
    
    removeAgentThinking();
    addAgentContent(verify);
    
    // ═══════════════════════════════════════════════════════════════════
    // FASE 4: RESULTADO
    // ═══════════════════════════════════════════════════════════════════
    addAgentSection('complete', 'flag-checkered', 'Concluído');
    
    var changes = [];
    if (agentState.currentCode.html !== codeStudioState.html) {
        var diff = calculateDiff(codeStudioState.html || '', agentState.currentCode.html);
        changes.push({ lang: 'html', code: agentState.currentCode.html, added: diff.added, removed: diff.removed });
    }
    if (agentState.currentCode.css !== codeStudioState.css) {
        var diff = calculateDiff(codeStudioState.css || '', agentState.currentCode.css);
        changes.push({ lang: 'css', code: agentState.currentCode.css, added: diff.added, removed: diff.removed });
    }
    if (agentState.currentCode.js !== codeStudioState.js) {
        var diff = calculateDiff(codeStudioState.js || '', agentState.currentCode.js);
        changes.push({ lang: 'js', code: agentState.currentCode.js, added: diff.added, removed: diff.removed });
    }
    
    var finalSummary = `**${agentState.completedSubtasks.length} passos concluídos:**\n${agentState.summary.join('\n')}`;
    
    if (changes.length > 0) {
        showPendingChanges(finalSummary, changes);
    } else {
        var forced = [];
        if (agentState.currentCode.html) forced.push({ lang: 'html', code: agentState.currentCode.html, added: 1, removed: 0 });
        if (agentState.currentCode.css) forced.push({ lang: 'css', code: agentState.currentCode.css, added: 1, removed: 0 });
        if (agentState.currentCode.js) forced.push({ lang: 'js', code: agentState.currentCode.js, added: 1, removed: 0 });
        showPendingChanges(finalSummary, forced);
    }
    
    restoreSendButton();
}

// Extrair todos os comentários de seção do código
function extractAllSectionComments(html, css, js) {
    var sections = { html: [], css: [], js: [], total: 0, formatted: '' };
    
    // Padrões de comentário de seção
    var htmlPattern = /<!--\s*[═=─-]{2,}\s*(.+?)\s*[═=─-]{2,}\s*-->/gi;
    var cssPattern = /\/\*\s*[═=─-]{2,}\s*(.+?)\s*[═=─-]{2,}\s*\*\//gi;
    var jsPattern = /\/\/\s*[═=─-]{2,}\s*(.+?)\s*[═=─-]{2,}/gi;
    
    var match;
    var lines;
    
    // HTML
    lines = html.split('\n');
    for (var i = 0; i < lines.length; i++) {
        htmlPattern.lastIndex = 0;
        match = htmlPattern.exec(lines[i]);
        if (match) {
            sections.html.push({ name: match[1].trim(), line: i + 1 });
        }
    }
    
    // CSS
    lines = css.split('\n');
    for (var i = 0; i < lines.length; i++) {
        cssPattern.lastIndex = 0;
        match = cssPattern.exec(lines[i]);
        if (match) {
            sections.css.push({ name: match[1].trim(), line: i + 1 });
        }
    }
    
    // JS
    lines = js.split('\n');
    for (var i = 0; i < lines.length; i++) {
        jsPattern.lastIndex = 0;
        match = jsPattern.exec(lines[i]);
        if (match) {
            sections.js.push({ name: match[1].trim(), line: i + 1 });
        }
    }
    
    sections.total = sections.html.length + sections.css.length + sections.js.length;
    
    // Formatar para exibição
    var formatted = '';
    if (sections.html.length > 0) {
        formatted += 'HTML:\n';
        sections.html.forEach(s => { formatted += '  • ' + s.name + ' (linha ' + s.line + ')\n'; });
    }
    if (sections.css.length > 0) {
        formatted += 'CSS:\n';
        sections.css.forEach(s => { formatted += '  • ' + s.name + ' (linha ' + s.line + ')\n'; });
    }
    if (sections.js.length > 0) {
        formatted += 'JS:\n';
        sections.js.forEach(s => { formatted += '  • ' + s.name + ' (linha ' + s.line + ')\n'; });
    }
    sections.formatted = formatted || '(sem seções definidas)';
    
    return sections;
}

// Extrair código de seções específicas
function extractCodeBySections(code, sectionIndex, sectionNames) {
    var result = '';
    
    function extractFromFile(fileCode, fileSections, fileType) {
        var lines = fileCode.split('\n');
        var extracted = '';
        
        for (var i = 0; i < sectionNames.length; i++) {
            var wantedName = sectionNames[i].toUpperCase();
            
            for (var j = 0; j < fileSections.length; j++) {
                if (fileSections[j].name.toUpperCase().includes(wantedName)) {
                    var startLine = fileSections[j].line - 1;
                    var endLine = (j + 1 < fileSections.length) ? fileSections[j + 1].line - 2 : lines.length;
                    
                    extracted += '// === ' + fileType + ': ' + fileSections[j].name + ' (L' + (startLine+1) + '-' + (endLine+1) + ') ===\n';
                    for (var k = startLine; k <= endLine && k < lines.length; k++) {
                        extracted += lines[k] + '\n';
                    }
                    extracted += '\n';
                }
            }
        }
        
        return extracted;
    }
    
    result += extractFromFile(code.html, sectionIndex.html, 'HTML');
    result += extractFromFile(code.css, sectionIndex.css, 'CSS');
    result += extractFromFile(code.js, sectionIndex.js, 'JS');
    
    return result || '(nenhuma seção encontrada)';
}

// ═══════════════════════════════════════════════════════════════════════════
// ███ CHAMADA PARA LLM LOCAL (OFFLINE) ███
// ═══════════════════════════════════════════════════════════════════════════

async function callLocalLLMForCodeStudio(prompt) {
    console.log('[CodeStudio Local] Iniciando chamada LLM local com STREAMING visual...');
    
    createStreamingMessage();
    
    var systemPrompt = `Você é um assistente de código web. SEMPRE retorne código modificado.

FORMATO OBRIGATÓRIO:
---HTML---
(código html completo)
---/HTML---

---CSS---
(código css completo)  
---/CSS---

---JS---
(código js completo)
---/JS---

Explicação breve em português.`;
    
    // Contexto generoso - até 15k tokens (~60k chars)
    var htmlCode = codeStudioState.html.length > 20000 ? 
        codeStudioState.html.substring(0, 20000) + '\n... (truncated)' : 
        codeStudioState.html;
    var cssCode = codeStudioState.css.length > 12000 ? 
        codeStudioState.css.substring(0, 12000) + '\n... (truncated)' : 
        codeStudioState.css;
    var jsCode = codeStudioState.js.length > 12000 ? 
        codeStudioState.js.substring(0, 12000) + '\n... (truncated)' : 
        codeStudioState.js;
    
    var userMessage = `Current code:

=== HTML ===
${htmlCode}

=== CSS ===
${cssCode}

=== JS ===
${jsCode}

Task: ${prompt}`;

    // Montar mensagens
    var messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];
    
    // Coletar resposta via stream com atualização visual
    await window.generateLocalResponse(messages, function(chunk) {
        updateStreamingMessage(chunk);
    });
    
    console.log('[CodeStudio Local] Resposta completa via streaming');
    return finalizeStreamingMessage();
}

// ===== CHAMADA PARA LLM LOCAL - MODO ASK =====
async function callLocalLLMForAsk(systemPrompt, context) {
    console.log('[CodeStudio Local ASK] Iniciando...');
    
    var messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
    ];
    
    var fullResponse = '';
    
    await window.generateLocalResponse(messages, function(chunk) {
        fullResponse += chunk;
    });
    
    console.log('[CodeStudio Local ASK] Resposta:', fullResponse.length, 'chars');
    return fullResponse;
}

// ===== Funções Auxiliares do Agent =====

async function callAgentLLM(prompt, useLocalLLM) {
    if (useLocalLLM) {
        return await callLocalLLMForAsk(prompt, '');
    } else {
        return await callCodeStudioWithMainAI(prompt, '');
    }
}

function extractSubtasks(planning) {
    var subtasks = [];
    var lines = planning.split('\n');
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        // Procurar padrões como "SUBTASK 1:", "- SUBTASK 1:", "1.", "- 1."
        var match = line.match(/(?:SUBTASK\s*\d+[:\s]*|^[\-\*]\s*(?:SUBTASK\s*)?\d+[:\.\)]\s*|^\d+[:\.\)]\s*)(.+)/i);
        if (match && match[1]) {
            var task = match[1].trim();
            if (task.length > 5 && task.length < 200) {
                subtasks.push(task);
            }
        }
    }
    
    // Se não encontrou, tentar extrair itens de lista
    if (subtasks.length === 0) {
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.match(/^[\-\*]\s+[A-Z]/)) {
                var task = line.replace(/^[\-\*]\s+/, '').trim();
                if (task.length > 10 && task.length < 150) {
                    subtasks.push(task);
                }
            }
        }
    }
    
    return subtasks.slice(0, 6); // Máximo 6 subtarefas
}

function parseCodeResponse(response) {
    var htmlMatch = response.match(/---HTML---([\s\S]*?)---\/HTML---/);
    var cssMatch = response.match(/---CSS---([\s\S]*?)---\/CSS---/);
    var jsMatch = response.match(/---JS---([\s\S]*?)---\/JS---/);
    
    return {
        html: htmlMatch && htmlMatch[1].trim().length > 20 ? cleanCodeMarkers(htmlMatch[1].trim()) : null,
        css: cssMatch && cssMatch[1].trim().length > 5 ? cleanCodeMarkers(cssMatch[1].trim()) : null,
        js: jsMatch && jsMatch[1].trim().length > 5 ? cleanCodeMarkers(jsMatch[1].trim()) : null
    };
}

function addAgentSection(type, icon, title) {
    var colors = {
        planning: '#8b5cf6',
        task: '#3b82f6',
        review: '#f59e0b',
        complete: '#10b981'
    };
    var color = colors[type] || '#8b5cf6';
    
    var html = `
        <div class="agent-section" style="border-left: 3px solid ${color}; margin: 16px 0 8px 0; padding-left: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; color: ${color}; font-weight: 600; font-size: 13px; margin-bottom: 6px;">
                <i class="fas fa-${icon}"></i>
                <span>${title}</span>
            </div>
        </div>
    `;
    addAgentHTML(html);
}

function addAgentThinking(text) {
    var html = `
        <div class="agent-thinking" id="agentThinking" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; margin: 6px 0;">
            <div style="display: flex; gap: 4px;">
                <span style="width: 6px; height: 6px; background: #fbbf24; border-radius: 50%; animation: agentDot 1.4s ease-in-out infinite;"></span>
                <span style="width: 6px; height: 6px; background: #fbbf24; border-radius: 50%; animation: agentDot 1.4s ease-in-out 0.2s infinite;"></span>
                <span style="width: 6px; height: 6px; background: #fbbf24; border-radius: 50%; animation: agentDot 1.4s ease-in-out 0.4s infinite;"></span>
            </div>
            <span style="color: #fbbf24; font-size: 12px; font-style: italic;">${text}</span>
        </div>
        <style>
            @keyframes agentDot {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
        </style>
    `;
    addAgentHTML(html);
}

function removeAgentThinking() {
    var el = document.getElementById('agentThinking');
    if (el) el.remove();
}

function addAgentContent(text) {
    // Aplicar formatação markdown
    var formattedText = formatChatMessage(text);
    var html = `
        <div class="agent-content" style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px 12px; margin: 6px 0; color: #d1d5db; font-size: 13px; line-height: 1.6;">
${formattedText}
        </div>
    `;
    addAgentHTML(html);
}

function addAgentValidation(type, text) {
    var colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
    var color = colors[type] || '#10b981';
    // Aplicar formatação
    var formattedText = formatChatMessage(text);
    var html = `
        <div style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: ${color}15; border-radius: 6px; margin: 4px 0; font-size: 12px; color: ${color};">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i>
            <span>${formattedText}</span>
        </div>
    `;
    addAgentHTML(html);
}

function addAgentChecklist(subtasks) {
    var items = subtasks.map(function(task, i) {
        return '<div class="agent-checklist-item" id="agentCheck' + i + '" style="display: flex; align-items: center; gap: 8px; padding: 6px 0; color: #888; font-size: 12px;"><i class="far fa-circle" style="width: 16px;"></i><span>' + task.substring(0, 60) + '</span></div>';
    }).join('');
    
    var html = `
        <div class="agent-checklist" style="background: rgba(30,30,30,0.5); border-radius: 8px; padding: 10px 12px; margin: 10px 0;">
            <div style="font-size: 11px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Subtarefas</div>
            ${items}
        </div>
    `;
    addAgentHTML(html);
}

function updateChecklistItem(index, status) {
    var item = document.getElementById('agentCheck' + index);
    if (!item) return;
    
    var icon = item.querySelector('i');
    if (!icon) return;
    
    if (status === 'progress') {
        icon.className = 'fas fa-spinner fa-spin';
        icon.style.color = '#fbbf24';
        item.style.color = '#fbbf24';
    } else if (status === 'done') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#10b981';
        item.style.color = '#10b981';
    } else if (status === 'error') {
        icon.className = 'fas fa-times-circle';
        icon.style.color = '#ef4444';
        item.style.color = '#ef4444';
    } else if (status === 'warning') {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = '#f59e0b';
        item.style.color = '#f59e0b';
    }
}

function addAgentHTML(html) {
    var container = document.getElementById('codeStudioChatMessages');
    if (container) {
        container.insertAdjacentHTML('beforeend', html);
        container.scrollTop = container.scrollHeight;
    }
}

// Função delay
function delay(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

// Usa a mesma configuração de API do chat principal com system prompt separado
async function callCodeStudioWithMainAI(systemPrompt, userMessage) {
    console.log('[CodeStudio API] === Iniciando chamada de API ===');
    
    // Criar AbortController para permitir cancelamento
    codeStudioState.abortController = new AbortController();
    
    // Obter provider e modelo via NeoAPI (fonte única)
    var apiProvider, selectedModel, apiKey;
    
    if (typeof NeoAPI !== 'undefined') {
        selectedModel = NeoAPI.getModel();
        apiProvider = NeoAPI.getProvider(selectedModel);
        apiKey = NeoAPI.getKey(apiProvider) || '';
    } else {
        apiProvider = localStorage.getItem('neo_selected_provider') || 'gemini';
        selectedModel = localStorage.getItem('neo_selected_model') || 'gemini-2.5-flash';
        apiKey = localStorage.getItem(apiProvider === 'gemini' ? 'neo_user_api_key' : 'neo_api_' + apiProvider) || '';
    }
    
    console.log('[CodeStudio API] Provider:', apiProvider, 'Modelo:', selectedModel, 'Key:', apiKey ? 'SIM' : 'NÃO');
    
    if (!apiKey) {
        throw new Error('Configure a chave API de ' + apiProvider.toUpperCase() + ' nas configurações do app');
    }
    
    // Chamar a API apropriada
    if (apiProvider === 'gemini') {
        return await callGeminiForCodeStudio(apiKey, systemPrompt, userMessage);
    } else if (apiProvider === 'openai') {
        return await callOpenAIForCodeStudio(apiKey, systemPrompt, userMessage);
    } else if (apiProvider === 'anthropic') {
        return await callAnthropicForCodeStudio(apiKey, systemPrompt, userMessage);
    } else if (apiProvider === 'deepseek') {
        return await callDeepseekForCodeStudio(apiKey, systemPrompt, userMessage);
    } else if (apiProvider === 'groq') {
        return await callGroqForCodeStudio(apiKey, systemPrompt, userMessage);
    } else if (apiProvider === 'openrouter') {
        return await callOpenRouterForCodeStudio(apiKey, systemPrompt, userMessage);
    } else {
        return await callGeminiForCodeStudio(apiKey, systemPrompt, userMessage);
    }
}

async function callGeminiForCodeStudio(apiKey, systemPrompt, userMessage) {
    console.log('[CodeStudio Gemini] Iniciando chamada com STREAMING...');
    var modelName = localStorage.getItem('neo_selected_model') || localStorage.getItem('geminiModel') || 'gemini-2.5-flash';
    console.log('[CodeStudio Gemini] Modelo:', modelName);
    
    createStreamingMessage();
    
    try {
        var fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userMessage }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192
                }
            })
        };
        
        if (codeStudioState.abortController) {
            fetchOptions.signal = codeStudioState.abortController.signal;
        }
        
        // Gemini streaming endpoint
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':streamGenerateContent?alt=sse&key=' + apiKey;
        var response = await fetch(url, fetchOptions);
        
        console.log('[CodeStudio Gemini] Response status:', response.status);
        
        if (!response.ok) {
            var err = await response.text();
            console.error('[CodeStudio Gemini] Erro:', err);
            finalizeStreamingMessage();
            throw new Error('Erro Gemini: ' + response.status);
        }
        
        // Processar stream
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
        
        while (true) {
            var result = await reader.read();
            if (result.done) break;
            
            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line || !line.startsWith('data: ')) continue;
                
                try {
                    var json = JSON.parse(line.substring(6));
                    if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
                        var text = json.candidates[0].content.parts[0].text || '';
                        if (text) updateStreamingMessage(text);
                    }
                } catch (e) {}
            }
        }
        
        return finalizeStreamingMessage();
    } catch (e) {
        console.error('[CodeStudio Gemini] Exceção:', e);
        finalizeStreamingMessage();
        throw e;
    }
}

async function callOpenAIForCodeStudio(apiKey, systemPrompt, userMessage) {
    var modelName = localStorage.getItem('neo_selected_model') || localStorage.getItem('openaiModel') || 'gpt-4o-mini';
    console.log('[CodeStudio OpenAI] Modelo:', modelName, '- STREAMING');
    
    createStreamingMessage();
    
    var fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 8192,
            stream: true
        })
    };
    if (codeStudioState.abortController) fetchOptions.signal = codeStudioState.abortController.signal;
    var response = await fetch('https://api.openai.com/v1/chat/completions', fetchOptions);
    
    if (!response.ok) {
        finalizeStreamingMessage();
        throw new Error('Erro OpenAI: ' + response.status);
    }
    
    // Processar stream
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    
    while (true) {
        var result = await reader.read();
        if (result.done) break;
        
        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'data: [DONE]' || !line.startsWith('data: ')) continue;
            
            try {
                var json = JSON.parse(line.substring(6));
                if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                    updateStreamingMessage(json.choices[0].delta.content);
                }
            } catch (e) {}
        }
    }
    
    return finalizeStreamingMessage();
}

async function callAnthropicForCodeStudio(apiKey, systemPrompt, userMessage) {
    var modelName = localStorage.getItem('neo_selected_model') || localStorage.getItem('anthropicModel') || 'claude-3-5-sonnet-20241022';
    console.log('[CodeStudio Anthropic] Modelo:', modelName, '- STREAMING');
    
    createStreamingMessage();
    
    var fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: modelName,
            max_tokens: 8192,
            stream: true,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }]
        })
    };
    if (codeStudioState.abortController) fetchOptions.signal = codeStudioState.abortController.signal;
    var response = await fetch('https://api.anthropic.com/v1/messages', fetchOptions);
    
    if (!response.ok) {
        finalizeStreamingMessage();
        throw new Error('Erro Anthropic: ' + response.status);
    }
    
    // Processar stream
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    
    while (true) {
        var result = await reader.read();
        if (result.done) break;
        
        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || !line.startsWith('data: ')) continue;
            
            try {
                var json = JSON.parse(line.substring(6));
                if (json.type === 'content_block_delta' && json.delta && json.delta.text) {
                    updateStreamingMessage(json.delta.text);
                }
            } catch (e) {}
        }
    }
    
    return finalizeStreamingMessage();
}

async function callDeepseekForCodeStudio(apiKey, systemPrompt, userMessage) {
    var modelName = localStorage.getItem('neo_selected_model') || localStorage.getItem('deepseekModel') || 'deepseek-chat';
    console.log('[CodeStudio DeepSeek] Modelo:', modelName, '- STREAMING VISUAL');
    
    // Criar mensagem de streaming no chat
    createStreamingMessage();
    
    var fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 4096,
            stream: true
        })
    };
    if (codeStudioState.abortController) fetchOptions.signal = codeStudioState.abortController.signal;
    
    var response = await fetch('https://api.deepseek.com/v1/chat/completions', fetchOptions);
    
    if (!response.ok) {
        var errText = await response.text();
        console.error('[CodeStudio DeepSeek] Erro:', response.status, errText);
        finalizeStreamingMessage();
        throw new Error('Erro Deepseek: ' + response.status);
    }
    
    // Processar stream com atualização visual
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    
    while (true) {
        var result = await reader.read();
        if (result.done) break;
        
        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'data: [DONE]') continue;
            if (!line.startsWith('data: ')) continue;
            
            try {
                var json = JSON.parse(line.substring(6));
                if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                    // Atualizar UI em tempo real
                    updateStreamingMessage(json.choices[0].delta.content);
                }
            } catch (e) {
                // Ignorar linhas mal formadas
            }
        }
    }
    
    // Finalizar e retornar conteúdo completo
    var fullContent = finalizeStreamingMessage();
    console.log('[CodeStudio DeepSeek] Resposta completa, tamanho:', fullContent.length);
    return fullContent;
}

async function callGroqForCodeStudio(apiKey, systemPrompt, userMessage) {
    var modelName = localStorage.getItem('neo_selected_model') || localStorage.getItem('groqModel') || 'llama-3.3-70b-versatile';
    console.log('[CodeStudio Groq] Modelo:', modelName, '- STREAMING');
    
    createStreamingMessage();
    
    var fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 8192,
            stream: true
        })
    };
    if (codeStudioState.abortController) fetchOptions.signal = codeStudioState.abortController.signal;
    var response = await fetch('https://api.groq.com/openai/v1/chat/completions', fetchOptions);
    
    if (!response.ok) {
        finalizeStreamingMessage();
        throw new Error('Erro Groq: ' + response.status);
    }
    
    // Processar stream (formato OpenAI)
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    
    while (true) {
        var result = await reader.read();
        if (result.done) break;
        
        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'data: [DONE]' || !line.startsWith('data: ')) continue;
            
            try {
                var json = JSON.parse(line.substring(6));
                if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                    updateStreamingMessage(json.choices[0].delta.content);
                }
            } catch (e) {}
        }
    }
    
    return finalizeStreamingMessage();
}

async function callOpenRouterForCodeStudio(apiKey, systemPrompt, userMessage) {
    var modelName = localStorage.getItem('neo_selected_model') || localStorage.getItem('openrouterModel') || 'openai/gpt-4o-mini';
    console.log('[CodeStudio OpenRouter] Modelo:', modelName, '- STREAMING');
    
    createStreamingMessage();
    
    var fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 8192,
            stream: true
        })
    };
    if (codeStudioState.abortController) fetchOptions.signal = codeStudioState.abortController.signal;
    var response = await fetch('https://openrouter.ai/api/v1/chat/completions', fetchOptions);
    
    if (!response.ok) {
        finalizeStreamingMessage();
        throw new Error('Erro OpenRouter: ' + response.status);
    }
    
    // Processar stream (formato OpenAI)
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    
    while (true) {
        var result = await reader.read();
        if (result.done) break;
        
        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'data: [DONE]' || !line.startsWith('data: ')) continue;
            
            try {
                var json = JSON.parse(line.substring(6));
                if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                    updateStreamingMessage(json.choices[0].delta.content);
                }
            } catch (e) {}
        }
    }
    
    return finalizeStreamingMessage();
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


