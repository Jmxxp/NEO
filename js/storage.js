// ===== STORAGE - Funções de armazenamento =====

// ╔════════════════════════════════════════════════════════════════╗
// ║  VERSÃO DO APP - ALTERE AQUI QUANDO PUBLICAR UMA ATUALIZAÇÃO  ║
// ╚════════════════════════════════════════════════════════════════╝
const APP_VERSION = "2.0.0";
// ════════════════════════════════════════════════════════════════════

// Cache das configurações
let savedSettingsCache = null;

// ===== SISTEMA DE ID DO USUÁRIO =====
const USER_ID_STORAGE_KEY = 'neo_user_id';
const ACCESS_CHECK_URL = 'https://jmxxp.github.io/Acesso-ao-NEO/access.txt';

// ===== SISTEMA DE ACESSO OFFLINE (3 DIAS) =====
const OFFLINE_ACCESS_KEY = 'neo_offline_access';
const OFFLINE_ACCESS_DAYS = 3; // Dias permitidos sem verificar online

// Salva timestamp da última verificação online bem-sucedida
function saveOfflineAccess() {
    const data = {
        timestamp: Date.now(),
        expiresAt: Date.now() + (OFFLINE_ACCESS_DAYS * 24 * 60 * 60 * 1000) // 3 dias em ms
    };
    localStorage.setItem(OFFLINE_ACCESS_KEY, JSON.stringify(data));
    console.log('🔓 [Offline] Acesso offline salvo até:', new Date(data.expiresAt).toLocaleString());
}

// Verifica se o acesso offline ainda é válido
function checkOfflineAccess() {
    try {
        const data = localStorage.getItem(OFFLINE_ACCESS_KEY);
        if (!data) {
            console.log('🔒 [Offline] Sem dados de acesso offline');
            return { valid: false, reason: 'no_data' };
        }
        
        const parsed = JSON.parse(data);
        const now = Date.now();
        
        if (now < parsed.expiresAt) {
            const remainingMs = parsed.expiresAt - now;
            const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
            const remainingDays = Math.floor(remainingHours / 24);
            console.log(`🔓 [Offline] Acesso offline válido! Restam ${remainingDays}d ${remainingHours % 24}h`);
            return { 
                valid: true, 
                expiresAt: parsed.expiresAt,
                remainingHours: remainingHours
            };
        } else {
            console.log('🔒 [Offline] Acesso offline EXPIRADO');
            return { valid: false, reason: 'expired' };
        }
    } catch (e) {
        console.error('🔒 [Offline] Erro ao verificar:', e);
        return { valid: false, reason: 'error' };
    }
}

// Limpa o acesso offline (quando bloqueado)
function clearOfflineAccess() {
    localStorage.removeItem(OFFLINE_ACCESS_KEY);
    console.log('🔒 [Offline] Acesso offline removido');
}

// Gera um ID de 9 dígitos aleatório
function generateUserId() {
    let id = '';
    for (let i = 0; i < 9; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}

// Obtém ou cria o ID do usuário (persistente)
function getUserId() {
    let userId = localStorage.getItem(USER_ID_STORAGE_KEY);
    
    if (!userId) {
        userId = generateUserId();
        localStorage.setItem(USER_ID_STORAGE_KEY, userId);
        console.log('🆔 [ID] Novo ID gerado:', userId);
    }
    
    return userId;
}

// ===== SISTEMA DE VERIFICAÇÃO DE ACESSO =====

// Variável global para armazenar a API key do arquivo
let remoteApiKey = null;

// Verifica o acesso do usuário no arquivo remoto
// Novo formato:
// ( nome ) [ ID ] { LIBERADO/BLOQUEADO }
// < chave API >
async function checkUserAccess() {
    const userId = getUserId();
    console.log('🔐 [Acesso] Verificando acesso para ID:', userId);
    
    try {
        // Buscar arquivo de acesso com cache-busting
        const url = ACCESS_CHECK_URL + '?t=' + Date.now();
        console.log('🔐 [Acesso] Buscando:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn('🔐 [Acesso] Erro HTTP:', response.status);
            // Verificação online falhou - tentar acesso offline
            return { authorized: false, apiKey: null, offline: false, networkError: true };
        }
        
        const text = await response.text();
        console.log('🔐 [Acesso] Arquivo recebido, tamanho:', text.length);
        
        // Dividir em linhas
        const lines = text.split('\n');
        
        // Procurar linha que contém o ID do usuário entre [ ]
        let userLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Procura [ ID ] na linha
            const idMatch = line.match(/\[\s*(\d+)\s*\]/);
            if (idMatch && idMatch[1] === userId) {
                userLineIndex = i;
                console.log('🔐 [Acesso] ✅ ID encontrado na linha:', i, line);
                break;
            }
        }
        
        if (userLineIndex === -1) {
            console.log('🔐 [Acesso] ❌ ID não encontrado no arquivo');
            // ID não encontrado = não autorizado, limpar acesso offline
            clearOfflineAccess();
            return { authorized: false, apiKey: null, offline: false };
        }
        
        const userLine = lines[userLineIndex];
        
        // Verificar status {LIBERADO} ou {BLOQUEADO}
        const lineUpper = userLine.toUpperCase();
        let isAuthorized = false;
        
        if (lineUpper.includes('{BLOQUEADO}')) {
            console.log('🔐 [Acesso] Status: BLOQUEADO');
            isAuthorized = false;
            // Limpar acesso offline quando bloqueado
            clearOfflineAccess();
        } else if (lineUpper.includes('{LIBERADO}')) {
            console.log('🔐 [Acesso] Status: LIBERADO');
            isAuthorized = true;
            // Salvar/renovar acesso offline quando liberado online
            saveOfflineAccess();
        } else {
            console.log('🔐 [Acesso] Status não encontrado, bloqueando por segurança');
            isAuthorized = false;
            clearOfflineAccess();
        }
        
        // Buscar API key na linha seguinte (entre < >)
        let apiKey = null;
        if (userLineIndex + 1 < lines.length) {
            const nextLine = lines[userLineIndex + 1];
            const apiMatch = nextLine.match(/<\s*([^>]+)\s*>/);
            if (apiMatch && apiMatch[1].trim()) {
                apiKey = apiMatch[1].trim();
                // Só pegar se não for vazio
                if (apiKey === '' || apiKey === '*chave API AQUI*') {
                    apiKey = null;
                }
                console.log('🔐 [Acesso] API Key encontrada:', apiKey ? '***' + apiKey.slice(-4) : 'vazia');
            }
        }
        
        // Armazenar API key globalmente
        remoteApiKey = apiKey;
        
        return { authorized: isAuthorized, apiKey: apiKey, offline: false };
        
    } catch (error) {
        console.error('🔐 [Acesso] Erro de rede:', error.message || error);
        // Erro de rede - retornar indicando que não conseguiu verificar online
        return { authorized: false, apiKey: null, offline: false, networkError: true };
    }
}

// Mostrar tela de bloqueio
function showBlockedScreen() {
    const blockedScreen = document.getElementById('blockedScreen');
    if (blockedScreen) {
        blockedScreen.classList.add('visible');
        blockedScreen.classList.remove('authorized', 'offline-expired');
        document.body.style.overflow = 'hidden';
    }
    
    // Atualizar status no card
    updateAccessStatusDisplay(false);
}

