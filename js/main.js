// ===== NEO AI CHAT - SCRIPT PRINCIPAL =====
// Este arquivo coordena todos os módulos e inicializa o app

// Flag para impedir popstate de executar logo após backbutton
var backButtonHandled = false;

// ===== PREVENIR FECHAMENTO DO TECLADO =====
// Botões que não devem tirar foco do textarea
// NOTA: Botões dentro do sidebar de anexos (attachFileBtn, attachCameraBtn, etc.)
// NÃO devem estar aqui pois o preventDefault no touchstart bloqueia o scroll!
(function () {
    // Apenas botões FORA do sidebar de anexos
    const noBlurIds = ['attachBtn', 'micBtn', 'sendCallBtn'];

    document.addEventListener('DOMContentLoaded', function () {
        noBlurIds.forEach(function (id) {
            const btn = document.getElementById(id);
            if (btn) {
                // Touchstart com passive: false para poder usar preventDefault
                btn.addEventListener('touchstart', function (e) {
                    e.preventDefault();
                    // Dispara o click manualmente
                    btn.click();
                }, { passive: false });

                // Mousedown para desktop
                btn.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                });
            }
        });
    });
})();

// Aguardar Cordova estar pronto (isCordovaReady declarado em config.js)
document.addEventListener('deviceready', function () {
    console.log('✓ Cordova está pronto');
    isCordovaReady = true;
    initMic();

    // Configurar listeners de segundo plano para continuar processamento
    initBackgroundHandlers();
    
    // Configurar listeners de conexão de rede
    initNetworkListeners();
    
    // Configurar botão voltar do Android (funciona apenas em Cordova)
    document.addEventListener('backbutton', handleBackButton, false);
}, false);

// Listener de tecla Escape para simular botão voltar no navegador/desktop
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        handleBackButton(e);
    }
});

// ===== LISTENERS DE REDE - DETECTAR OFFLINE/ONLINE =====
let wasOffline = false; // Flag para saber se estava offline antes

function initNetworkListeners() {
    // Verificar estado inicial (sem mostrar toast)
    wasOffline = !isNetworkOnline();
    
    // Listener quando fica offline
    document.addEventListener('offline', function() {
        console.log('📴 Sem conexão com a internet');
        wasOffline = true;
        
        // Trocar automaticamente para modo offline se configurado
        if (typeof handleNetworkChange === 'function') {
            handleNetworkChange(false);
        }
        
        showNetworkStatus(false);
    }, false);
    
    // Listener quando volta online
    document.addEventListener('online', function() {
        console.log('📶 Conectado à internet');
        
        // Trocar automaticamente para modo online se configurado
        if (typeof handleNetworkChange === 'function') {
            handleNetworkChange(true);
        }
        
        // Só mostra toast se estava offline antes (não na abertura do app)
        if (wasOffline) {
            showNetworkStatus(true);
        }
        wasOffline = false;
    }, false);
    
    // Verificar estado inicial - só mostra se estiver offline
    setTimeout(() => {
        if (!isNetworkOnline()) {
            showNetworkStatus(false);
        }
        // Não mostra toast de "conectado" na abertura do app
    }, 2000);
}

// Mostrar status da rede com toast premium
function showNetworkStatus(isOnline) {
    // Verificar se está em modo automático (ambos habilitados)
    const isAutoMode = typeof shouldUseOfflineMode === 'function' && 
                       typeof offlineModeEnabled !== 'undefined' && 
                       typeof onlineModeEnabled !== 'undefined';
    
    if (isOnline) {
        // Verificar se trocou automaticamente para online
        const hasOfflineCapability = typeof isLocalLlmActive === 'function';
        if (hasOfflineCapability && isAutoMode) {
            showToast('Conectado - Usando modo Online', 'success');
        } else {
            showToast('Conectado à internet', 'success');
        }
    } else {
        // Verificar se tem modelo local ativo
        const hasLocalModel = typeof isLocalLlmActive === 'function' && isLocalLlmActive();
        
        if (hasLocalModel) {
            showToast('Sem internet - Usando modo Offline', 'warning');
        } else {
            // Tentar ativar modo offline automaticamente se tiver modelo baixado
            if (typeof activateOfflineFallback === 'function') {
                const activated = activateOfflineFallback();
                if (activated) {
                    showToast('Sem internet - Modo Offline ativado', 'warning');
                    return;
                }
            }
            showToast('Sem conexão com a internet', 'error');
        }
    }
}

// Handler do botão voltar do Android
function handleBackButton(e) {
    e.preventDefault();
    
    // Marcar que o backbutton está sendo tratado para evitar popstate duplicado
    backButtonHandled = true;
    setTimeout(function() { backButtonHandled = false; }, 100);
    
    // ===== MODAIS DE TELA CHEIA (prioridade máxima) =====
    
    // Preview de imagem em tela cheia
    var imagePreviewModal = document.querySelector('.image-preview-modal');
    if (imagePreviewModal) {
        console.log('[BackButton] Fechando Image Preview');
        imagePreviewModal.remove();
        return;
    }
    
    // Modal de edição de imagem
    var imageEditModal = document.getElementById('imageEditModal');
    if (imageEditModal) {
        console.log('[BackButton] Fechando Image Edit Modal');
        imageEditModal.classList.remove('visible');
        setTimeout(() => imageEditModal.remove(), 300);
        return;
    }
    
    // Voice Call / Chamada de voz
    var voiceCallOverlay = document.getElementById('voiceCallOverlay');
    if (voiceCallOverlay && voiceCallOverlay.classList.contains('show')) {
        console.log('[BackButton] Fechando Voice Call');
        if (typeof endVoiceCall === 'function') endVoiceCall();
        return;
    }
    
    // Code Studio
    var codeStudioModal = document.getElementById('codeStudioModal');
    if (codeStudioModal && codeStudioModal.classList.contains('show')) {
        console.log('[BackButton] Fechando Code Studio');
        if (closeCodeStudio) closeCodeStudio();
        return;
    }
    
    // Video Studio
    var videoStudioModal = document.getElementById('videoStudioModal');
    if (videoStudioModal && videoStudioModal.classList.contains('show')) {
        console.log('[BackButton] Fechando Video Studio');
        if (typeof closeVideoStudio === 'function') closeVideoStudio();
        return;
    }
    
    // Image Studio
    var imageStudioModal = document.getElementById('imageStudioModal');
    if (imageStudioModal && imageStudioModal.classList.contains('show')) {
        console.log('[BackButton] Fechando Image Studio');
        if (typeof closeImageStudio === 'function') closeImageStudio();
        return;
    }
    
    // Conversor de Arquivos
    var converterModal = document.getElementById('converterModal');
    if (converterModal && converterModal.classList.contains('show')) {
        console.log('[BackButton] Fechando Converter');
        if (window.closeConverter) window.closeConverter();
        return;
    }
    
    // Modal de transcrição individual (usa classe 'open')
    var transcriptionModal = document.getElementById('transcriptionModal');
    if (transcriptionModal && transcriptionModal.classList.contains('open')) {
        console.log('[BackButton] Fechando Transcription Modal');
        if (window.closeTranscriptionModal) window.closeTranscriptionModal();
        return;
    }
    
    // Página de transcrições/gravador (usa aria-hidden)
    var transcriptionPage = document.getElementById('transcriptionPage');
    if (transcriptionPage && transcriptionPage.getAttribute('aria-hidden') === 'false') {
        console.log('[BackButton] Fechando Transcription Page');
        if (window.closeTranscriptionPage) window.closeTranscriptionPage();
        return;
    }
    
    // Histórico de transcrições (usa classe no body)
    if (document.body.classList.contains('transcriptions-history-open')) {
        console.log('[BackButton] Fechando Transcriptions History');
        if (window.closeTranscriptionsHistory) window.closeTranscriptionsHistory();
        return;
    }
    
    // ===== SIDEBARS E MODAIS MENORES =====
    
    // Sidebar de configuração de IA (LLM)
    var llmSidebar = document.getElementById('local-llm-sidebar');
    if (llmSidebar && llmSidebar.classList.contains('open')) {
        if (typeof closeLocalLlmModal === 'function') closeLocalLlmModal();
        return;
    }
    
    // Se estiver em modo de edição de mensagem, sair do modo edição
    if (document.body.classList.contains('editing-message')) {
        if (typeof exitEditingMessage === 'function') {
            exitEditingMessage();
            return;
        }
    }

    // Sidebar de anexos
    const attachMenu = document.getElementById('attachMenu');
    if (attachMenu && attachMenu.classList.contains('open')) {
        if (typeof closeAttachMenu === 'function') closeAttachMenu(true);
        return;
    }

    // Modal de memória
    const memoryEditorModal = document.getElementById('memoryEditorModal');
    if (memoryEditorModal && memoryEditorModal.getAttribute('aria-hidden') === 'false') {
        memoryEditorModal.setAttribute('aria-hidden', 'true');
        return;
    }

    // Modal de seleção de fonte
    const fontModal = document.getElementById('fontSelectorModal');
    if (fontModal && fontModal.classList.contains("open")) {
        if (typeof closeFontModal === 'function') closeFontModal();
        return;
    }

    // Modal de senha PIN
    const codePasswordOverlay = document.getElementById('codePasswordOverlay');
    if (codePasswordOverlay && codePasswordOverlay.classList.contains("open")) {
        if (typeof closeCodePasswordModalDirect === 'function') closeCodePasswordModalDirect();
        return;
    }

    // Fechar editor de nota primeiro
    const noteEditorOverlay = document.getElementById('noteEditorOverlay');
    if (noteEditorOverlay && noteEditorOverlay.classList.contains('open')) {
        if (typeof saveCurrentNote === 'function') saveCurrentNote();
        return;
    }

    // Fechar tela de anotações
    if (document.body.classList.contains('notes-open')) {
        if (typeof closeNotes === 'function') closeNotes();
        return;
    }

    // Fechar sidebar de modos (personas)
    if (document.body.classList.contains('personas-open')) {
        if (typeof closePersonaModal === 'function') closePersonaModal();
        return;
    }

    // Fechar configurações
    if (document.body.classList.contains("settings-open")) {
        document.body.classList.remove("settings-open");
        return;
    }
    
    // Fechar sidebar de chats
    if (document.body.classList.contains("chats-open")) {
        document.body.classList.remove("chats-open");
        return;
    }

    // Lógica de saída do app com toast
    if (typeof exitToastActive !== 'undefined' && exitToastActive) {
        // Segundo clique - sair do app
        if (typeof hideExitToast === 'function') hideExitToast();
        if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        }
        return;
    }

    // Primeiro clique - mostrar toast
    if (typeof showExitToast === 'function') {
        showExitToast();
    }
}

