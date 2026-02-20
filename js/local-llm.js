/**
 * ===== LOCAL LLM - Native llama.cpp Integration =====
 * Usa modelos GGUF via plugin nativo para máxima performance
 * 40-60 tok/s com llama.cpp nativo
 */

// ===== MODELOS DISPONÍVEIS (GGUF NATIVOS) =====
// Modelos hospedados em: https://huggingface.co/Jmxxp7777/neo-llms
const LOCAL_LLM_MODELS = {
    // ========== CATEGORIA: LIGHT (< 2GB) - Rápidos e eficientes ==========
    "qwen-0.5b": {
        name: "Qwen2.5 0.5B Q8",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/qwen2.5-0.5b-instruct-q8_0.gguf?download=true",
        fileName: "qwen2.5-0.5b-instruct-q8_0.gguf",
        size: "~530 MB",
        params: "0.5B",
        tokensPerSec: "~50 tok/s",
        description: "Q8 - Ultra leve, respostas rápidas",
        logo: "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png",
        company: "Alibaba",
        category: "light",
        nCtx: 4096
    },
    "tinyllama-openorca": {
        name: "TinyLlama 1.1B Q8",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/tinyllama-1.1b-1t-openorca.Q8_0.gguf?download=true",
        fileName: "tinyllama-1.1b-1t-openorca.Q8_0.gguf",
        size: "~1.1 GB",
        params: "1.1B",
        tokensPerSec: "~55 tok/s",
        description: "Q8 - O mais rápido!",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg",
        company: "TinyLlama",
        category: "light",
        nCtx: 2048
    },
    "llama-1b": {
        name: "Llama 3.2 1B Q8",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/Llama-3.2-1B-Instruct-Q8_0.gguf?download=true",
        fileName: "Llama-3.2-1B-Instruct-Q8_0.gguf",
        size: "~1.3 GB",
        params: "1B",
        tokensPerSec: "~40 tok/s",
        description: "Q8 - Meta compacto, bom em inglês",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg",
        company: "Meta",
        category: "light",
        nCtx: 4096
    },
    "llama-1b-abliterated": {
        name: "Llama 3.2 1B Q8 Unlocked",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/Llama-3.2-1B-Instruct-abliterated.Q8_0.gguf?download=true",
        fileName: "Llama-3.2-1B-Instruct-abliterated.Q8_0.gguf",
        size: "~1.3 GB",
        params: "1B",
        tokensPerSec: "~40 tok/s",
        description: "Q8 - Meta desbloqueado!",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg",
        company: "Meta",
        category: "light",
        nCtx: 4096
    },
    "qwen-1.5b": {
        name: "Qwen2.5 1.5B Q8",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/qwen2.5-1.5b-instruct-q8_0.gguf?download=true",
        fileName: "qwen2.5-1.5b-instruct-q8_0.gguf",
        size: "~1.6 GB",
        params: "1.5B",
        tokensPerSec: "~35 tok/s",
        description: "Q8 - Ótimo custo-benefício, multilíngue",
        logo: "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png",
        company: "Alibaba",
        category: "light",
        nCtx: 4096
    },
    "qwen-1.5b-abliterated": {
        name: "Qwen2.5 1.5B Q8 Unlocked",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/Qwen2.5-1.5B-Instruct-abliterated.Q8_0.gguf?download=true",
        fileName: "Qwen2.5-1.5B-Instruct-abliterated.Q8_0.gguf",
        size: "~1.6 GB",
        params: "1.5B",
        tokensPerSec: "~35 tok/s",
        description: "Q8 - Alibaba desbloqueado!",
        logo: "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png",
        company: "Alibaba",
        category: "light",
        nCtx: 4096
    },

    // ========== CATEGORIA: MEDIUM (2-5GB) - Equilíbrio qualidade/velocidade ==========
    "gemma-2b": {
        name: "Gemma 2 2B Q8",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/gemma-2-2b-it-Q8_0.gguf?download=true",
        fileName: "gemma-2-2b-it-Q8_0.gguf",
        size: "~2.7 GB",
        params: "2B",
        tokensPerSec: "~28 tok/s",
        description: "Q8 - Google, excelente raciocínio",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png",
        company: "Google",
        category: "medium",
        nCtx: 4096
    },
    "gemma-2b-abliterated": {
        name: "Gemma 2 2B Q8 Unlocked",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/gemma-2-2b-it-abliterated-Q8_0.gguf?download=true",
        fileName: "gemma-2-2b-it-abliterated-Q8_0.gguf",
        size: "~2.7 GB",
        params: "2B",
        tokensPerSec: "~28 tok/s",
        description: "Q8 - Google desbloqueado!",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png",
        company: "Google",
        category: "medium",
        nCtx: 4096
    },
    "kappa-phi-abliterated": {
        name: "Kappa-3 Phi 3.8B Q8 Unlocked",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/kappa-3-phi-abliterated.Q8_0.gguf?download=true",
        fileName: "kappa-3-phi-abliterated.Q8_0.gguf",
        size: "~4.1 GB",
        params: "3.8B",
        tokensPerSec: "~18 tok/s",
        description: "Q8 - Phi-3 desbloqueado, código!",
        logo: "https://img.icons8.com/fluency/96/microsoft.png",
        company: "Microsoft",
        category: "medium",
        nCtx: 4096
    },
    "llama-3b": {
        name: "Llama 3.2 3B Q8",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/Llama-3.2-3B-Instruct-Q8_0.gguf?download=true",
        fileName: "Llama-3.2-3B-Instruct-Q8_0.gguf",
        size: "~3.4 GB",
        params: "3B",
        tokensPerSec: "~22 tok/s",
        description: "Q8 - Meta, conversas naturais",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg",
        company: "Meta",
        category: "medium",
        nCtx: 4096
    },
    "llama-3b-abliterated": {
        name: "Llama 3.2 3B Q8 Unlocked",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/Llama-3.2-3B-Instruct-abliterated.Q8_0.gguf?download=true",
        fileName: "Llama-3.2-3B-Instruct-abliterated.Q8_0.gguf",
        size: "~3.4 GB",
        params: "3B",
        tokensPerSec: "~22 tok/s",
        description: "Q8 - Meta desbloqueado!",
        logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg",
        company: "Meta",
        category: "medium",
        nCtx: 4096
    },
    "qwen-3b": {
        name: "Qwen2.5 3B Q8",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/qwen2.5-3b-instruct-q8_0.gguf?download=true",
        fileName: "qwen2.5-3b-instruct-q8_0.gguf",
        size: "~3.5 GB",
        params: "3B",
        tokensPerSec: "~20 tok/s",
        description: "Q8 - Excelente em português e código",
        logo: "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png",
        company: "Alibaba",
        category: "medium",
        nCtx: 4096
    },
    "qwen-3b-abliterated": {
        name: "Qwen2.5 3B Q8 Unlocked",
        modelUrl: "https://huggingface.co/Jmxxp7777/neo-llms/resolve/main/Qwen2.5-3B-Instruct-abliterated.Q8_0.gguf?download=true",
        fileName: "Qwen2.5-3B-Instruct-abliterated.Q8_0.gguf",
        size: "~3.5 GB",
        params: "3B",
        tokensPerSec: "~20 tok/s",
        description: "Q8 - Alibaba top em português!",
        logo: "https://opencv.org/wp-content/uploads/2025/01/MIhJKlK5yVR3axxgE7_gHL-rsKjliShJKd3asUqg5KDdEsdOGut-9mCW4Ti1x7i2y8zCkxeZHQFR00sQg6BfYA.png",
        company: "Alibaba",
        category: "medium",
        nCtx: 4096
    }
};

// ===== ESTADO DO LLM LOCAL =====
let localLlmState = {
    enabled: false,
    activeModel: null,
    downloadedModels: [],
    engine: null,
    isLoading: false,
    isGenerating: false,
    isCancelled: false,
    currentDownloadId: null
};

// ===== CONFIGURAÇÕES DA IA LOCAL - Otimizadas para modelos pequenos =====
let localLlmConfig = {
    nCtx: 4096,          // Contexto maior para respostas completas
    maxTokens: 2048,     // Aumentado para respostas longas e completas
    temperature: 0.7,    // Padrão - bom equilíbrio criatividade/coerência
    topP: 0.9,           // Padrão - deixar o modelo ter mais opções
    topK: 40,            // Padrão - mais diversidade
    repetitionPenalty: 1.1  // Reduzido! 1.5 era muito alto e penalizava palavras normais
};

// Expor globalmente para api.js acessar
window.localLlmConfig = localLlmConfig;

// Carregar estado salvo imediatamente
// Isso garante que isLocalLlmActive() funcione mesmo antes do initLocalLlm()
try {
    const saved = localStorage.getItem("neo_local_llm_state");
    if (saved) {
        const parsed = JSON.parse(saved);
        localLlmState.enabled = parsed.enabled || false;
        localLlmState.activeModel = parsed.activeModel || null;
        localLlmState.downloadedModels = parsed.downloadedModels || [];
    }
} catch (e) {
    console.warn("[LocalLLM] Erro ao carregar estado inicial:", e);
}

// ===== ELEMENTOS DA UI =====
let localLlmModal = null;
let localLlmToggle = null;
let localLlmBtn = null;
let localLlmStatus = null;
let localLlmActiveName = null;

// ===== INICIALIZAÇÃO =====
async function initLocalLlm() {
    console.log("🤖 [LocalLLM] Inicializando llama.cpp nativo...");
    
    // Verificar se plugin está disponível
    if (typeof LlamaNative === 'undefined') {
        console.warn("⚠️ [LocalLLM] Plugin LlamaNative não disponível");
        console.warn("⚠️ [LocalLLM] IA Local requer execução no Android");
    } else {
        console.log("✅ [LocalLLM] Plugin LlamaNative disponível");
        console.log("📋 [LocalLLM] Métodos disponíveis:", Object.keys(LlamaNative));
        
        // Inicializar plugin
        try {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Timeout init")), 5000);
                LlamaNative.init(
                    () => { clearTimeout(timeout); resolve(); },
                    (err) => { clearTimeout(timeout); reject(new Error(err)); }
                );
            });
            console.log("✅ [LocalLLM] Plugin inicializado");
        } catch (e) {
            console.warn("⚠️ [LocalLLM] Erro ao inicializar plugin:", e?.message || e);
        }
        
        // Verificar se há download em andamento (background service)
        await checkBackgroundDownloadStatus();
    }
    
    // Carregar estado salvo
    loadLocalLlmState();
    loadLocalLlmConfig();
    
    // Verificar se modelos salvos realmente existem
    if (isNativePluginAvailable() && localLlmState.downloadedModels.length > 0) {
        try {
            const modelsData = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => resolve([]), 3000);
                LlamaNative.listModels(
                    (files) => { clearTimeout(timeout); resolve(files || []); },
                    () => { clearTimeout(timeout); resolve([]); }
                );
            });
            
            // Plugin retorna array de objetos {path, name, size}
            const existingFiles = Array.isArray(modelsData) 
                ? modelsData.map(m => typeof m === 'string' ? m : (m.path || m.name || '')).filter(p => p)
                : [];
            
            console.log("📂 [LocalLLM] Arquivos no dispositivo:", existingFiles);
            
            // Filtrar modelos que realmente existem
            const validModels = localLlmState.downloadedModels.filter(modelKey => {
                const model = LOCAL_LLM_MODELS[modelKey];
                if (!model) return false;
                return existingFiles.some(f => f.includes(model.fileName));
            });
            
            if (validModels.length !== localLlmState.downloadedModels.length) {
                console.warn(`⚠️ [LocalLLM] Alguns modelos não existem no dispositivo`);
                console.warn(`📋 [LocalLLM] Salvos: ${localLlmState.downloadedModels.join(", ")}`);
                console.warn(`📋 [LocalLLM] Válidos: ${validModels.join(", ")}`);
                
                localLlmState.downloadedModels = validModels;
                
                // Se modelo ativo foi removido, desativar
                if (localLlmState.activeModel && !validModels.includes(localLlmState.activeModel)) {
                    localLlmState.activeModel = validModels[0] || null;
                    if (!localLlmState.activeModel) {
                        localLlmState.enabled = false;
                    }
                }
                
                saveLocalLlmState();
            }
        } catch (e) {
            console.warn("[LocalLLM] Erro verificando modelos:", e);
        }
    }
    
    // Inicializar sistema de notificações de download
    initDownloadNotifications();
    
    // Criar elementos da UI
    createLocalLlmUI();
    
    // Atualizar UI
    updateLocalLlmUI();
    
    // Carregar modelo automaticamente ao abrir o app se modo offline está ativo
    // Isso garante que o chat funcione imediatamente
    if (localLlmState.enabled && localLlmState.activeModel && offlineModeEnabled) {
        console.log("[LocalLLM] Modo offline ativo, carregando modelo automaticamente...");
        // Carregar modelo em background com loading visual
        setTimeout(async () => {
            try {
                await loadLocalModelWithModal(localLlmState.activeModel);
                console.log("✅ [LocalLLM] Modelo carregado automaticamente na inicialização");
            } catch (e) {
                console.warn("⚠️ [LocalLLM] Erro ao carregar modelo na inicialização:", e);
            }
        }, 1000); // Delay para UI carregar primeiro
    }
    
    // Atualizar estado dos botões que requerem internet
    setTimeout(() => updateOnlineOnlyButtons(), 500);
    
    console.log("✅ [LocalLLM] Inicializado:", localLlmState);
}

// ===== FUNÇÃO DE DIAGNÓSTICO GLOBAL =====
window.debugLLM = function() {
    console.log("========== DEBUG LLM COMPLETO ==========");
    console.log("Estado:", JSON.stringify(localLlmState, null, 2));
    console.log("Config:", JSON.stringify(localLlmConfig, null, 2));
    console.log("Modelo ativo:", localLlmState.activeModel);
    console.log("Modelo em LOCAL_LLM_MODELS:", LOCAL_LLM_MODELS[localLlmState.activeModel]);
    console.log("Modo IA:", iaMode);
    console.log("Plugin disponível:", typeof LlamaNative !== 'undefined');
    console.log("Engine carregado:", !!localLlmState.engine);
    console.log("==========================================");
    
    // Retornar objeto para inspeção
    return {
        state: localLlmState,
        config: localLlmConfig,
        model: LOCAL_LLM_MODELS[localLlmState.activeModel],
        iaMode: iaMode,
        pluginAvailable: typeof LlamaNative !== 'undefined'
    };
};

// ===== VERIFICAR SE PLUGIN DISPONÍVEL =====
function isNativePluginAvailable() {
    const available = typeof LlamaNative !== 'undefined' && LlamaNative !== null;
    console.log(`🔌 [LocalLLM] Plugin disponível: ${available}`);
    if (!available) {
        console.warn("⚠️ [LocalLLM] LlamaNative não está definido. Cordova plugin não carregado?");
    }
    return available;
}

// ===== MODELO SIMPLIFICADO PARA A UI =====
const NEO_MODELS = {
    "neo-offline": {
        name: "NEO Offline",
        icon: "fa-solid fa-plane",
        iconStyle: "transform: rotate(-45deg);",
        size: "2.7 GB",
        modelKey: "gemma-2b-abliterated",
        description: "Gemma 2 2B desbloqueado - IA sem internet"
    }
};

// ===== ESTADO DOS MODOS (NOVO SISTEMA) =====
// Ambos podem estar ON ao mesmo tempo - sistema automático decide qual usar
let onlineModeEnabled = localStorage.getItem('neo_online_mode_enabled') !== 'false'; // default: true
let offlineModeEnabled = localStorage.getItem('neo_offline_mode_enabled') === 'true'; // default: false

// Função para salvar estados dos modos
function saveModeStates() {
    localStorage.setItem('neo_online_mode_enabled', onlineModeEnabled);
    localStorage.setItem('neo_offline_mode_enabled', offlineModeEnabled);
}

// Função para determinar qual modo usar AUTOMATICAMENTE
function shouldUseOfflineMode() {
    // Se offline está habilitado e online não, usa offline
    if (offlineModeEnabled && !onlineModeEnabled) {
        return true;
    }
    
    // Se online está habilitado e offline não, usa online
    if (onlineModeEnabled && !offlineModeEnabled) {
        return false;
    }
    
    // Se ambos estão habilitados, decide baseado na conexão
    if (onlineModeEnabled && offlineModeEnabled) {
        // Sem internet -> usa offline
        if (!navigator.onLine) {
            console.log("📴 [AutoMode] Sem internet - usando modo Offline");
            return true;
        }
        // Com internet -> usa online
        console.log("🌐 [AutoMode] Com internet - usando modo Online");
        return false;
    }
    
    // Se nenhum está habilitado, default para online (vai dar erro de API key)
    return false;
}

// Variável legada mantida para compatibilidade
let iaMode = localStorage.getItem('neo_ia_mode') || 'online';