// Mostrar estado de acesso liberado (animação verde antes de fechar)
function showAccessGranted() {
    const blockedScreen = document.getElementById('blockedScreen');
    const blockedIcon = document.getElementById('blockedIcon');
    const blockedTitle = document.getElementById('blockedTitle');
    const blockedSubtitle = document.getElementById('blockedSubtitle');
    
    if (blockedScreen) {
        // Adicionar classe de autorizado para estilo verde
        blockedScreen.classList.add('authorized');
        
        // Atualizar textos
        if (blockedTitle) {
            blockedTitle.textContent = 'Acesso Liberado!';
        }
        if (blockedSubtitle) {
            blockedSubtitle.textContent = 'Seu ID foi autorizado. Bem-vindo ao NEO!';
        }
        
        // Trocar ícone para check
        if (blockedIcon) {
            const icon = blockedIcon.querySelector('i');
            if (icon) {
                icon.className = 'fa-solid fa-check';
            }
        }
        
        // Aguardar 2 segundos e fechar
        setTimeout(() => {
            hideBlockedScreen();
            // Resetar estado visual
            blockedScreen.classList.remove('authorized');
            if (blockedTitle) blockedTitle.textContent = 'Acesso Negado';
            if (blockedSubtitle) blockedSubtitle.textContent = 'Seu ID não está autorizado a usar este aplicativo.';
            if (blockedIcon) {
                const icon = blockedIcon.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-ban';
            }
        }, 2000);
    }
    
    // Atualizar status no card
    updateAccessStatusDisplay(true);
}

// Esconder tela de bloqueio
function hideBlockedScreen() {
    const blockedScreen = document.getElementById('blockedScreen');
    if (blockedScreen) {
        blockedScreen.classList.remove('visible');
        document.body.style.overflow = '';
    }
    
    // Atualizar status no card
    updateAccessStatusDisplay(true);
}

// Atualizar exibição do status
function updateAccessStatusDisplay(isAuthorized, isOffline = false) {
    const statusEl = document.querySelector('.user-id-status');
    if (statusEl) {
        if (isAuthorized) {
            if (isOffline) {
                statusEl.textContent = 'Offline';
                statusEl.classList.remove('blocked');
                statusEl.classList.add('authorized', 'offline-mode');
            } else {
                statusEl.textContent = 'Liberado';
                statusEl.classList.remove('blocked', 'offline-mode');
                statusEl.classList.add('authorized');
            }
        } else {
            statusEl.textContent = 'Bloqueado';
            statusEl.classList.remove('authorized', 'offline-mode');
            statusEl.classList.add('blocked');
        }
    }
}

// Mostrar tela de bloqueio por falta de conexão (expirou período offline)
function showOfflineExpiredScreen() {
    const blockedScreen = document.getElementById('blockedScreen');
    const blockedIcon = document.getElementById('blockedIcon');
    const blockedTitle = document.getElementById('blockedTitle');
    const blockedSubtitle = document.getElementById('blockedSubtitle');
    
    if (blockedScreen) {
        blockedScreen.classList.add('visible');
        blockedScreen.classList.remove('authorized');
        blockedScreen.classList.add('offline-expired');
        document.body.style.overflow = 'hidden';
        
        if (blockedTitle) {
            blockedTitle.textContent = 'Verificação Necessária';
        }
        if (blockedSubtitle) {
            blockedSubtitle.textContent = 'Conecte-se à internet para verificar seu acesso. O período offline de 3 dias expirou.';
        }
        if (blockedIcon) {
            const icon = blockedIcon.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-wifi';
        }
    }
    
    updateAccessStatusDisplay(false);
}

// Inicializar verificação de acesso (COM SISTEMA OFFLINE DE 3 DIAS)
async function initAccessControl() {
    console.log('🔐 [Acesso] Iniciando verificação...');
    
    // 1. Primeiro, tentar verificar online
    const result = await checkUserAccess();
    
    // 2. Se conseguiu verificar online
    if (!result.networkError) {
        if (result.authorized) {
            console.log('✅ [Acesso] Usuário AUTORIZADO (verificação online)');
            
            // Se o arquivo remoto tem uma API key, configurar no app
            if (result.apiKey) {
                console.log('🔑 [API] Configurando API key do arquivo remoto...');
                const settings = loadSettings();
                if (settings.apiKeysGemini !== result.apiKey) {
                    settings.apiKeysGemini = result.apiKey;
                    saveSettings(settings);
                    console.log('🔑 [API] API key Gemini configurada com sucesso!');
                }
            }
            
            // Acesso offline já foi salvo/renovado no checkUserAccess
            hideBlockedScreen();
            updateAccessStatusDisplay(true, false);
            return true;
        } else {
            console.log('🚫 [Acesso] Usuário BLOQUEADO (verificação online)');
            // Acesso offline já foi limpo no checkUserAccess
            showBlockedScreen();
            return false;
        }
    }
    
    // 3. Se não conseguiu verificar online (erro de rede), verificar acesso offline
    console.log('📡 [Acesso] Sem conexão - verificando acesso offline...');
    
    const offlineAccess = checkOfflineAccess();
    
    if (offlineAccess.valid) {
        const remainingDays = Math.floor(offlineAccess.remainingHours / 24);
        const remainingHours = offlineAccess.remainingHours % 24;
        
        console.log(`✅ [Acesso] Acesso OFFLINE válido! Restam ${remainingDays}d ${remainingHours}h`);
        
        hideBlockedScreen();
        updateAccessStatusDisplay(true, true); // Marcar como offline
        
        // Mostrar toast informando modo offline
        if (typeof showToast === 'function') {
            showToast(`Modo offline: ${remainingDays}d ${remainingHours}h restantes`, 'info');
        }
        
        return true;
    } else {
        // Acesso offline expirado ou nunca existiu
        if (offlineAccess.reason === 'expired') {
            console.log('🚫 [Acesso] Acesso offline EXPIRADO - precisa verificar online');
            showOfflineExpiredScreen();
        } else {
            console.log('🚫 [Acesso] Sem acesso offline - precisa verificar online');
            showBlockedScreen();
        }
        return false;
    }
}

// ===== SISTEMA DE VERIFICAÇÃO DE ATUALIZAÇÃO =====

// Verifica se há atualização disponível no arquivo remoto
async function checkForUpdate() {
    console.log('🔄 [Update] Verificando atualizações... Versão atual:', APP_VERSION);
    
    try {
        // Buscar arquivo de acesso com cache-busting
        const url = ACCESS_CHECK_URL + '?t=' + Date.now();
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn('🔄 [Update] Erro HTTP:', response.status);
            return null;
        }
        
        const text = await response.text();
        
        // Procurar seção !UPDATE!
        const updateMatch = text.match(/\*{10,}[\s\S]*?!UPDATE![\s\S]*?\{([^}]+)\}[\s\S]*?\[([^\]]+)\][\s\S]*?MELHORIAS:\s*([^\*]+)[\s\S]*?\*{10,}/);
        
        if (!updateMatch) {
            // Tentar sem MELHORIAS (retrocompatibilidade)
            const basicMatch = text.match(/\*{10,}[\s\S]*?!UPDATE![\s\S]*?\{([^}]+)\}[\s\S]*?\[([^\]]+)\][\s\S]*?\*{10,}/);
            if (!basicMatch) {
                console.log('🔄 [Update] Seção !UPDATE! não encontrada');
                return null;
            }
            // Usar match básico sem melhorias
            const remoteVersion = basicMatch[1].trim();
            const downloadUrl = basicMatch[2].trim();
            
            if (compareVersions(remoteVersion, APP_VERSION) > 0) {
                return { version: remoteVersion, url: downloadUrl, improvements: [] };
            }
            return null;
        }
        
        const remoteVersion = updateMatch[1].trim();
        const downloadUrl = updateMatch[2].trim();
        const improvementsRaw = updateMatch[3].trim();
        
        // Separar melhorias por vírgula
        const improvements = improvementsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        console.log('🔄 [Update] Versão remota:', remoteVersion);
        console.log('🔄 [Update] URL de download:', downloadUrl);
        console.log('🔄 [Update] Melhorias:', improvements);
        
        // Comparar versões
        if (compareVersions(remoteVersion, APP_VERSION) > 0) {
            console.log('🔄 [Update] ⚠️ ATUALIZAÇÃO DISPONÍVEL!');
            return {
                version: remoteVersion,
                url: downloadUrl,
                improvements: improvements
            };
        }
        
        console.log('🔄 [Update] ✅ App está atualizado');
        return null;
        
    } catch (error) {
        console.error('🔄 [Update] Erro:', error.message || error);
        return null;
    }
}