// ===== BACKGROUND MODE - CONTINUAR RESPOSTAS EM SEGUNDO PLANO =====
let isInBackground = false;
let backgroundTaskActive = false;

function initBackgroundHandlers() {
    // Configurar plugin de background mode
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
        const bgMode = window.cordova.plugins.backgroundMode;
        
        // Configurar notificação de segundo plano
        bgMode.setDefaults({
            title: 'Neo AI',
            text: 'Processando em segundo plano...',
            icon: 'ic_launcher',
            color: '667eea',
            resume: true,
            hidden: false,
            bigText: false,
            silent: true
        });

        // Desabilitar otimizações de bateria (mantém app rodando)
        bgMode.disableBatteryOptimizations();
        
        // Desabilitar WebView pausada em segundo plano
        bgMode.disableWebViewOptimizations();
        
        // Permitir rodar em segundo plano sem restrições
        bgMode.on('activate', function() {
            console.log('🔋 Background mode ativado');
            // Desbloquear modo de economia (Android)
            bgMode.disableWebViewOptimizations();
        });
        
        bgMode.on('deactivate', function() {
            console.log('🔋 Background mode desativado');
        });
        
        console.log('✅ Background mode configurado');
    }

    // Listener para quando o app vai para segundo plano
    document.addEventListener('pause', function () {
        console.log('📱 App pausado (segundo plano)');
        isInBackground = true;

        // Verificar se tem tarefas ativas (streaming, download, geração)
        const hasActiveTasks = 
            (typeof isSending !== 'undefined' && isSending) ||
            (typeof localLlmState !== 'undefined' && localLlmState.currentDownloadId) ||
            (typeof localLlmState !== 'undefined' && localLlmState.isGenerating) ||
            (window._streamingState && window._streamingState.isActive);

        if (hasActiveTasks) {
            backgroundTaskActive = true;
            console.log('🔄 Tarefas ativas - habilitando segundo plano');

            // Ativar modo background
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
                window.cordova.plugins.backgroundMode.enable();
            }
        }
    }, false);

    // Listener para quando o app volta para primeiro plano
    document.addEventListener('resume', function () {
        console.log('📱 App retomado (primeiro plano)');
        isInBackground = false;

        // Sincronizar UI do streaming se estava gerando em background
        if (typeof window.syncStreamingUI === 'function') {
            setTimeout(() => {
                window.syncStreamingUI();
            }, 50);
        }

        // Verificar se ainda tem tarefas ativas
        const hasActiveTasks = 
            (typeof isSending !== 'undefined' && isSending) ||
            (typeof localLlmState !== 'undefined' && localLlmState.currentDownloadId) ||
            (typeof localLlmState !== 'undefined' && localLlmState.isGenerating) ||
            (window._streamingState && window._streamingState.isActive);

        // Desabilitar modo background se não há mais tarefas
        if (!hasActiveTasks && window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
            window.cordova.plugins.backgroundMode.disable();
            backgroundTaskActive = false;
        }

        // Atualizar UI se necessário
        if (typeof renderMessages === 'function') {
            setTimeout(renderMessages, 100);
        }
        
        // Atualizar UI de download local se estava baixando
        if (typeof updateLocalLlmUI === 'function') {
            setTimeout(updateLocalLlmUI, 100);
        }
    }, false);
}

// Função para marcar fim da geração (chamada quando resposta completa)
function onGenerationComplete() {
    backgroundTaskActive = false;

    // Desabilitar modo background se app está em primeiro plano
    if (!isInBackground && window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
        window.cordova.plugins.backgroundMode.disable();
    }
}

// Expor funções globalmente
window.onGenerationComplete = onGenerationComplete;
window.isInBackground = () => isInBackground;

// Função para aguardar aceite dos termos
function waitForTermsAcceptance() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (localStorage.getItem('neo_terms_accepted_v1')) {
                clearInterval(checkInterval);
                console.log('✅ Termos aceitos!');
                resolve();
            }
        }, 500);
    });
}