// ===== CRIAR UI =====
function createLocalLlmUI() {
    // Verificar se já existe
    if (document.getElementById("local-llm-sidebar")) return;
    
    // Função auxiliar para gerar card de modelo NEO
    const generateNeoModelCard = (key, model) => {
        return `
        <div id="${key}-card" class="neo-model-card" data-neo-key="${key}">
            <div class="download-progress-bar" id="${key}-progress">
                <div class="download-progress-fill"></div>
            </div>
            <div class="neo-model-info">
                <i class="${model.icon} neo-model-icon" style="${model.iconStyle || ''}"></i>
                <span class="neo-model-name">${model.name}</span>
            </div>
            <button id="${key}-btn" class="neo-model-size-btn" data-neo-key="${key}">
                <span class="btn-text">${model.size}</span>
                <i class="fa-solid fa-download btn-icon"></i>
            </button>
        </div>`;
    };
    
    // Função auxiliar para gerar card de modelo completo (para AVANÇADO)
    // Usando mesma estrutura simplificada dos cards NEO
    const generateModelCard = (key, model) => `
        <div id="${key}-card" class="neo-model-card advanced-model-card" data-model-id="${key}">
            <div class="download-progress-bar" id="${key}-progress">
                <div class="download-progress-fill"></div>
            </div>
            <div class="neo-model-info">
                <img src="${model.logo}" alt="${model.company}" class="advanced-model-logo">
                <div class="advanced-model-text">
                    <span class="neo-model-name">${model.name}</span>
                    <span class="advanced-model-desc">${model.description}</span>
                </div>
            </div>
            <button id="${key}-btn" class="neo-model-size-btn" data-model-id="${key}">
                <span class="btn-text">${model.size}</span>
                <i class="fa-solid fa-download btn-icon"></i>
            </button>
        </div>`;
    
    // Carregar API key salva
    const savedApiKey = localStorage.getItem('neo_user_api_key') || '';
    
    // Criar Sidebar
    const sidebarHTML = `
    <div id="local-llm-sidebar" class="local-llm-sidebar">
        <div class="local-llm-sidebar-header" style="justify-content: flex-start; border-bottom: none; padding: 12px 16px;">
            <button class="local-llm-close-btn" onclick="closeLocalLlmModal()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        
        <div class="local-llm-sidebar-content">
            <!-- Tabs de modo -->
            <div class="ia-mode-tabs">
                <button class="ia-mode-tab active" data-mode="online" onclick="switchIaMode('online')">
                    <i class="fa-solid fa-globe"></i>
                    <span>Modo Online</span>
                </button>
                <button class="ia-mode-tab" data-mode="offline" onclick="switchIaMode('offline')">
                    <i class="fa-solid fa-plane" style="transform: rotate(-45deg);"></i>
                    <span>Modo Offline</span>
                </button>
            </div>
            
            <!-- ========== CONTEÚDO MODO ONLINE ========== -->
            <div id="ia-mode-online-content" class="ia-mode-content active">
                <div class="ia-mode-header">
                    <h2 class="ia-mode-title">Modo Online</h2>
                    <div id="online-mode-toggle" class="ia-mode-toggle ${onlineModeEnabled ? 'active' : ''}" onclick="toggleOnlineMode()">
                        <div class="ia-mode-toggle-knob"></div>
                    </div>
                </div>
                
                <div class="api-key-status-row">
                    <div id="apiKeyStatusNeon" class="api-key-status-badge ${savedApiKey ? 'testing' : 'empty'}">
                        <span>${savedApiKey ? '...' : ''}</span>
                    </div>
                </div>
                
                <div class="api-key-section">
                    <!-- Input da API Key -->
                    <input type="text" 
                           id="userApiKeyInput" 
                           class="api-key-input-field" 
                           placeholder="Insira aqui sua chave API"
                           value="${savedApiKey}"
                           oninput="onApiKeyInput(this.value)">
                    
                    <button class="api-key-get-btn" onclick="openApiKeyPage()">
                        <span>Pegar chave API</span>
                    </button>
                    
                    <p class="api-key-description">
                        Para usar a IA, você precisa inserir sua chave de API ela é o motor do chat. 
                        Usar sua própria API garante muito mais privacidade, limites diários maiores e controle total.
                    </p>
                    
                    <div class="api-key-steps">
                        <div class="api-key-step">
                            <span class="step-number">1</span>
                            <span>Clique em "Pegar chave API"</span>
                        </div>
                        <div class="api-key-step">
                            <span class="step-number">2</span>
                            <span>A chave será gerada</span>
                        </div>
                        <div class="api-key-step">
                            <span class="step-number">3</span>
                            <span><strong style="color: #ff4444; font-weight: 700;">Arraste para o lado</strong> e clique em <i class="fa-regular fa-copy"></i></span>
                        </div>
                        <div class="api-key-step">
                            <span class="step-number">4</span>
                            <span>Depois cole a chave neste espaço</span>
                        </div>
                    </div>
                </div>
                
                <!-- Botão Avançado -->
                <button class="ia-advanced-btn" onclick="toggleAdvancedOnline()">
                    AVANÇADO
                </button>
                
                <!-- Conteúdo avançado online (escondido por padrão) -->
                <div id="advanced-online-content" class="advanced-content" style="display:none;">
                    
                    <!-- Botão Seletor de Modelo Premium -->
                    <div class="model-selector-section">
                        <label class="model-selector-label">
                            <i class="fa-solid fa-robot"></i>
                            <span>Modelo de IA</span>
                        </label>
                        <button type="button" class="model-selector-btn" id="openModelSelectorBtn">
                            <div class="model-selector-content">
                                <img id="selectedModelIcon" class="model-btn-icon" src="https://www.google.com/s2/favicons?domain=google.com&sz=32" alt="icon">
                                <span id="selectedModelName">gemini-2.5-flash</span>
                            </div>
                            <i class="fa-solid fa-chevron-right model-selector-arrow"></i>
                        </button>
                        <p class="model-selector-hint">Toque para escolher qual IA usar</p>
                    </div>
                    
                    <p class="advanced-description">Configure APIs de diferentes provedores:</p>
                    
                    <!-- Google Gemini -->
                    <div class="api-provider-card" data-provider="gemini">
                        <div class="api-provider-header" onclick="toggleApiProvider('gemini')">
                            <div class="api-provider-info">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png" alt="Google" class="api-provider-logo">
                                <div class="api-provider-text">
                                    <span class="api-provider-name">Google Gemini</span>
                                    <span class="api-provider-desc">Recomendado • Gratuito</span>
                                </div>
                            </div>
                            <div class="api-provider-status">
                                <span class="api-provider-badge free">GRÁTIS</span>
                                <i class="fa-solid fa-chevron-down api-provider-chevron"></i>
                            </div>
                        </div>
                        <div class="api-provider-content" id="gemini-api-content">
                            <input type="text" class="api-provider-input" id="geminiApiKeyInput" 
                                   placeholder="Cole sua API Key do Gemini" 
                                   value="${localStorage.getItem('neo_user_api_key') || ''}"
                                   oninput="syncApiKeyFromAdvanced(this.value)">
                            <button class="api-provider-get-btn" onclick="window.open('https://aistudio.google.com/apikey', '_system')">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                    
                    <!-- DeepSeek -->
                    <div class="api-provider-card" data-provider="deepseek">
                        <div class="api-provider-header" onclick="toggleApiProvider('deepseek')">
                            <div class="api-provider-info">
                                <img src="https://images.seeklogo.com/logo-png/61/2/deepseek-ai-icon-logo-png_seeklogo-611473.png" alt="DeepSeek" class="api-provider-logo">
                                <div class="api-provider-text">
                                    <span class="api-provider-name">DeepSeek</span>
                                    <span class="api-provider-desc">Muito barato • Reasoning</span>
                                </div>
                            </div>
                            <div class="api-provider-status">
                                <span class="api-provider-badge cheap">BARATO</span>
                                <i class="fa-solid fa-chevron-down api-provider-chevron"></i>
                            </div>
                        </div>
                        <div class="api-provider-content" id="deepseek-api-content">
                            <input type="text" class="api-provider-input" id="deepseekApiKeyInput" 
                                   placeholder="Cole sua API Key do DeepSeek" 
                                   value="${localStorage.getItem('neo_api_deepseek') || ''}"
                                   oninput="saveProviderApiKey('deepseek', this.value)">
                            <button class="api-provider-get-btn" onclick="window.open('https://platform.deepseek.com/api_keys', '_system')">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                    
                    <!-- OpenAI -->
                    <div class="api-provider-card" data-provider="openai">
                        <div class="api-provider-header" onclick="toggleApiProvider('openai')">
                            <div class="api-provider-info">
                                <img src="https://1millionbot.com/wp-content/uploads/2023/03/ChatGPT_logo.png" alt="OpenAI" class="api-provider-logo">
                                <div class="api-provider-text">
                                    <span class="api-provider-name">OpenAI</span>
                                    <span class="api-provider-desc">GPT-4o • o1 • ChatGPT</span>
                                </div>
                            </div>
                            <div class="api-provider-status">
                                <span class="api-provider-badge filter-warning">TEM FILTROS</span>
                                <i class="fa-solid fa-chevron-down api-provider-chevron"></i>
                            </div>
                        </div>
                        <div class="api-provider-content" id="openai-api-content">
                            <input type="text" class="api-provider-input" id="openaiApiKeyInput" 
                                   placeholder="Cole sua API Key da OpenAI" 
                                   value="${localStorage.getItem('neo_api_openai') || ''}"
                                   oninput="saveProviderApiKey('openai', this.value)">
                            <button class="api-provider-get-btn" onclick="window.open('https://platform.openai.com/api-keys', '_system')">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                    
                    <!-- Anthropic Claude -->
                    <div class="api-provider-card" data-provider="anthropic">
                        <div class="api-provider-header" onclick="toggleApiProvider('anthropic')">
                            <div class="api-provider-info">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg" alt="Anthropic" class="api-provider-logo">
                                <div class="api-provider-text">
                                    <span class="api-provider-name">Anthropic Claude</span>
                                    <span class="api-provider-desc">Claude 3.5 • Sonnet • Opus</span>
                                </div>
                            </div>
                            <div class="api-provider-status">
                                <span class="api-provider-badge filter-warning">TEM FILTROS</span>
                                <i class="fa-solid fa-chevron-down api-provider-chevron"></i>
                            </div>
                        </div>
                        <div class="api-provider-content" id="anthropic-api-content">
                            <input type="text" class="api-provider-input" id="anthropicApiKeyInput" 
                                   placeholder="Cole sua API Key da Anthropic" 
                                   value="${localStorage.getItem('neo_api_anthropic') || ''}"
                                   oninput="saveProviderApiKey('anthropic', this.value)">
                            <button class="api-provider-get-btn" onclick="window.open('https://console.anthropic.com/settings/keys', '_system')">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                    
                    <!-- Groq -->
                    <div class="api-provider-card" data-provider="groq">
                        <div class="api-provider-header" onclick="toggleApiProvider('groq')">
                            <div class="api-provider-info">
                                <img src="https://play-lh.googleusercontent.com/dQRKhi30KpzG3gww3TdVLzyIAVuOAWylnAcgnEUxqfpm2A8dEt2sgApVvtKAy-DO8aI" alt="Groq" class="api-provider-logo">
                                <div class="api-provider-text">
                                    <span class="api-provider-name">Groq</span>
                                    <span class="api-provider-desc">Ultra rápido • Llama 3.3</span>
                                </div>
                            </div>
                            <div class="api-provider-status">
                                <span class="api-provider-badge filter-warning">TEM FILTROS</span>
                                <span class="api-provider-badge free">GRÁTIS</span>
                                <i class="fa-solid fa-chevron-down api-provider-chevron"></i>
                            </div>
                        </div>
                        <div class="api-provider-content" id="groq-api-content">
                            <input type="text" class="api-provider-input" id="groqApiKeyInput" 
                                   placeholder="Cole sua API Key do Groq" 
                                   value="${localStorage.getItem('neo_api_groq') || ''}"
                                   oninput="saveProviderApiKey('groq', this.value)">
                            <button class="api-provider-get-btn" onclick="window.open('https://console.groq.com/keys', '_system')">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                    
                    <!-- OpenRouter -->
                    <div class="api-provider-card" data-provider="openrouter">
                        <div class="api-provider-header" onclick="toggleApiProvider('openrouter')">
                            <div class="api-provider-info">
                                <img src="https://images.seeklogo.com/logo-png/61/1/openrouter-logo-png_seeklogo-611674.png" alt="OpenRouter" class="api-provider-logo">
                                <div class="api-provider-text">
                                    <span class="api-provider-name">OpenRouter</span>
                                    <span class="api-provider-desc">Todos os modelos • Gateway</span>
                                </div>
                            </div>
                            <div class="api-provider-status">
                                <span class="api-provider-badge cheap">VARIÁVEL</span>
                                <i class="fa-solid fa-chevron-down api-provider-chevron"></i>
                            </div>
                        </div>
                        <div class="api-provider-content" id="openrouter-api-content">
                            <input type="text" class="api-provider-input" id="openrouterApiKeyInput" 
                                   placeholder="Cole sua API Key do OpenRouter" 
                                   value="${localStorage.getItem('neo_api_openrouter') || ''}"
                                   oninput="saveProviderApiKey('openrouter', this.value)">
                            <button class="api-provider-get-btn" onclick="window.open('https://openrouter.ai/keys', '_system')">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ========== CONTEÚDO MODO OFFLINE ========== -->
            <div id="ia-mode-offline-content" class="ia-mode-content">
                <div class="ia-mode-header">
                    <h2 class="ia-mode-title">Modo Offline</h2>
                    <div id="offline-mode-toggle" class="ia-mode-toggle ${offlineModeEnabled ? 'active' : ''}" onclick="toggleOfflineMode()">
                        <div class="ia-mode-toggle-knob"></div>
                    </div>
                </div>
                
                <!-- Cards de modelos NEO simplificados -->
                <div class="neo-models-list">
                    ${Object.entries(NEO_MODELS).map(([key, model]) => generateNeoModelCard(key, model)).join('')}
                </div>
                
                <p class="offline-description">
                    Para usar a IA offline, é necessário baixar um modelo de linguagem no seu dispositivo. 
                    O modelo funciona como o cérebro da IA e permite respostas rápidas, privadas e sem internet.
                </p>
                
                <!-- Botão Avançado -->
                <!-- Botão Limpar Dados -->
                <button class="ia-clear-data-btn" onclick="clearAllLlmData()">
                    <i class="fa-solid fa-trash-can"></i> LIMPAR TODOS OS DADOS
                </button>
                
                <button class="ia-advanced-btn" onclick="toggleAdvancedOffline()">
                    AVANÇADO
                </button>
                
                <!-- Conteúdo avançado offline (escondido por padrão) -->
                <div id="advanced-offline-content" class="advanced-content" style="display:none;">
                    <p class="advanced-description">Mais modelos disponíveis:</p>
                    
                    <div class="local-llm-models">
                        <div class="local-llm-category">
                            <h4><i class="fa-solid fa-feather"></i> Leves (até 1GB)</h4>
                        </div>
                        ${Object.entries(LOCAL_LLM_MODELS).filter(([k,m]) => m.category === 'light').map(([key, model]) => generateModelCard(key, model)).join('')}
                        
                        <div class="local-llm-category">
                            <h4><i class="fa-solid fa-fire"></i> Médios (2-3GB)</h4>
                        </div>
                        ${Object.entries(LOCAL_LLM_MODELS).filter(([k,m]) => m.category === 'medium').map(([key, model]) => generateModelCard(key, model)).join('')}
                        
                        <div class="local-llm-category">
                            <h4><i class="fa-solid fa-rocket"></i> Pesados (5-10GB)</h4>
                        </div>
                        ${Object.entries(LOCAL_LLM_MODELS).filter(([k,m]) => m.category === 'heavy').map(([key, model]) => generateModelCard(key, model)).join('')}
                        
                        <div class="local-llm-category">
                            <h4><i class="fa-solid fa-microchip"></i> Ultra (10GB+) - Máxima Inteligência</h4>
                        </div>
                        ${Object.entries(LOCAL_LLM_MODELS).filter(([k,m]) => m.category === 'ultra').map(([key, model]) => generateModelCard(key, model)).join('')}
                    </div>
                    
                    <!-- Card de Configurações Avançadas -->
                    <div class="local-llm-config-card">
                        <div class="local-llm-config-header" onclick="toggleLocalLlmConfig()">
                            <span><i class="fa-solid fa-sliders"></i> Configurações</span>
                            <i class="fa-solid fa-chevron-down local-llm-config-chevron" id="localLlmConfigChevron"></i>
                        </div>
                        <div class="local-llm-config-content" id="localLlmConfigContent">
                            <div class="local-llm-input-grid">
                                <div class="local-llm-input-group">
                                    <label>Context Size</label>
                                    <input type="number" id="nCtxInput" value="4096" min="512" max="32768" onchange="updateLocalLlmConfig('nCtx', this.value)">
                                </div>
                                <div class="local-llm-input-group">
                                    <label>Max Response</label>
                                    <input type="number" id="maxTokensInput" value="2048" min="64" max="8192" onchange="updateLocalLlmConfig('maxTokens', this.value)">
                                </div>
                                <div class="local-llm-input-group">
                                    <label>Temperature</label>
                                    <input type="number" id="tempInput" value="0.7" min="0" max="2" step="0.1" onchange="updateLocalLlmConfig('temperature', this.value)">
                                </div>
                                <div class="local-llm-input-group">
                                    <label>Top P</label>
                                    <input type="number" id="topPInput" value="0.9" min="0" max="1" step="0.05" onchange="updateLocalLlmConfig('topP', this.value)">
                                </div>
                                <div class="local-llm-input-group">
                                    <label>Top K</label>
                                    <input type="number" id="topKInput" value="40" min="1" max="100" onchange="updateLocalLlmConfig('topK', this.value)">
                                </div>
                                <div class="local-llm-input-group">
                                    <label>Rep. Penalty</label>
                                    <input type="number" id="repetitionPenaltyInput" value="1.1" min="1" max="2" step="0.05" onchange="updateLocalLlmConfig('repetitionPenalty', this.value)">
                                </div>
                            </div>
                            <button class="local-llm-reset-config-btn" onclick="resetLocalLlmConfig()">
                                <i class="fa-solid fa-rotate-left"></i> Restaurar Padrões
                            </button>
                        </div>
                    </div>
                    
                    <div class="local-llm-info">
                        <p><i class="fa-solid fa-info-circle"></i> Os modelos são baixados uma vez e ficam salvos no dispositivo. Funciona 100% offline.</p>
                    </div>
                    
                    <button id="local-llm-delete-all-btn" class="local-llm-delete-all-btn">
                        <i class="fa-solid fa-trash"></i>
                        <span>Apagar todos os modelos</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div id="local-llm-backdrop" class="local-llm-backdrop" onclick="closeLocalLlmModal()"></div>`;
    
    document.body.insertAdjacentHTML("beforeend", sidebarHTML);
    
    // Guardar referências
    localLlmModal = document.getElementById("local-llm-sidebar");
    localLlmToggle = document.getElementById("local-llm-toggle");
    localLlmStatus = document.getElementById("local-llm-status");
    localLlmActiveName = document.getElementById("local-llm-active-name");
    
    // ===== EVENT DELEGATION =====
    // Usar delegation no sidebar inteiro para que os eventos funcionem
    // mesmo após o innerHTML dos botões ser alterado
    const sidebar = document.getElementById("local-llm-sidebar");
    if (sidebar) {
        sidebar.addEventListener("click", function(e) {
            console.log("🖱️ [Delegation] Clique detectado em:", e.target.tagName, e.target.className);
            
            // Verificar se clicou em um botão de modelo
            const btn = e.target.closest('.neo-model-size-btn');
            if (btn) {
                console.log("🖱️ [Delegation] Botão encontrado:", btn.id, "data-model-id:", btn.dataset.modelId, "data-neo-key:", btn.dataset.neoKey);
                e.preventDefault();
                e.stopPropagation();
                handleButtonClick(btn);
                return;
            }
            
            // Verificar se clicou em um card (mas não no botão)
            const card = e.target.closest('.neo-model-card');
            if (card && !e.target.closest('.neo-model-size-btn')) {
                handleCardClick(card);
                return;
            }
        });
        console.log("[LocalLLM] Event delegation configurado no sidebar");
    }
    
    // Adicionar evento ao botão de apagar todos (legado - se existir)
    const deleteAllBtn = document.getElementById("local-llm-delete-all-btn");
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            console.log("🗑️ [LocalLLM] Clicou em deletar TODOS os modelos");
            clearAllLlmData();
        });
    }
    
    // Sincronizar seletor de modelo avançado com o modelo atual
    syncAdvancedModelSelect();
    
    // Adicionar event listeners aos inputs de API (mais confiável que oninput inline)
    setupApiKeyInputListeners();
    
    // Se tem chave salva, testar automaticamente
    const savedKey = localStorage.getItem('neo_user_api_key');
    if (savedKey && savedKey.trim()) {
        setTimeout(() => testApiKeyAuto(savedKey.trim()), 500);
    }
    
    // Atualizar UI dos modelos NEO
    updateNeoModelsUI();
}