// Compara duas versões (retorna 1 se v1 > v2, -1 se v1 < v2, 0 se iguais)
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    
    return 0;
}

// Mostrar modal de atualização obrigatória
function showUpdateModal(updateInfo) {
    const modal = document.getElementById('updateModal');
    const versionEl = document.getElementById('updateNewVersion');
    const currentEl = document.getElementById('updateCurrentVersion');
    const downloadBtn = document.getElementById('updateDownloadBtn');
    const improvementsList = document.getElementById('updateImprovementsList');
    
    if (modal) {
        if (versionEl) versionEl.textContent = updateInfo.version;
        if (currentEl) currentEl.textContent = APP_VERSION;
        if (downloadBtn) downloadBtn.href = updateInfo.url;
        
        // Exibir melhorias
        if (improvementsList && updateInfo.improvements && updateInfo.improvements.length > 0) {
            improvementsList.innerHTML = updateInfo.improvements
                .map(item => `<li><i class="fa-solid fa-check"></i> ${item}</li>`)
                .join('');
            improvementsList.parentElement.style.display = 'block';
        } else if (improvementsList) {
            improvementsList.parentElement.style.display = 'none';
        }
        
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

// Inicializar verificação de atualização
async function initUpdateCheck() {
    const updateInfo = await checkForUpdate();
    
    if (updateInfo) {
        showUpdateModal(updateInfo);
        return false; // Bloqueia o app
    }
    
    return true; // App atualizado, pode continuar
}

// Exibe o ID no card
function displayUserId() {
    const display = document.getElementById('userIdDisplay');
    if (display) {
        display.textContent = getUserId();
    }
}

// Copia o ID para a área de transferência
function copyUserId() {
    const userId = getUserId();
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(userId).then(() => {
            showCopyFeedback();
        }).catch(() => {
            fallbackCopyUserId(userId);
        });
    } else {
        fallbackCopyUserId(userId);
    }
}

function fallbackCopyUserId(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showCopyFeedback();
    } catch (e) {
        console.error('Erro ao copiar:', e);
    }
    document.body.removeChild(textarea);
}

function showCopyFeedback() {
    const btn = document.getElementById('copyUserIdBtn');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = 'fa-solid fa-check';
            setTimeout(() => {
                icon.className = 'fa-solid fa-copy';
            }, 1500);
        }
    }
    
    // Vibrar se disponível
    if (typeof vibrateLight === 'function') {
        vibrateLight();
    }
}

// Inicializar sistema de ID
function initUserIdSystem() {
    displayUserId();
    
    const copyBtn = document.getElementById('copyUserIdBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyUserId);
    }
}

// ===== HELPERS PARA MÚLTIPLAS CHAVES API =====

// Extrai todas as chaves de uma lista de inputs
function getApiKeysFromList(provider) {
    const listId = `${provider}-keys-list`;
    const list = document.getElementById(listId);
    if (list) {
        const inputs = list.querySelectorAll('input.api-key-input');
        const keys = [];
        inputs.forEach(input => {
            const value = (input.value || '').trim();
            if (value) keys.push(value);
        });
        if (keys.length > 0) return keys;
    }

    // Fallback: ler de NeoAPI quando DOM não existe (provedores de IA)
    if (typeof NeoAPI !== 'undefined') {
        const aiProviders = ['deepseek', 'gemini', 'openai', 'anthropic', 'groq', 'openrouter'];
        if (aiProviders.includes(provider)) {
            const key = provider === 'gemini' ? NeoAPI.getGeminiKey() : NeoAPI.getKey(provider);
            return key ? [key] : [];
        }
    }

    return [];
}

// Popula a lista de inputs com as chaves salvas
function setApiKeysToList(provider, keys) {
    const listId = `${provider}-keys-list`;
    const list = document.getElementById(listId);
    if (!list || !keys || keys.length === 0) return;

    // Limpar inputs extras (manter só o primeiro)
    const rows = list.querySelectorAll('.api-key-row');
    for (let i = 1; i < rows.length; i++) {
        rows[i].remove();
    }

    // Preencher o primeiro input
    const firstInput = list.querySelector('input.api-key-input');
    if (firstInput && keys[0]) {
        firstInput.value = keys[0];
    }

    // Adicionar inputs extras se necessário
    for (let i = 1; i < keys.length; i++) {
        addApiKeyInput(provider, keys[i]);
    }

    // Atualizar visibilidade dos botões de remover
    updateRemoveButtons(provider);
}

// Adiciona um novo input de API key
function addApiKeyInput(provider, initialValue = '') {
    const listId = `${provider}-keys-list`;
    const list = document.getElementById(listId);
    if (!list) return;

    // Pegar o template do primeiro row
    const firstRow = list.querySelector('.api-key-row');
    if (!firstRow) return;

    // Clonar o row
    const newRow = firstRow.cloneNode(true);

    // Limpar o valor do input
    const input = newRow.querySelector('input.api-key-input');
    if (input) {
        input.value = initialValue;
        input.type = 'text'; // Garantir que seja visível
    }

    // Mostrar botão de remover
    const removeBtn = newRow.querySelector('.remove-api-key-btn');
    if (removeBtn) {
        removeBtn.style.display = 'flex';
    }

    // Adicionar à lista
    list.appendChild(newRow);

    // Atualizar números das chaves
    updateKeyNumbers(provider);

    // Atualizar visibilidade dos botões de remover
    updateRemoveButtons(provider);

    // Focar no novo input se não tiver valor inicial
    if (!initialValue && input) {
        input.focus();
    }
}

// Remove um input de API key
function removeApiKeyInput(button) {
    const row = button.closest('.api-key-row');
    const list = row.closest('.api-keys-list');
    const provider = list.id.replace('-keys-list', '');

    // Não remover se for o único
    const allRows = list.querySelectorAll('.api-key-row');
    if (allRows.length <= 1) return;

    row.remove();

    // Atualizar números das chaves
    updateKeyNumbers(provider);

    // Atualizar visibilidade dos botões de remover
    updateRemoveButtons(provider);

    // Salvar configurações
    if (typeof saveSettings === 'function') {
        saveSettings();
    }
}

// Atualiza os números das chaves (1, 2, 3...)
function updateKeyNumbers(provider) {
    const listId = `${provider}-keys-list`;
    const list = document.getElementById(listId);
    if (!list) return;

    const rows = list.querySelectorAll('.api-key-row');
    rows.forEach((row, index) => {
        const numberEl = row.querySelector('.api-key-number');
        if (numberEl) {
            numberEl.textContent = index + 1;
        }
    });
}

// Atualiza visibilidade dos botões de remover
function updateRemoveButtons(provider) {
    const listId = `${provider}-keys-list`;
    const list = document.getElementById(listId);
    if (!list) return;

    const rows = list.querySelectorAll('.api-key-row');

    rows.forEach((row, index) => {
        const removeBtn = row.querySelector('.remove-api-key-btn');
        if (removeBtn) {
            // Mostrar botão apenas se tiver mais de 1 row
            removeBtn.style.display = rows.length > 1 ? 'flex' : 'none';
        }
    });
}