// ===== INICIALIZAÇÃO =====
async function initApp() {
    // Inicializar sistema de ID do usuário
    if (typeof initUserIdSystem === 'function') {
        initUserIdSystem();
    }

    // IMPORTANTE: Aguardar termos serem aceitos ANTES de verificar acesso
    const termsAccepted = localStorage.getItem('neo_terms_accepted_v1');
    if (!termsAccepted) {
        // Termos não aceitos - aguardar aceite antes de continuar
        console.log('⏳ Aguardando aceite dos termos...');
        await waitForTermsAcceptance();
    }

    // CONFIGURAÇÃO DE API: Mostrar tela de setup (não bloqueia mais!)
    // O usuário pode pular e configurar depois
    if (typeof waitForApiSetup === 'function' && typeof isApiSetupDone === 'function') {
        if (!isApiSetupDone()) {
            console.log('🔑 Mostrando tela de configuração de API (pode pular)...');
            await waitForApiSetup();
        }
    }

    // VERIFICAR ATUALIZAÇÃO: Antes de tudo, verificar se há atualização obrigatória
    if (typeof initUpdateCheck === 'function') {
        const isUpToDate = await initUpdateCheck();
        if (!isUpToDate) {
            console.log('⚠️ Atualização obrigatória pendente - app bloqueado');
            return; // Para a inicialização aqui
        }
    }

    // Verificar acesso do usuário (sistema de bloqueio remoto)
    if (typeof initAccessControl === 'function') {
        await initAccessControl();
        
        const userId = getUserId();
        
        // Exibir ID na tela de bloqueio
        const blockedIdDisplay = document.getElementById('blockedIdDisplay');
        if (blockedIdDisplay) {
            blockedIdDisplay.textContent = userId;
        }
        
        // Configurar botão de WhatsApp com link
        const requestAccessBtn = document.getElementById('requestAccessBtn');
        if (requestAccessBtn) {
            const whatsappNumber = '5519996370701';
            const message = encodeURIComponent(`Gostaria de acessar o NEO, meu ID é: ${userId}`);
            requestAccessBtn.href = `https://wa.me/${whatsappNumber}?text=${message}`;
        }
        
        // Configurar botão de verificar status com polling de 10 segundos
        const verifyStatusBtn = document.getElementById('verifyStatusBtn');
        if (verifyStatusBtn) {
            verifyStatusBtn.addEventListener('click', async () => {
                verifyStatusBtn.disabled = true;
                
                // Polling por 10 segundos (verificar a cada 1.5 segundos)
                const startTime = Date.now();
                const maxDuration = 10000; // 10 segundos
                const interval = 1500; // 1.5 segundos entre cada check
                let attempts = 0;
                
                const checkWithPolling = async () => {
                    attempts++;
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.ceil((maxDuration - elapsed) / 1000);
                    
                    verifyStatusBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verificando... ${remaining}s`;
                    
                    const result = await checkUserAccess();
                    
                    if (result && result.authorized) {
                        // Liberado!
                        showAccessGranted();
                        return;
                    }
                    
                    // Continuar polling se ainda não passou 10 segundos
                    if (elapsed < maxDuration) {
                        setTimeout(checkWithPolling, interval);
                    } else {
                        // Tempo esgotado
                        verifyStatusBtn.disabled = false;
                        verifyStatusBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Verificar Status';
                    }
                };
                
                checkWithPolling();
            });
        }
    }

    // Carregar cache de settings
    savedSettingsCache = loadSettings();

    // Carregar conversas
    conversations = loadConversations();

    // Carregar settings
    const savedSettings = loadSettings();
    if (savedSettings) {
        humorRange.value = savedSettings.humor;
        freedomRange.value = savedSettings.freedom;
        professionalRange.value = savedSettings.professional;
        formalidadeRange.value = savedSettings.formalidade || 5;
        memoryText.value = savedSettings.memory;
        styleCustom.value = savedSettings.styleCustom || "";
        
        // Priorizar modelo salvo em neo_selected_model (novo sistema unificado)
        const savedNeoModel = localStorage.getItem('neo_selected_model');
        if (savedNeoModel) {
            modelSelect.value = savedNeoModel;
        } else {
            modelSelect.value = savedSettings.model || DEFAULT_MODEL_NAME;
        }

        // Sincronizar chaves salvas com NeoAPI localStorage (fonte única de verdade)
        const providerKeyMap = {
            deepseek: savedSettings.apiKeysDeepseek || (savedSettings.apiKeyDeepseek ? [savedSettings.apiKeyDeepseek] : []),
            gemini: savedSettings.apiKeysGemini || (savedSettings.apiKeyGemini ? [savedSettings.apiKeyGemini] : []),
            openai: savedSettings.apiKeysOpenai || (savedSettings.apiKeyOpenai ? [savedSettings.apiKeyOpenai] : []),
            anthropic: savedSettings.apiKeysAnthropic || (savedSettings.apiKeyAnthropic ? [savedSettings.apiKeyAnthropic] : []),
            groq: savedSettings.apiKeysGroq || (savedSettings.apiKeyGroq ? [savedSettings.apiKeyGroq] : []),
            openrouter: savedSettings.apiKeysOpenrouter || (savedSettings.apiKeyOpenrouter ? [savedSettings.apiKeyOpenrouter] : [])
        };
        
        if (typeof NeoAPI !== 'undefined') {
            Object.entries(providerKeyMap).forEach(([provider, keys]) => {
                if (keys && keys.length > 0 && keys[0]) {
                    // Só escrever se NeoAPI ainda não tem a chave
                    const existing = provider === 'gemini' ? NeoAPI.getGeminiKey() : NeoAPI.getKey(provider);
                    if (!existing) {
                        NeoAPI.saveKey(provider, keys[0]);
                        console.log(`🔄 [Load] Sincronizado ${provider} de settings → NeoAPI`);
                    }
                }
            });
        }

        if (savedSettings.apiKeysSerp && savedSettings.apiKeysSerp.length > 0) {
            setApiKeysToList('serp', savedSettings.apiKeysSerp);
        }

        // Carregar configurações de voz
        const voiceProviderEl = document.getElementById('voiceProviderSelect');

        if (voiceProviderEl && savedSettings.voiceProvider) {
            voiceProviderEl.value = savedSettings.voiceProvider;
        }
        // Atualizar visibilidade das seções de voz
        updateVoiceConfigVisibility();

        bgColorPicker.value = savedSettings.bgColor || "#050014";
        currentGradient = savedSettings.bgGradient;
        if (currentGradient === undefined) {
            currentGradient = "default";
        }

        if (codeSourceText) {
            codeSourceText.value = savedSettings.codeSource || "";
            console.log("🔍 [initApp] Código fonte carregado:", savedSettings.codeSource ? `"${savedSettings.codeSource.substring(0, 100)}..."` : "(vazio)");
        } else {
            console.warn("🔍 [initApp] codeSourceText NÃO ENCONTRADO!");
        }

        if (savedSettings.secondaryColor !== undefined) {
            currentSecondaryColor = savedSettings.secondaryColor;
        }
        if (savedSettings.secondaryColorCustom) {
            secondaryColorPicker.value = savedSettings.secondaryColorCustom;
        }

        if (savedSettings.appFont) {
            currentFont = savedSettings.appFont;
        }

        if (savedSettings.themeMode) {
            currentThemeMode = savedSettings.themeMode;
        }
    } else {
        currentGradient = "default";
        currentSecondaryColor = "white";
        currentThemeMode = "dark";
        // Priorizar modelo salvo em neo_selected_model
        const savedNeoModel = localStorage.getItem('neo_selected_model');
        modelSelect.value = savedNeoModel || DEFAULT_MODEL_NAME;
        // Definir padrão para voz
        updateVoiceConfigVisibility();
    }

    // ===== CHAVES API =====
    // Não há chaves padrão - usuário deve configurar suas próprias chaves
    // As chaves são configuradas na tela de setup inicial ou nas configurações
    console.log("🔑 [Init] Nenhuma chave padrão - usuário deve configurar suas chaves");

    // Aplicar visual
    applyBackground();
    applySecondaryColor();
    applyFont();
    initSystemThemeListener(); // Inicializar listener de tema do sistema
    applyThemeMode();
    updatePresetButtonState();
    updateSecondaryPresetState();
    updateFontButtonState();
    updateThemeModeState();
    loadPasswordConfig(); // Carregar configuração de senha
    
    // Inicializar IA Local (WebLLM)
    if (typeof initLocalLlm === 'function') {
        initLocalLlm();
    }

    // Sincronizar memória
    const stored = loadUserMemory();
    if (stored && stored.text) {
        memoryText.value = stored.text;
    } else {
        const fromSettings = (savedSettings && savedSettings.memory) || "";
        if (fromSettings.trim()) {
            saveUserMemory({ text: fromSettings.trim(), messageId: null });
            memoryText.value = fromSettings.trim();
        }
    }
    saveSettings();

    // Inicializa histórico
    (function initHistoryRoot() {
        if (!history.state || !history.state.neoRoot) {
            history.replaceState({ neoRoot: true }, "");
            history.pushState({ neoIdle: true }, "");
        }
    })();

    // Criar conversa inicial
    if (conversations.length === 0) {
        createNewConversation();
    } else {
        createNewConversation();
        currentConversationId = conversations[conversations.length - 1].id;
        renderHistory();
        renderMessages();
        // Scroll para o fim do chat
        scrollChatToEnd();
    }

    // Inicializar estados
    updateSliderState();
    updatePresetButtonState();
    updateSecondaryPresetState();
    updateFontButtonState();

    // Inicializar handlers de PDF
    if (typeof initPDFHandlers === 'function') {
        initPDFHandlers();
    }

    // Inicializar handlers de Imagem
    if (typeof initImageHandlers === 'function') {
        initImageHandlers();
    }

    // Configurar botão de download dos termos
    const downloadTermsBtn = document.getElementById('downloadTermsBtn');
    if (downloadTermsBtn) {
        downloadTermsBtn.addEventListener('click', () => {
            if (typeof downloadSignedTerms === 'function') {
                downloadSignedTerms();
            }
        });
    }

    // Configurar botão de API Setup nas configurações
    const openApiSetupBtn = document.getElementById('openApiSetupBtn');
    if (openApiSetupBtn) {
        openApiSetupBtn.addEventListener('click', () => {
            console.log('🔑 Abrindo configuração de APIs...');
            if (typeof showApiSetup === 'function') {
                showApiSetup(true); // true = aberto pelas configurações (mostra botão voltar)
            }
        });
    }

    // Inicializar sistema de limite de tokens
    if (typeof checkMidnightReset === 'function') {
        checkMidnightReset();
    }
    if (typeof updateTokenDisplay === 'function') {
        updateTokenDisplay();
    }
    
    // Inicializar IA Local (PRIORIZA NATIVO llama.cpp)
    if (typeof NativeLLM !== 'undefined' && typeof NativeLLM.init === 'function') {
        NativeLLM.init().then(success => {
            if (success) {
                console.log('🚀 [Main] LLM Nativo (llama.cpp) reinicializado!');
            } else if (typeof initLocalLlm === 'function') {
                initLocalLlm();
            }
        });
    } else if (typeof initLocalLlm === 'function') {
        initLocalLlm();
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // ===== BOTÃO CANCELAR EDIÇÃO =====
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            if (typeof exitEditingMessage === 'function') {
                exitEditingMessage();
            }
        });
    }

    // ===== REDE =====
    if (networkModal) {
        networkModal.addEventListener("click", (e) => {
            if (e.target === networkModal) {
                closeNetworkModal();
            }
        });
    }

    if (btnRetryNetwork) {
        btnRetryNetwork.addEventListener("click", () => {
            if (isNetworkOnline()) {
                closeNetworkModal();
            } else {
                vibrateOnClick();
            }
        });
    }

    if (btnCloseNetwork) {
        btnCloseNetwork.addEventListener("click", () => {
            closeNetworkModal();
        });
    }

    // Listeners globais de rede
    if (typeof window.addEventListener === "function") {
        window.addEventListener("online", () => {
            console.log("Conexão restaurada");
            closeNetworkModal();
        });
        window.addEventListener("offline", () => {
            console.log("Conexão perdida");
            // Modal de rede desativado - apenas log
            showToast('Sem conexão com a internet', 'warning');
        });
    }

    // ===== TEXTAREA =====
    // Auto-expansão do textarea
    input.addEventListener('input', autoResize);

    // Inicializar tamanho
    input.style.height = '24px';
    inputWrapper.style.height = '52px';

    // ===== BOTÃO DINÂMICO (CALL/ENVIAR) =====
    // Função para atualizar estado do botão
    function updateSendCallBtn() {
        const sendCallBtn = document.getElementById('sendCallBtn');
        const sendBtnVoiceIcon = sendCallBtn ? sendCallBtn.querySelector('.send-btn-voice-icon') : null;
        const sendArrowIcon = sendCallBtn ? sendCallBtn.querySelector('.send-arrow-icon') : null;

        if (!sendCallBtn || !sendBtnVoiceIcon || !sendArrowIcon) {
            console.warn('⚠️ updateSendCallBtn: elementos não encontrados', { sendCallBtn, sendBtnVoiceIcon, sendArrowIcon });
            return;
        }

        const hasText = input.value.trim().length > 0;
        const pdfs = typeof getAttachedPDFs === 'function' ? getAttachedPDFs() : null;
        const images = typeof getAttachedImages === 'function' ? getAttachedImages() : null;
        const hasAttachments = (pdfs && pdfs.length > 0) || (images && images.length > 0);

        if (hasText || hasAttachments) {
            // Modo enviar
            sendBtnVoiceIcon.style.display = 'none';
            sendArrowIcon.style.display = 'inline-block';
            sendCallBtn.setAttribute('aria-label', 'Enviar mensagem');
            sendCallBtn.setAttribute('title', 'Enviar mensagem');
            sendCallBtn.setAttribute('type', 'submit');
        } else {
            // Modo chamada de voz
            sendBtnVoiceIcon.style.display = 'flex';
            sendArrowIcon.style.display = 'none';
            sendCallBtn.setAttribute('aria-label', 'Iniciar chamada de voz');
            sendCallBtn.setAttribute('title', 'Iniciar chamada de voz');
            sendCallBtn.setAttribute('type', 'button');
        }
    }

    // Monitorar mudanças no input
    input.addEventListener('input', updateSendCallBtn);

    // Handler do botão
    const sendCallBtnElement = document.getElementById('sendCallBtn');
    if (sendCallBtnElement) {
        sendCallBtnElement.addEventListener('click', function (e) {
            // Verificar se está no modo stop (durante geração)
            if (sendCallBtnElement.classList.contains('stop-mode')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('⏹️ Parando geração...');
                if (typeof stopGeneration === 'function') {
                    stopGeneration();
                }
                return;
            }

            const hasText = input.value.trim().length > 0;
            const pdfs = typeof getAttachedPDFs === 'function' ? getAttachedPDFs() : null;
            const images = typeof getAttachedImages === 'function' ? getAttachedImages() : null;
            const hasAttachments = (pdfs && pdfs.length > 0) || (images && images.length > 0);

            if (!hasText && !hasAttachments) {
                // Modo chamada de voz
                e.preventDefault();
                e.stopPropagation();
                console.log('📞 Iniciando chamada de voz...');
                if (typeof startVoiceCall === 'function') {
                    startVoiceCall();
                } else {
                    console.error('❌ startVoiceCall não está disponível');
                }
            }
            // Se tiver texto, o form submit será acionado normalmente
        });
        console.log('✓ Event listener adicionado ao botão sendCallBtn');
    } else {
        console.error('❌ sendCallBtn não encontrado!');
    }

    // Inicializar estado
    updateSendCallBtn();

    // Exportar função para ser chamada quando anexos mudarem
    window.updateSendCallBtn = updateSendCallBtn;

    // Enter apenas pula linha se houver texto, enviar somente pelo botão
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            const text = input.value.trim();
            if (!text) {
                e.preventDefault(); // Bloqueia pular linha se não houver texto
            }
        }
    });

    // ===== TRANSIÇÃO SUAVE PARA TECLADO =====
    let lastViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let isAnimating = false;
    let animationFrame = null;
    let lastTypedTextTop = null; // Guardar última posição conhecida
    let lastSuggestionsTop = null; // Guardar última posição das sugestões

    // Elementos que precisam de transição suave
    const typedText = document.getElementById('typed-text');
    const suggestionCards = document.getElementById('suggestion-cards');

    // Inicializar posição do texto em pixels (converter de % para px)
    function initTypedTextPosition() {
        if (typedText && !typedText.classList.contains('hidden')) {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            lastTypedTextTop = currentHeight * 0.33;
            lastViewportHeight = currentHeight;
        }
        if (suggestionCards && !suggestionCards.classList.contains('hidden')) {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            lastSuggestionsTop = currentHeight * 0.42;
        }
    }

    // Inicializar quando o documento carregar
    if (document.readyState === 'complete') {
        initTypedTextPosition();
    } else {
        window.addEventListener('load', initTypedTextPosition);
    }

    // Atualizar posição salva periodicamente quando não está animando
    setInterval(() => {
        if (!isAnimating && typedText && !typedText.classList.contains('hidden')) {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            lastTypedTextTop = currentHeight * 0.33;
            lastViewportHeight = currentHeight;
        }
        if (!isAnimating && suggestionCards && !suggestionCards.classList.contains('hidden')) {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            lastSuggestionsTop = currentHeight * 0.42;
        }
    }, 500);

    function smoothKeyboardTransition() {
        const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const heightDiff = lastViewportHeight - currentHeight; // Positivo = teclado abriu, Negativo = teclado fechou
        const absHeightDiff = Math.abs(heightDiff);

        // Se houve mudança significativa (teclado abriu/fechou - mais de 50px)
        if (absHeightDiff > 50) {

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            const isOpening = heightDiff > 0;

            // Animar texto "como posso ajudar?"
            if (typedText && !typedText.classList.contains('hidden')) {
                // Usar a posição salva anteriormente (antes do viewport mudar)
                const currentTop = lastTypedTextTop || (lastViewportHeight * 0.33);

                // Calcular nova posição alvo (33% do viewport atual)
                const targetTop = currentHeight * 0.33;

                // Fixar na posição anterior antes de animar
                typedText.style.position = 'fixed';
                typedText.style.left = '50%';
                typedText.style.top = currentTop + 'px';
                typedText.style.transform = 'translate(-50%, -50%)';
                typedText.style.transition = 'none';
                void typedText.offsetHeight;

                isAnimating = true;

                // Aplicar transição - mais rápida na subida (teclado fechando)
                const duration = isOpening ? '0.15s' : '0.12s';

                animationFrame = requestAnimationFrame(() => {
                    typedText.style.transition = `top ${duration} cubic-bezier(0.2, 0, 0.2, 1)`;
                    typedText.style.top = targetTop + 'px';

                    // Atualizar posição salva
                    lastTypedTextTop = targetTop;
                });
            }

            // Animar cards de sugestão
            if (suggestionCards && !suggestionCards.classList.contains('hidden')) {
                const currentSugTop = lastSuggestionsTop || (lastViewportHeight * 0.42);
                const targetSugTop = currentHeight * 0.42;

                suggestionCards.style.position = 'fixed';
                suggestionCards.style.left = '50%';
                suggestionCards.style.top = currentSugTop + 'px';
                suggestionCards.style.transform = 'translate(-50%, 0)';
                suggestionCards.style.transition = 'none';
                void suggestionCards.offsetHeight;

                isAnimating = true;

                const duration = isOpening ? '0.15s' : '0.12s';

                requestAnimationFrame(() => {
                    suggestionCards.style.transition = `top ${duration} cubic-bezier(0.2, 0, 0.2, 1)`;
                    suggestionCards.style.top = targetSugTop + 'px';

                    lastSuggestionsTop = targetSugTop;
                });
            }
        }

        lastViewportHeight = currentHeight;
    }

    function finalizePosition() {
        if (typedText && !typedText.classList.contains('hidden')) {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const finalTop = currentHeight * 0.33;

            // Atualizar posição salva
            typedText.style.top = finalTop + 'px';
            lastTypedTextTop = finalTop;
        }
        if (suggestionCards && !suggestionCards.classList.contains('hidden')) {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const finalSugTop = currentHeight * 0.42;

            suggestionCards.style.top = finalSugTop + 'px';
            lastSuggestionsTop = finalSugTop;
        }
        isAnimating = false;
    }

    // Usar visualViewport para detectar teclado (mais preciso)
    if (window.visualViewport) {
        let resizeTimeout;
        window.visualViewport.addEventListener('resize', () => {
            smoothKeyboardTransition();
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(finalizePosition, 200);
        });
    } else {
        let resizeTimeout;
        window.addEventListener("resize", () => {
            smoothKeyboardTransition();
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(finalizePosition, 200);
        });
    }

    // ===== SCROLL =====
    if (contentEl) {
        contentEl.addEventListener("scroll", () => {
            shouldAutoScroll = isNearBottom();
        });
    }

    window.addEventListener("resize", () => scrollMessagesToBottom(true));

    // ===== FORMULÁRIO DE ENVIO =====
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (isRecording) {
            stopMicRecording();
        }

        // Se está gerando, PARA a geração E continua para enviar a nova mensagem
        if (isSending) {
            console.log("⏹️ Parando geração anterior para enviar nova mensagem...");
            stopGeneration();
            // Pequeno delay para garantir que parou
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!isNetworkOnline()) {
            // Se tiver IA Local ativa, permite continuar sem internet
            if (typeof isLocalLlmActive === 'function' && isLocalLlmActive()) {
                console.log("[Main] Sem internet, mas IA Local está ativa");
            } else {
                // Modal desativado - apenas toast
                showToast('Sem conexão com a internet', 'warning');
                return;
            }
        }

        // Verificar limite de tokens diários
        if (typeof isTokenLimitExceeded === 'function' && isTokenLimitExceeded()) {
            // Criar mensagem de aviso sobre limite excedido
            let conv = conversations.find(c => c.id === currentConversationId);
            if (!conv) {
                createNewConversation(true);
                conv = conversations.find(c => c.id === currentConversationId);
            }

            const warningMessage = typeof getTokenLimitMessage === 'function'
                ? getTokenLimitMessage()
                : "⚠️ Limite diário de tokens excedido!";

            conv.messages.push({ role: "user", text: input.value.trim() });
            conv.messages.push({ role: "ai", text: warningMessage, id: "limit-" + Date.now() });

            renderMessages();
            saveConversations();

            input.value = "";
            return;
        }

        const cleanedInput = input.value.replace(/\s*\[.*?\]\s*$/, '').trim();
        input.value = cleanedInput;

        const text = input.value.trim();

        // Verificar se tem texto, PDFs ou imagens anexadas
        const pdfsToSend = typeof getAttachedPDFs === 'function' ? getAttachedPDFs() : null;
        const imagesToSend = typeof getAttachedImages === 'function' ? getAttachedImages() : null;
        if (!text && (!pdfsToSend || pdfsToSend.length === 0) && (!imagesToSend || imagesToSend.length === 0)) return;

        stopTypingEffect();
        
        // Esconder cards de sugestão
        if (typeof hideSuggestionCards === 'function') {
            hideSuggestionCards();
        }

        let conv = conversations.find(c => c.id === currentConversationId);
        if (!conv) {
            createNewConversation(true); // true para já entrar no novo chat
            conv = conversations.find(c => c.id === currentConversationId);
        }

        if (editingIndex !== null) {
            const editIdx = editingIndex;
            editingIndex = null;
            document.body.classList.remove('editing-message');
            if (!conv.messages[editIdx] || conv.messages[editIdx].role !== "user") return;

            conv.messages[editIdx].text = text;
            conv.messages[editIdx].pdfAttachments = pdfsToSend;
            conv.messages[editIdx].imageAttachments = imagesToSend;
            conv.messages = conv.messages.slice(0, editIdx + 1);
            conv.titleGenerated = false;
        } else {
            if (!conv.titleGenerated && conv.messages.length === 0) {
                updateConversationTitleFallback(conv);
            }
            // Adicionar mensagem com PDFs e imagens anexados se houver
            const userMessage = { role: "user", text: text };
            if (pdfsToSend && pdfsToSend.length > 0) {
                userMessage.pdfAttachments = pdfsToSend;
            }
            if (imagesToSend && imagesToSend.length > 0) {
                userMessage.imageAttachments = imagesToSend;
            }
            // Marcar se foi enviada com busca web ativa
            if (typeof webSearchEnabled !== 'undefined' && webSearchEnabled) {
                userMessage.webSearch = true;
            }
            // Marcar se foi enviada com modo agente ativo
            if (typeof isAgentModeActive === 'function' && isAgentModeActive()) {
                userMessage.agentMode = true;
            }
            // Marcar se foi enviada com modo gráfico ativo
            if (typeof isChartModeActive === 'function' && isChartModeActive()) {
                userMessage.chartMode = true;
            }
            // Marcar se foi enviada com modo documento ativo
            if (typeof isDocumentModeActive === 'function' && isDocumentModeActive()) {
                userMessage.documentMode = true;
            }
            // Marcar se foi enviada com modo mapa mental ativo
            if (typeof isMindMapModeActive === 'function' && isMindMapModeActive()) {
                userMessage.mindMapMode = true;
                console.log("🧠 [Main] Mensagem marcada com mindMapMode = true");
            }
            conv.messages.push(userMessage);

            // NOTA: Contagem de tokens agora é feita nas funções de API
            // para incluir system prompt + histórico completo
        }

        // Limpar anexos após enviar
        clearAttachment();
        if (typeof clearAllImageAttachments === 'function') {
            clearAllImageAttachments();
        }

        renderHistory();
        renderMessages();

        input.value = "";
        input.style.height = MIN_TEXTAREA_HEIGHT + "px";
        input.style.overflowY = "hidden";
        inputWrapper.style.height = MIN_WRAPPER_HEIGHT + "px";
        inputWrapper.classList.remove("multiline");

        isSending = true;
        setSendButtonState("stop");
        showThinkingIndicator();

        abortController = new AbortController();

        try {
            console.log("=== ETAPA 1: Iniciando processamento ===");

            // ===== VERIFICAR SE É MODO AGENTE =====
            const isAgentMode = typeof isAgentModeActive === 'function' && isAgentModeActive();

            if (isAgentMode) {
                console.log("🧠 Modo Agente ativado");

                removeThinkingIndicator();

                // Resetar modo agente após uso
                if (typeof resetAgentMode === 'function') {
                    resetAgentMode();
                }

                try {
                    await processAgentRequest(text, conv);
                } catch (agentErr) {
                    console.error("Erro no modo agente:", agentErr);
                }

                isSending = false;
                setSendButtonState("send");
                saveConversations();

                // Gerar título se necessário
                if (!conv.titleGenerated) {
                    try {
                        const title = await generateChatTitle(conv);
                        conv.title = title;
                        conv.titleGenerated = true;
                    } catch (errTitle) {
                        updateConversationTitleFallback(conv);
                    }
                    renderHistory();
                    saveConversations();
                }

                return;
            }
            // ===== FIM MODO AGENTE =====

            // ===== VERIFICAR SE É PEDIDO DE LIMPEZA DE MEMÓRIA =====
            if (typeof detectClearMemoryRequest === 'function') {
                const clearRequest = detectClearMemoryRequest(text);
                if (clearRequest.shouldClear && clearRequest.clearType === 'ALL') {
                    console.log("🧹 Detectado pedido de limpar memória - executando diretamente!");

                    // Limpar a memória diretamente
                    if (typeof clearAllMemory === 'function') {
                        clearAllMemory();
                    }

                    // Criar resposta automática confirmando
                    removeThinkingIndicator();

                    const aiId = "ai-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
                    const confirmMessage = "Pronto! 🧹 Limpei toda a minha memória sobre você. Agora não lembro mais nada. Podemos começar do zero! ✨";

                    conv.messages.push({
                        role: "ai",
                        text: confirmMessage,
                        id: aiId
                    });

                    renderMessages();

                    isSending = false;
                    setSendButtonState("send");
                    saveConversations();

                    // Gerar título se necessário
                    if (!conv.titleGenerated) {
                        conv.title = "Memória limpa";
                        conv.titleGenerated = true;
                        renderHistory();
                    }

                    return;
                }
            }
            // ===== FIM VERIFICAÇÃO DE LIMPEZA DE MEMÓRIA =====

            // NOTA: O reset dos modos especiais foi movido para DEPOIS do processamento
            // da resposta para que o buildSystemPrompt possa detectar o modo ativo

            console.log("=== ETAPA 2: Chamando API ===");
            const response = await callAIAPIStream(conv, abortController, pdfsToSend);
            console.log("=== ETAPA 3: Resposta recebida ===", response);
            removeThinkingIndicator();

            const aiId = "ai-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
            const aiMessage = { role: "ai", text: "", id: aiId, topicImagesHtml: null };
            conv.messages.push(aiMessage);
            renderMessages();

            const lastRow = messagesEl.lastElementChild;
            const bubble = lastRow ? lastRow.querySelector(".message-bubble") : null;

            // ===== IMAGENS DO TÓPICO (buscar em paralelo) =====
            // Buscar imagens relacionadas ao tópico da pergunta (não bloqueia o stream)
            if (bubble && typeof getTopicImagesHtml === 'function') {
                getTopicImagesHtml(text).then(imagesHtml => {
                    if (imagesHtml && lastRow) {
                        // Salvar na mensagem para persistir após renderMessages
                        aiMessage.topicImagesHtml = imagesHtml;
                        
                        // Inserir carrossel de imagens ANTES do bubble
                        const imagesContainer = document.createElement('div');
                        imagesContainer.innerHTML = imagesHtml;
                        const carousel = imagesContainer.firstElementChild;
                        if (carousel && bubble.parentNode) {
                            bubble.parentNode.insertBefore(carousel, bubble);
                            scrollMessagesToBottom();
                        }
                    }
                }).catch(err => {
                    console.warn('🖼️ Erro ao buscar imagens do tópico:', err);
                });
            }
            // ===== FIM IMAGENS DO TÓPICO =====

            if (bubble) {
                console.log("=== ETAPA 4: Processando stream ===");
                const fullRawText = await processStream(response, bubble);
                console.log("=== ETAPA 5: Stream processado ===");

                // Restaurar botão de envio imediatamente após o streaming terminar
                isSending = false;
                setSendButtonState("send");

                // Extrair e processar comandos de memória inline (sistema neo)
                const { cleanedText, memories, memoryCommands } = extractMemoryBlocks(fullRawText);
                aiMessage.text = cleanedText || fullRawText;

                // Processar novos comandos de memória (tags)
                if (memoryCommands && memoryCommands.length > 0) {
                    console.log("🧠 [Main] Comandos de memória inline detectados:", memoryCommands);
                    processMemoryCommands(memoryCommands, aiId);
                    // Marcar que a mensagem teve memória e salvar os comandos para exibição
                    const msgInConv = conv.messages.find(m => m.id === aiId);
                    if (msgInConv) {
                        msgInConv.hadMemory = true;
                        msgInConv.memoryChanges = memoryCommands;
                        saveConversations();
                    }
                }
                // Manter compatibilidade com sistema antigo [[MEMORY]]
                else if (memories && memories.length) {
                    const latestMemory = memories[memories.length - 1];
                    appendUserMemory(latestMemory, aiId);
                }

                // Processar resposta com formatMarkdown (já inclui gráficos, documentos e mapas mentais)
                bubble.innerHTML = formatMarkdown(aiMessage.text);

                // Resetar modos especiais DEPOIS de processar a resposta (uso único)
                if (typeof resetChartMode === 'function' && typeof isChartModeActive === 'function' && isChartModeActive()) {
                    console.log("📊 [Main] Resetando modo gráfico após processamento");
                    resetChartMode();
                }
                if (typeof resetDocumentMode === 'function' && typeof isDocumentModeActive === 'function' && isDocumentModeActive()) {
                    console.log("📄 [Main] Resetando modo documento após processamento");
                    resetDocumentMode();
                }
                if (typeof resetMindMapMode === 'function' && typeof isMindMapModeActive === 'function' && isMindMapModeActive()) {
                    console.log("🧠 [Main] Resetando modo mapa mental após processamento");
                    resetMindMapMode();
                }
            }

            renderMessages();

            console.log("📝 [Main] titleGenerated:", conv.titleGenerated, "| Chamando geração de título...");
            if (!conv.titleGenerated) {
                try {
                    console.log("📝 [Main] Iniciando generateChatTitle...");
                    const title = await generateChatTitle(conv);
                    console.log("📝 [Main] Título gerado:", title);
                    conv.title = title;
                    conv.titleGenerated = true;
                } catch (errTitle) {
                    console.error("📝 [Main] Erro ao gerar título:", errTitle);
                    updateConversationTitleFallback(conv);
                }
            }

            renderHistory();
            saveConversations();
        } catch (err) {
            console.error("Erro ao chamar IA:", err);
            console.error("Erro detalhado - name:", err?.name, "message:", err?.message, "stack:", err?.stack);

            if (err.name === "AbortError") {
                removeThinkingIndicator();
            } else if (err.isApiError) {
                // Erro específico da API (rate limit, chave inválida, etc.)
                removeThinkingIndicator();
                
                // Se é erro de falta de API key, adicionar botão de configuração
                const messageData = {
                    role: "ai",
                    text: err.message || "Erro desconhecido da API",
                    id: "ai-error-" + Date.now()
                };
                
                // Marcar se precisa do botão de configurar IA
                if (err.needsApiKey) {
                    messageData.needsApiKeyButton = true;
                }
                
                conv.messages.push(messageData);
                renderMessages();
                saveConversations();
            } else if (!isNetworkOnline() && !(typeof isLocalLlmActive === 'function' && isLocalLlmActive())) {
                // Apenas mostrar erro de rede se o plugin confirmar que está offline E não tiver IA local
                removeThinkingIndicator();
                // Modal desativado - apenas adiciona mensagem
                showToast('Sem conexão com a internet', 'warning');
                conv.messages.push({
                    role: "ai",
                    text: "🌐 **Sem conexão com a internet**\n\nVerifique sua conexão e tente novamente.",
                    id: "ai-error-" + Date.now()
                });
                renderMessages();
                saveConversations();
            } else {
                // Qualquer outro erro
                removeThinkingIndicator();
                let errorMsg = "❌ **Erro ao conectar com a IA**\n\n";
                
                // Tentar extrair informação útil do erro
                const errMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
                const errName = err?.name || "Erro";
                
                errorMsg += `**${errName}:** ${errMessage}\n\n`;
                errorMsg += "**Possíveis causas:**\n• Modelo não disponível na API\n• Servidor da API temporariamente indisponível\n• Problema de conexão\n\n**Tente:**\n• Aguardar alguns minutos\n• Trocar de modelo";

                conv.messages.push({
                    role: "ai",
                    text: errorMsg,
                    id: "ai-error-" + Date.now()
                });
                renderMessages();
                saveConversations();
            }
        } finally {
            isSending = false;
            abortController = null;
            setSendButtonState("send");
        }
    });

    // ===== SIDEBAR DE CHATS =====
    chatBtn.addEventListener("click", () => {
        toggleChats();
        renderFavorites();
    });

    overlay.addEventListener("click", function () {
        if (chatsHistoryFlag) {
            history.back();
            chatsHistoryFlag = false;
        } else {
            document.body.classList.remove("chats-open");
        }
    });

    historyList.addEventListener("click", function (e) {
        const item = e.target.closest(".history-item");
        if (!item) return;
        const id = item.dataset.id;
        if (!id) return;
        switchConversation(id);
    });

    historySearchInput.addEventListener("input", function () {
        historyFilterText = this.value.trim();
        renderHistory();
        clearSearchBtn.style.display = this.value ? "block" : "none";
    });

    clearSearchBtn.addEventListener("click", function () {
        historySearchInput.value = "";
        historyFilterText = "";
        renderHistory();
        clearSearchBtn.style.display = "none";
        historySearchInput.focus();
    });

    newChatBtn.addEventListener("click", function () {
        createNewConversation(true);
    });

    tempChatBtn.addEventListener("click", function () {
        let conv = conversations.find(c => c.id === currentConversationId);

        // Se não há conversa ativa, criar uma nova temporária
        if (!conv) {
            createNewConversation(true, true); // switchToNew=true, isTemp=true
            updateTempButtonState();
            return;
        }

        if (conv.isTemporary) {
            // Desativar modo temporário
            conv.isTemporary = false;
            conv.title = conv.title.replace("Chat Temporário", "Novo chat");
        } else {
            // Ativar modo temporário
            conv.isTemporary = true;
            if (conv.title === "Novo chat" || !conv.titleGenerated) {
                conv.title = "Chat Temporário";
            }
        }

        saveConversations();
        renderHistory();
        updateTempButtonState();
    });

    clearChatsBtn.addEventListener("click", function () {
        openHistoryModal();
    });

    // NOTA: Botão de busca web é gerenciado pelo pdf-handler.js

    // ===== CONFIGURAÇÕES =====
    settingsBtn.addEventListener("click", openSettings);

    // Botão voltar das configurações
    const settingsBackBtn = document.getElementById("settingsBackBtn");
    if (settingsBackBtn) {
        settingsBackBtn.addEventListener("click", function () {
            closeSettings();
            if (settingsHistoryFlag) {
                settingsHistoryFlag = false;
            }
        });
    }

    // ===== POPSTATE =====
    window.addEventListener("popstate", function (e) {
        // Se o backbutton do Cordova já tratou este evento, ignorar
        if (backButtonHandled) {
            return;
        }
        
        // ===== MODAIS DE TELA CHEIA (prioridade máxima) =====
        
        // Code Studio
        var codeStudioModal = document.getElementById('codeStudioModal');
        if (codeStudioModal && codeStudioModal.classList.contains('show')) {
            e.preventDefault();
            if (window.closeCodeStudio) window.closeCodeStudio();
            history.pushState({ neoIdle: true }, '');
            return;
        }
        
        // Conversor de Arquivos
        var converterModal = document.getElementById('converterModal');
        if (converterModal && converterModal.classList.contains('show')) {
            e.preventDefault();
            if (window.closeConverter) window.closeConverter();
            history.pushState({ neoIdle: true }, '');
            return;
        }
        
        // Modal de transcrição individual
        var transcriptionModal = document.getElementById('transcriptionModal');
        if (transcriptionModal && transcriptionModal.classList.contains('open')) {
            e.preventDefault();
            if (window.closeTranscriptionModal) window.closeTranscriptionModal();
            history.pushState({ neoIdle: true }, '');
            return;
        }
        
        // Página de transcrições/gravador
        var transcriptionPage = document.getElementById('transcriptionPage');
        if (transcriptionPage && transcriptionPage.getAttribute('aria-hidden') === 'false') {
            e.preventDefault();
            if (window.closeTranscriptionPage) window.closeTranscriptionPage();
            history.pushState({ neoIdle: true }, '');
            return;
        }
        
        // Histórico de transcrições
        if (document.body.classList.contains('transcriptions-history-open')) {
            e.preventDefault();
            if (window.closeTranscriptionsHistory) window.closeTranscriptionsHistory();
            history.pushState({ neoIdle: true }, '');
            return;
        }
        
        // Se estiver em modo de edição de mensagem, sair do modo edição
        if (document.body.classList.contains('editing-message')) {
            if (typeof exitEditingMessage === 'function') {
                exitEditingMessage();
                return;
            }
        }

        // Sidebar de anexos
        const attachMenu = document.getElementById('attachMenu');
        if (attachMenu && attachMenu.classList.contains('open')) {
            if (typeof closeAttachMenu === 'function') closeAttachMenu(true);
            history.pushState({ neoIdle: true }, '');
            return;
        }

        // Modal de memória
        const memoryEditorModal = document.getElementById('memoryEditorModal');
        if (memoryEditorModal && memoryEditorModal.getAttribute('aria-hidden') === 'false') {
            memoryEditorModal.setAttribute('aria-hidden', 'true');
            // Re-push o estado para não fechar as configurações
            history.pushState({ settings: true }, '');
            return;
        }

        // Modal de seleção de fonte
        if (fontModal && fontModal.classList.contains("open")) {
            closeFontModal();
            return;
        }

        // Modal de senha PIN
        if (codePasswordOverlay && codePasswordOverlay.classList.contains("open")) {
            closeCodePasswordModalDirect();
            return;
        }

        // Fechar editor de nota primeiro
        const noteEditorOverlay = document.getElementById('noteEditorOverlay');
        if (noteEditorOverlay && noteEditorOverlay.classList.contains('open')) {
            if (typeof saveCurrentNote === 'function') saveCurrentNote();
            return;
        }

        // Fechar tela de anotações
        if (document.body.classList.contains('notes-open')) {
            if (typeof closeNotes === 'function') closeNotes();
            return;
        }

        // Fechar sidebar de modos (personas)
        if (document.body.classList.contains('personas-open')) {
            if (typeof closePersonaModal === 'function') closePersonaModal();
            return;
        }

        if (document.body.classList.contains("settings-open")) {
            document.body.classList.remove("settings-open");
            settingsHistoryFlag = false;
            return;
        }
        if (document.body.classList.contains("chats-open")) {
            document.body.classList.remove("chats-open");
            chatsHistoryFlag = false;
            return;
        }

        if (exitingApp) {
            exitingApp = false;
            hideExitToast();
            return;
        }

        if (!exitToastActive) {
            showExitToast();
            history.pushState({ neoIdle: true }, "");
            return;
        }

        hideExitToast();
    });

    // ===== SLIDERS (REMOVIDOS - Hora são hidden inputs com valores fixos) =====
    // Os event listeners abaixo são mantidos por compatibilidade mas não fazem nada visível
    if (humorRange) humorRange.addEventListener("input", function () {
        if (humorValue) humorValue.textContent = humorRange.value;
        saveSettings();
    });
    if (freedomRange) freedomRange.addEventListener("input", function () {
        if (freedomValue) freedomValue.textContent = freedomRange.value;
        saveSettings();
    });
    if (professionalRange) professionalRange.addEventListener("input", function () {
        if (professionalValue) professionalValue.textContent = professionalRange.value;
        saveSettings();
    });
    if (formalidadeRange) formalidadeRange.addEventListener("input", function () {
        if (formalidadeValue) formalidadeValue.textContent = formalidadeRange.value;
        saveSettings();
    });

    if (styleCustom) styleCustom.addEventListener("input", function () {
        updateSliderState();
        saveSettings();
    });
    if (styleCustom) styleCustom.addEventListener("change", function () {
        updateSliderState();
        saveSettings();
    });

    modelSelect.addEventListener("change", saveSettings);

    // ===== CONFIGURAÇÕES DE VOZ =====
    const voiceProviderEl = document.getElementById('voiceProviderSelect');
    const testVoiceBtnEl = document.getElementById('testVoiceBtn');
    const testVoiceProviderBtnEl = document.getElementById('testVoiceProviderBtn');
    const nativeVoiceSelectEl = document.getElementById('nativeVoiceSelect');

    // Carregar vozes nativas do sistema
    loadNativeVoices();

    if (voiceProviderEl) {
        voiceProviderEl.addEventListener('change', function () {
            updateVoiceConfigVisibility();
            saveSettings();
        });
    }
    if (nativeVoiceSelectEl) {
        nativeVoiceSelectEl.addEventListener('change', saveSettings);
    }
    if (testVoiceBtnEl) {
        testVoiceBtnEl.addEventListener('click', testVoiceFromSettings);
    }
    // Novo botão geral de testar voz
    if (testVoiceProviderBtnEl) {
        testVoiceProviderBtnEl.addEventListener('click', testVoiceFromSettings);
    }
    
    // ===== EVENT LISTENERS PARA INPUTS DE API KEY (SERP apenas, AI keys gerenciadas pelo NeoAPI) =====
    // SERP keys list no sidebar (única seção de keys que permanece no DOM)
    const serpContainer = document.getElementById('serp-keys-list');
    if (serpContainer) {
        serpContainer.addEventListener('input', function(e) {
            if (e.target && e.target.classList.contains('api-key-input')) {
                saveSettings();
            }
        });
        serpContainer.addEventListener('change', function(e) {
            if (e.target && e.target.classList.contains('api-key-input')) {
                saveSettings();
            }
        });
    }
    
    // Também adicionar listener ao SERP API key se existir
    const serpApiKeyEl = document.getElementById('serpApiKey');
    if (serpApiKeyEl) {
        serpApiKeyEl.addEventListener('input', saveSettings);
        serpApiKeyEl.addEventListener('change', saveSettings);
    }
    
    // Botão de testar SERP API
    const testSerpBtnEl = document.getElementById('testSerpBtn');
    if (testSerpBtnEl) {
        testSerpBtnEl.addEventListener('click', () => {
            if (typeof testSerpApi === 'function') {
                testSerpApi();
            } else if (typeof window.testSerpApi === 'function') {
                window.testSerpApi();
            } else {
                alert('❌ Função de teste não disponível');
            }
        });
    }

    // ===== PRESETS DE COR =====
    presetDefault.addEventListener('click', () => setGradientPreset('default'));
    if (presetWhite) {
        presetWhite.addEventListener('click', () => setGradientPreset('white'));
    }
    presetPink.addEventListener('click', () => setGradientPreset('pink'));
    presetGreen.addEventListener('click', () => setGradientPreset('green'));
    presetYellow.addEventListener('click', () => setGradientPreset('yellow'));
    presetRed.addEventListener('click', () => setGradientPreset('red'));
    presetBlack.addEventListener('click', () => setGradientPreset('black'));
    presetCustom.addEventListener('click', () => {
        currentGradient = null;
        updatePresetButtonState();
        bgColorPicker.click();
    });

    // ===== MODO DE TEMA =====
    if (themeModeLight) {
        themeModeLight.addEventListener('click', () => setThemeMode('light'));
    }
    if (themeModeDark) {
        themeModeDark.addEventListener('click', () => setThemeMode('dark'));
    }
    if (themeModeAuto) {
        themeModeAuto.addEventListener('click', () => setThemeMode('auto'));
    }
    // Listener para mudança de preferência do sistema (modo auto)
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (currentThemeMode === "auto") {
            applyThemeMode();
        }
    });

    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', function () {
            currentGradient = null;
            applyBackground();
            updatePresetButtonState();
            saveSettings();
        });
        bgColorPicker.addEventListener('change', function () {
            currentGradient = null;
            applyBackground();
            updatePresetButtonState();
            saveSettings();
        });
    }

    // ===== COR SECUNDÁRIA =====
    secondaryPresetWhite.addEventListener("click", function () {
        currentSecondaryColor = "white";
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    });
    secondaryPresetBlack.addEventListener("click", function () {
        currentSecondaryColor = "black";
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    });
    secondaryPresetCyan.addEventListener("click", function () {
        currentSecondaryColor = "cyan";
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    });
    secondaryPresetLime.addEventListener("click", function () {
        currentSecondaryColor = "lime";
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    });
    secondaryPresetPink.addEventListener("click", function () {
        currentSecondaryColor = "pink";
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    });
    secondaryPresetOrange.addEventListener("click", function () {
        currentSecondaryColor = "orange";
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    });
    if (secondaryPresetRed) {
        secondaryPresetRed.addEventListener("click", function () {
            currentSecondaryColor = "red";
            applySecondaryColor();
            updateSecondaryPresetState();
            saveSettings();
        });
    }
    secondaryPresetCustom.addEventListener("click", function () {
        currentSecondaryColor = null;
        updateSecondaryPresetState();
        secondaryColorPicker.click();
    });
    secondaryColorPicker.addEventListener("input", function () {
        currentSecondaryColor = null;
        applySecondaryColor();
        updateSecondaryPresetState();
        saveSettings();
    });

    // ===== FONTE =====
    if (fontSelectBtn) {
        fontSelectBtn.addEventListener("click", openFontModal);
    }
    if (fontModalCloseBtn) {
        fontModalCloseBtn.addEventListener("click", closeFontModal);
    }
    if (fontModal) {
        fontModal.addEventListener("click", (e) => {
            const option = e.target.closest('.font-option');
            if (option && option.dataset.font) {
                selectFont(option.dataset.font);
            }
            // Clicar fora da sidebar fecha ela
            if (e.target === fontModal) {
                closeFontModal();
            }
        });
    }

    // ===== MODAL DE SAÍDA =====
    exitModal.addEventListener("click", function (e) {
        if (e.target === exitModal) {
            closeExitModal();
        }
    });
    btnStay.addEventListener("click", function () {
        closeExitModal();
        if (!history.state || history.state.neoRoot) {
            history.pushState({ neoIdle: true }, "");
        }
    });
    btnExit.addEventListener("click", function () {
        exitingApp = true;
        history.back();
    });

    // ===== MODAL DE HISTÓRICO =====
    historyModal.addEventListener("click", function (e) {
        if (e.target === historyModal) {
            closeHistoryModal();
        }
    });
    btnCancelHistory.addEventListener("click", function () {
        closeHistoryModal();
    });
    btnConfirmHistory.addEventListener("click", function () {
        clearAllChats();
        closeHistoryModal();
    });

    // ===== MODAL DELETAR CHAT =====
    deleteChatModal.addEventListener("click", function (e) {
        if (e.target === deleteChatModal) {
            closeDeleteChatModal();
        }
    });
    btnCancelDeleteChat.addEventListener("click", function () {
        closeDeleteChatModal();
    });
    btnConfirmDeleteChat.addEventListener("click", function () {
        if (chatToDelete) {
            deleteConversation(chatToDelete);
        }
        closeDeleteChatModal();
    });

    // ===== MODAL DE MEMÓRIA =====
    if (memoryModal) {
        memoryModal.addEventListener("click", (e) => {
            if (e.target === memoryModal) {
                closeMemoryModal();
            }
        });
    }
    if (memoryModalCloseBtn) {
        memoryModalCloseBtn.addEventListener("click", closeMemoryModal);
    }
    if (memoryModalEditBtn) {
        memoryModalEditBtn.addEventListener("click", () => {
            closeMemoryModal();
            openMemoryEditorModal();
        });
    }

    // ===== CÓDIGO FONTE =====
    if (codeSourceCloseBtn) {
        codeSourceCloseBtn.addEventListener("click", closeCodeSourceSidebar);
    }
    if (codeSourceCancelBtn) {
        codeSourceCancelBtn.addEventListener("click", function () {
            const again = loadSettings();
            if (again && codeSourceText) {
                codeSourceText.value = again.codeSource || "";
            }
            closeCodeSourceSidebar();
        });
    }
    if (codeSourceSaveBtn) {
        codeSourceSaveBtn.addEventListener("click", function () {
            saveSettings();
            closeCodeSourceSidebar();
        });
    }
    if (codeSourceOverlay) {
        codeSourceOverlay.addEventListener("click", function (e) {
            if (e.target === codeSourceOverlay) {
                closeCodeSourceSidebar();
            }
        });
    }

    // ===== CONFIGURAÇÃO DE SENHA =====
    const setPasswordBtn = document.getElementById('setPasswordBtn');
    const removePasswordBtn = document.getElementById('removePasswordBtn');

    if (setPasswordBtn) {
        setPasswordBtn.addEventListener('click', setNewPassword);
    }
    if (removePasswordBtn) {
        removePasswordBtn.addEventListener('click', removePassword);
    }

    // ===== MODAL DE SENHA =====
    if (lockedBtn) {
        lockedBtn.addEventListener("click", function () {
            openCodePasswordModal();
        });
    }
    if (codePasswordCancelBtn) {
        codePasswordCancelBtn.addEventListener("click", closeCodePasswordModal);
    }
    if (codePasswordConfirmBtn) {
        codePasswordConfirmBtn.addEventListener("click", handleCodePasswordConfirm);
    }
    if (codePasswordInput) {
        codePasswordInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                handleCodePasswordConfirm();
            } else if (e.key === "Escape") {
                e.preventDefault();
                closeCodePasswordModal();
            }
        });
    }
    if (codePasswordOverlay) {
        codePasswordOverlay.addEventListener("click", function (e) {
            if (e.target === codePasswordOverlay) {
                closeCodePasswordModal();
            }
        });
    }

    // ===== LIMPAR MEMÓRIA =====
    if (clearMemoryBtn) {
        clearMemoryBtn.addEventListener("click", openClearMemoryModal);
    }
    if (clearMemoryModal) {
        clearMemoryModal.addEventListener("click", function (e) {
            if (e.target === clearMemoryModal) {
                closeClearMemoryModal();
            }
        });
    }
    if (btnCancelClearMemory) {
        btnCancelClearMemory.addEventListener("click", closeClearMemoryModal);
    }
    if (btnConfirmClearMemory) {
        btnConfirmClearMemory.addEventListener("click", function () {
            localStorage.removeItem(MEMORY_KEY);
            if (memoryText) {
                memoryText.value = "";
            }
            // Também limpa o textarea do editor de memória
            const memoryEditorTextarea = document.getElementById('memoryEditorTextarea');
            if (memoryEditorTextarea) {
                memoryEditorTextarea.value = "";
            }
            saveSettings();
            closeClearMemoryModal();
        });
    }

    // ===== BUSCA (sem expansão fullscreen) =====

    // ===== CONTROLE DE TOKENS =====
    if (dailyTokenLimitInput) {
        dailyTokenLimitInput.addEventListener("change", function () {
            setDailyTokenLimit(this.value);
        });
    }
    if (tokenResetHourInput) {
        tokenResetHourInput.addEventListener("change", function () {
            setTokenResetHour(this.value);
        });
    }
    if (resetTokensBtn) {
        resetTokensBtn.addEventListener("click", function () {
            if (typeof resetTokensNow === 'function') {
                resetTokensNow();
                vibrateOnClick();
            }
        });
    }

    // ===== MODAL DE EDIÇÃO DE MEMÓRIA =====
    setupMemoryEditorModal();
}

// ===== MODAL DE EDIÇÃO DE MEMÓRIA =====
let memoryEditorHistoryPushed = false;

function setupMemoryEditorModal() {
    const openBtn = document.getElementById('openMemoryEditorBtn');
    const modal = document.getElementById('memoryEditorModal');
    const backBtn = document.getElementById('memoryEditorBackBtn');
    const saveBtn = document.getElementById('memoryEditorSaveBtn');
    const clearBtn = document.getElementById('memoryEditorClearBtn');
    const textarea = document.getElementById('memoryEditorTextarea');

    if (!openBtn || !modal) return;

    // Abrir modal
    openBtn.addEventListener('click', () => {
        openMemoryEditorModal();
    });

    // Fechar com botão voltar
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            closeMemoryEditorModal();
        });
    }

    // Salvar memória
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (textarea && memoryText) {
                memoryText.value = textarea.value;
                saveUserMemory({
                    text: textarea.value.trim(),
                    messageId: null
                });
                saveSettings();
            }
            closeMemoryEditorModal();
            vibrateOnClick();
        });
    }

    // Limpar memória - abre modal de confirmação
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            openClearMemoryModal();
            vibrateOnClick();
        });
    }

    // Fechar ao clicar no overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMemoryEditorModal();
        }
    });
}

function openMemoryEditorModal() {
    const modal = document.getElementById('memoryEditorModal');
    const textarea = document.getElementById('memoryEditorTextarea');

    if (!modal) return;

    // Carregar memória do localStorage para garantir dados atualizados
    // (a memória pode ter sido alterada pelo sistema de análise de chat)
    let memoryValue = '';
    if (typeof loadUserMemory === 'function') {
        const storedMemory = loadUserMemory();
        if (storedMemory && storedMemory.text) {
            memoryValue = storedMemory.text;
            // Sincronizar o elemento oculto também
            if (memoryText) {
                memoryText.value = memoryValue;
            }
        }
    } else if (memoryText) {
        memoryValue = memoryText.value || '';
    }

    // Copiar memória atual para o textarea do modal
    if (textarea) {
        textarea.value = memoryValue;
    }

    modal.setAttribute('aria-hidden', 'false');
    memoryEditorHistoryPushed = true;

    // Focar no textarea após animação
    setTimeout(() => {
        if (textarea) {
            textarea.focus();
        }
    }, 400);
}

function closeMemoryEditorModal() {
    const modal = document.getElementById('memoryEditorModal');

    if (!modal) return;

    modal.setAttribute('aria-hidden', 'true');
    memoryEditorHistoryPushed = false;
}

// ===== RELÓGIO EM TEMPO REAL =====
function initClock() {
    const clockEl = document.getElementById('clockTime');
    if (!clockEl) return;

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}:${seconds}`;

        // Atualizar também o contador de tokens
        if (typeof updateTokenUsageUI === 'function') {
            updateTokenUsageUI();
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// ===== INICIALIZAÇÃO DE TOKENS =====
function initTokenSystem() {
    // Carregar configurações salvas
    const usage = typeof loadTokenUsage === 'function' ? loadTokenUsage() : null;
    if (usage && dailyTokenLimitInput) {
        dailyTokenLimitInput.value = usage.dailyLimit || 0;
    }
    if (usage && tokenResetHourInput) {
        // Simple number value for select
        tokenResetHourInput.value = usage.resetHour || 0;
    }

    // Atualizar UI
    if (typeof updateTokenUsageUI === 'function') {
        updateTokenUsageUI();
    }
}

// ===== CONFIGURAÇÕES DE VOZ =====

// Carrega vozes nativas do sistema
function loadNativeVoices() {
    const select = document.getElementById('nativeVoiceSelect');
    if (!select) return;

    // FORÇAR ÚNICA VOZ: pt-br-x-ptd-local
    console.log('🎤 FORÇANDO ÚNICA VOZ: pt-br-x-ptd-local');
    select.innerHTML = '<option value="pt-br-x-ptd-local" selected>Português Brasil (pt-br-x-ptd-local)</option>';
    select.value = 'pt-br-x-ptd-local';
    
    // Salvar nas configurações
    const savedSettings = JSON.parse(localStorage.getItem("neoSettings") || "{}");
    savedSettings.nativeVoice = 'pt-br-x-ptd-local';
    localStorage.setItem("neoSettings", JSON.stringify(savedSettings));
    
    console.log('🎤 VOZ FORÇADA: pt-br-x-ptd-local');
}

// Atualiza visibilidade das seções de configuração de voz
function updateVoiceConfigVisibility() {
    const voiceProviderEl = document.getElementById('voiceProviderSelect');
    const googleTtsInfoEl = document.getElementById('googleTtsInfo');
    const nativeVoiceConfigEl = document.getElementById('nativeVoiceConfig');

    if (!voiceProviderEl) return;

    const provider = voiceProviderEl.value;

    if (nativeVoiceConfigEl) {
        nativeVoiceConfigEl.style.display = provider === 'native' ? 'block' : 'none';
    }
    if (googleTtsInfoEl) {
        googleTtsInfoEl.style.display = provider === 'google' ? 'block' : 'none';
    }
}

// Testa a voz selecionada nas configurações
async function testVoiceFromSettings() {
    // Buscar botão (pode ser o novo ou o antigo)
    let testBtn = document.getElementById('testVoiceProviderBtn') || document.getElementById('testVoiceBtn');
    const voiceProviderEl = document.getElementById('voiceProviderSelect');
    const nativeVoiceEl = document.getElementById('nativeVoiceSelect');

    if (!testBtn) return;

    // Desabilitar botão durante teste
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testando...';

    const provider = voiceProviderEl ? voiceProviderEl.value : 'google';
    const testText = 'Olá! Eu sou o Neo, seu assistente virtual.';

    try {
        if (provider === 'native') {
            // MÉTODO 1: Plugin TTS Cordova (Android)
            if (typeof TTS !== 'undefined') {
                console.log('✅ Testando com plugin TTS Cordova');
                const selectedVoiceId = nativeVoiceEl ? nativeVoiceEl.value : ''; // Agora é o identifier
                
                const ttsOptions = {
                    text: testText,
                    rate: 1.0,
                    pitch: 1.0,
                    cancel: true
                };
                
                // Se uma voz foi selecionada, usar o identifier diretamente
                if (selectedVoiceId && selectedVoiceId !== 'default' && selectedVoiceId !== '') {
                    ttsOptions.identifier = selectedVoiceId;
                    console.log('🔊 Usando identifier:', selectedVoiceId);
                } else {
                    // Fallback para português
                    ttsOptions.locale = 'pt-BR';
                }
                
                console.log('🔊 Opções TTS teste:', JSON.stringify(ttsOptions));
                await TTS.speak(ttsOptions);
            } 
            // MÉTODO 2: Web Speech API (navegador)
            else if ('speechSynthesis' in window) {
                await new Promise((resolve, reject) => {
                    window.speechSynthesis.cancel();

                    const voices = window.speechSynthesis.getVoices();
                    const selectedVoiceName = nativeVoiceEl ? nativeVoiceEl.value : '';
                    
                    const utterance = new SpeechSynthesisUtterance(testText);
                    utterance.lang = 'pt-BR';
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;

                    if (selectedVoiceName) {
                        const selectedVoice = voices.find(v => v.name === selectedVoiceName);
                        if (selectedVoice) {
                            utterance.voice = selectedVoice;
                            utterance.lang = selectedVoice.lang;
                            console.log('Usando voz:', selectedVoice.name);
                        }
                    }

                    utterance.onend = resolve;
                    utterance.onerror = (e) => reject(new Error(e.error || 'Erro na síntese'));

                    window.speechSynthesis.speak(utterance);
                });
            } else {
                throw new Error('Nenhum sistema de voz disponível');
            }

        } else {
            // Testar com Google TTS
            const encodedText = encodeURIComponent(testText);
            const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=pt-BR&client=tw-ob`;

            const audio = new Audio(audioUrl);
            audio.playbackRate = 1.25;
            await audio.play();
        }
    } catch (err) {
        console.error('Erro no teste de voz:', err);
        const errorMsg = err?.message || err?.toString() || 'Falha na conexão com o serviço de voz';
        alert('Erro ao testar voz: ' + errorMsg);
    } finally {
        // Restaurar botão
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fa-solid fa-play"></i> Testar voz';
    }
}

// ===== INICIALIZAÇÃO DO APP =====
async function startApplication() {
    try {
        // MIGRAÇÃO: Forçar modelo gemini se estiver usando modelo antigo/inválido
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            const currentModel = modelSelect.value;
            // Se o modelo atual não é um modelo válido, forçar o padrão
            const validModels = [
                'gemini-3-pro',
                'gemini-3-flash',
                'gemini-2.5-flash',
                'gemini-2.5-flash-lite',
                'gemini-2.5-pro',
                'deepseek-chat',
                'deepseek-reasoner',
                'gpt-4o',
                'gpt-4o-mini'
            ];
            if (!validModels.includes(currentModel)) {
                modelSelect.value = 'gemini-2.5-flash';
                localStorage.setItem('neo_selected_model', 'gemini-2.5-flash');
                console.log(`🔄 [Migração] Modelo atualizado de ${currentModel} para gemini-2.5-flash`);
            }
        }
        
        await initApp();
        setupEventListeners();
        renderFavorites();
        startTypingLoop();
        addVibrationToButtons();
        initSidebarDrag();
        initSettingsDrag();
        initClock();
        initTokenSystem();
        
        // Inicializa cards de sugestão
        if (typeof initSuggestionCards === 'function') {
            initSuggestionCards();
        }
        
        // Mostra cards de sugestão se não houver mensagens
        setTimeout(() => {
            if (typeof showSuggestionCards === 'function') {
                showSuggestionCards();
            }
        }, 500);
    } catch (err) {
        console.error('Erro na inicialização:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication);
} else {
    startApplication();
}