/**
 * Handler para clique em BOTÃO (via delegation)
 */
function handleButtonClick(btn) {
    console.log("🔘 [handleButtonClick] Botão clicado:", btn.id);
    console.log("🔘 [handleButtonClick] data-neo-key:", btn.dataset.neoKey);
    console.log("🔘 [handleButtonClick] data-model-id:", btn.dataset.modelId);
    console.log("🔘 [handleButtonClick] className:", btn.className);
    
    let modelId = null;
    
    // Pegar modelId do botão
    if (btn.dataset.modelId) {
        modelId = btn.dataset.modelId;
        console.log("🔘 [handleButtonClick] modelId via data-model-id:", modelId);
    } else if (btn.dataset.neoKey) {
        const neoModel = NEO_MODELS[btn.dataset.neoKey];
        if (neoModel) {
            modelId = neoModel.modelKey;
            console.log("🔘 [handleButtonClick] modelId via data-neo-key:", modelId);
        }
    } else {
        // Fallback: extrair do ID
        const btnKey = btn.id?.replace('-btn', '');
        console.log("🔘 [handleButtonClick] Fallback btnKey:", btnKey);
        if (btnKey && NEO_MODELS[btnKey]) {
            modelId = NEO_MODELS[btnKey].modelKey;
            console.log("🔘 [handleButtonClick] modelId via fallback NEO:", modelId);
        } else if (btnKey && LOCAL_LLM_MODELS[btnKey]) {
            modelId = btnKey;
            console.log("🔘 [handleButtonClick] modelId via fallback LOCAL:", modelId);
        }
    }
    
    if (!modelId) {
        console.log("⚠️ [Btn] Não encontrou modelId para:", btn.id);
        return;
    }
    
    console.log("🖱️ [Btn] Clique em botão, modelId final:", modelId);
    handleModelButtonAction(modelId);
}

/**
 * Handler para clique em CARD (via delegation)
 */
function handleCardClick(card) {
    let modelId = null;
    
    // Pegar modelId do card
    if (card.dataset.modelId) {
        modelId = card.dataset.modelId;
    } else if (card.dataset.neoKey) {
        const neoModel = NEO_MODELS[card.dataset.neoKey];
        if (neoModel) modelId = neoModel.modelKey;
    } else {
        // Fallback: extrair do ID
        const cardKey = card.id?.replace('-card', '');
        if (cardKey && NEO_MODELS[cardKey]) {
            modelId = NEO_MODELS[cardKey].modelKey;
        } else if (cardKey && LOCAL_LLM_MODELS[cardKey]) {
            modelId = cardKey;
        }
    }
    
    if (!modelId) {
        console.log("⚠️ [Card] Não encontrou modelId para:", card.id);
        return;
    }
    
    console.log("🖱️ [Card] Clique em card:", modelId);
    
    const isDownloaded = localLlmState.downloadedModels.includes(modelId);
    const isActive = localLlmState.activeModel === modelId && localLlmState.enabled;
    
    // Só selecionar se baixado e não ativo
    if (isDownloaded && !isActive) {
        selectModel(modelId);
    }
}

// Atualizar indicador de status da API key (badge pequeno no header)
// status: 'empty' | 'testing' | 'active' | 'error'
function updateApiKeyStatusNeon(status, message) {
    const neon = document.getElementById('apiKeyStatusNeon');
    if (!neon) return;
    
    const configs = {
        'empty': { text: '', class: 'empty' },
        'testing': { text: '...', class: 'testing' },
        'active': { text: 'Ativo', class: 'active' },
        'error': { text: 'Inválido', class: 'error' }
    };
    
    const cfg = configs[status] || configs['empty'];
    neon.className = 'api-key-status-badge ' + cfg.class;
    neon.innerHTML = '<span>' + cfg.text + '</span>';
    
    // Controlar toggle do modo online baseado no status da chave
    const onlineToggle = document.getElementById('online-mode-toggle');
    if (onlineToggle) {
        if (status === 'active') {
            // Chave válida - ativar toggle automaticamente
            onlineToggle.classList.add('active');
        } else if (status === 'empty' || status === 'error') {
            // Chave inválida ou removida - desativar toggle
            onlineToggle.classList.remove('active');
        }
        // 'testing' não muda o estado do toggle
    }
}

// Debounce para teste automático
let apiKeyTestTimeout = null;

// Handler de input da API key - testa automaticamente
function onApiKeyInput(value) {
    const trimmed = (value || '').trim();
    
    // Salvar imediatamente
    saveUserApiKey(trimmed);
    
    // Cancelar teste anterior
    if (apiKeyTestTimeout) {
        clearTimeout(apiKeyTestTimeout);
        apiKeyTestTimeout = null;
    }
    
    if (!trimmed) {
        updateApiKeyStatusNeon('empty');
        localStorage.removeItem('neo_api_key_tested');
        return;
    }
    
    // Mostrar "testando" imediatamente
    updateApiKeyStatusNeon('testing');
    
    // Aguardar 800ms sem digitar para testar
    apiKeyTestTimeout = setTimeout(() => {
        testApiKeyAuto(trimmed);
    }, 800);
}

// Testar API key automaticamente (sem botão)
async function testApiKeyAuto(apiKey) {
    if (!apiKey) {
        updateApiKeyStatusNeon('empty');
        return false;
    }
    
    updateApiKeyStatusNeon('testing');
    
    try {
        const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
        
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'OK' }] }],
                generationConfig: { maxOutputTokens: 5 }
            })
        });
        
        if (response.ok || response.status === 429) {
            // Chave válida!
            updateApiKeyStatusNeon('active', response.status === 429 ? 'Ativo (limite)' : 'Ativo');
            localStorage.setItem('neo_api_key_tested', 'true');
            
            // Limpar chaves falhas
            if (typeof clearAllFailedKeys === 'function') {
                clearAllFailedKeys();
            }
            
            // Definir modelo Gemini
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect && !modelSelect.value.startsWith('gemini')) {
                modelSelect.value = 'gemini-2.5-flash';
                modelSelect.dispatchEvent(new Event('change'));
            }
            
            // Sincronizar seletor avançado
            syncAdvancedModelSelect();
            
            return true;
        } else {
            updateApiKeyStatusNeon('error', 'Inválido');
            localStorage.removeItem('neo_api_key_tested');
            return false;
        }
    } catch (error) {
        console.error('[API Test] Erro:', error);
        updateApiKeyStatusNeon('error', 'Erro');
        return false;
    }
}

// Sincronizar seletor de modelo avançado
function syncAdvancedModelSelect() {
    const modelSelect = document.getElementById('modelSelect');
    const advancedSelect = document.getElementById('advancedModelSelect');
    
    if (modelSelect && advancedSelect) {
        const currentValue = modelSelect.value;
        // Verificar se o valor existe no select avançado
        const optionExists = Array.from(advancedSelect.options).some(opt => opt.value === currentValue);
        if (optionExists) {
            advancedSelect.value = currentValue;
        }
    }
}

// Handler de mudança do seletor de modelo avançado
function onAdvancedModelChange(value) {
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.value = value;
        modelSelect.dispatchEvent(new Event('change'));
        console.log('🔄 [IA] Modelo alterado para:', value);
        showToast('Modelo alterado para ' + value.split('-').slice(-2).join(' '), 'success');
    }
}

// Manter função antiga para compatibilidade (mas não usamos mais)
function updateApiKeyStatusBadge(status, message) {
    // Redirecionar para o novo sistema neon
    const statusMap = {
        'inactive': 'empty',
        'pending': 'testing',
        'testing': 'testing',
        'active': 'active',
        'error': 'error'
    };
    updateApiKeyStatusNeon(statusMap[status] || 'empty', message);
}

// Testar a chave API (versão com toast - chamada pelo botão antigo se existir)
async function testApiKey() {
    const apiKeyInput = document.getElementById('userApiKeyInput');
    const testBtn = document.getElementById('testApiKeyBtn');
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
    
    if (!apiKey) {
        updateApiKeyStatusBadge('inactive', 'Insira uma chave');
        showToast('Insira uma chave API primeiro!', 'warning');
        return false;
    }
    
    // SALVAR A CHAVE IMEDIATAMENTE (antes de testar)
    localStorage.setItem('neo_user_api_key', apiKey);
    console.log('🔑 [API] Chave salva em neo_user_api_key');
    
    // Desabilitar botão e mostrar loading
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>...</span>';
    }
    updateApiKeyStatusBadge('testing');
    
    try {
        // Fazer requisição de teste ao Gemini (usar modelo que existe)
        const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
        
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Responda apenas: OK' }] }],
                generationConfig: { maxOutputTokens: 10 }
            })
        });
        
        if (response.ok || response.status === 429) {
            // Chave válida! (429 = rate limit mas chave é válida)
            const isRateLimited = response.status === 429;
            
            updateApiKeyStatusBadge('active', isRateLimited ? 'Válida (limite)' : 'Funcionando!');
            showToast(isRateLimited ? 'Chave válida, mas no limite de uso' : 'Chave API válida! ✓', isRateLimited ? 'info' : 'success');
            
            // Marcar como testada
            localStorage.setItem('neo_api_key_tested', 'true');
            
            // LIMPAR TODAS as chaves marcadas como falhas
            if (typeof clearAllFailedKeys === 'function') {
                clearAllFailedKeys();
                console.log('🧹 [API] Todas as chaves falhas limpas');
            }
            
            // Mudar modelo para Gemini
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect) {
                modelSelect.value = 'gemini-2.5-flash';
                modelSelect.dispatchEvent(new Event('change'));
                console.log('🔄 [API] Modelo alterado para gemini-2.5-flash');
            }
            
            if (testBtn) {
                testBtn.disabled = false;
                testBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>OK!</span>';
                setTimeout(() => {
                    testBtn.innerHTML = '<i class="fa-solid fa-vial"></i> <span>Testar</span>';
                }, 2000);
            }
            return true;
        } else {
            // Erro na API
            let errorMsg = 'Chave inválida';
            if (response.status === 400) errorMsg = 'Chave inválida';
            else if (response.status === 403) errorMsg = 'Chave bloqueada';
            
            updateApiKeyStatusBadge('error', errorMsg);
            showToast('Erro: ' + errorMsg, 'error');
            localStorage.removeItem('neo_api_key_tested');
        }
    } catch (error) {
        console.error('[API Test] Erro:', error);
        updateApiKeyStatusBadge('error', 'Erro de rede');
        showToast('Erro de conexão. Verifique sua internet.', 'error');
    }
    
    if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fa-solid fa-vial"></i> <span>Testar</span>';
    }
    return false;
}

// ===== FUNÇÕES DA NOVA UI =====

// Trocar entre modo online e offline
function switchIaMode(mode) {
    iaMode = mode;
    localStorage.setItem('neo_ia_mode', mode);
    
    // Atualizar tabs
    document.querySelectorAll('.ia-mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Atualizar conteúdo
    document.querySelectorAll('.ia-mode-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`ia-mode-${mode}-content`).classList.add('active');
    
    console.log(`🔄 [IA Mode] Mudou para tab: ${mode}`);
}

// Toggle modo online (NOVO: não desativa o outro modo)
async function toggleOnlineMode() {
    const toggle = document.getElementById('online-mode-toggle');
    const isActive = toggle.classList.contains('active');
    
    if (!isActive) {
        // Verificar se tem alguma chave API válida em qualquer provedor
        let hasValidKey = false;
        const providers = ['gemini', 'deepseek', 'openai', 'anthropic', 'groq', 'openrouter'];
        
        for (const provider of providers) {
            if (typeof getAllApiKeys === 'function') {
                const keys = getAllApiKeys(provider);
                if (keys && keys.length > 0) {
                    hasValidKey = true;
                    console.log(`✅ [OnlineMode] Chave válida encontrada: ${provider}`);
                    break;
                }
            }
        }
        
        // Fallback: verificar campo principal
        if (!hasValidKey) {
            const apiKeyInput = document.getElementById('userApiKeyInput');
            const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
            if (apiKey) {
                hasValidKey = true;
            }
        }
        
        if (!hasValidKey) {
            showToast('Configure uma chave API primeiro!', 'warning');
            // Abrir seção de API keys se existir
            const apiSection = document.querySelector('.api-provider-card');
            if (apiSection) {
                apiSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Ativar modo online
        toggle.classList.add('active');
        onlineModeEnabled = true;
        saveModeStates();
        
        // Mostrar status do sistema
        updateModeStatusDisplay();
        showToast('Modo Online ativado', 'success');
    } else {
        // Desativar modo online
        // Verificar se offline está ativo, senão não permite desativar
        if (!offlineModeEnabled) {
            showToast('Ative o modo Offline primeiro!', 'warning');
            return;
        }
        
        toggle.classList.remove('active');
        onlineModeEnabled = false;
        saveModeStates();
        updateModeStatusDisplay();
        showToast('Modo Online desativado', 'info');
    }
    
    updateOnlineOnlyButtons();
}

// Toggle modo offline (NOVO: não desativa o outro modo)
async function toggleOfflineMode() {
    const toggle = document.getElementById('offline-mode-toggle');
    const isActive = toggle.classList.contains('active');
    
    if (!isActive) {
        // Verificar se tem modelo baixado
        if (localLlmState.downloadedModels.length === 0) {
            showToast('Baixe um modelo primeiro!', 'warning');
            return;
        }
        
        // Ativar modo offline
        toggle.classList.add('active');
        offlineModeEnabled = true;
        localLlmState.enabled = true;
        
        // Se não tem modelo ativo, usar o primeiro baixado
        if (!localLlmState.activeModel && localLlmState.downloadedModels.length > 0) {
            localLlmState.activeModel = localLlmState.downloadedModels[0];
        }
        
        saveModeStates();
        saveLocalLlmState();
        updateModeStatusDisplay();
        
        // Carregar modelo APENAS se existe modelo ativo
        if (localLlmState.activeModel) {
            loadLocalModelWithModal(localLlmState.activeModel);
        } else {
            console.warn('[LocalLLM] Nenhum modelo ativo para carregar');
        }
        showToast('Modo Offline ativado', 'success');
    } else {
        // Desativar modo offline
        // Verificar se online está ativo, senão não permite desativar
        if (!onlineModeEnabled) {
            showToast('Ative o modo Online primeiro!', 'warning');
            return;
        }
        
        toggle.classList.remove('active');
        offlineModeEnabled = false;
        localLlmState.enabled = false;
        
        saveModeStates();
        saveLocalLlmState();
        unloadLocalModel();
        updateModeStatusDisplay();
        showToast('Modo Offline desativado', 'info');
    }
    
    updateLocalLlmUI();
    updateOnlineOnlyButtons();
}

// Atualizar display de status do modo atual
function updateModeStatusDisplay() {
    // Podemos adicionar um indicador visual se necessário
    console.log(`📊 [Mode Status] Online: ${onlineModeEnabled}, Offline: ${offlineModeEnabled}`);
    console.log(`📊 [Mode Status] Modo atual: ${shouldUseOfflineMode() ? 'OFFLINE' : 'ONLINE'}`);
}

// Atualizar botões que requerem internet (desabilitar no modo offline exclusivo)
function updateOnlineOnlyButtons() {
    // Só desabilita botões se APENAS offline está ativo (sem online como fallback)
    const isOfflineOnly = offlineModeEnabled && !onlineModeEnabled;
    
    // TODOS os botões de anexo - desativados no modo offline
    const allAttachBtns = [
        'attachFileBtn',       // Inserir arquivo
        'attachCameraBtn',     // Tirar foto
        'attachAgentBtn',      // Modo agente
        'attachWebSearchBtn',  // Busca web
        'attachImageGenBtn',   // Gerar imagem
        'attachChartBtn',      // Gerar gráfico
        'attachDocumentBtn',   // Criar documento
        'attachMindMapBtn'     // Mapa mental
    ];
    
    // Desabilitar/habilitar todos os anexos
    allAttachBtns.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            if (isOfflineOnly) {
                btn.classList.add('disabled-offline');
                btn.setAttribute('data-offline-disabled', 'true');
                btn.style.opacity = '0.4';
                btn.style.pointerEvents = 'none';
            } else {
                btn.classList.remove('disabled-offline');
                btn.removeAttribute('data-offline-disabled');
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
            }
        }
    });
    
    // Também desabilitar o botão principal de anexo
    const mainAttachBtn = document.getElementById('attachBtn');
    if (mainAttachBtn) {
        if (isOfflineOnly) {
            mainAttachBtn.classList.add('disabled-offline');
            mainAttachBtn.style.opacity = '0.4';
            mainAttachBtn.style.pointerEvents = 'none';
            mainAttachBtn.title = 'Anexos indisponíveis no modo offline';
        } else {
            mainAttachBtn.classList.remove('disabled-offline');
            mainAttachBtn.style.opacity = '';
            mainAttachBtn.style.pointerEvents = '';
            mainAttachBtn.title = 'Anexar';
        }
    }
}

// Salvar API key do usuário (fonte única: neo_user_api_key)
function saveUserApiKey(key) {
    const trimmedKey = (key || '').trim();
    
    if (trimmedKey) {
        localStorage.setItem('neo_user_api_key', trimmedKey);
    } else {
        localStorage.removeItem('neo_user_api_key');
        // Limpar também outras possíveis fontes antigas
        localStorage.removeItem('neo_api_gemini');
        localStorage.removeItem('neo_api_key_tested');
    }
    
    // Sincronizar inputs
    const userInput = document.getElementById('userApiKeyInput');
    const advancedInput = document.getElementById('geminiApiKeyInput');
    
    if (userInput && userInput.value !== trimmedKey) {
        userInput.value = trimmedKey;
    }
    if (advancedInput && advancedInput.value !== trimmedKey) {
        advancedInput.value = trimmedKey;
    }
    
    console.log('🔑 [API] Chave Gemini salva:', trimmedKey ? '✅' : '❌ (removida)');
}

// Sincronizar chave do input avançado para o principal
function syncApiKeyFromAdvanced(value) {
    const trimmed = (value || '').trim();
    saveUserApiKey(trimmed);
    
    // Disparar o teste automático
    onApiKeyInput(trimmed);
}

// Salvar API key de qualquer provider
function saveProviderApiKey(provider, value) {
    const trimmed = (value || '').trim();
    
    // Mapeamento de provider para localStorage key
    const storageKeys = {
        'gemini': 'neo_user_api_key',
        'deepseek': 'neo_api_deepseek',
        'openai': 'neo_api_openai',
        'anthropic': 'neo_api_anthropic',
        'groq': 'neo_api_groq',
        'openrouter': 'neo_api_openrouter'
    };
    
    const key = storageKeys[provider];
    if (!key) {
        console.warn(`[API] Provider desconhecido: ${provider}`);
        return;
    }
    
    if (trimmed) {
        localStorage.setItem(key, trimmed);
        console.log(`🔑 [API] Chave ${provider} salva: ${trimmed.substring(0, 10)}...`);
    } else {
        localStorage.removeItem(key);
        console.log(`🔑 [API] Chave ${provider} removida`);
    }
}

// Configurar event listeners para inputs de API (mais confiável que oninput inline)
function setupApiKeyInputListeners() {
    console.log('🔧 [API] Configurando listeners de inputs de API...');
    
    // Input principal do modo online
    const userApiKeyInput = document.getElementById('userApiKeyInput');
    if (userApiKeyInput) {
        userApiKeyInput.addEventListener('input', function() {
            onApiKeyInput(this.value);
        });
        console.log('✅ [API] Listener adicionado: userApiKeyInput');
    }
    
    // Input Gemini no Avançado
    const geminiInput = document.getElementById('geminiApiKeyInput');
    if (geminiInput) {
        geminiInput.addEventListener('input', function() {
            syncApiKeyFromAdvanced(this.value);
        });
        console.log('✅ [API] Listener adicionado: geminiApiKeyInput');
    }
    
    // Inputs dos outros providers
    const providerInputs = {
        'deepseekApiKeyInput': 'deepseek',
        'openaiApiKeyInput': 'openai',
        'anthropicApiKeyInput': 'anthropic',
        'groqApiKeyInput': 'groq',
        'openrouterApiKeyInput': 'openrouter'
    };
    
    for (const [inputId, provider] of Object.entries(providerInputs)) {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function() {
                saveProviderApiKey(provider, this.value);
            });
            console.log(`✅ [API] Listener adicionado: ${inputId}`);
        }
    }
}