// Remove uma chave específica pelo valor (usada para remover chaves inválidas)
function removeApiKeyByValue(provider, keyValue) {
    const listId = `${provider}-keys-list`;
    const list = document.getElementById(listId);
    if (!list || !keyValue) return false;

    const rows = list.querySelectorAll('.api-key-row');
    let removed = false;

    rows.forEach((row) => {
        const input = row.querySelector('input.api-key-input');
        if (input && input.value.trim() === keyValue.trim()) {
            // Se for o único input, apenas limpar o valor
            if (rows.length <= 1) {
                input.value = '';
                console.log(`🗑️ [API Keys] Chave ${provider} limpa (era a única)`);
            } else {
                row.remove();
                console.log(`🗑️ [API Keys] Chave ${provider} removida permanentemente`);
            }
            removed = true;
        }
    });

    if (removed) {
        // Atualizar números das chaves
        updateKeyNumbers(provider);
        // Atualizar visibilidade dos botões de remover
        updateRemoveButtons(provider);
        // Salvar configurações
        if (typeof saveSettings === 'function') {
            saveSettings();
        }
    }

    return removed;
}

// ===== CONVERSAS =====
function saveConversations() {
    try {
        // Filtrar conversas temporárias E conversas vazias (sem mensagens)
        const nonTempConversations = conversations.filter(c =>
            !c.isTemporary && c.messages && c.messages.length > 0
        );

        // Limpar dados grandes (imagens base64) antes de salvar para evitar exceder localStorage
        const cleanedConversations = nonTempConversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg => {
                // Criar cópia limpa da mensagem
                let cleanedMsg = { ...msg };
                
                // Se é uma mensagem de geração de imagem, limpar o texto HTML com base64
                if (msg.isImageGeneration) {
                    // Preservar metadados importantes, remover texto HTML grande
                    cleanedMsg = {
                        role: msg.role,
                        text: msg.generatedPrompt ? `[Imagem: ${msg.generatedPrompt}]` : '[Imagem gerada]',
                        isImageGeneration: true,
                        generatedPrompt: msg.generatedPrompt,
                        imageProvider: msg.imageProvider,
                        imageStorageId: msg.imageStorageId,
                        hasStoredImage: msg.hasStoredImage || !!msg.imageStorageId,
                        // Não salvar generatedImageUrl se for base64 grande
                        generatedImageUrl: (msg.generatedImageUrl && msg.generatedImageUrl.length < 100000) 
                            ? msg.generatedImageUrl : null
                    };
                }
                
                // Se a mensagem tem attachments de imagem, mantém dataUrl comprimido
                if (msg.imageAttachments && msg.imageAttachments.length > 0) {
                    cleanedMsg.imageAttachments = msg.imageAttachments.map(img => {
                        // Se dataUrl é muito grande (>100KB), não salvar
                        const dataUrl = img.dataUrl;
                        const isSmallEnough = dataUrl && dataUrl.length < 100000;
                        return {
                            filename: img.filename || img.name || 'imagem',
                            mimeType: img.mimeType || img.type || 'image/jpeg',
                            dataUrl: isSmallEnough ? dataUrl : null,
                            hadImage: true // Indica que havia imagem mesmo se não salvou
                        };
                    });
                }
                
                // Remove documentos PDF base64 também
                if (msg.documentAttachments && msg.documentAttachments.length > 0) {
                    cleanedMsg.documentAttachments = msg.documentAttachments.map(doc => ({
                        type: doc.type,
                        name: doc.name || 'documento',
                        hadDocument: true
                    }));
                }
                
                return cleanedMsg;
            })
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedConversations));
        console.log(`💾 [Storage] Conversas salvas: ${cleanedConversations.length}`);
    } catch (e) {
        console.warn("Falha ao salvar conversas:", e);
        // Tenta salvar sem mensagens se ainda falhar (último recurso)
        try {
            const minimalConversations = conversations
                .filter(c => !c.isTemporary)
                .map(c => ({
                    id: c.id,
                    title: c.title,
                    timestamp: c.timestamp,
                    messages: c.messages.slice(-10).map(m => {
                        // PRESERVAR metadados de imagem mesmo no modo mínimo
                        if (m.isImageGeneration) {
                            return {
                                role: m.role,
                                text: `[Imagem: ${m.generatedPrompt || 'gerada'}]`,
                                isImageGeneration: true,
                                generatedPrompt: m.generatedPrompt,
                                imageProvider: m.imageProvider,
                                imageStorageId: m.imageStorageId,
                                hasStoredImage: m.hasStoredImage || !!m.imageStorageId
                            };
                        }
                        return {
                            role: m.role,
                            text: typeof m.text === 'string' ? m.text.substring(0, 1000) : m.text
                        };
                    })
                }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalConversations));
            console.log("⚠️ Conversas salvas em modo mínimo (últimas 10 mensagens truncadas)");
        } catch (e2) {
            console.error("❌ Impossível salvar conversas:", e2);
        }
    }
}

function loadConversations() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.warn("Falha ao carregar conversas:", e);
        return [];
    }
}

// ===== CONFIGURAÇÕES =====
function saveSettings() {
    try {
        const apiKeyVisionInput = document.getElementById('apiKeyVisionInput');
        const voiceProviderEl = document.getElementById('voiceProviderSelect');
        const elevenLabsApiKeyEl = document.getElementById('elevenLabsApiKey');
        const elevenLabsVoiceEl = document.getElementById('elevenLabsVoiceSelect');

        // Obter chaves de todos os providers
        const deepseekKeys = getApiKeysFromList('deepseek');
        const geminiKeys = getApiKeysFromList('gemini');
        const openaiKeys = getApiKeysFromList('openai');
        const anthropicKeys = getApiKeysFromList('anthropic');
        const groqKeys = getApiKeysFromList('groq');
        const openrouterKeys = getApiKeysFromList('openrouter');
        
        console.log('💾 [SaveSettings] Salvando chaves:', {
            deepseek: deepseekKeys.length > 0 ? `${deepseekKeys.length} chave(s)` : 'nenhuma',
            gemini: geminiKeys.length > 0 ? `${geminiKeys.length} chave(s)` : 'nenhuma',
            openai: openaiKeys.length > 0 ? `${openaiKeys.length} chave(s)` : 'nenhuma',
            anthropic: anthropicKeys.length > 0 ? `${anthropicKeys.length} chave(s)` : 'nenhuma',
            groq: groqKeys.length > 0 ? `${groqKeys.length} chave(s)` : 'nenhuma',
            openrouter: openrouterKeys.length > 0 ? `${openrouterKeys.length} chave(s)` : 'nenhuma'
        });

        // IMPORTANTE: Salvar chave Gemini também em neo_user_api_key (fonte única usada pela API)
        if (geminiKeys.length > 0) {
            localStorage.setItem('neo_user_api_key', geminiKeys[0]);
            console.log('💾 [SaveSettings] Chave Gemini salva em neo_user_api_key');
        }

        const settings = {
            humor: humorRange.value,
            freedom: freedomRange.value,
            professional: professionalRange.value,
            formalidade: formalidadeRange.value,
            memory: memoryText.value,
            styleCustom: styleCustom.value,
            // Chaves API - todos os providers
            apiKeysGemini: geminiKeys,
            apiKeysDeepseek: deepseekKeys,
            apiKeysOpenai: openaiKeys,
            apiKeysAnthropic: anthropicKeys,
            apiKeysGroq: groqKeys,
            apiKeysOpenrouter: openrouterKeys,
            apiKeysSerp: getApiKeysFromList('serp'),
            model: modelSelect.value,
            bgColor: bgColorPicker.value,
            bgGradient: currentGradient,
            secondaryColor: currentSecondaryColor,
            secondaryColorCustom: secondaryColorPicker.value,
            appFont: currentFont,
            themeMode: currentThemeMode,
            codeSource: codeSourceText
                ? codeSourceText.value
                : (savedSettingsCache && savedSettingsCache.codeSource) || "",
            // Configurações de voz
            voiceProvider: voiceProviderEl ? voiceProviderEl.value : 'local',
            apiKeysElevenlabs: getApiKeysFromList('elevenlabs'),
            elevenLabsVoice: elevenLabsVoiceEl ? elevenLabsVoiceEl.value : 'ErXwobaYiN019PkySvjV',
            nativeVoice: document.getElementById('nativeVoiceSelect')?.value || ''
        };

        // DEBUG: Log do código fonte sendo salvo
        console.log("💾 [saveSettings] Salvando codeSource:", settings.codeSource ? `"${settings.codeSource.substring(0, 100)}..."` : "(vazio)");

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        // Invalidar cache do system prompt quando configurações mudam
        if (typeof invalidateSystemPromptCache === 'function') {
            invalidateSystemPromptCache();
        }
    } catch (e) {
        console.warn("Falha ao salvar configurações:", e);
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.warn("Falha ao carregar configurações:", e);
        return null;
    }
}

