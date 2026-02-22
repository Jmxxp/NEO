// ===== IA CONFIG - VERSÃO WEB (SOMENTE ONLINE) =====
// Substitui local-llm.js sem funcionalidades offline

let iaConfigCreated = false;

function openLocalLlmModal() {
    if (!iaConfigCreated) createIaConfigUI();
    
    const sidebar = document.getElementById("local-llm-sidebar");
    const backdrop = document.getElementById("local-llm-backdrop");
    
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
    
    updateConfigInputs();
    loadElevenLabsSettings();
    
    // Se tem chave salva, testar automaticamente
    const savedKey = localStorage.getItem('neo_user_api_key');
    if (savedKey && savedKey.trim()) {
        setTimeout(() => testApiKeyAuto(savedKey.trim()), 500);
    }
}

function closeLocalLlmModal() {
    const sidebar = document.getElementById("local-llm-sidebar");
    const backdrop = document.getElementById("local-llm-backdrop");
    
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
}

function createIaConfigUI() {
    if (document.getElementById("local-llm-sidebar")) return;
    
    const savedApiKey = localStorage.getItem('neo_user_api_key') || '';
    
    const sidebarHTML = `
    <div id="local-llm-sidebar" class="local-llm-sidebar">
        <div class="local-llm-sidebar-header" style="justify-content: flex-start; border-bottom: none; padding: 12px 16px; padding-top: max(12px, env(safe-area-inset-top, 0px));">
            <button class="local-llm-close-btn" onclick="closeLocalLlmModal()" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border-radius:50%;font-size:20px;">
                &times;
            </button>
        </div>
        
        <div class="local-llm-sidebar-content">
            <!-- CONTEÚDO MODO ONLINE -->
            <div id="ia-mode-online-content" class="ia-mode-content active">
                <div class="ia-mode-header">
                    <h2 class="ia-mode-title">Configurar IA</h2>
                </div>
                
                <div class="api-key-status-row">
                    <div id="apiKeyStatusNeon" class="api-key-status-badge ${savedApiKey ? 'testing' : 'empty'}">
                        <span>${savedApiKey ? '...' : ''}</span>
                    </div>
                </div>
                
                <div class="api-key-section">
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
                
                <!-- Conteúdo avançado online -->
                <div id="advanced-online-content" class="advanced-content" style="display:none;">
                    
                    <!-- Seletor de Modelo -->
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
                            <button class="api-provider-get-btn" onclick="window.open('https://aistudio.google.com/apikey', '_blank')">
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
                            <button class="api-provider-get-btn" onclick="window.open('https://platform.deepseek.com/api_keys', '_blank')">
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
                            <button class="api-provider-get-btn" onclick="window.open('https://platform.openai.com/api-keys', '_blank')">
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
                            <button class="api-provider-get-btn" onclick="window.open('https://console.anthropic.com/settings/keys', '_blank')">
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
                            <button class="api-provider-get-btn" onclick="window.open('https://console.groq.com/keys', '_blank')">
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
                            <button class="api-provider-get-btn" onclick="window.open('https://openrouter.ai/keys', '_blank')">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                    
                    <!-- ElevenLabs (Voz) -->
                    <div class="api-provider-card" data-provider="elevenlabs">
                        <div class="api-provider-header" onclick="toggleApiProvider('elevenlabs')">
                            <div class="api-provider-info">
                                <img src="https://play-lh.googleusercontent.com/hv00KCMljDTnMaL7DPh7v2s5YLHdK1OwcGnBXv3M5hbRLKen30n2t3mUYD-ypQIrcw" alt="ElevenLabs" class="api-provider-logo" style="border-radius: 8px;">
                                <div class="api-provider-text">
                                    <span class="api-provider-name">ElevenLabs</span>
                                    <span class="api-provider-desc">Voz realista para chamadas</span>
                                </div>
                            </div>
                            <div class="api-provider-status">
                                <span class="api-provider-badge cheap">VOZ</span>
                                <i class="fa-solid fa-chevron-down api-provider-chevron"></i>
                            </div>
                        </div>
                        <div class="api-provider-content" id="elevenlabs-api-content">
                            <input type="text" class="api-provider-input" id="elevenlabsApiKeyInput" 
                                   placeholder="Cole sua API Key do ElevenLabs" 
                                   value="${localStorage.getItem('neo_api_elevenlabs') || ''}"
                                   oninput="saveProviderApiKey('elevenlabs', this.value)">
                            <select class="api-provider-input" id="elevenlabsVoiceSelectOnline" onchange="saveElevenLabsVoice(this.value)" style="margin-top: 8px;">
                                <option value="onwK4e9ZLuTAKqWW03F9">Daniel (Masculino BR)</option>
                                <option value="9BWtsMINqrJLrRacOk9x">Aria (Feminino)</option>
                                <option value="EXAVITQu4vr4xnSDxMaL">Sarah (Feminino)</option>
                                <option value="FGY2WhTYpPnrIDTdsKH5">Laura (Feminino BR)</option>
                                <option value="TX3LPaxmHKxFdv7VOQHJ">Liam (Masculino)</option>
                                <option value="pFZP5JQG7iQjIQuC4Bku">Lily (Feminino)</option>
                                <option value="bIHbv24MWmeRgasZH58o">Will (Masculino)</option>
                                <option value="nPczCjzI2devNBz1zQrb">Brian (Masculino)</option>
                            </select>
                            <button class="api-provider-get-btn" onclick="testElevenLabsVoiceOnline()" style="margin-top: 8px;">
                                <i class="fa-solid fa-play"></i> Testar Voz
                            </button>
                            <button class="api-provider-get-btn" onclick="window.open('https://elevenlabs.io/app/settings/api-keys', '_blank')" style="margin-top: 4px;">
                                <i class="fa-solid fa-key"></i> Obter API Key
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="local-llm-backdrop" class="local-llm-backdrop" onclick="closeLocalLlmModal()"></div>`;
    
    document.body.insertAdjacentHTML("beforeend", sidebarHTML);
    iaConfigCreated = true;
    
    // Conectar seletor de modelo
    const modelSelectorBtn = document.getElementById('openModelSelectorBtn');
    if (modelSelectorBtn && typeof openModelSelector === 'function') {
        modelSelectorBtn.addEventListener('click', openModelSelector);
    }
    
    // Sincronizar modelo selecionado
    syncAdvancedModelSelect();
}