// Abrir página para pegar API key
function openApiKeyPage() {
    const url = 'https://aistudio.google.com/apikey';
    
    // Tentar abrir no navegador do sistema
    if (window.cordova && cordova.InAppBrowser) {
        cordova.InAppBrowser.open(url, '_system');
    } else {
        window.open(url, '_blank');
    }
}

// Toggle conteúdo avançado online
function toggleAdvancedOnline() {
    const content = document.getElementById('advanced-online-content');
    if (content) {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
        
        // Sincronizar input avançado com o principal ao abrir
        if (content.style.display === 'block') {
            const mainKey = localStorage.getItem('neo_user_api_key') || '';
            const advancedInput = document.getElementById('geminiApiKeyInput');
            if (advancedInput) {
                advancedInput.value = mainKey;
            }
        }
    }
}

// Toggle card de provedor de API
function toggleApiProvider(provider) {
    const card = document.querySelector(`.api-provider-card[data-provider="${provider}"]`);
    if (card) {
        // Fechar outros cards abertos
        document.querySelectorAll('.api-provider-card.expanded').forEach(c => {
            if (c !== card) c.classList.remove('expanded');
        });
        // Toggle o card clicado
        card.classList.toggle('expanded');
    }
}

// Salvar chave de API individual (chamado automaticamente via oninput)
function saveProviderApiKey(provider, value) {
    if (value && value.trim()) {
        localStorage.setItem(`neo_api_${provider}`, value.trim());
    } else {
        localStorage.removeItem(`neo_api_${provider}`);
    }
}

// Toggle conteúdo avançado offline
function toggleAdvancedOffline() {
    const content = document.getElementById('advanced-offline-content');
    if (content) {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
}

// =====================================================================
// ===== NOVO SISTEMA DE DOWNLOAD - REFATORADO DO ZERO =====
// =====================================================================

/**
 * ESTADO DO DOWNLOAD
 * - downloadInProgress: modelo sendo baixado ou null
 * - downloadProgress: progresso atual (0-100)
 * - downloadCancelled: flag para cancelamento
 */
const downloadState = {
    inProgress: null,      // modelId sendo baixado ou null
    progress: 0,           // 0-100
    cancelled: false,      // flag de cancelamento
    startTime: null        // timestamp início
};

/**
 * VERIFICAR STATUS DE DOWNLOAD EM BACKGROUND
 * Chamado quando o app é aberto para verificar se há download em andamento
 */
async function checkBackgroundDownloadStatus() {
    if (!isNativePluginAvailable() || typeof LlamaNative.getDownloadStatus !== 'function') {
        return;
    }
    
    try {
        const status = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => resolve(null), 3000);
            LlamaNative.getDownloadStatus(
                (result) => { clearTimeout(timeout); resolve(result); },
                (err) => { clearTimeout(timeout); resolve(null); }
            );
        });
        
        if (!status) return;
        
        console.log("📥 [Download] Status do background:", status);
        
        if (status.isDownloading && status.filename) {
            // Encontrar modelo pelo filename
            const modelId = Object.keys(LOCAL_LLM_MODELS).find(key => 
                LOCAL_LLM_MODELS[key].fileName === status.filename
            );
            
            if (modelId) {
                console.log(`📥 [Download] Download em andamento: ${modelId} (${status.progress}%)`);
                
                // Atualizar estado
                downloadState.inProgress = modelId;
                downloadState.progress = status.progress;
                downloadState.startTime = Date.now();
                
                // Atualizar UI
                updateModelButtonUI(modelId, 'downloading', status.progress);
                showDownloadNotification(LOCAL_LLM_MODELS[modelId].name, status.progress);
                
                // Iniciar polling para verificar progresso
                startBackgroundDownloadPolling(modelId);
            }
        } else if (status.success && status.filePath) {
            // Download concluiu enquanto app estava fechado
            const modelId = Object.keys(LOCAL_LLM_MODELS).find(key => 
                LOCAL_LLM_MODELS[key].fileName === status.filename
            );
            
            if (modelId && !localLlmState.downloadedModels.includes(modelId)) {
                console.log(`✅ [Download] Download concluído em background: ${modelId}`);
                
                // Registrar modelo
                localLlmState.downloadedModels.push(modelId);
                localLlmState.activeModel = modelId;
                localLlmState.enabled = true;
                saveLocalLlmState();
                
                // Atualizar UI
                refreshAllModelButtons();
                showToast(`${LOCAL_LLM_MODELS[modelId].name} baixado com sucesso!`, "success");
            }
        }
    } catch (e) {
        console.warn("⚠️ [Download] Erro ao verificar status:", e);
    }
}

/**
 * POLLING para verificar progresso de download em background
 */
let backgroundPollingInterval = null;

function startBackgroundDownloadPolling(modelId) {
    // Limpar polling anterior
    if (backgroundPollingInterval) {
        clearInterval(backgroundPollingInterval);
    }
    
    backgroundPollingInterval = setInterval(async () => {
        if (!isNativePluginAvailable()) {
            clearInterval(backgroundPollingInterval);
            return;
        }
        
        try {
            const status = await new Promise((resolve, reject) => {
                LlamaNative.getDownloadStatus(
                    (result) => resolve(result),
                    (err) => resolve(null)
                );
            });
            
            if (!status) return;
            
            if (status.isDownloading) {
                // Atualizar progresso
                downloadState.progress = status.progress;
                updateModelButtonUI(modelId, 'downloading', status.progress);
                updateDownloadNotification(LOCAL_LLM_MODELS[modelId]?.name || modelId, status.progress);
            } else if (status.success) {
                // Download concluído!
                clearInterval(backgroundPollingInterval);
                backgroundPollingInterval = null;
                
                console.log(`✅ [Download] Concluído via polling: ${modelId}`);
                
                // Registrar modelo
                if (!localLlmState.downloadedModels.includes(modelId)) {
                    localLlmState.downloadedModels.push(modelId);
                }
                localLlmState.activeModel = modelId;
                localLlmState.enabled = true;
                localLlmState.currentDownloadId = null;
                saveLocalLlmState();
                
                // Limpar estado de download
                downloadState.inProgress = null;
                downloadState.progress = 0;
                
                // Atualizar UI
                refreshAllModelButtons();
                hideDownloadNotification();
                showDownloadCompleteNotification(LOCAL_LLM_MODELS[modelId]?.name || modelId, true);
                showToast(`${LOCAL_LLM_MODELS[modelId]?.name || modelId} pronto!`, "success");
                
                // Ativar modo offline
                iaMode = 'offline';
                localStorage.setItem('neo_ia_mode', 'offline');
                document.getElementById('offline-mode-toggle')?.classList.add('active');
                document.getElementById('online-mode-toggle')?.classList.remove('active');
                
            } else if (status.error) {
                // Download falhou
                clearInterval(backgroundPollingInterval);
                backgroundPollingInterval = null;
                
                console.error(`❌ [Download] Erro via polling: ${status.error}`);
                
                downloadState.inProgress = null;
                downloadState.progress = 0;
                
                refreshAllModelButtons();
                hideDownloadNotification();
                showToast(`Erro no download: ${status.error}`, "error");
            }
        } catch (e) {
            console.warn("⚠️ [Download] Erro no polling:", e);
        }
    }, 2000); // Verificar a cada 2 segundos
}

/**
 * INICIAR DOWNLOAD DE MODELO
 * Função principal - limpa e direta
 */
async function startModelDownload(modelId) {
    const model = LOCAL_LLM_MODELS[modelId];
    if (!model) {
        showToast("Modelo não encontrado", "error");
        return false;
    }
    
    // Verificar se já tem download ativo
    if (downloadState.inProgress) {
        showToast("Aguarde o download atual terminar", "warning");
        return false;
    }
    
    // Verificar plugin nativo
    if (!isNativePluginAvailable()) {
        showToast("Plugin não disponível", "error");
        return false;
    }
    
    console.log(`📥 [Download] ========== INICIANDO DOWNLOAD ==========`);
    console.log(`📥 [Download] Modelo: ${model.name}`);
    
    // ===== CONFIGURAR ESTADO =====
    downloadState.inProgress = modelId;
    downloadState.progress = 0;
    downloadState.cancelled = false;
    downloadState.startTime = Date.now();
    
    // ===== MOSTRAR NOTIFICAÇÃO =====
    showDownloadNotification(model.name, 0);
    
    // ===== ATUALIZAR UI =====
    updateModelButtonUI(modelId, 'downloading', 0);
    showToast(`Baixando ${model.name}...`, "info");
    
    // Iniciar polling como backup
    startBackgroundDownloadPolling(modelId);
    
    // Executar download
    return new Promise((resolve) => {
        LlamaNative.downloadModel(
            { url: model.modelUrl, filename: model.fileName },
            // PROGRESSO
            (data) => {
                // IGNORAR se foi cancelado ou se não é mais este download
                if (downloadState.cancelled || downloadState.inProgress !== modelId) {
                    return;
                }
                
                // O plugin pode enviar objeto ou número
                let percent = 0;
                if (typeof data === 'object' && data.percent !== undefined) {
                    percent = data.percent;
                } else if (typeof data === 'number') {
                    percent = data;
                } else if (typeof data === 'string') {
                    percent = parseInt(data, 10);
                }
                
                // Validar
                if (isNaN(percent) || percent < 0) percent = 0;
                if (percent > 100) percent = 100;
                
                // Só avançar (nunca voltar)
                if (percent >= downloadState.progress) {
                    downloadState.progress = percent;
                    updateModelButtonUI(modelId, 'downloading', percent);
                    updateDownloadNotification(model.name, percent);
                    
                    // Log a cada 10%
                    if (percent % 10 === 0 && percent > 0) {
                        const elapsed = (Date.now() - downloadState.startTime) / 1000;
                        console.log(`📥 [Download] ${model.name}: ${percent}% (${elapsed.toFixed(0)}s)`);
                    }
                }
            },
            // SUCESSO
            (result) => {
                // Parar polling
                if (backgroundPollingInterval) {
                    clearInterval(backgroundPollingInterval);
                    backgroundPollingInterval = null;
                }
                
                // IGNORAR se foi cancelado
                if (downloadState.cancelled) {
                    console.log(`🚫 [Download] Ignorando sucesso - foi cancelado`);
                    resolve(false);
                    return;
                }
                console.log(`✅ [Download] Concluído: ${model.name}`);
                
                // Registrar modelo como baixado
                if (!localLlmState.downloadedModels.includes(modelId)) {
                    localLlmState.downloadedModels.push(modelId);
                }
                
                // Definir como modelo ativo
                localLlmState.activeModel = modelId;
                localLlmState.enabled = true;
                localLlmState.currentDownloadId = null;
                
                // Salvar e atualizar
                saveLocalLlmState();
                
                // Limpar estado de download
                downloadState.inProgress = null;
                downloadState.progress = 0;
                
                // Atualizar UI
                refreshAllModelButtons();
                hideDownloadNotification();
                showDownloadCompleteNotification(model.name, true);
                showToast(`${model.name} pronto para usar!`, "success");
                
                // Ativar modo offline
                iaMode = 'offline';
                localStorage.setItem('neo_ia_mode', 'offline');
                document.getElementById('offline-mode-toggle')?.classList.add('active');
                document.getElementById('online-mode-toggle')?.classList.remove('active');
                
                resolve(true);
            },
            // ERRO
            (error) => {
                // Parar polling
                if (backgroundPollingInterval) {
                    clearInterval(backgroundPollingInterval);
                    backgroundPollingInterval = null;
                }
                
                console.error(`❌ [Download] Erro: ${error}`);
                
                // Limpar estado
                downloadState.inProgress = null;
                downloadState.progress = 0;
                localLlmState.currentDownloadId = null;
                
                // Atualizar UI
                refreshAllModelButtons();
                hideDownloadNotification();
                
                if (!downloadState.cancelled) {
                    showDownloadCompleteNotification(model.name, false);
                    showToast(`Erro no download: ${error}`, "error");
                }
                
                resolve(false);
            }
        );
    });
}

/**
 * CANCELAR DOWNLOAD ATIVO
 */
function cancelActiveDownload() {
    const modelId = downloadState.inProgress;
    if (!modelId) {
        console.log("⚠️ [Download] Nenhum download ativo para cancelar");
        return;
    }
    
    console.log(`🛑 [Download] Cancelando: ${modelId}`);
    
    // Parar polling
    if (backgroundPollingInterval) {
        clearInterval(backgroundPollingInterval);
        backgroundPollingInterval = null;
    }
    
    // PRIMEIRO: Marcar como cancelado e limpar estado IMEDIATAMENTE
    downloadState.cancelled = true;
    downloadState.inProgress = null;
    downloadState.progress = 0;
    localLlmState.currentDownloadId = null;
    
    // Chamar plugin para cancelar o download em andamento
    if (isNativePluginAvailable() && typeof LlamaNative.cancelDownload === 'function') {
        LlamaNative.cancelDownload(
            {},
            () => console.log("✅ [Download] Cancelamento enviado ao plugin"),
            (err) => console.warn("⚠️ [Download] Erro no cancelamento:", err)
        );
    }
    
    // Deletar arquivo parcial
    const model = LOCAL_LLM_MODELS[modelId];
    if (model) {
        console.log(`🗑️ [Download] Deletando arquivo parcial: ${model.fileName}`);
        deleteModelFile(model.fileName);
    }
    
    // Atualizar UI - agora vai mostrar estado 'default' (botão de download)
    refreshAllModelButtons();
    hideDownloadNotification();
    showToast("Download cancelado", "info");
    
    // Resetar flag cancelled após um delay (para ignorar callbacks atrasados)
    setTimeout(() => {
        downloadState.cancelled = false;
        console.log(`✅ [Download] Flag cancelled resetada`);
    }, 2000);
}

/**
 * DELETAR MODELO BAIXADO
 */