// ===== MEMÓRIA DO USUÁRIO =====
function loadUserMemory() {
    try {
        const raw = localStorage.getItem(MEMORY_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        const text = typeof parsed.text === "string" ? parsed.text : "";
        const messageId = typeof parsed.messageId === "string" ? parsed.messageId : null;
        if (!text.trim()) return null;
        return { text, messageId };
    } catch {
        return null;
    }
}

function loadMemoryHistory() {
    try {
        const raw = localStorage.getItem(MEMORY_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveMemoryHistory(history) {
    try {
        const trimmed = history.slice(-MAX_MEMORY_HISTORY);
        localStorage.setItem(MEMORY_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.warn("Falha ao salvar histórico de memória:", e);
    }
}

function pushToMemoryHistory(memoryObj) {
    if (!memoryObj || !memoryObj.text) return;

    // Não salvar se estiver em modo temporário
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && conv.isTemporary) {
        console.log("Modo temporário ativo - histórico de memória não será salvo");
        return;
    }

    const history = loadMemoryHistory();
    history.push({
        text: memoryObj.text,
        messageId: memoryObj.messageId || null,
        timestamp: Date.now()
    });
    saveMemoryHistory(history);
}

function saveUserMemory(mem) {
    // Não salvar se estiver em modo temporário
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && conv.isTemporary) {
        console.log("Modo temporário ativo - memória não será salva");
        return;
    }

    try {
        if (!mem || !mem.text || !mem.text.trim()) {
            const currentMem = loadUserMemory();
            if (currentMem && currentMem.text) {
                pushToMemoryHistory(currentMem);
            }
            localStorage.removeItem(MEMORY_KEY);
            if (memoryText) memoryText.value = "";
            return;
        }

        const currentMem = loadUserMemory();
        if (currentMem && currentMem.text && currentMem.text !== mem.text.trim()) {
            pushToMemoryHistory(currentMem);
        }

        localStorage.setItem(MEMORY_KEY, JSON.stringify({
            text: mem.text.trim(),
            messageId: mem.messageId || null
        }));
        if (memoryText) {
            memoryText.value = mem.text.trim();
            saveSettings();
        }
    } catch (e) {
        console.warn("Falha ao salvar memória do usuário:", e);
    }
}

function undoLastMemoryChange() {
    const history = loadMemoryHistory();

    if (history.length === 0) {
        localStorage.removeItem(MEMORY_KEY);
        if (memoryText) {
            memoryText.value = "";
            saveSettings();
        }
        return false;
    }

    const previousMem = history.pop();
    saveMemoryHistory(history);

    localStorage.setItem(MEMORY_KEY, JSON.stringify({
        text: previousMem.text,
        messageId: previousMem.messageId || null
    }));

    if (memoryText) {
        memoryText.value = previousMem.text;
        saveSettings();
    }

    return true;
}

function getAllMemoryTexts() {
    const mem = loadUserMemory();
    return mem && mem.text ? [mem.text] : [];
}

// ===== MEMÓRIA POR MENSAGEM =====
function loadMemoryByMessage() {
    try {
        const raw = localStorage.getItem(MEMORY_BY_MESSAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

function saveMemoryByMessage(map) {
    try {
        localStorage.setItem(MEMORY_BY_MESSAGE_KEY, JSON.stringify(map));

        // Invalidar cache do system prompt quando memória estruturada muda
        if (typeof invalidateSystemPromptCache === 'function') {
            invalidateSystemPromptCache();
        }
    } catch (e) {
        console.warn("Falha ao salvar mapa de memórias:", e);
    }
}

function addMemoryForMessage(messageId, memoryTextValue) {
    if (!messageId || !memoryTextValue) return;

    // Não salvar se estiver em modo temporário
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && conv.isTemporary) {
        console.log("Modo temporário ativo - memória por mensagem não será salva");
        return;
    }

    // Carregar memória atual para salvar como previousText
    const currentMem = loadUserMemory();
    const previousText = currentMem ? currentMem.text : null;

    const map = loadMemoryByMessage();
    map[messageId] = {
        text: memoryTextValue.trim(),
        previousText: previousText,
        timestamp: Date.now()
    };
    saveMemoryByMessage(map);
}

function getMemoryForMessageId(messageId) {
    if (!messageId) return null;
    const map = loadMemoryByMessage();
    return map[messageId] || null;
}

function deleteMemoryForMessage(messageId) {
    if (!messageId) return;
    const map = loadMemoryByMessage();
    delete map[messageId];
    saveMemoryByMessage(map);
}

function getMemoriesForMessage(messageId) {
    if (!messageId) return [];
    const memoryForMsg = getMemoryForMessageId(messageId);
    if (memoryForMsg && memoryForMsg.text) {
        return [{
            text: memoryForMsg.text,
            previousText: memoryForMsg.previousText || null,
            messageId: messageId
        }];
    }
    return [];
}

function appendUserMemory(newMemoryText, messageId) {
    if (!newMemoryText) return;
    const trimmed = newMemoryText.trim();
    if (!trimmed) return;

    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && conv.isTemporary) {
        console.log("Modo temporário ativo - memória não será salva");
        return;
    }

    if (messageId && conv) {
        const msg = conv.messages.find(m => m.id === messageId);
        if (msg) {
            msg.hadMemory = true;
            saveConversations();
        }
    }

    if (messageId) {
        addMemoryForMessage(messageId, trimmed);
    }

    saveUserMemory({
        text: trimmed,
        messageId: messageId || null
    });

    // Atualizar preview do botão de memória
    updateMemoryButtonPreview();
}

// Atualiza o preview no botão de memória nas configurações
function updateMemoryButtonPreview() {
    const previewText = document.getElementById('memoryPreviewText');
    const memoryTextEl = document.getElementById('memoryText');

    if (!previewText) return;

    const memory = memoryTextEl ? memoryTextEl.value : '';
    if (memory && memory.trim()) {
        const lines = memory.split('\n').filter(l => l.trim());
        const preview = lines[0] || '';
        previewText.textContent = preview.length > 30 ? preview.substring(0, 30) + '...' : preview;
        previewText.style.color = 'rgba(167, 139, 250, 0.8)';
    } else {
        previewText.textContent = 'Nenhuma memória salva';
        previewText.style.color = 'rgba(255, 255, 255, 0.5)';
    }
}

function deleteUserMemoryByText() {
    const currentMem = loadUserMemory();
    if (currentMem && currentMem.messageId) {
        deleteMemoryForMessage(currentMem.messageId);
    }
    undoLastMemoryChange();
}

// ===== DETECÇÃO DIRETA DE PEDIDO DE LIMPEZA DE MEMÓRIA =====
// Detecta se o usuário está pedindo para limpar a memória (sem depender da IA)
function detectClearMemoryRequest(userText) {
    if (!userText) return { shouldClear: false, clearType: null };

    const text = userText.toLowerCase().trim();

    // Padrões para limpar TODA a memória
    const clearAllPatterns = [
        /limp[ae]\s*(sua\s*)?(a\s*)?mem[oó]ria/i,
        /apag[ae]\s*(sua\s*)?(a\s*)?mem[oó]ria/i,
        /delet[ae]\s*(sua\s*)?(a\s*)?mem[oó]ria/i,
        /zer[ae]\s*(sua\s*)?(a\s*)?mem[oó]ria/i,
        /reset[ae]?\s*(sua\s*)?(a\s*)?mem[oó]ria/i,
        /esqu?ec?[ea]\s+tudo\s*(sobre\s*mim)?/i,
        /apag[ae]\s+tudo\s*(que\s*sabe)?/i,
        /n[aã]o\s+lembr[ae]?\s+mais\s+de\s+mim/i,
        /esqu?ec?[ea]\s+de\s+mim/i,
        /limpar?\s+mem[oó]ria/i,
        /mem[oó]ria\s+limpa/i,
        /esqueça\s+o\s+que\s+sabe/i,
        /apagar?\s+o\s+que\s+sabe/i,
        /come[cç][ae]r?\s+do\s+zero/i,
        /recome[cç]ar?\s+do\s+zero/i
    ];

    for (const pattern of clearAllPatterns) {
        if (pattern.test(text)) {
            console.log("🔴 DETECTADO PEDIDO DE LIMPAR TODA MEMÓRIA:", text);
            return { shouldClear: true, clearType: 'ALL' };
        }
    }

    return { shouldClear: false, clearType: null };
}

// Função para limpar toda a memória diretamente
function clearAllMemory() {
    console.log("🗑️ LIMPANDO TODA A MEMÓRIA!");

    // Limpar do localStorage
    saveUserMemory({ text: '', messageId: null });

    // Atualizar textarea de memória se existir
    const memoryTextEl = document.getElementById('memoryText');
    if (memoryTextEl) {
        memoryTextEl.value = '';
    }

    // Atualizar preview
    updateMemoryButtonPreview();

    console.log("✅ Memória limpa com sucesso!");
    return true;
}

function extractMemoryBlocks(responseText) {
    if (!responseText) return { cleanedText: responseText || "", memories: [], memoryCommands: [] };

    const memoryCommands = [];
    let cleaned = responseText;

    // ===== EXTRAIR TAGS [mem.add] (com suporte a quebras de linha) =====
    const addRegex = /\[mem\.add(?::([^\]]*))?\]([\s\S]*?)\[\/mem\.add\]/gi;
    let match;
    while ((match = addRegex.exec(responseText)) !== null) {
        const sector = (match[1] || "").trim().toUpperCase() || null;
        const content = (match[2] || "").trim().replace(/\n/g, ' ');
        if (content) {
            memoryCommands.push({ action: 'add', sector, content });
            console.log("📝 [Memory] ADD:", sector, "->", content);
        }
    }

    // ===== EXTRAIR TAGS [mem.remove] =====
    const removeRegex = /\[mem\.remove(?::([^\]]*))?\]([\s\S]*?)\[\/mem\.remove\]/gi;
    while ((match = removeRegex.exec(responseText)) !== null) {
        const sector = (match[1] || "").trim().toUpperCase() || null;
        const content = (match[2] || "").trim().replace(/\n/g, ' ');
        if (content) {
            memoryCommands.push({ action: 'remove', sector, content });
            console.log("🗑️ [Memory] REMOVE:", sector, "->", content);
        }
    }

    // ===== EXTRAIR TAGS [mem.edit] =====
    const editRegex = /\[mem\.edit(?::([^\]]*))?\]([\s\S]*?)\[\/mem\.edit\]/gi;
    while ((match = editRegex.exec(responseText)) !== null) {
        const sector = (match[1] || "").trim().toUpperCase() || null;
        const content = (match[2] || "").trim().replace(/\n/g, ' ');
        if (content) {
            memoryCommands.push({ action: 'edit', sector, content });
            console.log("✏️ [Memory] EDIT:", sector, "->", content);
        }
    }

    // ===== EXTRAIR TAGS [mem.clear] =====
    const clearRegex = /\[mem\.clear\]([\s\S]*?)\[\/mem\.clear\]/gi;
    while ((match = clearRegex.exec(responseText)) !== null) {
        const content = (match[1] || "").trim();
        memoryCommands.push({ action: 'clear', content: content || 'ALL' });
        console.log("🧹 [Memory] CLEAR:", content || 'ALL');
    }

    // ===== TAG ESPECIAL [LIMPAR_MEMORIA] =====
    if (/\[(LIMPAR_MEMORIA|CLEAR_MEMORY|APAGAR_TUDO)\]/gi.test(responseText)) {
        memoryCommands.push({ action: 'clear', content: 'ALL' });
        console.log("🔴 [Memory] WIPE ALL");
    }

    // ===== LIMPAR TODAS AS TAGS DO TEXTO (ULTRA AGRESSIVO) =====
    // 1. Tags completas [mem.xxx:YYY]...[/mem.xxx] - com setor
    cleaned = cleaned.replace(/\[mem\.(add|remove|edit|clear):[^\]]*\][\s\S]*?\[\/mem\.\1\]/gi, "");
    
    // 2. Tags completas [mem.xxx]...[/mem.xxx] - sem setor  
    cleaned = cleaned.replace(/\[mem\.(add|remove|edit|clear)\][\s\S]*?\[\/mem\.\1\]/gi, "");
    
    // 3. FALLBACK NUCLEAR: qualquer [mem...] até [/mem...]
    cleaned = cleaned.replace(/\[mem[^\]]*\][\s\S]*?\[\/mem[^\]]*\]/gi, "");
    
    // 4. Tags órfãs sobrando
    cleaned = cleaned.replace(/\[mem[^\]]*\]/gi, "");
    cleaned = cleaned.replace(/\[\/mem[^\]]*\]/gi, "");
    
    // Remover tags especiais
    cleaned = cleaned.replace(/\[(LIMPAR_MEMORIA|CLEAR_MEMORY|APAGAR_TUDO)\]/gi, "");
    
    // Limpar linhas vazias extras no final
    cleaned = cleaned.replace(/\n\s*\n\s*$/g, "\n");
    cleaned = cleaned.replace(/\s+$/g, "");

    // ===== COMPATIBILIDADE COM SISTEMA ANTIGO [[MEMORY]] =====
    const oldRegex = /\[\[MEMORY\]\]([\s\S]*?)\[\[\/MEMORY\]\]/gi;
    const memories = [];
    while ((match = oldRegex.exec(responseText)) !== null) {
        const mem = (match[1] || "").trim();
        if (mem) memories.push(mem);
    }
    cleaned = cleaned.replace(oldRegex, "");
    cleaned = cleaned.replace(/\[\[MEMORY\]\][\s\S]*$/gi, "");

    return { cleanedText: cleaned.trim(), memories, memoryCommands };
}