// ===== FUNÇÕES DE API =====

function saveUserApiKey(apiKey) {
    localStorage.setItem('neo_user_api_key', apiKey);
}

const API_KEY_MAP = {
    'deepseek': 'neo_api_deepseek',
    'openai': 'neo_api_openai',
    'anthropic': 'neo_api_anthropic',
    'groq': 'neo_api_groq',
    'openrouter': 'neo_api_openrouter',
    'elevenlabs': 'neo_api_elevenlabs'
};

function saveProviderApiKey(provider, value) {
    const key = API_KEY_MAP[provider];
    if (key) {
        const trimmed = (value || '').trim();
        if (trimmed) {
            localStorage.setItem(key, trimmed);
        } else {
            localStorage.removeItem(key);
        }
    }
}

function syncApiKeyFromAdvanced(value) {
    const trimmed = (value || '').trim();
    saveUserApiKey(trimmed);
    
    const mainInput = document.getElementById('userApiKeyInput');
    if (mainInput && mainInput.value !== value) {
        mainInput.value = value;
    }
    
    onApiKeyInput(value);
}

function toggleApiProvider(provider) {
    const card = document.querySelector(`.api-provider-card[data-provider="${provider}"]`);
    if (card) {
        card.classList.toggle('expanded');
    }
}

function toggleAdvancedOnline() {
    const content = document.getElementById('advanced-online-content');
    const btn = document.querySelector('.ia-advanced-btn');
    
    if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        if (btn) btn.textContent = isHidden ? 'OCULTAR' : 'AVANÇADO';
    }
}

function openApiKeyPage() {
    window.open('https://aistudio.google.com/apikey', '_blank');
}

// ===== STATUS DA API KEY =====

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
}

function updateApiKeyStatusBadge(status, message) {
    const statusMap = {
        'inactive': 'empty',
        'pending': 'testing',
        'testing': 'testing',
        'active': 'active',
        'error': 'error'
    };
    updateApiKeyStatusNeon(statusMap[status] || 'empty', message);
}

// ===== TESTE DE API KEY =====

let apiKeyTestTimeout = null;

function onApiKeyInput(value) {
    const trimmed = (value || '').trim();
    
    saveUserApiKey(trimmed);
    
    if (apiKeyTestTimeout) {
        clearTimeout(apiKeyTestTimeout);
        apiKeyTestTimeout = null;
    }
    
    if (!trimmed) {
        updateApiKeyStatusNeon('empty');
        localStorage.removeItem('neo_api_key_tested');
        return;
    }
    
    updateApiKeyStatusNeon('testing');
    
    apiKeyTestTimeout = setTimeout(() => {
        testApiKeyAuto(trimmed);
    }, 800);
}

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
            updateApiKeyStatusNeon('active', response.status === 429 ? 'Ativo (limite)' : 'Ativo');
            localStorage.setItem('neo_api_key_tested', 'true');
            
            if (typeof clearAllFailedKeys === 'function') {
                clearAllFailedKeys();
            }
            
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect && !modelSelect.value.startsWith('gemini')) {
                modelSelect.value = 'gemini-2.5-flash';
                modelSelect.dispatchEvent(new Event('change'));
            }
            
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

