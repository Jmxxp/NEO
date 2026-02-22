// ===== UI - Interface do usuário (modais, sidebars, temas) =====

// Estado da UI
let currentGradient = null;
let currentSecondaryColor = "white";
let currentFont = "Inter";
let currentThemeMode = "dark"; // claro, escuro, auto
let currentMemoryInModal = null;
let exitToastActive = false;
let exitToastTimeout = null;
let chatToDelete = null;

// ===== DETECÇÃO DE TEMA DO SISTEMA =====
let cachedSystemTheme = null;

function detectSystemTheme() {
    // Se temos cache recente, usar
    if (cachedSystemTheme !== null) {
        return cachedSystemTheme;
    }

    // Método 1: matchMedia (funciona na maioria dos casos)
    if (window.matchMedia) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
        if (prefersDark.matches !== undefined) {
            cachedSystemTheme = prefersDark.matches ? "dark" : "light";
            return cachedSystemTheme;
        }
    }

    // Método 2: Verificar hora do dia como fallback
    const hour = new Date().getHours();
    cachedSystemTheme = (hour >= 6 && hour < 18) ? "light" : "dark";
    return cachedSystemTheme;
}

// Atualizar tema usando plugin Cordova (assíncrono)
function updateSystemThemeFromPlugin() {
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.ThemeDetection) {
        cordova.plugins.ThemeDetection.isDarkModeEnabled(
            function (success) {
                const newTheme = success.value ? "dark" : "light";
                if (cachedSystemTheme !== newTheme) {
                    cachedSystemTheme = newTheme;
                    console.log("Sistema detectado via plugin:", cachedSystemTheme);
                    if (currentThemeMode === "auto") {
                        applyThemeMode();
                    }
                }
            },
            function (error) {
                console.log("ThemeDetection error:", error);
            }
        );
    }
}

// Listener para mudanças no tema do sistema
function initSystemThemeListener() {
    // Listener via matchMedia
    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
            cachedSystemTheme = e.matches ? "dark" : "light";
            console.log("Sistema detectado via matchMedia:", cachedSystemTheme);
            if (currentThemeMode === "auto") {
                applyThemeMode();
                saveSettings();
            }
        });
    }

    // Verificar via plugin Cordova quando disponível
    document.addEventListener('deviceready', function () {
        updateSystemThemeFromPlugin();
    }, false);

    // Se já estiver pronto
    if (typeof cordova !== 'undefined') {
        updateSystemThemeFromPlugin();
    }
}

// ===== FUNÇÕES DE BACKGROUND =====
function applyBackground() {
    if (currentGradient && GRADIENT_PRESETS[currentGradient]) {
        document.body.style.setProperty("--chat-bg", GRADIENT_PRESETS[currentGradient]);
    } else if (bgColorPicker && bgColorPicker.value) {
        document.body.style.setProperty("--chat-bg", bgColorPicker.value);
    }
}

function applySecondaryColor() {
    let color;
    if (currentSecondaryColor && SECONDARY_COLOR_PRESETS[currentSecondaryColor]) {
        color = SECONDARY_COLOR_PRESETS[currentSecondaryColor];
    } else if (secondaryColorPicker && secondaryColorPicker.value) {
        color = secondaryColorPicker.value;
    } else {
        color = "#ffffff";
    }
    document.body.style.setProperty("--accent-color", color);

    let borderColor;
    if (currentSecondaryColor === "white" || color === "#ffffff") {
        borderColor = "#555555";
    } else if (currentSecondaryColor === "black" || color === "#1a1a1a") {
        borderColor = "#cccccc";
    } else {
        borderColor = hexToRgba(color, 0.5);
    }
    document.body.style.setProperty("--border-color", borderColor);
}

function applyFont() {
    document.body.style.setProperty("--app-font", `"${currentFont}"`);
    if (fontPreviewText) {
        fontPreviewText.textContent = currentFont;
        fontPreviewText.style.fontFamily = `"${currentFont}", sans-serif`;
    }
}

// ===== FUNÇÕES DE TEMA =====
function applyThemeMode() {
    document.body.classList.remove("theme-light", "theme-dark");

    let effectiveTheme = currentThemeMode;

    if (currentThemeMode === "auto") {
        // Detectar preferência do sistema
        effectiveTheme = detectSystemTheme();
    }

    if (effectiveTheme === "light") {
        document.body.classList.add("theme-light");
        document.documentElement.setAttribute('data-theme', 'light');
        // Modo claro: fundo branco e cor secundária preta
        currentGradient = "white";
        currentSecondaryColor = "black";
    } else {
        document.body.classList.add("theme-dark");
        document.documentElement.setAttribute('data-theme', 'dark');
        // Modo escuro: fundo padrão e cor secundária branca
        currentGradient = "default";
        currentSecondaryColor = "white";
    }

    // Reaplicar fundo e cores secundárias
    applyBackground();
    updatePresetButtonState();
    applySecondaryColor();
    updateSecondaryPresetState();
}

function updateThemeModeState() {
    if (!themeModeLight) return;

    themeModeLight.classList.remove("active");
    themeModeDark.classList.remove("active");
    themeModeAuto.classList.remove("active");

    if (currentThemeMode === "light") themeModeLight.classList.add("active");
    else if (currentThemeMode === "dark") themeModeDark.classList.add("active");
    else themeModeAuto.classList.add("active");
}

function setThemeMode(mode) {
    currentThemeMode = mode;
    applyThemeMode();
    updateThemeModeState();
    saveSettings();
}

// ===== ESTADO DOS PRESETS =====
function updatePresetButtonState() {
    if (!presetDefault) return;

    presetDefault.classList.remove("active");
    presetPink.classList.remove("active");
    presetGreen.classList.remove("active");
    presetYellow.classList.remove("active");
    presetRed.classList.remove("active");
    presetBlack.classList.remove("active");
    presetCustom.classList.remove("active");
    if (presetWhite) presetWhite.classList.remove("active");

    if (currentGradient === "default") presetDefault.classList.add("active");
    else if (currentGradient === "white" && presetWhite) presetWhite.classList.add("active");
    else if (currentGradient === "pink") presetPink.classList.add("active");
    else if (currentGradient === "green") presetGreen.classList.add("active");
    else if (currentGradient === "yellow") presetYellow.classList.add("active");
    else if (currentGradient === "red") presetRed.classList.add("active");
    else if (currentGradient === "black") presetBlack.classList.add("active");
    else presetCustom.classList.add("active");
}

function updateSecondaryPresetState() {
    if (!secondaryPresetWhite) return;

    secondaryPresetWhite.classList.remove("active");
    secondaryPresetBlack.classList.remove("active");
    secondaryPresetCyan.classList.remove("active");
    secondaryPresetLime.classList.remove("active");
    secondaryPresetPink.classList.remove("active");
    secondaryPresetOrange.classList.remove("active");
    if (secondaryPresetRed) secondaryPresetRed.classList.remove("active");
    secondaryPresetCustom.classList.remove("active");

    if (currentSecondaryColor === "white") secondaryPresetWhite.classList.add("active");
    else if (currentSecondaryColor === "black") secondaryPresetBlack.classList.add("active");
    else if (currentSecondaryColor === "cyan") secondaryPresetCyan.classList.add("active");
    else if (currentSecondaryColor === "lime") secondaryPresetLime.classList.add("active");
    else if (currentSecondaryColor === "pink") secondaryPresetPink.classList.add("active");
    else if (currentSecondaryColor === "orange") secondaryPresetOrange.classList.add("active");
    else if (currentSecondaryColor === "red" && secondaryPresetRed) secondaryPresetRed.classList.add("active");
    else secondaryPresetCustom.classList.add("active");
}