function deleteDownloadedModel(modelId) {
    const model = LOCAL_LLM_MODELS[modelId];
    if (!model) return;
    
    if (!confirm(`Apagar ${model.name}?\n\nIsso vai liberar espaço no dispositivo.`)) {
        return;
    }
    
    console.log(`🗑️ [Delete] Apagando: ${model.name}`);
    
    // Descarregar se estiver ativo
    if (localLlmState.activeModel === modelId) {
        unloadLocalModel();
        localLlmState.activeModel = null;
        localLlmState.enabled = false;
    }
    
    // Remover da lista
    localLlmState.downloadedModels = localLlmState.downloadedModels.filter(m => m !== modelId);
    saveLocalLlmState();
    
    // Deletar arquivo
    deleteModelFile(model.fileName);
    
    // Atualizar UI
    refreshAllModelButtons();
    showToast(`${model.name} apagado!`, "success");
}

/**
 * DELETAR ARQUIVO DE MODELO
 */
function deleteModelFile(filename) {
    if (!isNativePluginAvailable()) return;
    
    LlamaNative.deleteModel(
        { filename },
        () => console.log(`✅ [Delete] Arquivo deletado: ${filename}`),
        (err) => console.warn(`⚠️ [Delete] Erro ao deletar: ${err}`)
    );
}

/**
 * SELECIONAR MODELO COMO ATIVO
 */
function selectModel(modelId) {
    const model = LOCAL_LLM_MODELS[modelId];
    if (!model) return;
    
    // Verificar se está baixado
    if (!localLlmState.downloadedModels.includes(modelId)) {
        showToast("Baixe o modelo primeiro", "warning");
        return;
    }
    
    console.log(`✨ [Select] Ativando: ${model.name}`);
    
    // Definir como ativo
    localLlmState.activeModel = modelId;
    localLlmState.enabled = true;
    saveLocalLlmState();
    
    // Modo offline
    iaMode = 'offline';
    localStorage.setItem('neo_ia_mode', 'offline');
    document.getElementById('offline-mode-toggle')?.classList.add('active');
    document.getElementById('online-mode-toggle')?.classList.remove('active');
    
    // Atualizar UI
    refreshAllModelButtons();
    
    // Carregar modelo com modal
    loadLocalModelWithModal(modelId);
}

// =====================================================================
// ===== SISTEMA DE UI - REFEITO DO ZERO =====
// =====================================================================

/**
 * ENCONTRAR TODOS OS ELEMENTOS RELACIONADOS A UM MODELO
 * Um modelo pode ter elementos tanto no painel NEO quanto no Avançado
 * Retorna arrays de todos os elementos encontrados
 */
function getAllElementsForModel(modelId) {
    const elements = {
        buttons: [],
        cards: [],
        progressBars: []
    };
    
    // 1. Buscar elemento direto pelo modelId (avançado)
    const directBtn = document.getElementById(`${modelId}-btn`);
    const directCard = document.getElementById(`${modelId}-card`);
    const directProgress = document.getElementById(`${modelId}-progress`);
    
    if (directBtn) elements.buttons.push(directBtn);
    if (directCard) elements.cards.push(directCard);
    if (directProgress) elements.progressBars.push(directProgress);
    
    // 2. Buscar elemento NEO que usa esse modelId
    for (const [neoKey, neoModel] of Object.entries(NEO_MODELS)) {
        if (neoModel.modelKey === modelId) {
            const neoBtn = document.getElementById(`${neoKey}-btn`);
            const neoCard = document.getElementById(`${neoKey}-card`);
            const neoProgress = document.getElementById(`${neoKey}-progress`);
            
            if (neoBtn) elements.buttons.push(neoBtn);
            if (neoCard) elements.cards.push(neoCard);
            if (neoProgress) elements.progressBars.push(neoProgress);
        }
    }
    
    return elements;
}

/**
 * ATUALIZAR UI DE TODOS OS ELEMENTOS DE UM MODELO
 * Atualiza TANTO o card NEO quanto o Avançado se ambos existirem
 */
function updateModelUI(modelId, state, progress = 0) {
    const elements = getAllElementsForModel(modelId);
    const model = LOCAL_LLM_MODELS[modelId];
    const size = model?.size || "???";
    
    console.log(`🎨 [UI] Atualizando ${modelId}: state=${state}, progress=${progress}`);
    console.log(`🎨 [UI] Encontrou: ${elements.buttons.length} botões, ${elements.cards.length} cards, ${elements.progressBars.length} barras`);
    
    // Atualizar TODOS os botões encontrados
    elements.buttons.forEach(btn => {
        switch (state) {
            case 'downloading':
                btn.className = 'neo-model-size-btn downloading';
                btn.innerHTML = `<span class="btn-text">${progress}%</span><i class="fa-solid fa-stop btn-icon"></i>`;
                break;
            case 'downloaded':
                btn.className = 'neo-model-size-btn downloaded';
                btn.innerHTML = `<span class="btn-text">Apagar</span><i class="fa-solid fa-trash btn-icon"></i>`;
                break;
            default:
                btn.className = 'neo-model-size-btn';
                btn.innerHTML = `<span class="btn-text">${size}</span><i class="fa-solid fa-download btn-icon"></i>`;
        }
    });
    
    // Atualizar TODAS as barras de progresso encontradas
    elements.progressBars.forEach(progressBar => {
        const fill = progressBar.querySelector('.download-progress-fill');
        if (state === 'downloading') {
            progressBar.classList.add('active');
            if (fill) fill.style.width = `${progress}%`;
        } else {
            progressBar.classList.remove('active');
            if (fill) fill.style.width = '0%';
        }
    });
    
    // Atualizar TODOS os cards encontrados
    elements.cards.forEach(card => {
        if (state === 'downloading') {
            card.classList.add('downloading');
        } else {
            card.classList.remove('downloading');
        }
    });
}

/**
 * ATUALIZAR ESTADO ATIVO/INATIVO DE UM MODELO
 */
function updateModelActiveState(modelId, isActive) {
    const elements = getAllElementsForModel(modelId);
    
    elements.cards.forEach(card => {
        card.classList.toggle('active', isActive);
    });
}

/**
 * ATUALIZAR TODOS OS MODELOS - ESTADO COMPLETO
 */
function refreshAllModelButtons() {
    console.log("🔄 [UI] Atualizando todos os modelos...");
    
    // Coletar todos os modelIds únicos (dos NEO + Avançados)
    const allModelIds = new Set();
    
    // Adicionar modelIds dos NEO
    for (const neoModel of Object.values(NEO_MODELS)) {
        allModelIds.add(neoModel.modelKey);
    }
    
    // Adicionar modelIds avançados
    for (const modelId of Object.keys(LOCAL_LLM_MODELS)) {
        allModelIds.add(modelId);
    }
    
    // Atualizar cada modelo
    for (const modelId of allModelIds) {
        const isDownloaded = localLlmState.downloadedModels.includes(modelId);
        const isDownloading = downloadState.inProgress === modelId;
        const isActive = localLlmState.activeModel === modelId && localLlmState.enabled;
        
        // Determinar estado
        let state = 'default';
        if (isDownloading) {
            state = 'downloading';
        } else if (isDownloaded) {
            state = 'downloaded';
        }
        
        // Atualizar UI
        updateModelUI(modelId, state, isDownloading ? downloadState.progress : 0);
        updateModelActiveState(modelId, isActive && isDownloaded);
    }
    
    // Atualizar toggle offline
    const offlineToggle = document.getElementById('offline-mode-toggle');
    if (offlineToggle) {
        offlineToggle.classList.toggle('active', localLlmState.enabled);
    }
    
    console.log("✅ [UI] Atualização completa");
}

// Aliases para compatibilidade
function updateModelButtonUI(modelId, state, progress = 0) {
    updateModelUI(modelId, state, progress);
}

function updateModelCardUI(modelId, isActive) {
    updateModelActiveState(modelId, isActive);
}

// =====================================================================
// ===== HANDLERS DE CLIQUE =====
// =====================================================================

/**
 * Handler para clique no botão NEO (via onclick no HTML)
 */
function handleNeoDownloadClick(neoKey) {
    const neoModel = NEO_MODELS[neoKey];
    if (!neoModel) return;
    
    const modelId = neoModel.modelKey;
    handleModelButtonAction(modelId);
}
window.handleNeoDownloadClick = handleNeoDownloadClick;

/**
 * Handler para clique no botão Avançado (via onclick no HTML)
 */
function handleAdvancedDownloadClick(modelId) {
    if (!LOCAL_LLM_MODELS[modelId]) return;
    handleModelButtonAction(modelId);
}
window.handleAdvancedDownloadClick = handleAdvancedDownloadClick;

/**
 * Ação do botão baseada no estado
 */
function handleModelButtonAction(modelId) {
    console.log(`🎯 [Action] Ação para: ${modelId}`);
    console.log(`🎯 [Action] Download ativo: ${downloadState.inProgress}`);
    console.log(`🎯 [Action] Baixados: ${localLlmState.downloadedModels.join(', ')}`);
    
    const isDownloaded = localLlmState.downloadedModels.includes(modelId);
    const isDownloading = downloadState.inProgress === modelId;
    const anyDownloadActive = downloadState.inProgress !== null;
    
    // Se tem download ativo de OUTRO modelo, avisar
    if (anyDownloadActive && !isDownloading) {
        showToast("Aguarde o download atual terminar", "warning");
        return;
    }
    
    if (isDownloading) {
        console.log("🎯 [Action] → Cancelar download");
        cancelActiveDownload();
    } else if (isDownloaded) {
        console.log("🎯 [Action] → Deletar modelo");
        deleteDownloadedModel(modelId);
    } else {
        console.log("🎯 [Action] → Iniciar download");
        startModelDownload(modelId);
    }
}

// =====================================================================
// ===== FUNÇÕES DE UI DOS MODELOS (mantidas para compatibilidade) =====
// =====================================================================

function updateNeoModelsUI() {
    refreshAllModelButtons();
}

function updateAdvancedModelsUI() {
    refreshAllModelButtons();
}

// Alias para compatibilidade
function cancelDownload(modelId) {
    cancelActiveDownload();
}

// =====================================================================
// ===== SISTEMA LEGADO DE DOWNLOAD (substituído) =====
// =====================================================================

// Estas funções são mantidas apenas para compatibilidade
// mas redirecionam para o novo sistema

async function downloadModel(modelId) {
    return startModelDownload(modelId);
}

async function downloadModelUnified(modelId, neoKey) {
    return startModelDownload(modelId);
}

function deleteModelUnified(modelId) {
    deleteDownloadedModel(modelId);
}

function selectModelUnified(modelId) {
    selectModel(modelId);
}

// Funções legadas (não usadas mais, mas mantidas para não quebrar)
function handleNeoModelClick(e) { /* legado */ }
function handleNeoCardClick(e) { /* legado */ }
function handleUnifiedCardClick(e) { /* legado - agora usa handleCardClick */ }
function handleUnifiedModelClick(e) { /* legado - agora usa handleButtonClick */ }
function setupNeoEvents() { /* legado */ }
function handleNeoButtonClick(key) { handleNeoDownloadClick(key); }
function startNeoDownload(key) { handleNeoDownloadClick(key); }
function cancelNeoDownload(key) { cancelActiveDownload(); }
function deleteNeoModel(key) {
    const neoModel = NEO_MODELS[key];
    if (neoModel) deleteDownloadedModel(neoModel.modelKey);
}
function selectNeoModel(key) {
    const neoModel = NEO_MODELS[key];
    if (neoModel) selectModel(neoModel.modelKey);
}
function initNeoModelEvents() { refreshAllModelButtons(); }

// Manter compatibilidade com localLlmState.currentDownloadId
Object.defineProperty(localLlmState, 'currentDownloadId', {
    get: function() { return downloadState.inProgress; },
    set: function(val) { downloadState.inProgress = val; }
});

// ===== FUNÇÕES DE LIMPEZA DE DADOS =====

// Limpar todos os dados de LLM
function clearAllLlmData() {
    if (!confirm('Apagar TODOS os modelos e dados?\n\nIsso vai:\n• Deletar TODOS os arquivos de modelos LLM\n• Limpar todas as configurações\n• Liberar espaço no dispositivo\n\nEssa ação não pode ser desfeita!')) {
        return;
    }
    
    console.log('🧹 [LIMPEZA] Iniciando limpeza TOTAL...');
    showToast('Limpando dados...', 'info');
    
    // Descarregar modelo da memória ANTES de tudo
    unloadLocalModel();
    
    // Deletar arquivos via plugin nativo
    if (isNativePluginAvailable() && typeof LlamaNative.deleteAllModels === 'function') {
        LlamaNative.deleteAllModels(
            {},
            (result) => {
                console.log(`✅ [LIMPEZA] Deletados: ${result.deletedCount} arquivos`);
                showToast(`${result.deletedCount} arquivos apagados! (${result.freedFormatted})`, 'success');
                forceResetLlmState();
            },
            (err) => {
                console.error(`❌ [LIMPEZA] Erro: ${err}`);
                showToast(`Erro: ${err}`, 'error');
                forceResetLlmState();
            }
        );
    } else {
        forceResetLlmState();
    }
}

// Resetar estado do LLM completamente
function forceResetLlmState() {
    console.log('🚨 [LocalLLM] RESET COMPLETO...');
    
    // Limpar estado
    localLlmState.downloadedModels = [];
    localLlmState.activeModel = null;
    localLlmState.enabled = false;
    localLlmState.modelLoaded = false;
    localLlmState.engine = null;
    
    // Limpar download state
    downloadState.inProgress = null;
    downloadState.progress = 0;
    downloadState.cancelled = false;
    
    // Limpar localStorage
    localStorage.removeItem('neo_local_llm_state');
    localStorage.removeItem('neo_local_llm_config');
    
    // Salvar estado limpo
    saveLocalLlmState();
    
    // Atualizar UI
    refreshAllModelButtons();
    updateLocalLlmUI();
    
    console.log('✅ [LocalLLM] Estado resetado');
}

// Alias para compatibilidade
function resetLlmState() {
    forceResetLlmState();
}

// Função para deletar todos os modelos com confirmação
function deleteAllModelsWithConfirm() {
    clearAllLlmData();
}

// Expor funções globalmente
window.switchIaMode = switchIaMode;
window.toggleOnlineMode = toggleOnlineMode;
window.toggleOfflineMode = toggleOfflineMode;
window.openApiKeyPage = openApiKeyPage;
window.toggleAdvancedOnline = toggleAdvancedOnline;
window.toggleAdvancedOffline = toggleAdvancedOffline;
window.clearAllLlmData = clearAllLlmData;

// ===== ABRIR SIDEBAR NO MODO ONLINE (para configurar API) =====
function openOnlineModeSidebar() {
    if (!localLlmModal) createLocalLlmUI();
    
    // Garantir que está no modo online
    iaMode = 'online';
    localStorage.setItem('neo_ia_mode', 'online');
    
    const sidebar = document.getElementById("local-llm-sidebar");
    const backdrop = document.getElementById("local-llm-backdrop");
    
    if (sidebar) {
        sidebar.classList.add("open");
    }
    if (backdrop) {
        backdrop.classList.add("open");
    }
    
    // Mudar para modo online
    switchIaMode('online');
    
    updateLocalLlmUI();
    updateConfigInputs();
}
window.openOnlineModeSidebar = openOnlineModeSidebar;

// ===== ABRIR/FECHAR MODAL =====
function openLocalLlmModal() {
    if (!localLlmModal) createLocalLlmUI();
    
    const sidebar = document.getElementById("local-llm-sidebar");
    const backdrop = document.getElementById("local-llm-backdrop");
    
    if (sidebar) {
        sidebar.classList.add("open");
    }
    if (backdrop) {
        backdrop.classList.add("open");
    }
    
    // Sincronizar modo salvo
    iaMode = localStorage.getItem('neo_ia_mode') || 'online';
    switchIaMode(iaMode);
    
    // Atualizar toggles baseado no estado
    const onlineToggle = document.getElementById('online-mode-toggle');
    const offlineToggle = document.getElementById('offline-mode-toggle');
    
    if (onlineToggle) {
        onlineToggle.classList.toggle('active', iaMode === 'online' && !localLlmState.enabled);
    }
    if (offlineToggle) {
        offlineToggle.classList.toggle('active', localLlmState.enabled);
    }
    
    updateLocalLlmUI();
    updateConfigInputs();
    loadElevenLabsSettings();
    
    // Inicializar eventos dos modelos NEO
    initNeoModelEvents();
}

function closeLocalLlmModal() {
    const sidebar = document.getElementById("local-llm-sidebar");
    const backdrop = document.getElementById("local-llm-backdrop");
    
    if (sidebar) {
        sidebar.classList.remove("open");
    }
    if (backdrop) {
        backdrop.classList.remove("open");
    }
}

// ===== TOGGLE LLM LOCAL =====
async function toggleLocalLlm() {
    // Se não tem modelo baixado, não pode ativar
    if (!localLlmState.enabled && localLlmState.downloadedModels.length === 0) {
        showToast("Baixe um modelo primeiro!", "warning");
        return;
    }
    
    // Carregar WebLLM se necessário
    if (!localLlmState.enabled) {
        const loaded = await loadWebLLM();
        if (!loaded) return;
    }
    
    // Se não tem modelo ativo mas tem baixados, usar o primeiro
    if (!localLlmState.enabled && !localLlmState.activeModel && localLlmState.downloadedModels.length > 0) {
        localLlmState.activeModel = localLlmState.downloadedModels[0];
    }
    
    localLlmState.enabled = !localLlmState.enabled;
    
    if (localLlmState.enabled) {
        // Carregar o modelo com modal
        await loadLocalModelWithModal(localLlmState.activeModel);
    } else {
        // Descarregar modelo
        unloadLocalModel();
        showToast("Voltando para API online", "info");
    }
    
    saveLocalLlmState();
    updateLocalLlmUI();
}

// ===============================================
// ===== SISTEMA DE NOTIFICAÇÃO DE DOWNLOAD =====
// ===============================================
// Implementação do ZERO - 100% nova

let downloadNotificationActive = false;

/**
 * Inicializa o sistema de notificações
 * Deve ser chamado após deviceready
 */