// ===== SINCRONIZAÇÃO DE MODELO =====

function syncAdvancedModelSelect() {
    const modelSelect = document.getElementById('modelSelect');
    const nameEl = document.getElementById('selectedModelName');
    const iconEl = document.getElementById('selectedModelIcon');
    
    if (modelSelect && nameEl) {
        nameEl.textContent = modelSelect.value || 'gemini-2.5-flash';
    }
    
    if (iconEl && modelSelect) {
        const val = modelSelect.value || '';
        if (val.startsWith('gemini')) {
            iconEl.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32';
        } else if (val.startsWith('deepseek')) {
            iconEl.src = 'https://images.seeklogo.com/logo-png/61/2/deepseek-ai-icon-logo-png_seeklogo-611473.png';
        } else if (val.startsWith('gpt') || val.startsWith('o1') || val.startsWith('o3')) {
            iconEl.src = 'https://1millionbot.com/wp-content/uploads/2023/03/ChatGPT_logo.png';
        } else if (val.startsWith('claude')) {
            iconEl.src = 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg';
        } else {
            iconEl.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32';
        }
    }
}

// ===== ATUALIZAR INPUTS COM VALORES SALVOS =====

function updateConfigInputs() {
    const inputs = {
        'userApiKeyInput': 'neo_user_api_key',
        'geminiApiKeyInput': 'neo_user_api_key',
        'deepseekApiKeyInput': 'neo_api_deepseek',
        'openaiApiKeyInput': 'neo_api_openai',
        'anthropicApiKeyInput': 'neo_api_anthropic',
        'groqApiKeyInput': 'neo_api_groq',
        'openrouterApiKeyInput': 'neo_api_openrouter',
        'elevenlabsApiKeyInput': 'neo_api_elevenlabs'
    };
    
    for (const [inputId, storageKey] of Object.entries(inputs)) {
        const el = document.getElementById(inputId);
        const val = localStorage.getItem(storageKey);
        if (el && val) el.value = val;
    }
}

// ===== ELEVENLABS =====

function saveElevenLabsVoice(voiceId) {
    localStorage.setItem('neo_elevenlabs_voice', voiceId);
    
    const settingsSelect = document.getElementById('elevenLabsVoiceSelect');
    if (settingsSelect && settingsSelect.value !== voiceId) {
        settingsSelect.value = voiceId;
    }
    
    if (typeof saveSettings === 'function') {
        saveSettings();
    }
    
    if (typeof showToast === 'function') showToast('Voz ElevenLabs salva!', 'success');
}

async function testElevenLabsVoiceOnline() {
    const apiKey = document.getElementById('elevenlabsApiKeyInput')?.value?.trim() || 
                   localStorage.getItem('neo_api_elevenlabs');
    const voiceSelect = document.getElementById('elevenlabsVoiceSelectOnline');
    const voiceId = voiceSelect?.value || 'onwK4e9ZLuTAKqWW03F9';
    
    if (!apiKey) {
        if (typeof showToast === 'function') showToast('Configure a API Key do ElevenLabs primeiro!', 'error');
        return;
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
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
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
        
        if (typeof showToast === 'function') showToast('Voz ElevenLabs funcionando!', 'success');
    } catch (error) {
        console.error('Erro ao testar ElevenLabs:', error);
        if (typeof showToast === 'function') showToast(`Erro: ${error.message}`, 'error');
    }
}

function loadElevenLabsSettings() {
    let savedVoice = localStorage.getItem('neo_elevenlabs_voice');
    let savedApiKey = localStorage.getItem('neo_api_elevenlabs');
    
    if (!savedVoice || !savedApiKey) {
        try {
            const settings = JSON.parse(localStorage.getItem('neo_settings') || '{}');
            if (!savedVoice && settings.elevenLabsVoice) savedVoice = settings.elevenLabsVoice;
            if (!savedApiKey && settings.apiKeysElevenlabs && settings.apiKeysElevenlabs.length > 0) {
                savedApiKey = settings.apiKeysElevenlabs[0];
            }
        } catch (e) {}
    }
    
    const voiceSelect = document.getElementById('elevenlabsVoiceSelectOnline');
    const apiInput = document.getElementById('elevenlabsApiKeyInput');
    
    if (voiceSelect && savedVoice) voiceSelect.value = savedVoice;
    if (apiInput && savedApiKey) apiInput.value = savedApiKey;
}

// ===== STUBS PARA COMPATIBILIDADE =====

function updateLocalLlmUI() { /* no-op na versão web */ }

// Estado da LLM local (stub)
window.localLlmState = {
    mode: 'online',
    currentModel: null,
    engine: null,
    isLoaded: false,
    isLoading: false,
    isDownloading: false,
    enabled: false,
    downloadedModels: [],
    activeModel: null
};

console.log('[IA Config] Módulo de configuração de IA web carregado');