function updateFontButtonState() {
    if (!fontList) return;

    const options = fontList.querySelectorAll('.font-option');
    options.forEach(option => {
        if (option.dataset.font === currentFont) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// ===== PRESETS DE COR =====
function setGradientPreset(gradientKey) {
    if (GRADIENT_PRESETS[gradientKey]) {
        currentGradient = gradientKey;
        applyBackground();
        updatePresetButtonState();
        saveSettings();
    }
}

function setSecondaryColorPreset(colorKey) {
    if (SECONDARY_COLOR_PRESETS[colorKey]) {
        currentSecondaryColor = colorKey;
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    }
}

// ===== MODAL DE FONTE =====
function openFontModal() {
    if (!fontModal) return;
    fontModal.classList.add("open");
    fontModal.setAttribute("aria-hidden", "false");
    updateFontButtonState();
    // Adicionar ao histórico para o botão voltar funcionar
    history.pushState({ fontModalOpen: true }, "");
}

function closeFontModal() {
    if (!fontModal) return;
    fontModal.classList.add("closing");
    setTimeout(() => {
        fontModal.classList.remove("open", "closing");
        fontModal.setAttribute("aria-hidden", "true");
    }, 200);
}

function selectFont(fontName) {
    currentFont = fontName;
    applyFont();
    updateFontButtonState();
    saveSettings();
    closeFontModal();
}

// ===== SLIDERS (REMOVIDOS - mantido por compatibilidade) =====
function updateSliderState() {
    // Sliders removidos, função mantida por compatibilidade
    const hasCustomStyle = styleCustom?.value?.trim()?.length > 0;

    if (humorRange) humorRange.disabled = hasCustomStyle;
    if (freedomRange) freedomRange.disabled = hasCustomStyle;
    if (professionalRange) professionalRange.disabled = hasCustomStyle;
    if (formalidadeRange) formalidadeRange.disabled = hasCustomStyle;

    // Elementos de label podem não existir mais
    const humorEl = document.getElementById("humorValue");
    const freedomEl = document.getElementById("freedomValue");
    const professionalEl = document.getElementById("professionalValue");
    const formalidadeEl = document.getElementById("formalidadeValue");
    
    if (humorEl?.parentElement?.querySelector(".setting-label")) {
        humorEl.parentElement.querySelector(".setting-label").classList.toggle("disabled", hasCustomStyle);
    }
    if (freedomEl?.parentElement?.querySelector(".setting-label")) {
        freedomEl.parentElement.querySelector(".setting-label").classList.toggle("disabled", hasCustomStyle);
    }
    if (professionalEl?.parentElement?.querySelector(".setting-label")) {
        professionalEl.parentElement.querySelector(".setting-label").classList.toggle("disabled", hasCustomStyle);
    }
    if (formalidadeEl?.parentElement?.querySelector(".setting-label")) {
        formalidadeEl.parentElement.querySelector(".setting-label").classList.toggle("disabled", hasCustomStyle);
    }
}

// ===== CONFIGURAÇÕES =====
function openSettings() {
    if (!document.body.classList.contains("settings-open")) {
        history.pushState({ neoSettings: true }, "");
        settingsHistoryFlag = true;
    }
    settingsContainer.classList.remove("closing");
    // Limpar estilos inline para permitir a animação CSS funcionar
    settingsContainer.style.animation = '';
    settingsContainer.style.transform = '';
    settingsContainer.style.opacity = '';
    settingsContainer.style.transition = '';
    document.body.classList.add("settings-open");
}

function closeSettings(skipAnimation) {
    if (skipAnimation) {
        // Fechamento direto sem animação (já foi arrastado)
        document.body.classList.remove("settings-open");
        settingsContainer.classList.remove("closing");
    } else {
        // Fechamento com animação normal
        settingsContainer.classList.add("closing");
        setTimeout(() => {
            document.body.classList.remove("settings-open");
            settingsContainer.classList.remove("closing");
        }, 300);
    }
}

// ===== SIDEBAR DE CHATS =====
function toggleChats() {
    const isOpen = document.body.classList.contains("chats-open");
    if (!isOpen) {
        document.body.classList.add("chats-open");
        if (!chatsHistoryFlag) {
            history.pushState({ neoChats: true }, "");
            chatsHistoryFlag = true;
        }
    } else {
        if (chatsHistoryFlag) {
            history.back();
            chatsHistoryFlag = false;
        } else {
            document.body.classList.remove("chats-open");
        }
    }
}

// ===== SIDEBAR DRAG TO CLOSE =====
let sidebarDragStartX = 0;
let sidebarDragStartY = 0;
let sidebarDragCurrentX = 0;
let sidebarIsDragging = false;
let sidebarDragLocked = false; // true = drag horizontal, false = pode ser scroll
let sidebarElement = null;
let sidebarOverlayElement = null;
let sidebarTouchStartTarget = null; // Guardar onde o toque começou
var isSidebarBeingDragged = false; // Flag global para bloquear swipe-to-delete

function initSidebarDrag() {
    sidebarElement = document.querySelector('.chat-sidebar');
    sidebarOverlayElement = document.getElementById('chatSidebarOverlay');

    if (!sidebarElement) return;

    // Touch events
    sidebarElement.addEventListener('touchstart', handleSidebarDragStart, { passive: true });
    sidebarElement.addEventListener('touchmove', handleSidebarDragMove, { passive: false });
    sidebarElement.addEventListener('touchend', handleSidebarDragEnd);
    sidebarElement.addEventListener('touchcancel', handleSidebarDragEnd);

    // Mouse events (para testes em desktop)
    sidebarElement.addEventListener('mousedown', handleSidebarDragStart);
    document.addEventListener('mousemove', handleSidebarDragMove);
    document.addEventListener('mouseup', handleSidebarDragEnd);
}

function handleSidebarDragStart(e) {
    if (!document.body.classList.contains('chats-open')) {
        return;
    }

    // Se está arrastando um item para deletar, não iniciar drag do sidebar
    if (typeof isSwipingToDelete !== 'undefined' && isSwipingToDelete) {
        return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    sidebarDragStartX = clientX;
    sidebarDragStartY = clientY;
    sidebarDragCurrentX = clientX;
    sidebarIsDragging = true;
    sidebarDragLocked = false;
    sidebarTouchStartTarget = e.target; // Guardar onde tocou
}

function handleSidebarDragMove(e) {
    if (!sidebarIsDragging) return;

    // Se está arrastando um item para deletar, cancelar drag do sidebar completamente
    if (typeof isSwipingToDelete !== 'undefined' && isSwipingToDelete) {
        sidebarIsDragging = false;
        sidebarDragLocked = false;
        // Resetar qualquer transformação parcial
        if (sidebarElement) {
            sidebarElement.style.transition = '';
            sidebarElement.style.transform = '';
        }
        if (sidebarOverlayElement) {
            sidebarOverlayElement.style.transition = '';
            sidebarOverlayElement.style.opacity = '';
        }
        return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - sidebarDragStartX;
    const deltaY = clientY - sidebarDragStartY;

    // Determinar direção do gesto se ainda não foi bloqueada
    if (!sidebarDragLocked && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        // Se tocou em um history-item e está arrastando para esquerda, é swipe para deletar
        // Então cancelar o drag do sidebar
        if (sidebarTouchStartTarget && sidebarTouchStartTarget.closest('.history-item') && deltaX < -5) {
            sidebarIsDragging = false;
            sidebarDragLocked = false;
            return;
        }

        // Se movimento horizontal é maior que vertical e é para esquerda, ativar drag
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -10) {
            sidebarDragLocked = true;
            isSidebarBeingDragged = true; // Bloquear swipe-to-delete
            // Desativar transição durante o drag
            sidebarElement.style.transition = 'none';
            if (sidebarOverlayElement) {
                sidebarOverlayElement.style.transition = 'none';
            }
        } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Movimento vertical - cancelar drag para permitir scroll
            sidebarIsDragging = false;
            return;
        }
    }

    if (!sidebarDragLocked) return;

    sidebarDragCurrentX = clientX;

    // Só arrastar para a esquerda (fechar)
    if (deltaX < 0) {
        e.preventDefault();

        // Aplicar transformação
        sidebarElement.style.transform = `translateX(${deltaX}px)`;

        // Atualizar opacidade do overlay proporcionalmente
        if (sidebarOverlayElement) {
            const sidebarWidth = sidebarElement.offsetWidth;
            const progress = Math.min(Math.abs(deltaX) / sidebarWidth, 1);
            sidebarOverlayElement.style.opacity = 1 - progress;
        }
    }
}

function handleSidebarDragEnd() {
    // SEMPRE resetar flags e posição ao soltar
    const wasDragging = sidebarDragLocked;

    // Resetar flags imediatamente
    sidebarIsDragging = false;
    sidebarDragLocked = false;
    isSidebarBeingDragged = false;

    // Sempre restaurar transições e posições
    if (sidebarElement) {
        sidebarElement.style.transition = '';
        sidebarElement.style.transform = '';
    }
    if (sidebarOverlayElement) {
        sidebarOverlayElement.style.transition = '';
        sidebarOverlayElement.style.opacity = '';
    }

    if (!wasDragging) {
        sidebarDragStartX = 0;
        sidebarDragStartY = 0;
        sidebarDragCurrentX = 0;
        return;
    }

    const deltaX = sidebarDragCurrentX - sidebarDragStartX;
    const sidebarWidth = sidebarElement ? sidebarElement.offsetWidth : 300;
    const threshold = sidebarWidth * 0.25; // 25% da largura para fechar

    if (deltaX < -threshold) {
        // Fechar o sidebar
        if (chatsHistoryFlag) {
            history.back();
            chatsHistoryFlag = false;
        } else {
            document.body.classList.remove('chats-open');
        }
    }

    sidebarDragStartX = 0;
    sidebarDragStartY = 0;
    sidebarDragCurrentX = 0;
}

// ===== SETTINGS DRAG TO CLOSE =====
let settingsSwipeStartY = 0;
let settingsSwipeCurrentY = 0;
let settingsSwipeActive = false;

function initSettingsDrag() {
    const container = document.getElementById('settingsContainer');
    const header = document.getElementById('settingsHeader');

    console.log('initSettingsDrag: container=', container, 'header=', header);

    if (!container || !header) {
        console.log('initSettingsDrag: elementos não encontrados');
        return;
    }

    // Usar addEventListener em vez de ontouchstart
    header.addEventListener('touchstart', function (e) {
        console.log('SETTINGS: touchstart', e.target);
        // Ignorar se tocou no botão
        if (e.target.closest('button')) {
            console.log('SETTINGS: ignorando - tocou no botão');
            return;
        }

        settingsSwipeStartY = e.touches[0].clientY;
        settingsSwipeCurrentY = settingsSwipeStartY;
        settingsSwipeActive = true;

        // Bloquear scroll do body enquanto arrasta
        document.body.style.overflow = 'hidden';

        container.style.transition = 'none';
        container.style.animation = 'none';
        console.log('SETTINGS: swipe iniciado em Y=', settingsSwipeStartY);
    }, { passive: false });

    header.addEventListener('touchmove', function (e) {
        if (!settingsSwipeActive) return;

        settingsSwipeCurrentY = e.touches[0].clientY;
        const delta = settingsSwipeCurrentY - settingsSwipeStartY;
        console.log('SETTINGS: touchmove delta=', delta);

        if (delta > 0) {
            e.preventDefault();
            container.style.transform = 'translateY(' + delta + 'px)';
        }
    }, { passive: false });

    header.addEventListener('touchend', function (e) {
        console.log('SETTINGS: touchend');
        if (!settingsSwipeActive) return;
        settingsSwipeActive = false;

        // Restaurar scroll do body
        document.body.style.overflow = '';

        const delta = settingsSwipeCurrentY - settingsSwipeStartY;
        const threshold = window.innerHeight * 0.15;

        if (delta > threshold) {
            // Fechar - continuar de onde parou até sair da tela
            container.style.transition = 'transform 0.3s ease-out';
            container.style.transform = 'translateY(100%)';

            setTimeout(function () {
                container.style.transition = '';
                container.style.animation = '';
                container.style.transform = '';
                closeSettings(true); // Pular animação pois já foi arrastado
                if (settingsHistoryFlag) settingsHistoryFlag = false;
            }, 300);
        } else {
            // Voltar - animar de volta para posição original
            container.style.transition = 'transform 0.2s ease-out';
            container.style.transform = 'translateY(0)';
            // Não limpar os estilos - manter transform fixo
        }

        settingsSwipeStartY = 0;
        settingsSwipeCurrentY = 0;
    }, { passive: true });

    console.log('initSettingsDrag: swipe configurado no header');
}

// ===== TOAST DE SAÍDA =====
function showExitToast() {
    if (!exitToast) return;
    exitToast.classList.add("show");
    exitToastActive = true;
    if (exitToastTimeout) clearTimeout(exitToastTimeout);
    exitToastTimeout = setTimeout(() => {
        exitToast.classList.remove("show");
        exitToastActive = false;
    }, 3000);
}

function hideExitToast() {
    if (!exitToast) return;
    exitToast.classList.remove("show");
    exitToastActive = false;
    if (exitToastTimeout) {
        clearTimeout(exitToastTimeout);
        exitToastTimeout = null;
    }
}

function openExitModal() {
    if (exitToastActive) {
        hideExitToast();
        exitingApp = true;
        history.back();
        return;
    }
    showExitToast();
    if (!history.state || history.state.neoRoot) {
        history.pushState({ neoIdle: true }, "");
    }
}

function closeExitModal() {
    hideExitToast();
}

// ===== MODAL DE REDE =====
function openNetworkModal() {
    if (!networkModal) return;
    networkModal.classList.add("open");
    networkModal.setAttribute("aria-hidden", "false");
}

function closeNetworkModal() {
    if (!networkModal) return;
    networkModal.classList.add("closing");
    setTimeout(() => {
        networkModal.classList.remove("open", "closing");
        networkModal.setAttribute("aria-hidden", "true");
    }, 200);
}

// ===== MODAL DE HISTÓRICO =====
function openHistoryModal() {
    historyModal.classList.add("open");
    historyModal.setAttribute("aria-hidden", "false");
}

function closeHistoryModal() {
    historyModal.classList.add("closing");
    setTimeout(() => {
        historyModal.classList.remove("open", "closing");
        historyModal.setAttribute("aria-hidden", "true");
    }, 200);
}

// ===== MODAL DE DELETAR CHAT =====
function openDeleteChatModal(chatId) {
    chatToDelete = chatId;
    deleteChatModal.classList.add("open");
    deleteChatModal.setAttribute("aria-hidden", "false");
}

function closeDeleteChatModal() {
    chatToDelete = null;
    deleteChatModal.classList.add("closing");
    setTimeout(() => {
        deleteChatModal.classList.remove("open", "closing");
        deleteChatModal.setAttribute("aria-hidden", "true");
    }, 200);
}

// ===== MODAL DE MEMÓRIA =====
function openMemoryModal(memoryObj) {
    if (!memoryObj) return;
    currentMemoryInModal = memoryObj;
    if (memoryModalText) {
        // Se tiver previousText, mostrar diff
        if (memoryObj.previousText) {
            const diffHtml = generateMemoryDiff(memoryObj.previousText, memoryObj.text);
            memoryModalText.innerHTML = diffHtml;
        } else {
            // Primeira memória - tudo é adicionado (verde)
            const formattedText = escapeHtml(memoryObj.text)
                .replace(/\n/g, '<br>')
                .replace(/• /g, '<span style="color: #4ea3ff;">•</span> ');
            memoryModalText.innerHTML = '<span style="color: #4CAF50; font-weight: bold;">' + formattedText + '</span>';
        }
    }
    memoryModal.classList.add("open");
    memoryModal.setAttribute("aria-hidden", "false");
}

// Função para gerar diff entre texto anterior e novo
// Ignora cabeçalhos de tópico (linhas com emoji + texto + ":")
function generateMemoryDiff(oldText, newText) {
    if (!oldText) {
        // Tudo novo - verde
        return '<span style="color: #4CAF50; font-weight: bold;">' +
            escapeHtml(newText).replace(/\n/g, '<br>').replace(/• /g, '<span style="color: #4ea3ff;">•</span> ') +
            '</span>';
    }

    // Função para verificar se uma linha é um cabeçalho de tópico (emoji + texto + ":")
    const isTopicHeader = (line) => {
        const trimmed = line.trim();
        // Ignora linhas que são cabeçalhos de tópico (terminam com : e não começam com -)
        if (trimmed.endsWith(':') && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
            return true;
        }
        return false;
    };

    // Função para extrair apenas o conteúdo (itens) de uma linha
    const getItemContent = (line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
            return trimmed.substring(1).trim().toLowerCase();
        }
        return trimmed.toLowerCase();
    };

    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    let result = [];

    // Filtrar apenas itens de conteúdo (não cabeçalhos)
    const oldItems = oldLines.filter(line => line.trim() && !isTopicHeader(line));
    const newItems = newLines.filter(line => line.trim() && !isTopicHeader(line));

    // Comparar conteúdo (case-insensitive)
    const oldContents = oldItems.map(getItemContent);
    const newContents = newItems.map(getItemContent);

    // Encontrar itens removidos
    const removedItems = oldItems.filter(line => {
        const content = getItemContent(line);
        return !newContents.includes(content);
    });

    // Encontrar itens adicionados
    const addedItems = newItems.filter(line => {
        const content = getItemContent(line);
        return !oldContents.includes(content);
    });

    // Itens inalterados
    const unchangedItems = newItems.filter(line => {
        const content = getItemContent(line);
        return oldContents.includes(content);
    });

    // Mostrar removidos primeiro
    if (removedItems.length > 0) {
        result.push('<div style="margin-bottom: 8px;"><span style="color: #888; font-size: 11px;">REMOVIDO:</span></div>');
        removedItems.forEach(line => {
            const formatted = escapeHtml(line.trim()).replace(/• /g, '<span style="color: #ff6b6b;">•</span> ');
            result.push('<div style="color: #ff6b6b; font-weight: bold; text-decoration: line-through; opacity: 0.8;">' + formatted + '</div>');
        });
    }

    // Mostrar adicionados
    if (addedItems.length > 0) {
        if (removedItems.length > 0) {
            result.push('<div style="margin: 12px 0 8px;"><span style="color: #888; font-size: 11px;">ADICIONADO:</span></div>');
        } else {
            result.push('<div style="margin-bottom: 8px;"><span style="color: #888; font-size: 11px;">ADICIONADO:</span></div>');
        }
        addedItems.forEach(line => {
            const formatted = escapeHtml(line.trim()).replace(/• /g, '<span style="color: #4CAF50;">•</span> ');
            result.push('<div style="color: #4CAF50; font-weight: bold;">' + formatted + '</div>');
        });
    }

    // Mostrar inalterados (se houver mudanças)
    if ((removedItems.length > 0 || addedItems.length > 0) && unchangedItems.length > 0) {
        result.push('<div style="margin: 12px 0 8px; border-top: 1px solid #333; padding-top: 12px;"><span style="color: #888; font-size: 11px;">INALTERADO:</span></div>');
        unchangedItems.forEach(line => {
            if (line.trim()) {
                const formatted = escapeHtml(line.trim()).replace(/• /g, '<span style="color: #4ea3ff;">•</span> ');
                result.push('<div style="color: #aaa;">' + formatted + '</div>');
            }
        });
    }

    // Se não houve mudanças detectáveis, mostrar texto completo
    if (removedItems.length === 0 && addedItems.length === 0) {
        const formattedText = escapeHtml(newText)
            .replace(/\n/g, '<br>')
            .replace(/• /g, '<span style="color: #4ea3ff;">•</span> ');
        return formattedText;
    }

    return result.join('');
}

function closeMemoryModal() {
    currentMemoryInModal = null;
    memoryModal.classList.add("closing");
    setTimeout(() => {
        memoryModal.classList.remove("open", "closing");
        memoryModal.setAttribute("aria-hidden", "true");
    }, 200);
}

// Função para mostrar alterações de memória (novo sistema com memoryChanges)
function openMemoryChangesModal(memoryChanges) {
    if (!memoryChanges || memoryChanges.length === 0) return;
    if (!memoryModalText) return;
    
    // Labels para os setores (sistema inline neo)
    const sectorLabels = {
        'IDENTIDADE': '👤 Identidade',
        'PROFISSÃO': '💼 Profissão',
        'PROFISSAO': '💼 Profissão',
        'RELACIONAMENTOS': '❤️ Relacionamentos',
        'RELACIONAMENTO': '❤️ Relacionamentos',
        'GOSTOS': '⭐ Gostos',
        'GOSTA': '⭐ Gostos',
        'NÃO GOSTA': '🚫 Não Gosta',
        'NAO_GOSTA': '🚫 Não Gosta',
        'NAO GOSTA': '🚫 Não Gosta',
        'PERSONALIDADE': '🎭 Personalidade',
        'LEMBRAR': '📌 Lembrar',
        'OUTROS': '📌 Outros'
    };
    
    let html = '';
    
    memoryChanges.forEach(cmd => {
        // Suportar tanto o novo formato (sector/content) quanto o antigo (topic/value)
        const sector = cmd.sector || cmd.topic || 'OUTROS';
        const sectorLabel = sectorLabels[sector] || sectorLabels[sector.toUpperCase()] || sector;
        const content = cmd.content || cmd.value || '';
        
        if (cmd.action === 'add') {
            // Card de ADIÇÃO - verde
            html += `<div style="
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid rgba(76, 175, 80, 0.3);
                border-left: 4px solid #4CAF50;
                border-radius: 8px;
                padding: 12px 14px;
                margin-bottom: 12px;
            ">`;
            html += `<div style="color: rgba(255,255,255,0.5); font-size: 11px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">${sectorLabel}</div>`;
            html += `<div style="display: flex; align-items: flex-start; gap: 8px;">`;
            html += `<span style="color: #4CAF50; font-weight: bold; font-size: 16px;">+</span>`;
            html += `<span style="color: #81C784; font-size: 14px;">${escapeHtml(content)}</span>`;
            html += `</div></div>`;
            
        } else if (cmd.action === 'remove') {
            // Card de REMOÇÃO - vermelho riscado
            html += `<div style="
                background: rgba(244, 67, 54, 0.1);
                border: 1px solid rgba(244, 67, 54, 0.3);
                border-left: 4px solid #f44336;
                border-radius: 8px;
                padding: 12px 14px;
                margin-bottom: 12px;
            ">`;
            html += `<div style="color: rgba(255,255,255,0.5); font-size: 11px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">${sectorLabel}</div>`;
            html += `<div style="display: flex; align-items: flex-start; gap: 8px;">`;
            html += `<span style="color: #f44336; font-weight: bold; font-size: 16px;">−</span>`;
            html += `<span style="color: #ef9a9a; font-size: 14px; text-decoration: line-through;">${escapeHtml(content)}</span>`;
            html += `</div></div>`;
            
        } else if (cmd.action === 'edit' || cmd.action === 'replace') {
            // Card de EDIÇÃO/SUBSTITUIÇÃO - vermelho riscado → verde novo
            const parts = content.split('->').map(p => p.trim());
            const oldContent = parts.length === 2 ? parts[0] : (cmd.oldContent || cmd.oldValue || content);
            const newContent = parts.length === 2 ? parts[1] : (cmd.newContent || cmd.newValue || content);
            
            html += `<div style="
                background: rgba(255, 193, 7, 0.08);
                border: 1px solid rgba(255, 193, 7, 0.25);
                border-left: 4px solid #FFC107;
                border-radius: 8px;
                padding: 12px 14px;
                margin-bottom: 12px;
            ">`;
            html += `<div style="color: rgba(255,255,255,0.5); font-size: 11px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">✏️ ${sectorLabel}</div>`;
            
            // Linha antiga (removida)
            html += `<div style="
                background: rgba(244, 67, 54, 0.15);
                border-radius: 6px;
                padding: 8px 10px;
                margin-bottom: 6px;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            ">`;
            html += `<span style="color: #f44336; font-weight: bold; font-size: 14px;">−</span>`;
            html += `<span style="color: #ef9a9a; font-size: 13px; text-decoration: line-through;">${escapeHtml(oldContent)}</span>`;
            html += `</div>`;
            
            // Seta de transição
            html += `<div style="text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; margin: 4px 0;">↓</div>`;
            
            // Linha nova (adicionada)
            html += `<div style="
                background: rgba(76, 175, 80, 0.15);
                border-radius: 6px;
                padding: 8px 10px;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            ">`;
            html += `<span style="color: #4CAF50; font-weight: bold; font-size: 14px;">+</span>`;
            html += `<span style="color: #81C784; font-size: 13px;">${escapeHtml(newContent)}</span>`;
            html += `</div>`;
            
            html += `</div>`;
        }
    });
    
    if (!html) {
        html = '<span style="color: #888;">Nenhuma alteração detectada</span>';
    }
    
    memoryModalText.innerHTML = html;
    memoryModal.classList.add("open");
    memoryModal.setAttribute("aria-hidden", "false");
}

// ===== SIDEBAR CÓDIGO FONTE =====
function openCodeSourceSidebar() {
    if (!codeSourceOverlay) return;
    codeSourceOverlay.classList.add("open");
    codeSourceOverlay.setAttribute("aria-hidden", "false");

    // Scroll para o topo ao abrir (com delay para garantir renderização)
    const sidebar = codeSourceOverlay.querySelector('.code-source-sidebar');
    if (sidebar) {
        // Resetar scroll imediatamente
        sidebar.scrollTop = 0;

        // E novamente após a animação para garantir
        setTimeout(() => {
            sidebar.scrollTop = 0;
        }, 50);

        setTimeout(() => {
            sidebar.scrollTop = 0;
        }, 300);
    }

    // NÃO fazer focus automático no textarea (isso causa scroll para baixo)
}

function closeCodeSourceSidebar() {
    if (!codeSourceOverlay) return;
    codeSourceOverlay.classList.add("closing");
    setTimeout(() => {
        codeSourceOverlay.classList.remove("open", "closing");
        codeSourceOverlay.setAttribute("aria-hidden", "true");
    }, 200);
}

// ===== MODAL DE SENHA (PIN) =====
let pinValue = '';
const PIN_LENGTH = 8;
const DEFAULT_PIN = '36313623';
let currentPin = DEFAULT_PIN; // Será carregado do localStorage
let isPasswordEnabled = true; // Se a senha está ativada
let codePasswordHistoryFlag = false;

// Carregar configuração de senha ao iniciar
function loadPasswordConfig() {
    const savedPin = localStorage.getItem('neo_code_password');
    const passwordEnabled = localStorage.getItem('neo_password_enabled');

    if (savedPin) {
        currentPin = savedPin;
    }

    if (passwordEnabled !== null) {
        isPasswordEnabled = passwordEnabled === 'true';
    }

    updatePasswordStatusUI();
}

// Atualizar UI do status da senha
function updatePasswordStatusUI() {
    const statusEl = document.getElementById('passwordConfigStatus');
    const removeBtn = document.getElementById('removePasswordBtn');

    if (statusEl) {
        if (isPasswordEnabled && currentPin) {
            statusEl.innerHTML = '<i class="fa-solid fa-lock"></i><span>Protegido com senha</span>';
            statusEl.classList.add('locked');
            statusEl.classList.remove('unlocked');
        } else {
            statusEl.innerHTML = '<i class="fa-solid fa-lock-open"></i><span>Sem proteção de senha</span>';
            statusEl.classList.remove('locked');
            statusEl.classList.add('unlocked');
        }
    }

    if (removeBtn) {
        removeBtn.style.display = isPasswordEnabled ? 'flex' : 'none';
    }
}

// Definir nova senha
function setNewPassword() {
    const newPassInput = document.getElementById('newPasswordInput');
    const confirmPassInput = document.getElementById('confirmPasswordInput');
    const messageEl = document.getElementById('passwordConfigMessage');

    if (!newPassInput || !confirmPassInput || !messageEl) return;

    const newPass = newPassInput.value.trim();
    const confirmPass = confirmPassInput.value.trim();

    // Validações
    if (newPass.length < 4 || newPass.length > 8) {
        showPasswordMessage('A senha deve ter de 4 a 8 dígitos', 'error');
        return;
    }

    if (!/^\d{4,8}$/.test(newPass)) {
        showPasswordMessage('A senha deve conter apenas números', 'error');
        return;
    }

    if (newPass !== confirmPass) {
        showPasswordMessage('As senhas não coincidem', 'error');
        return;
    }

    // Salvar nova senha
    currentPin = newPass;
    isPasswordEnabled = true;
    localStorage.setItem('neo_code_password', currentPin);
    localStorage.setItem('neo_password_enabled', 'true');

    // Limpar campos
    newPassInput.value = '';
    confirmPassInput.value = '';

    updatePasswordStatusUI();
    showPasswordMessage('Senha definida com sucesso!', 'success');

    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
}

// Remover senha
function removePassword() {
    isPasswordEnabled = false;
    localStorage.setItem('neo_password_enabled', 'false');

    updatePasswordStatusUI();
    showPasswordMessage('Proteção de senha removida', 'success');

    if (navigator.vibrate) navigator.vibrate(30);
}

// Mostrar mensagem de feedback
function showPasswordMessage(msg, type) {
    const messageEl = document.getElementById('passwordConfigMessage');
    if (!messageEl) return;

    messageEl.textContent = msg;
    messageEl.className = 'password-config-message ' + type;

    setTimeout(() => {
        messageEl.className = 'password-config-message';
    }, 3000);
}

// Gerar bolinhas do PIN dinamicamente
function generatePinDots() {
    const container = document.getElementById('pinDotsContainer');
    if (!container) return;

    const pinLength = currentPin.length;
    container.innerHTML = '';

    for (let i = 0; i < pinLength; i++) {
        const dot = document.createElement('span');
        dot.className = 'pin-dot';
        dot.dataset.index = i;
        container.appendChild(dot);
    }
}

function openCodePasswordModal() {
    // Se senha desativada, abrir direto
    if (!isPasswordEnabled) {
        openCodeSourceSidebar();
        return;
    }

    if (!codePasswordOverlay) return;
    pinValue = '';
    generatePinDots(); // Gerar bolinhas baseado no tamanho da senha
    updatePinDots();
    if (codePasswordError) codePasswordError.textContent = '';
    codePasswordOverlay.classList.add("open");
    codePasswordOverlay.setAttribute("aria-hidden", "false");

    // Adicionar ao histórico para o botão voltar funcionar
    history.pushState({ neoCodePassword: true }, "");
    codePasswordHistoryFlag = true;

    // Configurar eventos do teclado
    const keys = codePasswordOverlay.querySelectorAll('.pin-key[data-value]');
    keys.forEach(key => {
        key.onclick = () => handlePinKeyPress(key.dataset.value);
    });

    const deleteKey = codePasswordOverlay.querySelector('.pin-key[data-action="delete"]');
    if (deleteKey) {
        deleteKey.onclick = handlePinDelete;
    }
}

function closeCodePasswordModal() {
    if (!codePasswordOverlay) return;

    // Remover do histórico se foi adicionado
    if (codePasswordHistoryFlag) {
        codePasswordHistoryFlag = false;
        history.back();
        return; // O popstate vai chamar closeCodePasswordModal novamente
    }

    codePasswordOverlay.classList.add("closing");
    setTimeout(() => {
        codePasswordOverlay.classList.remove("open", "closing");
        codePasswordOverlay.setAttribute("aria-hidden", "true");
        pinValue = '';
        updatePinDots();
        if (codePasswordError) codePasswordError.textContent = '';
    }, 250);
}

// Função para fechar sem manipular histórico (chamada pelo popstate)
function closeCodePasswordModalDirect() {
    if (!codePasswordOverlay) return;
    codePasswordHistoryFlag = false;
    codePasswordOverlay.classList.add("closing");
    setTimeout(() => {
        codePasswordOverlay.classList.remove("open", "closing");
        codePasswordOverlay.setAttribute("aria-hidden", "true");
        pinValue = '';
        updatePinDots();
        if (codePasswordError) codePasswordError.textContent = '';
    }, 250);
}

function handlePinKeyPress(value) {
    if (pinValue.length >= PIN_LENGTH) return;

    pinValue += value;
    updatePinDots();

    // Vibrar levemente
    if (navigator.vibrate) navigator.vibrate(15);

    // Verificar automaticamente quando atingir o tamanho da senha configurada
    if (pinValue.length === currentPin.length) {
        setTimeout(() => {
            if (pinValue === currentPin) {
                showPinSuccess();
            } else {
                showPinError();
            }
        }, 150);
    }
}

function handlePinDelete() {
    if (pinValue.length === 0) return;
    pinValue = pinValue.slice(0, -1);
    updatePinDots();
    if (navigator.vibrate) navigator.vibrate(10);
}

function updatePinDots() {
    const dots = codePasswordOverlay.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        if (index < pinValue.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function showPinError() {
    const dotsContainer = codePasswordOverlay.querySelector('.pin-dots');
    dotsContainer.classList.add('error');
    if (codePasswordError) codePasswordError.textContent = 'Código incorreto';
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

    setTimeout(() => {
        dotsContainer.classList.remove('error');
        pinValue = '';
        updatePinDots();
    }, 600);
}

function showPinSuccess() {
    const dotsContainer = codePasswordOverlay.querySelector('.pin-dots');
    dotsContainer.classList.add('success');
    if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 50]);

    setTimeout(() => {
        dotsContainer.classList.remove('success');
        closeCodePasswordModal();
        openCodeSourceSidebar();
    }, 400);
}

function handleCodePasswordConfirm() {
    // Mantido para compatibilidade, mas agora a verificação é automática
    if (pinValue === currentPin) {
        showPinSuccess();
    } else {
        showPinError();
    }
}

// ===== MODAL LIMPAR MEMÓRIA =====
function openClearMemoryModal() {
    if (!clearMemoryModal) return;
    clearMemoryModal.classList.add("open");
    clearMemoryModal.setAttribute("aria-hidden", "false");
}

function closeClearMemoryModal() {
    if (!clearMemoryModal) return;
    clearMemoryModal.classList.add("closing");
    setTimeout(() => {
        clearMemoryModal.classList.remove("open", "closing");
        clearMemoryModal.setAttribute("aria-hidden", "true");
    }, 200);
}

// ===== RESET DE PARÂMETROS =====
function resetParams() {
    // Sliders removidos - valores fixos
    if (humorRange) humorRange.value = 3;
    if (freedomRange) freedomRange.value = 4;
    if (professionalRange) professionalRange.value = 8;
    if (formalidadeRange) formalidadeRange.value = 4;
    if (humorValue) humorValue.textContent = 3;
    if (freedomValue) freedomValue.textContent = 4;
    if (professionalValue) professionalValue.textContent = 8;
    if (formalidadeValue) formalidadeValue.textContent = 4;
    if (styleCustom) styleCustom.value = "";
    
    // Toggle de personalidade removido
    const personalityToggle = document.getElementById('personalityToggle');
    if (personalityToggle) {
        personalityToggle.classList.remove('active');
        localStorage.setItem('neo_personality_enabled', 'false');
        updatePersonalitySlidersState(false);
    }

    // Definir cores baseado no tema atual
    if (currentThemeMode === "light" || (currentThemeMode === "auto" && !window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        currentGradient = "white";
        currentSecondaryColor = "black";
    } else {
        currentGradient = "default";
        currentSecondaryColor = "white";
    }

    currentFont = "Inter";
    applyBackground();
    applySecondaryColor();
    applyFont();
    updatePresetButtonState();
    updateSecondaryPresetState();
    updateFontButtonState();
    updateSliderState();
    saveSettings();
}

// ===== EFEITO DE DIGITAÇÃO PREMIUM =====
const fullTypingText = "Como posso ajudar?";
let typingLoopRunning = false;
let typingTimeout = null;
let premiumAnimationActive = false;

function stopTypingEffect() {
    typingLoopRunning = false;
    premiumAnimationActive = false;

    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }

    if (textElement) {
        textElement.classList.add("hidden");
        textElement.innerHTML = "";
        textElement.style.animation = "none";
        textElement.style.opacity = "1";
    }
    
    // Esconder cards de sugestão junto com o texto
    if (typeof hideSuggestionCards === 'function') {
        hideSuggestionCards();
    }
}

function startTypingLoop() {
    stopTypingEffect();

    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && conv.messages.length > 0) {
        return;
    }

    typingTimeout = setTimeout(() => {
        typingLoopRunning = true;
        premiumAnimationActive = true;
        textElement.innerHTML = "";
        textElement.style.opacity = "1";
        textElement.classList.remove("hidden");
        
        // Iniciar animação premium letra por letra
        startPremiumLetterAnimation();
    }, 100);
}

// Animação premium: cada letra aparece de baixo pra cima com blur -> sólido
function startPremiumLetterAnimation() {
    if (!typingLoopRunning) return;
    
    const letters = fullTypingText.split('');
    textElement.innerHTML = '';
    
    // Criar spans para cada letra
    letters.forEach((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter === ' ' ? '\u00A0' : letter;
        span.className = 'premium-letter';
        span.style.cssText = `
            display: inline-block;
            opacity: 0;
            transform: translateY(18px);
            filter: blur(8px);
            transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        `;
        textElement.appendChild(span);
    });
    
    // Animar cada letra sequencialmente
    const letterSpans = textElement.querySelectorAll('.premium-letter');
    let currentIndex = 0;
    
    function animateNextLetter() {
        if (!typingLoopRunning || currentIndex >= letterSpans.length) {
            if (currentIndex >= letterSpans.length && typingLoopRunning) {
                // Todas as letras apareceram - marcar como completo
                textElement.setAttribute('data-animation-complete', 'true');
                
                // Mostrar sugestões (usa cache, não regenera)
                const suggestionsContainer = document.getElementById('suggestion-cards');
                if (suggestionsContainer && suggestionsContainer.classList.contains('hidden')) {
                    if (typeof showCachedSuggestionCards === 'function') {
                        showCachedSuggestionCards();
                    } else if (typeof showSuggestionCards === 'function') {
                        showSuggestionCards();
                    }
                }
                
                // Após 10 segundos, fazer fade out suave
                typingTimeout = setTimeout(() => {
                    fadeOutPremiumText();
                }, 10000);
            }
            return;
        }
        
        const span = letterSpans[currentIndex];
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
        span.style.filter = 'blur(0)';
        
        currentIndex++;
        
        // Próxima letra
        const delay = 55 + Math.random() * 25;
        typingTimeout = setTimeout(animateNextLetter, delay);
    }
    
    // Começar animação
    typingTimeout = setTimeout(animateNextLetter, 200);
}

// Fade out suave e reiniciar
function fadeOutPremiumText() {
    if (!typingLoopRunning) return;
    
    // Remover marca de animação completa
    textElement.removeAttribute('data-animation-complete');
    
    // NÃO esconder sugestões - elas ficam visíveis enquanto o loop estiver ativo
    
    const letterSpans = textElement.querySelectorAll('.premium-letter');
    
    // Fade out letra por letra (do fim pro início)
    let currentIndex = letterSpans.length - 1;
    
    function fadeNextLetter() {
        if (!typingLoopRunning || currentIndex < 0) {
            if (currentIndex < 0 && typingLoopRunning) {
                // Todas as letras sumiram - reiniciar após pausa
                typingTimeout = setTimeout(() => {
                    if (typingLoopRunning) {
                        startPremiumLetterAnimation();
                    }
                }, 800);
            }
            return;
        }
        
        const span = letterSpans[currentIndex];
        span.style.transition = 'all 0.35s ease-out';
        span.style.opacity = '0';
        span.style.transform = 'translateY(-12px)';
        span.style.filter = 'blur(5px)';
        
        currentIndex--;
        
        // Próxima letra fade out
        typingTimeout = setTimeout(fadeNextLetter, 40);
    }
    
    typingTimeout = setTimeout(fadeNextLetter, 60);
}

// ===== VIBRAÇÃO EM BOTÕES =====
function addVibrationToButtons() {
    // Botões principais
    if (chatBtn) chatBtn.addEventListener('click', vibrateOnClick);
    if (tempChatBtn) tempChatBtn.addEventListener('click', vibrateOnClick);
    if (settingsBtn) settingsBtn.addEventListener('click', vibrateOnClick);
    if (sendBtn) sendBtn.addEventListener('click', vibrateOnClick);
    if (micBtn) micBtn.addEventListener('click', vibrateOnClick);

    // Sidebar de chats
    if (newChatBtn) newChatBtn.addEventListener('click', vibrateOnClick);
    if (clearChatsBtn) clearChatsBtn.addEventListener('click', vibrateOnClick);

    // Configurações
    const settingsBackBtn = document.getElementById('settingsBackBtn');
    if (settingsBackBtn) settingsBackBtn.addEventListener('click', vibrateOnClick);
    if (document.getElementById('resetParamsBtn')) {
        document.getElementById('resetParamsBtn').addEventListener('click', vibrateOnClick);
    }
    if (lockedBtn) lockedBtn.addEventListener('click', vibrateOnClick);

    // Presets de cor
    if (presetDefault) presetDefault.addEventListener('click', vibrateOnClick);
    if (presetPink) presetPink.addEventListener('click', vibrateOnClick);
    if (presetGreen) presetGreen.addEventListener('click', vibrateOnClick);
    if (presetYellow) presetYellow.addEventListener('click', vibrateOnClick);
    if (presetRed) presetRed.addEventListener('click', vibrateOnClick);
    if (presetBlack) presetBlack.addEventListener('click', vibrateOnClick);
    if (presetWhite) presetWhite.addEventListener('click', vibrateOnClick);
    if (presetCustom) presetCustom.addEventListener('click', vibrateOnClick);

    // Presets de cor secundária
    if (secondaryPresetWhite) secondaryPresetWhite.addEventListener('click', vibrateOnClick);
    if (secondaryPresetBlack) secondaryPresetBlack.addEventListener('click', vibrateOnClick);
    if (secondaryPresetCyan) secondaryPresetCyan.addEventListener('click', vibrateOnClick);
    if (secondaryPresetLime) secondaryPresetLime.addEventListener('click', vibrateOnClick);
    if (secondaryPresetPink) secondaryPresetPink.addEventListener('click', vibrateOnClick);
    if (secondaryPresetOrange) secondaryPresetOrange.addEventListener('click', vibrateOnClick);
    if (secondaryPresetRed) secondaryPresetRed.addEventListener('click', vibrateOnClick);
    if (secondaryPresetCustom) secondaryPresetCustom.addEventListener('click', vibrateOnClick);

    // Modais
    if (btnStay) btnStay.addEventListener('click', vibrateOnClick);
    if (btnExit) btnExit.addEventListener('click', vibrateOnClick);
    if (btnCancelHistory) btnCancelHistory.addEventListener('click', vibrateOnClick);
    if (btnConfirmHistory) btnConfirmHistory.addEventListener('click', vibrateOnClick);
    if (btnCancelDeleteChat) btnCancelDeleteChat.addEventListener('click', vibrateOnClick);
    if (btnConfirmDeleteChat) btnConfirmDeleteChat.addEventListener('click', vibrateOnClick);

    // Código fonte
    if (codeSourceCloseBtn) codeSourceCloseBtn.addEventListener('click', vibrateOnClick);
    if (codeSourceCancelBtn) codeSourceCancelBtn.addEventListener('click', vibrateOnClick);
    if (codeSourceSaveBtn) codeSourceSaveBtn.addEventListener('click', vibrateOnClick);

    // Senha
    if (codePasswordCancelBtn) codePasswordCancelBtn.addEventListener('click', vibrateOnClick);
    if (codePasswordConfirmBtn) codePasswordConfirmBtn.addEventListener('click', vibrateOnClick);

    // Memória
    if (clearMemoryBtn) clearMemoryBtn.addEventListener('click', vibrateOnClick);
    if (btnCancelClearMemory) btnCancelClearMemory.addEventListener('click', vibrateOnClick);
    if (btnConfirmClearMemory) btnConfirmClearMemory.addEventListener('click', vibrateOnClick);
    if (memoryModalCloseBtn) memoryModalCloseBtn.addEventListener('click', vibrateOnClick);

    // Limpar busca
    if (typeof clearSearchBtn !== "undefined" && clearSearchBtn) {
        clearSearchBtn.addEventListener('click', vibrateOnClick);
    }

    // Delegação para botões dinâmicos
    document.addEventListener('click', function (e) {
        if (e.target.closest('.copy-btn')) vibrateOnClick();
        if (e.target.closest('.favorite-btn')) vibrateOnClick();
        if (e.target.closest('.memory-btn')) vibrateOnClick();
        if (e.target.closest('.delete-chat-btn')) vibrateOnClick();
        if (e.target.closest('.delete-favorite-btn')) vibrateOnClick();
    });
}

// ===== TOGGLE DE PERSONALIDADE =====
function updatePersonalitySlidersState(enabled) {
    const container = document.getElementById('personalitySlidersContainer');
    if (container) {
        if (enabled) {
            container.classList.remove('personality-sliders-disabled');
        } else {
            container.classList.add('personality-sliders-disabled');
        }
    }
}

function initPersonalityToggle() {
    const toggle = document.getElementById('personalityToggle');
    if (!toggle) return;
    
    // Carregar estado salvo
    const isEnabled = localStorage.getItem('neo_personality_enabled') === 'true';
    if (isEnabled) {
        toggle.classList.add('active');
    }
    updatePersonalitySlidersState(isEnabled);
    
    // Handler para toggle
    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willEnable = !toggle.classList.contains('active');
        
        if (willEnable) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
        
        localStorage.setItem('neo_personality_enabled', willEnable.toString());
        updatePersonalitySlidersState(willEnable);
        
        if (typeof saveSettings === 'function') {
            saveSettings();
        }
    };
    
    toggle.addEventListener('touchend', handleToggle, { passive: false });
    toggle.addEventListener('click', (e) => {
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
        handleToggle(e);
    });
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersonalityToggle);
} else {
    setTimeout(initPersonalityToggle, 100);
}