function initDownloadNotifications() {
    // Usar o background mode plugin para mostrar notificação persistente
    if (window.cordova && cordova.plugins && cordova.plugins.backgroundMode) {
        cordova.plugins.backgroundMode.setDefaults({
            title: 'Neo AI',
            text: 'Baixando modelo de IA...',
            icon: 'ic_launcher',
            color: '00C864',
            resume: true,
            hidden: false,
            bigText: true
        });
        
        // Permitir atualização do texto
        cordova.plugins.backgroundMode.on('activate', function() {
            console.log('📱 [BGMode] Ativado');
        });
        
        console.log('📱 [Notification] Sistema inicializado via BackgroundMode');
    }
}

/**
 * Mostra notificação de download usando BackgroundMode
 */
function showDownloadNotification(modelName, percent) {
    if (!window.cordova || !cordova.plugins || !cordova.plugins.backgroundMode) {
        console.warn('📱 [Notification] BackgroundMode não disponível');
        return;
    }
    
    // Ativar background mode (isso mostra a notificação)
    cordova.plugins.backgroundMode.enable();
    downloadNotificationActive = true;
    
    // Atualizar texto da notificação
    cordova.plugins.backgroundMode.configure({
        title: 'Neo AI - Baixando Modelo',
        text: `${modelName}: ${percent}%`,
        icon: 'ic_launcher',
        color: '00C864',
        resume: true,
        hidden: false,
        bigText: true
    });
    
    console.log(`📱 [Notification] Download: ${modelName} ${percent}%`);
}

/**
 * Atualiza o progresso na notificação
 */
function updateDownloadNotification(modelName, percent) {
    if (!downloadNotificationActive) return;
    
    if (window.cordova && cordova.plugins && cordova.plugins.backgroundMode) {
        cordova.plugins.backgroundMode.configure({
            text: `${modelName}: ${percent}%`
        });
    }
}

/**
 * Esconde a notificação de download
 */
function hideDownloadNotification() {
    if (!window.cordova || !cordova.plugins || !cordova.plugins.backgroundMode) return;
    
    downloadNotificationActive = false;
    cordova.plugins.backgroundMode.disable();
    console.log('📱 [Notification] Download notification hidden');
}

/**
 * Mostra notificação de conclusão
 */
function showDownloadCompleteNotification(modelName, success) {
    // Usar toast como fallback já que a notificação de bg mode será desativada
    if (success) {
        showToast(`✅ ${modelName} baixado com sucesso!`, 'success');
    } else {
        showToast(`❌ Erro ao baixar ${modelName}`, 'error');
    }
    
    // Esconder notificação de progresso
    hideDownloadNotification();
}

// ===============================================

// ===== CARREGAR MODELO =====
async function loadLocalModel(modelId) {
    if (!modelId) {
        console.error("❌ [LocalLLM] loadLocalModel chamado sem modelId");
        return false;
    }
    
    if (localLlmState.isLoading) {
        console.warn("⚠️ [LocalLLM] Já está carregando um modelo");
        return false;
    }
    
    const model = LOCAL_LLM_MODELS[modelId];
    if (!model) {
        console.error(`❌ [LocalLLM] Modelo não encontrado: ${modelId}`);
        return false;
    }
    
    localLlmState.isLoading = true;
    // Toast removido - modal de carregamento cuida da UI
    
    try {
        // Verificar se plugin disponível
        if (!isNativePluginAvailable()) {
            throw new Error("Plugin LlamaNative não disponível. O app precisa ser executado no Android.");
        }
        
        console.log(`🔄 [LocalLLM] Carregando modelo NATIVO: ${model.name}`);
        console.log(`🔄 [LocalLLM] Arquivo esperado: ${model.fileName}`);
        
        // Listar modelos para verificar se existe
        let modelFiles = [];
        try {
            const modelsData = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Timeout listando modelos")), 5000);
                LlamaNative.listModels(
                    (files) => { clearTimeout(timeout); resolve(files || []); },
                    (err) => { clearTimeout(timeout); reject(new Error(err || "Erro ao listar modelos")); }
                );
            });
            
            // Plugin retorna array de objetos {path, name, size}
            // Converter para array de paths
            if (Array.isArray(modelsData)) {
                modelFiles = modelsData.map(m => {
                    if (typeof m === 'string') return m;
                    return m.path || m.name || '';
                }).filter(p => p);
            }
            console.log(`📂 [LocalLLM] Modelos encontrados:`, modelFiles);
        } catch (listErr) {
            console.warn(`⚠️ [LocalLLM] Erro ao listar modelos:`, listErr?.message || listErr);
            // Continuar mesmo sem lista - talvez o método não exista
        }
        
        // Verificar se modelo existe na lista
        const modelPath = modelFiles.find(f => f.includes(model.fileName));
        if (!modelPath && modelFiles.length > 0) {
            console.warn(`⚠️ [LocalLLM] Modelo ${model.fileName} não encontrado na lista. Tentando com nome direto.`);
        }
        
        const pathToLoad = modelPath || model.fileName;
        console.log(`📂 [LocalLLM] Tentando carregar: ${pathToLoad}`);
        
        // Calcular nCtx baseado no tamanho do modelo para evitar crash de memória
        // Modelos pesados precisam de menos contexto
        let nCtx = model.nCtx || localLlmConfig.nCtx || 4096;
        if (model.category === 'ultra') {
            nCtx = Math.min(nCtx, 1024); // Ultra: máximo 1024
            console.log(`⚠️ [LocalLLM] Modelo ultra - reduzindo contexto para ${nCtx}`);
        } else if (model.category === 'heavy') {
            nCtx = Math.min(nCtx, 2048); // Heavy: máximo 2048
            console.log(`⚠️ [LocalLLM] Modelo pesado - reduzindo contexto para ${nCtx}`);
        }
        
        // Carregar modelo no plugin com timeout maior para modelos pesados
        const loadTimeout = (model.category === 'heavy' || model.category === 'ultra') ? 120000 : 30000;
        console.log(`⏱️ [LocalLLM] Timeout de carregamento: ${loadTimeout/1000}s`);
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`Timeout ao carregar modelo (${loadTimeout/1000}s)`)), loadTimeout);
            LlamaNative.loadModel(
                {
                    modelPath: pathToLoad,
                    nCtx: nCtx,
                    nThreads: 4,
                    nBatch: 256, // Reduzido para economizar memória
                    useMmap: true
                },
                () => { clearTimeout(timeout); resolve(); },
                (err) => { clearTimeout(timeout); reject(new Error(err || "Erro desconhecido ao carregar modelo")); }
            );
        });
        
        localLlmState.engine = true; // Marca que tem modelo carregado
        localLlmState.isLoading = false;
        // Toast removido - modal de carregamento cuida da UI
        console.log(`[LocalLLM] Modelo carregado com sucesso: ${model.name}`);
        return true;
        
    } catch (error) {
        const errorMsg = error?.message || JSON.stringify(error) || "Erro desconhecido";
        console.error(`[LocalLLM] Erro ao carregar modelo:`, errorMsg);
        // Toast removido - modal de carregamento cuida da UI
        
        // Remover da lista de baixados se não conseguiu carregar
        // (provavelmente o arquivo não existe)
        if (errorMsg.includes("not found") || errorMsg.includes("não encontrado")) {
            localLlmState.downloadedModels = localLlmState.downloadedModels.filter(m => m !== modelId);
        }
        
        localLlmState.engine = null;
        localLlmState.isLoading = false;
        saveLocalLlmState();
        updateLocalLlmUI();
        return false;
    }
}

// ===== CARREGAR MODELO COM MODAL BLOQUEANTE =====
async function loadLocalModelWithModal(modelId) {
    if (!modelId) {
        console.error("[LocalLLM] loadLocalModelWithModal chamado sem modelId");
        return false;
    }
    
    if (localLlmState.isLoading) {
        console.warn("[LocalLLM] Já está carregando um modelo");
        return false;
    }
    
    const model = LOCAL_LLM_MODELS[modelId];
    if (!model) {
        console.error(`[LocalLLM] Modelo não encontrado: ${modelId}`);
        return false;
    }
    
    // Mostrar modal de carregamento
    showModelLoadingModal(model.name);
    
    try {
        const success = await loadLocalModel(modelId);
        
        if (success) {
            updateModelLoadingModal('success', model.name);
        } else {
            updateModelLoadingModal('error', model.name);
        }
        
        // Aguardar um pouco para mostrar o estado final
        await new Promise(r => setTimeout(r, 1200));
        hideModelLoadingModal();
        
        return success;
    } catch (error) {
        console.error("[LocalLLM] Erro no loadLocalModelWithModal:", error);
        updateModelLoadingModal('error', model.name);
        await new Promise(r => setTimeout(r, 1500));
        hideModelLoadingModal();
        return false;
    }
}

// ===== MODAL DE CARREGAMENTO DE MODELO =====
function showModelLoadingModal(modelName) {
    // Remover modal existente se houver
    hideModelLoadingModal();
    
    const modal = document.createElement('div');
    modal.id = 'model-loading-modal';
    modal.className = 'model-loading-modal';
    modal.innerHTML = `
        <div class="model-loading-backdrop"></div>
        <div class="model-loading-content">
            <div class="model-loading-icon loading">
                <i class="fa-solid fa-microchip"></i>
                <div class="model-loading-spinner"></div>
            </div>
            <h3 class="model-loading-title">Preparando IA Offline</h3>
            <p class="model-loading-model">${modelName}</p>
            <p class="model-loading-status">Carregando modelo neural...</p>
            <div class="model-loading-progress">
                <div class="model-loading-progress-bar"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger animation
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });
}

function updateModelLoadingModal(status, modelName) {
    const modal = document.getElementById('model-loading-modal');
    if (!modal) return;
    
    const iconContainer = modal.querySelector('.model-loading-icon');
    const title = modal.querySelector('.model-loading-title');
    const statusText = modal.querySelector('.model-loading-status');
    const progressBar = modal.querySelector('.model-loading-progress-bar');
    
    if (status === 'success') {
        iconContainer.className = 'model-loading-icon success';
        iconContainer.innerHTML = '<i class="fa-solid fa-check"></i>';
        title.textContent = 'IA Pronta!';
        statusText.textContent = `${modelName} carregado com sucesso`;
        progressBar.style.width = '100%';
        progressBar.classList.add('complete');
    } else if (status === 'error') {
        iconContainer.className = 'model-loading-icon error';
        iconContainer.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        title.textContent = 'Erro ao Carregar';
        statusText.textContent = 'Não foi possível carregar o modelo';
        progressBar.classList.add('error');
    }
}

function hideModelLoadingModal() {
    const modal = document.getElementById('model-loading-modal');
    if (modal) {
        modal.classList.remove('visible');
        modal.classList.add('hiding');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ===== DESCARREGAR MODELO =====
function unloadLocalModel() {
    if (localLlmState.engine && isNativePluginAvailable()) {
        try {
            LlamaNative.unloadModel(() => {}, () => {});
        } catch (e) {
            console.warn("[LocalLLM] Erro ao descarregar:", e);
        }
        localLlmState.engine = null;
    }
    console.log("🔌 [LocalLLM] Modelo descarregado");
}

// ===== GERAR RESPOSTA COM MODELO LOCAL =====
async function generateLocalResponse(messages, onChunk) {
    if (!localLlmState.enabled) {
        throw new Error("Modelo local não está ativo");
    }
    
    // Se já está gerando, parar a geração anterior SEMPRE
    if (localLlmState.isGenerating) {
        console.log("🛑 [LocalLLM] Interrompendo geração anterior para nova mensagem...");
        try {
            if (typeof LlamaNative !== 'undefined' && typeof LlamaNative.stopGeneration === 'function') {
                await new Promise((resolve) => {
                    LlamaNative.stopGeneration(() => resolve(), () => resolve());
                });
            }
            if (typeof stopLocalLlmGeneration === 'function') {
                stopLocalLlmGeneration();
            }
        } catch (e) {
            console.warn("⚠️ [LocalLLM] Erro ao parar geração anterior:", e);
        }
        localLlmState.isGenerating = false;
        localLlmState.isCancelled = true;
        // Aguardar para garantir que parou
        await new Promise(r => setTimeout(r, 300));
    }
    
    // Resetar estados
    localLlmState.isCancelled = false;
    
    // Se modelo não está carregado, tentar carregar automaticamente
    if (!localLlmState.engine) {
        console.log("⏳ [LocalLLM] Modelo não carregado, carregando agora...");
        if (localLlmState.activeModel) {
            try {
                await loadLocalModelWithModal(localLlmState.activeModel);
            } catch (e) {
                console.error("❌ [LocalLLM] Erro ao carregar modelo:", e);
                throw new Error("Erro ao carregar modelo. Tente novamente.");
            }
        } else {
            throw new Error("Nenhum modelo offline disponível. Baixe um modelo nas configurações.");
        }
    }
    
    localLlmState.isGenerating = true;
    localLlmState.isCancelled = false;
    
    try {
        console.log("🤖 [LocalLLM] Gerando resposta via llama.cpp NATIVO...");
        
        // MEMÓRIA: Usar as mensagens recebidas como contexto (últimas 10)
        const userMessages = messages.filter(m => m.role === "user");
        
        // Última mensagem do usuário (a que deve ser respondida)
        const lastUserMessage = userMessages[userMessages.length - 1];
        const currentQuestion = (lastUserMessage?.content || lastUserMessage?.text || "").trim();
        
        // Contexto: usar as mensagens recebidas (máximo 10)
        const contextMessages = [];
        const maxContext = 10; // Últimas 10 mensagens para memória
        
        // Pegar as últimas mensagens da lista recebida
        const allMessages = messages.slice(-maxContext);
        for (const msg of allMessages) {
            if (msg.role === "user" || msg.role === "assistant") {
                const content = (msg.content || msg.text || "").trim();
                if (content) {
                    // Limitar tamanho para não sobrecarregar o modelo (1000 chars)
                    contextMessages.push({
                        role: msg.role,
                        content: content.substring(0, 1000)
                    });
                }
            }
        }
        
        // Garantir que a última mensagem é do usuário (a pergunta atual)
        const lastContext = contextMessages[contextMessages.length - 1];
        if (!lastContext || lastContext.role !== "user") {
            contextMessages.push({
                role: "user",
                content: currentQuestion
            });
        }
        
        // ===== MEMÓRIA DO SISTEMA (salva pela IA online) =====
        let memoriaContexto = '';
        try {
            // Memória estruturada (getAllMemoryTexts)
            if (typeof getAllMemoryTexts === 'function') {
                const memoriaEstruturada = getAllMemoryTexts().join("\n");
                if (memoriaEstruturada) {
                    memoriaContexto += `\nMEMÓRIA SOBRE O USUÁRIO:\n${memoriaEstruturada.substring(0, 500)}`;
                }
            }
            // Memória manual (memoryText)
            if (typeof memoryText !== 'undefined' && memoryText?.value?.trim()) {
                memoriaContexto += `\nNOTAS DO USUÁRIO:\n${memoryText.value.trim().substring(0, 300)}`;
            }
        } catch (e) {
            console.warn("⚠️ [LocalLLM] Erro ao carregar memória:", e);
        }
        
        // Detectar modos especiais pela pergunta
        const lowerQuestion = currentQuestion.toLowerCase();
        const isChartMode = lowerQuestion.includes('gráfico') || lowerQuestion.includes('grafico') || lowerQuestion.includes('chart') || 
            (typeof isChartModeActive === 'function' && isChartModeActive());
        const isDocumentMode = lowerQuestion.includes('documento') || lowerQuestion.includes('document') ||
            (typeof isDocumentModeActive === 'function' && isDocumentModeActive());
        const isMindMapMode = lowerQuestion.includes('mapa mental') || lowerQuestion.includes('mindmap') ||
            (typeof isMindMapModeActive === 'function' && isMindMapModeActive());
        
        // System prompt dinâmico baseado no modo
        let modeInstructions = '';
        if (isChartMode) {
            modeInstructions = `

MODO GRÁFICO ATIVO:
- Gere código Mermaid para criar o gráfico
- Use a sintaxe: \`\`\`mermaid ... \`\`\`
- Tipos: pie (pizza), bar/graph (barras), line (linha), flowchart (fluxo)
- Exemplo: \`\`\`mermaid
pie title Vendas
"Jan" : 30
"Fev" : 45
\`\`\``;
        } else if (isDocumentMode) {
            modeInstructions = `

MODO DOCUMENTO ATIVO:
- Crie um documento bem estruturado e completo
- Use títulos, subtítulos e parágrafos
- Inclua introdução, desenvolvimento e conclusão
- Seja detalhado e profissional`;
        } else if (isMindMapMode) {
            modeInstructions = `

MODO MAPA MENTAL ATIVO:
- Gere código Mermaid para mapa mental
- Use a sintaxe: \`\`\`mermaid
mindmap
  root((Tema))
    Sub1
      Item1
    Sub2
\`\`\`
- Organize hierarquicamente os conceitos`;
        }
        
        // System prompt em português - com instrução de memória
        const systemPrompt = `Você é NEO, um assistente inteligente e detalhista. Responda em português do Brasil.

REGRAS IMPORTANTES:
1. Dê respostas COMPLETAS e DETALHADAS - nunca respostas curtas de 1-2 linhas
2. Explique conceitos com exemplos práticos quando apropriado
3. Use formatação markdown: **negrito**, *itálico*, listas com -, blocos de código
4. Organize respostas longas em seções com ## títulos
5. Se for uma pergunta simples, ainda assim dê contexto útil adicional
6. Use o histórico de conversa como CONTEXTO para entender o assunto
7. Responda SOMENTE à última mensagem do usuário
8. Se não souber algo, diga honestamente
9. SEMPRE termine sua resposta com uma pergunta que estimule o desenvolvimento do assunto

ESTILO: Seja informativo, útil e engajante. Respostas devem ter no mínimo 3-4 parágrafos para perguntas abertas.${modeInstructions}${memoriaContexto}`;
        
        // Formatar prompt com histórico de conversa
        const model = LOCAL_LLM_MODELS[localLlmState.activeModel];
        
        // ===== DEBUG DETALHADO =====
        console.log("========== DEBUG LLM ==========");
        console.log("🔹 activeModel (key):", localLlmState.activeModel);
        console.log("🔹 model object:", model ? model.name : "NULL/UNDEFINED!");
        console.log("🔹 LOCAL_LLM_MODELS keys:", Object.keys(LOCAL_LLM_MODELS).slice(0, 5));
        console.log("🔹 systemPrompt length:", systemPrompt.length);
        console.log("🔹 contextMessages:", contextMessages.length);
        console.log("🔹 currentQuestion:", currentQuestion.substring(0, 100));
        console.log("================================");
        
        const prompt = formatChatMLPromptWithHistory(systemPrompt, contextMessages, model);
        
        // Mostrar o prompt enviado (primeiros 500 chars)
        console.log("📝 [LocalLLM] PROMPT ENVIADO (preview):", prompt.substring(0, 500));
        console.log("📝 [LocalLLM] PROMPT LENGTH:", prompt.length, "chars");
        
        console.log("🤖 [LocalLLM] Contexto:", contextMessages.length, "mensagens");
        console.log("🤖 [LocalLLM] Pergunta atual:", currentQuestion.substring(0, 50) + "...");
        console.log("⚙️ [LocalLLM] Configs COMPLETAS:", JSON.stringify(localLlmConfig));
        
        let fullResponse = "";
        let tokenCount = 0;
        const startTime = Date.now();
        
        // Gerar via plugin nativo
        await new Promise((resolve, reject) => {
            LlamaNative.generate(
                {
                    prompt: prompt,
                    maxTokens: localLlmConfig.maxTokens || 2048,
                    temperature: localLlmConfig.temperature || 0.7,
                    topP: localLlmConfig.topP || 0.9,
                    topK: localLlmConfig.topK || 40,
                    repeatPenalty: localLlmConfig.repetitionPenalty || 1.1
                    // NOTA: stopTokens não são suportados pelo plugin nativo
                    // A limpeza é feita depois via cleanLocalLLMResponse()
                },
                (token) => {
                    // Verificar se foi cancelado
                    if (localLlmState.isCancelled) {
                        return;
                    }
                    
                    fullResponse += token;
                    tokenCount++;
                    
                    // Streaming callback
                    if (onChunk) {
                        onChunk(token);
                    }
                },
                (result) => {
                    console.log("✅ [LocalLLM] Geração completa");
                    resolve(result);
                },
                (err) => {
                    reject(new Error(err));
                }
            );
        });
        
        const elapsed = (Date.now() - startTime) / 1000;
        const tokPerSec = tokenCount / elapsed;
        
        console.log(`[LocalLLM] ${tokenCount} tokens em ${elapsed.toFixed(2)}s (${tokPerSec.toFixed(1)} tok/s)`);
        
        // Limpar resposta de qualquer contaminação (roles, tokens especiais)
        const cleanedResponse = cleanLocalLLMResponse(fullResponse);
        
        return cleanedResponse;
        
    } catch (error) {
        console.error("[LocalLLM] Erro na geração:", error);
        throw error;
    } finally {
        localLlmState.isGenerating = false;
    }
}