// ===== SISTEMA DE PROCESSAMENTO DE COMANDOS DE MEMÓRIA =====

// Setores padrão da memória
const MEMORY_SECTORS = {
    'IDENTIDADE': '👤 IDENTIDADE',
    'TRABALHO': '💼 PROFISSÃO/ESTUDOS',
    'PROFISSÃO': '💼 PROFISSÃO/ESTUDOS',
    'ESTUDOS': '💼 PROFISSÃO/ESTUDOS',
    'RELACIONAMENTOS': '❤️ RELACIONAMENTOS',
    'GOSTOS': '⭐ GOSTOS',
    'NÃO GOSTA': '🚫 NÃO GOSTA',
    'PREFERÊNCIAS': '💭 PERSONALIDADE',
    'PREFERENCIA': '💭 PERSONALIDADE',
    'PERSONALIDADE': '💭 PERSONALIDADE',
    'LEMBRAR': '📌 LEMBRAR'
};

// Detectar setor a partir do conteúdo
function detectSector(content) {
    const contentUpper = content.toUpperCase();

    // Verificar se já tem um emoji de setor
    for (const [key, value] of Object.entries(MEMORY_SECTORS)) {
        if (contentUpper.includes(key) || content.includes(value)) {
            return value;
        }
    }

    // Detectar por palavras-chave
    if (/\b(nome|idade|localização|idioma|nascimento|aniversário)\b/i.test(content)) {
        return MEMORY_SECTORS['IDENTIDADE'];
    }
    if (/\b(trabalho|trabalha|profissão|cargo|empresa|estudante|estuda|faculdade|escola|curso)\b/i.test(content)) {
        return MEMORY_SECTORS['PROFISSÃO'];
    }
    if (/\b(namorad[oa]|casad[oa]|esposa|marido|noiv[oa]|filh[oa]|mãe|pai|irmã[oa]|família|pet|cachorro|gato|amigo)\b/i.test(content)) {
        return MEMORY_SECTORS['RELACIONAMENTOS'];
    }
    if (/\b(gosta|adora|ama|curte|favorit[oa]|hobby|interesse)\b/i.test(content)) {
        return MEMORY_SECTORS['GOSTOS'];
    }
    if (/\b(não gosta|odeia|detesta|evita|não curte|não suporta)\b/i.test(content)) {
        return MEMORY_SECTORS['NÃO GOSTA'];
    }
    if (/\b(personalidade|jeito|característica|humor|temperamento|tímid[oa]|extrovertid[oa])\b/i.test(content)) {
        return MEMORY_SECTORS['PERSONALIDADE'];
    }
    if (/\b(lembrar|lembre|guardar|anotar|não esquecer)\b/i.test(content)) {
        return MEMORY_SECTORS['LEMBRAR'];
    }

    // Default: LEMBRAR
    return MEMORY_SECTORS['LEMBRAR'];
}