// ===== TOGGLE SUGESTÕES NO CHAT =====
function initSuggestionsToggle() {
    const toggle = document.getElementById('suggestionsToggle');
    if (!toggle) return;
    
    // Carregar estado salvo (padrão: DESATIVADO para economizar tokens)
    const isEnabled = localStorage.getItem('neo_suggestions_enabled') === 'true';
    if (isEnabled) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
    
    // Aplicar estado inicial às sugestões
    updateSuggestionsVisibility(isEnabled);
    
    // Handler para toggle
    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willEnable = !toggle.classList.contains('active');
        
        if (willEnable) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
        
        localStorage.setItem('neo_suggestions_enabled', willEnable.toString());
        updateSuggestionsVisibility(willEnable);
        
        if (typeof vibrate === 'function') vibrate(10);
    };
    
    toggle.addEventListener('touchend', handleToggle, { passive: false });
    toggle.addEventListener('click', (e) => {
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
        handleToggle(e);
    });
}

function updateSuggestionsVisibility(enabled) {
    const suggestionCards = document.getElementById('suggestion-cards');
    if (suggestionCards) {
        if (enabled) {
            suggestionCards.style.display = '';
            suggestionCards.classList.remove('suggestions-disabled');
        } else {
            suggestionCards.style.display = 'none';
            suggestionCards.classList.add('suggestions-disabled');
        }
    }
}