/**
 * Limpa resposta do LLM local removendo contaminações
 */
function cleanLocalLLMResponse(response) {
    if (!response) return '';
    
    let cleaned = response;
    
    // Remover tokens especiais que podem ter vazado
    const tokensToRemove = [
        '<|im_start|>', '<|im_end|>',
        '<|begin_of_text|>', '<|end_of_text|>',
        '<|start_header_id|>', '<|end_header_id|>',
        '<|eot_id|>', '<|pad|>',
        '<start_of_turn>', '<end_of_turn>',
        '<|system|>', '<|user|>', '<|assistant|>', '<|end|>',
        '</s>', '<s>',
        '[INST]', '[/INST]',
        '<<SYS>>', '<</SYS>>',
        '<think>', '</think>'
    ];
    
    for (const token of tokensToRemove) {
        cleaned = cleaned.split(token).join('');
    }
    
    // Cortar a resposta se aparecer indicação de novo turno
    const cutPatterns = [
        /\n(user|User|USER)\s*:?\s*$/gi,
        /\n(user|User|USER)\s*:?\s*.*/gi,
        /\n(human|Human|HUMAN)\s*:?\s*$/gi,
        /\n(human|Human|HUMAN)\s*:?\s*.*/gi,
        /\nmodel\s*:?\s*$/gi,
        /\nassistant\s*:?\s*$/gi,
        /\nsystem\s*:?\s*$/gi
    ];
    
    for (const pattern of cutPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
            cleaned = cleaned.substring(0, match.index);
        }
    }
    
    // Remover múltiplas quebras de linha consecutivas
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
    
    // Trim
    cleaned = cleaned.trim();
    
    return cleaned;
}

// ===== FORMATAR PROMPT CHATML COM HISTÓRICO =====
function formatChatMLPromptWithHistory(systemPrompt, messages, model) {
    const modelName = model?.name?.toLowerCase() || '';
    
    // DEBUG: Ver qual template está sendo usado
    let templateUsed = 'ChatML (default/Qwen)';
    if (modelName.includes('llama')) templateUsed = 'Llama 3';
    else if (modelName.includes('phi')) templateUsed = 'Phi';
    else if (modelName.includes('gemma')) templateUsed = 'Gemma';
    else if (modelName.includes('mistral')) templateUsed = 'Mistral';
    else if (modelName.includes('deepseek')) templateUsed = 'DeepSeek';
    
    console.log(`🎯 [FORMAT] modelName="${modelName}", template="${templateUsed}"`);
    
    // Llama 3 format
    if (modelName.includes('llama')) {
        let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `<|start_header_id|>user<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
            } else if (msg.role === 'assistant') {
                prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
            }
        }
        
        prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n`;
        return prompt;
    }
    
    // Phi format
    if (modelName.includes('phi')) {
        let prompt = `<|system|>\n${systemPrompt}<|end|>\n`;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `<|user|>\n${msg.content}<|end|>\n`;
            } else if (msg.role === 'assistant') {
                prompt += `<|assistant|>\n${msg.content}<|end|>\n`;
            }
        }
        
        prompt += `<|assistant|>\n`;
        return prompt;
    }
    
    // Gemma format (não suporta system prompt separado)
    if (modelName.includes('gemma')) {
        let prompt = '';
        let isFirst = true;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `<start_of_turn>user\n`;
                if (isFirst) {
                    prompt += `${systemPrompt}\n\n`;
                    isFirst = false;
                }
                prompt += `${msg.content}<end_of_turn>\n`;
            } else if (msg.role === 'assistant') {
                prompt += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
            }
        }
        
        prompt += `<start_of_turn>model\n`;
        return prompt;
    }
    
    // Mistral format
    if (modelName.includes('mistral')) {
        let prompt = `<s>[INST] ${systemPrompt}\n\n`;
        let isFirstUser = true;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                if (!isFirstUser) {
                    prompt += `[INST] `;
                }
                prompt += `${msg.content} [/INST]`;
                isFirstUser = false;
            } else if (msg.role === 'assistant') {
                prompt += `${msg.content}</s>`;
            }
        }
        
        return prompt;
    }
    
    // DeepSeek R1 format (igual ChatML mas com thinking)
    if (modelName.includes('deepseek')) {
        let prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
            } else if (msg.role === 'assistant') {
                prompt += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
            }
        }
        
        prompt += `<|im_start|>assistant\n`;
        return prompt;
    }
    
    // Default: ChatML (Qwen, SmolLM, etc)
    let prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
    
    for (const msg of messages) {
        if (msg.role === 'user') {
            prompt += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
        } else if (msg.role === 'assistant') {
            prompt += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
        }
    }
    
    prompt += `<|im_start|>assistant\n`;
    return prompt;
}

// ===== FORMATAR PROMPT SIMPLES (para título e voz) =====
function formatSimpleChatMLPrompt(systemPrompt, userContent, model) {
    const modelName = model?.name?.toLowerCase() || '';
    
    // Llama 3 format
    if (modelName.includes('llama')) {
        return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${userContent}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
    }
    
    // Phi format
    if (modelName.includes('phi')) {
        return `<|system|>\n${systemPrompt}<|end|>\n<|user|>\n${userContent}<|end|>\n<|assistant|>\n`;
    }
    
    // Gemma format
    if (modelName.includes('gemma')) {
        return `<start_of_turn>user\n${systemPrompt}\n\n${userContent}<end_of_turn>\n<start_of_turn>model\n`;
    }
    
    // Default: ChatML
    return `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userContent}<|im_end|>\n<|im_start|>assistant\n`;
}

// ===== FORMATAR PROMPT CHATML (LEGACY - SEM HISTÓRICO) =====
function formatChatMLPrompt(systemPrompt, userContent, model) {
    const modelName = model?.name?.toLowerCase() || '';
    
    // Llama 3 format
    if (modelName.includes('llama')) {
        return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

${userContent}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;
    }
    
    // Phi format
    if (modelName.includes('phi')) {
        return `<|system|>
${systemPrompt}<|end|>
<|user|>
${userContent}<|end|>
<|assistant|>
`;
    }
    
    // Gemma format
    if (modelName.includes('gemma')) {
        return `<start_of_turn>user
${systemPrompt}

${userContent}<end_of_turn>
<start_of_turn>model
`;
    }
    
    // Default: ChatML (Qwen, SmolLM, etc)
    return `<|im_start|>system
${systemPrompt}<|im_end|>
<|im_start|>user
${userContent}<|im_end|>
<|im_start|>assistant
`;
}

// ===== PARAR GERAÇÃO LOCAL =====
function stopLocalLlmGeneration() {
    if (localLlmState.isGenerating) {
        console.log("🛑 [LocalLLM] Parando geração...");
        localLlmState.isCancelled = true;
        
        // Parar via plugin nativo
        if (isNativePluginAvailable()) {
            try {
                LlamaNative.stopGeneration(() => {}, () => {});
            } catch (e) {
                console.warn("[LocalLLM] Erro ao interromper:", e);
            }
        }
        
        localLlmState.isGenerating = false;
        return true;
    }
    return false;
}