// Parsear memória existente em setores
function parseMemoryToSectors(memoryText) {
    if (!memoryText) return {};

    const sectors = {};
    const lines = memoryText.split('\n');
    let currentSector = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Verificar se é um cabeçalho de setor
        let isSectorHeader = false;
        for (const [key, value] of Object.entries(MEMORY_SECTORS)) {
            if (trimmedLine.includes(value) || trimmedLine.toUpperCase().includes(key)) {
                currentSector = value;
                if (!sectors[currentSector]) {
                    sectors[currentSector] = [];
                }
                isSectorHeader = true;
                break;
            }
        }

        // Se não é cabeçalho e temos um setor atual, adicionar item
        if (!isSectorHeader && currentSector) {
            // Remover bullet se existir
            const cleanedLine = trimmedLine.replace(/^[•\-\*]\s*/, '').trim();
            if (cleanedLine) {
                sectors[currentSector].push(cleanedLine);
            }
        }
    }

    return sectors;
}

// Reconstruir texto da memória a partir dos setores
// Formato com quebras de linha entre setores e entre itens
function sectorsToMemoryText(sectors) {
    const sectorOrder = [
        '👤 IDENTIDADE',
        '💼 PROFISSÃO/ESTUDOS',
        '❤️ RELACIONAMENTOS',
        '⭐ GOSTOS',
        '🚫 NÃO GOSTA',
        '💭 PERSONALIDADE',
        '📌 LEMBRAR'
    ];

    let result = [];

    for (const sector of sectorOrder) {
        if (sectors[sector] && sectors[sector].length > 0) {
            result.push(sector);
            result.push(''); // Linha em branco após título do setor
            for (const item of sectors[sector]) {
                result.push('• ' + item);
                result.push(''); // Linha em branco entre cada item
            }
            result.push(''); // Linha em branco extra entre setores
        }
    }

    // Limpar linhas em branco extras no final
    return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Processar comandos de memória
function processMemoryCommands(commands, messageId) {
    if (!commands || commands.length === 0) return;

    // Verificar se está em modo temporário
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && conv.isTemporary) {
        console.log("Modo temporário ativo - comandos de memória ignorados");
        return;
    }

    // Carregar memória atual
    const currentMem = loadUserMemory();
    let sectors = parseMemoryToSectors(currentMem ? currentMem.text : '');

    for (const cmd of commands) {
        switch (cmd.action) {
            case 'add': {
                // Setor pode vir da tag [mem.add:SETOR] ou ser detectado automaticamente
                const content = cmd.content;
                let sector, value;

                // Se setor foi especificado na tag, usar ele
                if (cmd.sector) {
                    // Mapear setor da tag para o formato com emoji
                    let foundSector = null;
                    for (const [key, val] of Object.entries(MEMORY_SECTORS)) {
                        if (cmd.sector.includes(key)) {
                            foundSector = val;
                            break;
                        }
                    }
                    sector = foundSector || MEMORY_SECTORS['LEMBRAR'];
                    value = content;
                } else {
                    // Fallback: detectar setor automaticamente pelo conteúdo
                    sector = detectSector(content);
                    value = content;
                }

                // Limpar o valor de prefixos de setor se existirem
                for (const sectorName of Object.values(MEMORY_SECTORS)) {
                    value = value.replace(new RegExp(`^${sectorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
                }
                value = value.replace(/^[•\-\*]\s*/, '').trim();

                if (!sectors[sector]) {
                    sectors[sector] = [];
                }
                // Evitar duplicatas
                if (value && !sectors[sector].some(item => item.toLowerCase() === value.toLowerCase())) {
                    sectors[sector].push(value);
                }
                break;
            }

            case 'remove': {
                // Remover item que contenha o texto especificado
                const searchText = cmd.content.toLowerCase();
                for (const sector of Object.keys(sectors)) {
                    sectors[sector] = sectors[sector].filter(item =>
                        !item.toLowerCase().includes(searchText)
                    );
                    // Remover setor se ficou vazio
                    if (sectors[sector].length === 0) {
                        delete sectors[sector];
                    }
                }
                break;
            }

            case 'edit': {
                // Formato: antigo -> novo
                const parts = cmd.content.split('->').map(p => p.trim());
                if (parts.length === 2) {
                    const oldText = parts[0].toLowerCase();
                    const newText = parts[1];

                    for (const sector of Object.keys(sectors)) {
                        sectors[sector] = sectors[sector].map(item => {
                            if (item.toLowerCase().includes(oldText)) {
                                return newText;
                            }
                            return item;
                        });
                    }
                }
                break;
            }

            case 'clear': {
                const clearTarget = (cmd.content || '').toUpperCase().trim();
                console.log("🧹 Comando CLEAR recebido:", clearTarget);

                if (clearTarget === 'ALL' || clearTarget === 'TUDO' || clearTarget === '') {
                    // Limpar TODA a memória
                    console.log("🗑️ Limpando TODA a memória!");
                    sectors = {};
                } else {
                    // Limpar setor específico
                    for (const [key, value] of Object.entries(MEMORY_SECTORS)) {
                        if (clearTarget.includes(key)) {
                            console.log("🗑️ Limpando setor:", value);
                            delete sectors[value];
                            break;
                        }
                    }
                }
                break;
            }
        }
    }

    // Salvar memória atualizada
    const newMemoryText = sectorsToMemoryText(sectors);

    if (messageId) {
        appendUserMemory(newMemoryText, messageId);
    } else {
        saveUserMemory({
            text: newMemoryText,
            messageId: messageId || null
        });
    }
}

// ===== FAVORITOS =====
function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.warn("Falha ao salvar favoritos:", e);
    }
}

function loadFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function addFavorite(messageId, text, chatId, chatTitle, imageData = null) {
    if (!messageId || !text) return;
    const favorites = loadFavorites();
    if (favorites.some(f => f.messageId === messageId)) return;

    const favData = {
        messageId,
        text: text.substring(0, 500),
        chatId,
        chatTitle: chatTitle || "Chat sem título",
        timestamp: Date.now()
    };

    // Adicionar dados da imagem gerada se houver
    if (imageData && imageData.imageUrl) {
        favData.isImageGeneration = true;
        favData.generatedImageUrl = imageData.imageUrl;
        favData.generatedPrompt = imageData.prompt;
    }

    favorites.push(favData);
    saveFavorites(favorites);
    renderFavorites();
}

function removeFavorite(messageId) {
    let favorites = loadFavorites();
    favorites = favorites.filter(f => f.messageId !== messageId);
    saveFavorites(favorites);
    renderFavorites();
    renderMessages();
}

function isFavorited(messageId) {
    if (!messageId) return false;
    const favorites = loadFavorites();
    return favorites.some(f => f.messageId === messageId);
}

function toggleFavorite(messageId, text, chatId, chatTitle, imageData = null) {
    if (isFavorited(messageId)) {
        removeFavorite(messageId);
    } else {
        addFavorite(messageId, text, chatId, chatTitle, imageData);
    }
    renderMessages();
}

function chatHasFavorites(chatId) {
    if (!chatId) return false;
    const favorites = loadFavorites();
    return favorites.some(f => f.chatId === chatId);
}

function removeFavoritesByChatId(chatId) {
    if (!chatId) return;
    let favorites = loadFavorites();
    const originalLength = favorites.length;
    favorites = favorites.filter(f => f.chatId !== chatId);
    if (favorites.length !== originalLength) {
        saveFavorites(favorites);
        renderFavorites();
    }
}

// Função para extrair contexto de outros chats
function getOtherChatsContext() {
    const otherChats = conversations.filter(c =>
        c.id !== currentConversationId &&
        !c.isTemporary &&
        c.messages &&
        c.messages.length > 0
    );

    if (otherChats.length === 0) return "";

    const recentChats = otherChats.slice(-5);
    let context = "CONTEXTO DE CONVERSAS ANTERIORES (use para referência se relevante):\n\n";

    recentChats.forEach((chat) => {
        const title = chat.title || "Chat sem título";
        const recentMessages = chat.messages.slice(-6);

        if (recentMessages.length > 0) {
            context += `--- ${title} ---\n`;
            recentMessages.forEach(msg => {
                const role = msg.role === "user" ? "Usuário" : "Neo";
                const text = msg.text.length > 200
                    ? msg.text.substring(0, 200) + "..."
                    : msg.text;
                context += `${role}: ${text}\n`;
            });
            context += "\n";
        }
    });

    return context;
}

// ===== CONTROLE DE TOKENS DIÁRIOS =====
function loadTokenUsage() {
    try {
        const raw = localStorage.getItem(TOKEN_USAGE_KEY);
        if (!raw) return { tokensUsed: 0, lastReset: Date.now(), dailyLimit: 0, resetHour: 0 };
        return JSON.parse(raw);
    } catch {
        return { tokensUsed: 0, lastReset: Date.now(), dailyLimit: 0, resetHour: 0 };
    }
}

function saveTokenUsage(usage) {
    try {
        localStorage.setItem(TOKEN_USAGE_KEY, JSON.stringify(usage));
    } catch (e) {
        console.warn("Falha ao salvar uso de tokens:", e);
    }
}

function getNextResetTime(resetHour) {
    const now = new Date();
    const reset = new Date(now);
    reset.setHours(resetHour, 0, 0, 0);

    // Se já passou da hora de reset hoje, próximo reset é amanhã
    if (now >= reset) {
        reset.setDate(reset.getDate() + 1);
    }

    return reset.getTime();
}

function checkAndResetTokens() {
    const usage = loadTokenUsage();
    const now = new Date();
    const lastResetDate = new Date(usage.lastReset);
    const resetHour = usage.resetHour || 0;

    // Criar data de reset para comparação
    const todayReset = new Date(now);
    todayReset.setHours(resetHour, 0, 0, 0);

    // Se o último reset foi antes do horário de reset de hoje e agora já passou esse horário
    if (lastResetDate < todayReset && now >= todayReset) {
        usage.tokensUsed = 0;
        usage.lastReset = Date.now();
        saveTokenUsage(usage);
        console.log("✅ Tokens diários resetados!");
    }

    return usage;
}

function addTokensUsed(tokens) {
    const usage = checkAndResetTokens();
    usage.tokensUsed = (usage.tokensUsed || 0) + tokens;
    saveTokenUsage(usage);
    updateTokenUsageUI();
    return usage;
}

function isTokenLimitExceeded() {
    const usage = checkAndResetTokens();
    const tokensUsed = usage?.tokensUsed || 0;
    const dailyLimit = usage?.dailyLimit || 0;
    if (dailyLimit <= 0) return false; // Sem limite
    return tokensUsed >= dailyLimit;
}

function getTokenLimitMessage() {
    const usage = loadTokenUsage();
    const tokensUsed = usage?.tokensUsed || 0;
    const dailyLimit = usage?.dailyLimit || 0;
    const resetHour = usage?.resetHour || 0;
    const nextReset = getNextResetTime(resetHour);
    const resetDate = new Date(nextReset);
    const timeStr = resetDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `⚠️ **Limite diário de tokens excedido!**\n\n` +
        `Você usou **${tokensUsed.toLocaleString()}** tokens hoje.\n` +
        `O limite configurado é de **${dailyLimit.toLocaleString()}** tokens.\n\n` +
        `🕐 O contador será resetado às **${timeStr}**.\n\n` +
        `💎 *Aguarde o reset ou assine o **NEO Pro** para uso ilimitado!*`;
}

function updateTokenUsageUI() {
    const usage = checkAndResetTokens();
    
    // Garantir valores válidos
    const tokensUsed = usage?.tokensUsed || 0;
    const dailyLimit = usage?.dailyLimit || 0;
    
    const tokenUsedCount = document.getElementById('tokenUsedCount');
    const tokenLimitCount = document.getElementById('tokenLimitCount');
    const tokenUsageFill = document.getElementById('tokenUsageFill');
    const historyTokenUsageFill = document.getElementById('historyTokenUsageFill');
    const tokenResetTime = document.getElementById('tokenResetTime');

    if (tokenUsedCount) {
        tokenUsedCount.textContent = tokensUsed.toLocaleString();
    }

    if (tokenLimitCount) {
        tokenLimitCount.textContent = dailyLimit > 0
            ? dailyLimit.toLocaleString()
            : '∞';
    }

    // Atualizar ambas as barras (código fonte e histórico)
    const fillBars = [tokenUsageFill, historyTokenUsageFill].filter(Boolean);

    fillBars.forEach(fillBar => {
        // Usar limite definido ou um limite visual padrão de 200k para mostrar progresso
        const effectiveLimit = dailyLimit > 0 ? dailyLimit : 200000;
        const percentage = Math.min((tokensUsed / effectiveLimit) * 100, 100);
        fillBar.style.width = percentage + '%';

        // Mudar cor baseado no uso (só quando há limite real)
        fillBar.classList.remove('warning', 'danger', 'exceeded');
        if (dailyLimit > 0) {
            if (percentage >= 100) {
                fillBar.classList.add('exceeded');
            } else if (percentage >= 80) {
                fillBar.classList.add('danger');
            } else if (percentage >= 60) {
                fillBar.classList.add('warning');
            }
        }
    });

    if (tokenResetTime) {
        const resetHour = usage.resetHour || 0;
        const nextReset = getNextResetTime(resetHour);
        const now = Date.now();
        const diff = nextReset - now;

        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            tokenResetTime.textContent = `Reinicia em: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }
}

function resetTokensNow() {
    const usage = loadTokenUsage();
    usage.tokensUsed = 0;
    usage.lastReset = Date.now();
    saveTokenUsage(usage);
    updateTokenUsageUI();
    console.log("✅ Tokens resetados manualmente!");
}

function setDailyTokenLimit(limit) {
    const usage = loadTokenUsage();
    usage.dailyLimit = Math.max(0, parseInt(limit) || 0);
    saveTokenUsage(usage);
    updateTokenUsageUI();
}

function setTokenResetHour(hourValue) {
    const usage = loadTokenUsage();
    const hour = parseInt(hourValue) || 0;
    usage.resetHour = Math.max(0, Math.min(23, hour));
    saveTokenUsage(usage);
    updateTokenUsageUI();
}