// Função global para verificar se sugestões estão habilitadas
// Padrão: DESATIVADO para economizar tokens
function areSuggestionsEnabled() {
    return localStorage.getItem('neo_suggestions_enabled') === 'true';
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuggestionsToggle);
} else {
    setTimeout(initSuggestionsToggle, 100);
}

// FECHAR CARDS DE ANEXO AO CLICAR FORA
function closeAttachMenu() {
    const attachMenu = document.querySelector('.attach-menu');
    if (attachMenu && attachMenu.classList.contains('open')) {
        attachMenu.classList.remove('open');
    }
}

document.addEventListener('mousedown', function(e) {
    const attachMenu = document.querySelector('.attach-menu');
    if (!attachMenu || !attachMenu.classList.contains('open')) return;
    if (!e.target.closest('.attach-menu')) {
        closeAttachMenu();
    }
});

// ===== BOTÃO APAGAR DADOS (5 SEGUNDOS SEGURANDO) =====
function initDangerWipeButton() {
    const btn = document.getElementById('dangerWipeBtn');
    const progress = document.getElementById('dangerWipeProgress');
    if (!btn || !progress) return;

    let holdTimer = null;
    let startTime = 0;
    let animationFrame = null;
    const HOLD_DURATION = 5000; // 5 segundos

    function startHold(e) {
        e.preventDefault();
        
        // Resetar estado visual
        btn.classList.remove('complete');
        progress.style.width = '0%';
        
        // Forçar reflow para reiniciar animação
        void btn.offsetWidth;
        
        btn.classList.add('holding');
        startTime = Date.now();

        function updateProgress() {
            const elapsed = Date.now() - startTime;
            const percent = Math.min((elapsed / HOLD_DURATION) * 100, 100);
            progress.style.width = percent + '%';

            if (elapsed >= HOLD_DURATION) {
                // Completou 5 segundos - apagar tudo!
                btn.classList.remove('holding');
                btn.classList.add('complete');
                
                // Vibrar forte
                if (typeof vibrate === 'function') vibrate(200);
                
                // Apagar TUDO do localStorage
                setTimeout(() => {
                    localStorage.clear();
                    
                    // Recarregar o app
                    location.reload();
                }, 300);
                
                return;
            }

            animationFrame = requestAnimationFrame(updateProgress);
        }

        animationFrame = requestAnimationFrame(updateProgress);
    }

    function endHold() {
        btn.classList.remove('holding');
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        // Resetar progresso suavemente
        progress.style.transition = 'width 0.2s ease-out';
        progress.style.width = '0%';
        setTimeout(() => {
            progress.style.transition = '';
        }, 200);
    }

    // Touch events
    btn.addEventListener('touchstart', startHold, { passive: false });
    btn.addEventListener('touchend', endHold);
    btn.addEventListener('touchcancel', endHold);

    // Mouse events (para desktop)
    btn.addEventListener('mousedown', startHold);
    btn.addEventListener('mouseup', endHold);
    btn.addEventListener('mouseleave', endHold);
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDangerWipeButton);
} else {
    initDangerWipeButton();
}