// ===== GERAR TÍTULO VIA LLM LOCAL =====
async function generateLocalTitle(conversationText) {
    console.log("📝 [LocalLLM] generateLocalTitle chamado, enabled:", localLlmState.enabled);
    
    if (!localLlmState.enabled) {
        console.log("📝 [LocalLLM] Título: modo offline não ativo");
        return null;
    }
    
    if (!localLlmState.downloadedModels.length) {
        console.log("📝 [LocalLLM] Título: nenhum modelo baixado");
        return null;
    }
    
    // Se já está gerando, aguardar
    if (localLlmState.isGenerating) {
        console.log("📝 [LocalLLM] Título: aguardando geração atual terminar...");
        // Aguardar até 10 segundos
        for (let i = 0; i < 100 && localLlmState.isGenerating; i++) {
            await new Promise(r => setTimeout(r, 100));
        }
        if (localLlmState.isGenerating) {
            console.log("📝 [LocalLLM] Título: timeout aguardando geração");
            return null;
        }
    }
    
    // Aguardar engine se necessário
    if (!localLlmState.engine) {
        if (!localLlmState.activeModel && localLlmState.downloadedModels.length > 0) {
            localLlmState.activeModel = localLlmState.downloadedModels[0];
        }
        
        if (localLlmState.activeModel) {
            try {
                console.log("📝 [LocalLLM] Título: carregando modelo...");
                await loadLocalModel(localLlmState.activeModel);
            } catch (e) {
                console.error("📝 [LocalLLM] Título: Erro ao carregar modelo:", e);
                return null;
            }
        }
    }
    
    if (!localLlmState.engine) {
        console.log("📝 [LocalLLM] Título: engine não disponível");
        return null;
    }
    
    console.log("📝 [LocalLLM] Gerando título localmente...");
    
    const model = LOCAL_LLM_MODELS[localLlmState.activeModel];
    const titlePrompt = `Crie um título CURTO (3-5 palavras) para esta conversa. Responda APENAS o título:\n\n${conversationText.substring(0, 300)}`;
    
    const prompt = formatSimpleChatMLPrompt("Você gera títulos curtos.", titlePrompt, model);
    
    try {
        let title = "";
        await new Promise((resolve, reject) => {
            LlamaNative.generate(
                {
                    prompt: prompt,
                    maxTokens: 30,
                    temperature: 0.5,
                    topP: 0.9,
                    stopTokens: ['<|im_end|>', '</s>', '<|end|>', '<|eot_id|>', '\n']
                },
                (token) => { title += token; },
                () => resolve(),
                (err) => reject(new Error(err))
            );
        });
        
        // Limpar título
        title = title.replace(/^["']|["']$/g, '').replace(/\n/g, ' ').trim();
        if (title.length > 25) {
            title = title.substring(0, 25).trim();
            const lastSpace = title.lastIndexOf(' ');
            if (lastSpace > 15) title = title.substring(0, lastSpace);
        }
        
        console.log("📝 [LocalLLM] Título gerado:", title);
        return title || null;
    } catch (e) {
        console.error("📝 [LocalLLM] Erro ao gerar título:", e);
        return null;
    }
}

// ===== GERAR RESPOSTA PARA VOZ VIA LLM LOCAL =====
async function generateLocalVoiceResponse(userText, conversationHistory = []) {
    console.log("🎤 [LocalLLM] generateLocalVoiceResponse chamado");
    
    if (!localLlmState.enabled) {
        throw new Error("Modo offline não ativo");
    }
    
    if (!localLlmState.downloadedModels.length) {
        throw new Error("Nenhum modelo baixado");
    }
    
    // Se já está gerando, aguardar um pouco (máximo 5 segundos)
    if (localLlmState.isGenerating) {
        console.log("🎤 [LocalLLM] Voz: aguardando geração atual terminar...");
        for (let i = 0; i < 50 && localLlmState.isGenerating; i++) {
            await new Promise(r => setTimeout(r, 100));
        }
        // Se ainda está gerando após 5s, forçar reset
        if (localLlmState.isGenerating) {
            console.warn("🎤 [LocalLLM] Forçando reset de isGenerating");
            localLlmState.isGenerating = false;
        }
    }
    
    // IMPORTANTE: NÃO carregar modelo automaticamente!
    // Isso aquece muito o celular. O modelo deve estar pré-carregado.
    if (!localLlmState.engine) {
        console.warn("⚠️ [LocalLLM] Voz: Modelo não carregado!");
        throw new Error("Modelo não carregado. Ative o modo offline nas configurações.");
    }
    
    console.log("🎤 [LocalLLM] Gerando resposta para voz...");
    
    // Carregar memória do usuário
    let memoriaContexto = '';
    try {
        if (typeof getAllMemoryTexts === 'function') {
            const memoriaEstruturada = getAllMemoryTexts().join("\n");
            if (memoriaEstruturada) {
                memoriaContexto = `\nMEMÓRIA SOBRE O USUÁRIO:\n${memoriaEstruturada.substring(0, 400)}`;
            }
        }
        if (typeof memoryText !== 'undefined' && memoryText?.value?.trim()) {
            memoriaContexto += `\nNOTAS DO USUÁRIO:\n${memoryText.value.trim().substring(0, 200)}`;
        }
    } catch (e) {
        console.warn("🎤 [LocalLLM] Erro ao carregar memória:", e);
    }
    
    // Contexto da conversa de voz
    let conversationContext = '';
    if (conversationHistory.length > 0) {
        const recent = conversationHistory.slice(-4);
        conversationContext = '\nCONVERSA ANTERIOR:\n' + recent.map(m =>
            `${m.role === 'user' ? 'Usuário' : 'Neo'}: ${m.content}`
        ).join('\n');
    }
    
    const systemPrompt = `Você é Neo, assistente de voz em português brasileiro.

MODO VOZ - REGRAS:
- Responda de forma CURTA e NATURAL (1-3 frases)
- NÃO use emojis, asteriscos ou formatação
- NÃO use markdown
- Fale como uma pessoa real
- Seja direto e objetivo${memoriaContexto}${conversationContext}`;
    
    const model = LOCAL_LLM_MODELS[localLlmState.activeModel];
    const prompt = formatSimpleChatMLPrompt(systemPrompt, userText, model);
    
    let response = "";
    try {
        await new Promise((resolve, reject) => {
            // Timeout de 30 segundos para não travar
            const timeout = setTimeout(() => {
                reject(new Error("Timeout na geração"));
            }, 30000);
            
            LlamaNative.generate(
                {
                    prompt: prompt,
                    maxTokens: 200,
                    temperature: 0.7,
                    topP: 0.85,
                    repeatPenalty: 1.15,
                    stopTokens: ['<|im_end|>', '</s>', '<|end|>', '<|eot_id|>']
                },
                (token) => { response += token; },
                () => { clearTimeout(timeout); resolve(); },
                (err) => { clearTimeout(timeout); reject(new Error(err)); }
            );
        });
    } catch (e) {
        console.error("🎤 [LocalLLM] Erro na geração de voz:", e);
        return "Desculpe, ocorreu um erro. Tente novamente.";
    }
    
    // Limpar resposta para voz - remover toda formatação
    response = response
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remover negrito **texto**
        .replace(/\*([^*]+)\*/g, '$1')      // Remover itálico *texto*
        .replace(/__([^_]+)__/g, '$1')      // Remover negrito __texto__
        .replace(/_([^_]+)_/g, '$1')        // Remover itálico _texto_
        .replace(/[\*`#~]/g, '')            // Remover caracteres especiais restantes
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remover links markdown
        .replace(/\n+/g, ' ')               // Quebras de linha -> espaço
        .replace(/\s+/g, ' ')               // Múltiplos espaços -> um
        .replace(/[😀-🿿]/gu, '')           // Remover emojis
        .trim();
    
    console.log("🎤 [LocalLLM] Resposta voz:", response);
    return response || "Desculpe, não consegui processar.";
}

// ===== ATIVAR MODO OFFLINE AUTOMATICAMENTE (FALLBACK) =====
function activateOfflineFallback() {
    if (localLlmState.enabled) {
        console.log("🔄 [LocalLLM] Já está em modo offline");
        return true;
    }
    
    if (localLlmState.downloadedModels.length === 0) {
        console.log("🔄 [LocalLLM] Nenhum modelo baixado para fallback");
        return false;
    }
    
    console.log("🔄 [LocalLLM] Ativando modo offline automaticamente...");
    
    // Ativar modo offline
    localLlmState.enabled = true;
    
    // Usar último modelo ativo ou primeiro disponível
    if (!localLlmState.activeModel) {
        localLlmState.activeModel = localLlmState.downloadedModels[0];
    }
    
    saveLocalLlmState();
    
    // Atualizar UI
    const toggle = document.getElementById('offline-mode-toggle');
    if (toggle) toggle.classList.add('active');
    
    const onlineToggle = document.getElementById('online-mode-toggle');
    if (onlineToggle) onlineToggle.classList.remove('active');
    
    updateLocalLlmUI();
    updateOnlineOnlyButtons();
    
    // Carregar modelo com modal
    loadLocalModelWithModal(localLlmState.activeModel);
    
    return true;
}

// ===== VERIFICAR SE DEVE USAR LLM LOCAL (NOVO SISTEMA AUTOMÁTICO) =====
function isLocalLlmActive() {
    // Verifica se o modo offline está disponível (tem modelo baixado)
    const hasOfflineCapability = offlineModeEnabled && localLlmState.downloadedModels.length > 0;
    
    // Se não tem capacidade offline, retorna false
    if (!hasOfflineCapability) {
        console.log("🔍 [AutoMode] Offline não disponível - usando Online");
        return false;
    }
    
    // Usa a função automática para decidir
    const useOffline = shouldUseOfflineMode();
    
    console.log("🔍 [AutoMode] isLocalLlmActive():", useOffline, {
        onlineModeEnabled,
        offlineModeEnabled,
        hasInternet: navigator.onLine,
        downloadedCount: localLlmState.downloadedModels.length
    });
    
    // NÃO alterar localLlmState.enabled automaticamente!
    // Isso deve ser controlado apenas pelo usuário via toggleOfflineMode()
    // Removido código que desabilitava o modo offline automaticamente
    
    return useOffline;
}

// ===== TROCA AUTOMÁTICA DE MODO QUANDO A REDE MUDA =====
function handleNetworkChange(isOnline) {
    // Só faz troca automática se ambos os modos estiverem habilitados
    if (!onlineModeEnabled || !offlineModeEnabled) {
        console.log("🔄 [AutoSwitch] Troca automática desabilitada - apenas um modo ativo");
        return;
    }
    
    // Não tem modelo baixado para usar offline
    if (localLlmState.downloadedModels.length === 0) {
        console.log("🔄 [AutoSwitch] Nenhum modelo offline disponível");
        return;
    }
    
    if (isOnline) {
        // Voltou a ter internet - trocar para modo online
        console.log("🌐 [AutoSwitch] Internet restaurada - trocando para modo Online");
        localLlmState.enabled = false;
        
        // Atualizar indicadores visuais
        updateModeIndicator('online');
        
    } else {
        // Ficou sem internet - trocar para modo offline
        console.log("📴 [AutoSwitch] Sem internet - trocando para modo Offline");
        localLlmState.enabled = true;
        
        // Se não tem modelo ativo, usar o primeiro disponível
        if (!localLlmState.activeModel) {
            localLlmState.activeModel = localLlmState.downloadedModels[0];
        }
        
        // Carregar modelo se necessário
        if (!localLlmState.engine) {
            loadLocalModelWithModal(localLlmState.activeModel);
        }
        
        // Atualizar indicadores visuais
        updateModeIndicator('offline');
    }
    
    saveLocalLlmState();
    updateLocalLlmUI();
    updateOnlineOnlyButtons();
}

// ===== ATUALIZAR INDICADOR VISUAL DO MODO ATIVO =====
function updateModeIndicator(mode) {
    const offlineToggle = document.getElementById('offline-mode-toggle');
    const onlineToggle = document.getElementById('online-mode-toggle');
    
    // Os toggles mostram quais modos estão HABILITADOS, não qual está ATIVO
    // Mas podemos adicionar um indicador visual extra se necessário
    console.log(`✨ [ModeIndicator] Modo atual: ${mode}`);
}

// ===== VERIFICAR SE ENGINE ESTÁ PRONTO =====
function isLocalLlmEngineReady() {
    return localLlmState.engine !== null;
}

// ===== OBTER NOME DO MODELO ATIVO =====
function getActiveLocalModelName() {
    if (!localLlmState.activeModel) return null;
    return LOCAL_LLM_MODELS[localLlmState.activeModel]?.name || localLlmState.activeModel;
}

// ===== ATUALIZAR UI =====
function updateLocalLlmUI() {
    const hasDownloadedModels = localLlmState.downloadedModels.length > 0;
    
    // Atualizar todos os botões e cards
    refreshAllModelButtons();
    
    // Atualizar toggles de modo baseado nos estados independentes
    const offlineToggle = document.getElementById('offline-mode-toggle');
    if (offlineToggle) {
        offlineToggle.classList.toggle('active', offlineModeEnabled);
    }
    
    const onlineToggle = document.getElementById('online-mode-toggle');
    if (onlineToggle) {
        onlineToggle.classList.toggle('active', onlineModeEnabled);
    }
    
    // Toggle legado
    if (localLlmToggle) {
        localLlmToggle.classList.toggle("active", offlineModeEnabled);
        localLlmToggle.classList.toggle("disabled", !hasDownloadedModels);
    }
    
    // Botão no settings header
    if (localLlmBtn) {
        localLlmBtn.classList.toggle("active", offlineModeEnabled);
    }
    
    // Botão apagar todos
    const deleteAllBtn = document.getElementById("local-llm-delete-all-btn");
    if (deleteAllBtn) {
        deleteAllBtn.classList.toggle("visible", hasDownloadedModels);
    }
    
    // Status
    if (localLlmStatus && localLlmActiveName) {
        if (offlineModeEnabled && localLlmState.activeModel) {
            localLlmStatus.style.display = "flex";
            localLlmActiveName.textContent = LOCAL_LLM_MODELS[localLlmState.activeModel]?.name || localLlmState.activeModel;
        } else {
            localLlmStatus.style.display = "none";
        }
    }
}

// ===== SALVAR/CARREGAR ESTADO =====
function saveLocalLlmState() {
    try {
        const stateToSave = {
            enabled: localLlmState.enabled,
            activeModel: localLlmState.activeModel,
            downloadedModels: localLlmState.downloadedModels
        };
        localStorage.setItem("neo_local_llm_state", JSON.stringify(stateToSave));
        console.log("💾 [LocalLLM] Estado salvo:", stateToSave);
    } catch (e) {
        console.error("[LocalLLM] Erro ao salvar estado:", e);
    }
}

function loadLocalLlmState() {
    try {
        const saved = localStorage.getItem("neo_local_llm_state");
        if (saved) {
            const parsed = JSON.parse(saved);
            localLlmState.enabled = parsed.enabled || false;
            localLlmState.activeModel = parsed.activeModel || null;
            localLlmState.downloadedModels = parsed.downloadedModels || [];
            console.log("📂 [LocalLLM] Estado carregado:", parsed);
        }
        // Carregar configurações
        loadLocalLlmConfig();
    } catch (e) {
        console.error("[LocalLLM] Erro ao carregar estado:", e);
    }
}

// ===== CONFIGURAÇÕES AVANÇADAS =====
function saveLocalLlmConfig() {
    try {
        localStorage.setItem("neo_local_llm_config", JSON.stringify(localLlmConfig));
        window.localLlmConfig = localLlmConfig; // Atualizar referência global
        console.log("💾 [LocalLLM] Config salva:", localLlmConfig);
    } catch (e) {
        console.error("[LocalLLM] Erro ao salvar config:", e);
    }
}

function loadLocalLlmConfig() {
    try {
        const saved = localStorage.getItem("neo_local_llm_config");
        if (saved) {
            const parsed = JSON.parse(saved);
            localLlmConfig = { ...localLlmConfig, ...parsed };
            window.localLlmConfig = localLlmConfig; // Atualizar referência global
            console.log("📂 [LocalLLM] Config carregada:", localLlmConfig);
        }
    } catch (e) {
        console.error("[LocalLLM] Erro ao carregar config:", e);
    }
}

function updateLocalLlmConfig(key, value) {
    const numValue = parseFloat(value);
    localLlmConfig[key] = numValue;
    console.log(`⚙️ [LocalLLM] ${key} = ${numValue}`);
    saveLocalLlmConfig();
}

function resetLocalLlmConfig() {
    localLlmConfig = {
        nCtx: 4096,
        maxTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        repetitionPenalty: 1.1
    };
    
    // Atualizar inputs com valores padrão
    const inputs = {
        'nCtxInput': 4096,
        'maxTokensInput': 2048,
        'tempInput': 0.7,
        'topPInput': 0.9,
        'topKInput': 40,
        'repetitionPenaltyInput': 1.1
    };
    
    for (const [id, value] of Object.entries(inputs)) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }
    
    saveLocalLlmConfig();
    showToast("Configurações restauradas!", "success");
}

function toggleLocalLlmConfig() {
    const content = document.getElementById('localLlmConfigContent');
    const chevron = document.getElementById('localLlmConfigChevron');
    
    if (content && chevron) {
        content.classList.toggle('open');
        chevron.classList.toggle('open');
    }
}

function updateConfigInputs() {
    // Atualizar inputs com valores salvos
    const inputs = {
        'nCtxInput': localLlmConfig.nCtx || 4096,
        'maxTokensInput': localLlmConfig.maxTokens,
        'tempInput': localLlmConfig.temperature,
        'topPInput': localLlmConfig.topP,
        'topKInput': localLlmConfig.topK || 40,
        'repetitionPenaltyInput': localLlmConfig.repetitionPenalty
    };
    
    for (const [id, value] of Object.entries(inputs)) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }
}

// ===== FUNÇÕES ELEVENLABS (MODO ONLINE) =====

// Salvar voz ElevenLabs selecionada
function saveElevenLabsVoice(voiceId) {
    // Salvar no localStorage direto para acesso rápido
    localStorage.setItem('neo_elevenlabs_voice', voiceId);
    
    // Sincronizar com o select das configurações se existir
    const settingsSelect = document.getElementById('elevenLabsVoiceSelect');
    if (settingsSelect && settingsSelect.value !== voiceId) {
        settingsSelect.value = voiceId;
    }
    
    // Também atualizar no saveSettings se a função existir
    if (typeof saveSettings === 'function') {
        saveSettings();
    }
    
    showToast('Voz ElevenLabs salva!', 'success');
}

// Testar voz ElevenLabs no modo online
async function testElevenLabsVoiceOnline() {
    const apiKey = document.getElementById('elevenlabsApiKeyInput')?.value?.trim() || 
                   localStorage.getItem('neo_api_elevenlabs');
    const voiceSelect = document.getElementById('elevenlabsVoiceSelectOnline');
    const voiceId = voiceSelect?.value || 'onwK4e9ZLuTAKqWW03F9';
    
    if (!apiKey) {
        showToast('Configure a API Key do ElevenLabs primeiro!', 'error');
        return;
    }
    
    const testBtn = document.querySelector('.api-test-voice-btn');
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }
    
    try {
        const voiceName = voiceSelect?.options[voiceSelect.selectedIndex]?.text || 'ElevenLabs';
        const testText = `Olá! Esta é uma demonstração da voz ${voiceName.split(' ')[0]}. A NEO está funcionando perfeitamente!`;
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: testText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail?.message || `Erro ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        showToast('Voz ElevenLabs funcionando!', 'success');
        
    } catch (error) {
        console.error('Erro ao testar ElevenLabs:', error);
        showToast(`Erro: ${error.message}`, 'error');
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = '<i class="fa-solid fa-play"></i> Testar';
        }
    }
}

// Carregar configurações ElevenLabs salvas no modal
function loadElevenLabsSettings() {
    // Tentar carregar da chave direta primeiro, depois das settings gerais
    let savedVoice = localStorage.getItem('neo_elevenlabs_voice');
    let savedApiKey = localStorage.getItem('neo_api_elevenlabs');
    
    // Se não tiver no localStorage direto, tentar das settings
    if (!savedVoice || !savedApiKey) {
        try {
            const settings = JSON.parse(localStorage.getItem('neo_settings') || '{}');
            if (!savedVoice && settings.elevenLabsVoice) {
                savedVoice = settings.elevenLabsVoice;
            }
            if (!savedApiKey && settings.apiKeysElevenlabs && settings.apiKeysElevenlabs.length > 0) {
                savedApiKey = settings.apiKeysElevenlabs[0];
            }
        } catch (e) {
            console.warn('Erro ao carregar settings ElevenLabs:', e);
        }
    }
    
    const voiceSelect = document.getElementById('elevenlabsVoiceSelectOnline');
    const apiInput = document.getElementById('elevenlabsApiKeyInput');
    
    if (voiceSelect && savedVoice) {
        voiceSelect.value = savedVoice;
    }
    
    if (apiInput && savedApiKey) {
        apiInput.value = savedApiKey;
    }
    
    // Também carregar na seção principal
    const mainVoiceSelect = document.getElementById('elevenlabsVoiceMain');
    const mainApiInput = document.getElementById('elevenlabsApiKeyMain');
    
    if (mainVoiceSelect && savedVoice) {
        mainVoiceSelect.value = savedVoice;
    }
    if (mainApiInput && savedApiKey) {
        mainApiInput.value = savedApiKey;
    }
}

// Salvar voz ElevenLabs da seção principal
function saveElevenLabsVoiceMain(voiceId) {
    localStorage.setItem('neo_elevenlabs_voice', voiceId);
    
    // Sincronizar com outros selects
    const advancedSelect = document.getElementById('elevenlabsVoiceSelectOnline');
    const settingsSelect = document.getElementById('elevenLabsVoiceSelect');
    
    if (advancedSelect) advancedSelect.value = voiceId;
    if (settingsSelect) settingsSelect.value = voiceId;
    
    showToast('Voz salva!', 'success');
}

// Testar voz ElevenLabs da seção principal
async function testElevenLabsMain() {
    const apiKey = document.getElementById('elevenlabsApiKeyMain')?.value?.trim() || 
                   localStorage.getItem('neo_api_elevenlabs');
    const voiceSelect = document.getElementById('elevenlabsVoiceMain');
    const voiceId = voiceSelect?.value || 'onwK4e9ZLuTAKqWW03F9';
    
    if (!apiKey) {
        showToast('Insira a API Key do ElevenLabs primeiro!', 'error');
        return;
    }
    
    // Salvar a key se ainda não estava salva
    localStorage.setItem('neo_api_elevenlabs', apiKey);
    
    const testBtn = document.querySelector('.elevenlabs-test-btn');
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }
    
    try {
        const voiceName = voiceSelect?.options[voiceSelect.selectedIndex]?.text || 'ElevenLabs';
        const testText = `Olá! Esta é a voz ${voiceName.split(' ')[0]}. Tudo funcionando!`;
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: testText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail?.message || `Erro ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        
        await audio.play();
        showToast('Voz ElevenLabs OK!', 'success');
        
    } catch (error) {
        console.error('Erro ao testar ElevenLabs:', error);
        showToast(`Erro: ${error.message}`, 'error');
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
window.initLocalLlm = initLocalLlm;
window.openLocalLlmModal = openLocalLlmModal;
window.closeLocalLlmModal = closeLocalLlmModal;
window.toggleLocalLlm = toggleLocalLlm;
window.deleteModel = deleteDownloadedModel;
window.deleteAllModels = deleteAllModelsWithConfirm;
// ===== MODAL DE CONFIRMAÇÃO BONITO =====
function showConfirmModal(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
    return new Promise((resolve) => {
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;
        
        // Criar modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #1a1a1a;
            border-radius: 16px;
            padding: 24px;
            max-width: 320px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            animation: scaleIn 0.2s ease;
        `;
        
        modal.innerHTML = `
            <h3 style="color: #fff; font-size: 18px; margin: 0 0 12px 0; font-weight: 600;">${title}</h3>
            <p style="color: #aaa; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">${message}</p>
            <div style="display: flex; gap: 12px;">
                <button id="confirm-modal-cancel" style="
                    flex: 1;
                    padding: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    background: transparent;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">${cancelText}</button>
                <button id="confirm-modal-confirm" style="
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 10px;
                    background: #ff4646;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">${confirmText}</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Adicionar animações CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);
        
        // Event listeners
        const cleanup = () => {
            overlay.remove();
            style.remove();
        };
        
        document.getElementById('confirm-modal-cancel').onclick = () => {
            cleanup();
            resolve(false);
        };
        
        document.getElementById('confirm-modal-confirm').onclick = () => {
            cleanup();
            resolve(true);
        };
        
        // Fechar ao clicar no overlay
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false);
            }
        };
    });
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
window.isLocalLlmActive = isLocalLlmActive;
window.isLocalLlmEngineReady = isLocalLlmEngineReady;
window.getActiveLocalModelName = getActiveLocalModelName;
window.generateLocalResponse = generateLocalResponse;
window.generateLocalTitle = generateLocalTitle;
window.generateLocalVoiceResponse = generateLocalVoiceResponse;
window.updateLocalLlmConfig = updateLocalLlmConfig;
window.resetLocalLlmConfig = resetLocalLlmConfig;
window.toggleLocalLlmConfig = toggleLocalLlmConfig;
window.stopLocalLlmGeneration = stopLocalLlmGeneration;
window.updateNeoModelsUI = updateNeoModelsUI;
window.updateLocalLlmUI = updateLocalLlmUI;
window.saveElevenLabsVoice = saveElevenLabsVoice;
window.testElevenLabsVoiceOnline = testElevenLabsVoiceOnline;
window.loadElevenLabsSettings = loadElevenLabsSettings;
window.saveElevenLabsVoiceMain = saveElevenLabsVoiceMain;
window.testElevenLabsMain = testElevenLabsMain;
window.updateOnlineOnlyButtons = updateOnlineOnlyButtons;
window.activateOfflineFallback = activateOfflineFallback;
window.shouldUseOfflineMode = shouldUseOfflineMode;
window.saveModeStates = saveModeStates;
window.handleNetworkChange = handleNetworkChange;
