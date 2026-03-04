// ===== MODEL SELECTOR - Modal Premium de Seleção de Modelo =====

(function () {
    'use strict';

    // Elementos do DOM
    let modalOverlay, modalList, openBtn, closeBtn, selectedModelNameEl, selectedModelIconEl, infoEl;
    let modelOptions = [];

    // URLs das APIs (mantidos para referência)
    const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
    const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

    // Mapeamento de providers para ícones (favicons)
    const PROVIDER_ICONS = {
        'deepseek': 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=32',
        'gemini': 'https://www.google.com/s2/favicons?domain=google.com&sz=32',
        'openai': 'https://www.google.com/s2/favicons?domain=openai.com&sz=32',
        'anthropic': 'https://www.google.com/s2/favicons?domain=anthropic.com&sz=32',
        'groq': 'https://www.google.com/s2/favicons?domain=groq.com&sz=32',
        'openrouter': 'https://www.google.com/s2/favicons?domain=openrouter.ai&sz=32',
        'custom': 'https://www.google.com/s2/favicons?domain=github.com&sz=32'
    };

    // Função unificada para obter chave - delega ao NeoAPI
    function getFirstApiKey(provider) {
        if (typeof NeoAPI !== 'undefined') {
            return NeoAPI.getKey(provider) || '';
        }
        // Fallback direto ao localStorage
        const keys = {
            'gemini': 'neo_user_api_key',
            'deepseek': 'neo_api_deepseek',
            'openai': 'neo_api_openai',
            'anthropic': 'neo_api_anthropic',
            'groq': 'neo_api_groq',
            'openrouter': 'neo_api_openrouter'
        };
        const val = localStorage.getItem(keys[provider] || '');
        return (val && val.trim()) ? val.trim() : '';
    }

    // Inicialização
    function init() {
        console.log('🔧 Model Selector: Inicializando...');

        modalOverlay = document.getElementById('modelSelectorModal');
        modalList = document.getElementById('modelSelectorList');
        openBtn = document.getElementById('openModelSelectorBtn');
        closeBtn = document.getElementById('closeModelSelectorBtn');
        selectedModelNameEl = document.getElementById('selectedModelName');
        selectedModelIconEl = document.getElementById('selectedModelIcon');
        infoEl = modalOverlay?.querySelector('.model-selector-info span');

        console.log('🔧 Model Selector: modalOverlay=', modalOverlay, 'openBtn=', openBtn);

        if (!modalOverlay || !openBtn) {
            console.warn('❌ Model selector elements not found');
            return;
        }

        // Pegar todas as opções de modelo
        modelOptions = modalList.querySelectorAll('.model-option');
        console.log('🔧 Model Selector: Encontradas', modelOptions.length, 'opções de modelo');

        // Event listeners
        openBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔧 Model Selector: Botão clicado!');
            openModal();
        });

        closeBtn?.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // Click em cada opção de modelo
        modelOptions.forEach(option => {
            option.addEventListener('click', () => selectModel(option));
        });

        // Marcar modelo atual como selecionado (priorizar salvo, depois select, depois padrão)
        const savedModel = localStorage.getItem('neo_selected_model');
        const savedProvider = localStorage.getItem('neo_selected_provider');
        const modelSelectEl = document.getElementById('modelSelect');
        const currentModel = savedModel || modelSelectEl?.value || 'gemini-2.5-flash';
        
        // Garantir que modelo e provider padrão estão salvos se não existirem
        if (!savedModel) {
            localStorage.setItem('neo_selected_model', 'gemini-2.5-flash');
        }
        if (!savedProvider) {
            localStorage.setItem('neo_selected_provider', 'gemini');
        }
        
        // Sincronizar select com modelo salvo ANTES de atualizar display
        if (modelSelectEl && savedModel) {
            modelSelectEl.value = savedModel;
        }
        
        // Atualizar nome do modelo selecionado (DEPOIS de sincronizar o select)
        updateSelectedModelDisplay();
        
        markModelAsSelected(currentModel);

        // ===== CONFIGURAÇÃO DO MODELO CUSTOMIZADO =====
        initCustomModelConfig();

        console.log('✅ Model Selector: Inicializado com sucesso! Modelo:', currentModel);
    }

    // Inicializar configuração do modelo customizado
    function initCustomModelConfig() {
        const customOption = document.getElementById('customModelOption');
        const configPanel = document.getElementById('customModelConfig');
        const saveBtn = document.getElementById('saveCustomModelBtn');
        const testBtn = document.getElementById('testCustomModelBtn');
        const modelNameInput = document.getElementById('customModelNameInput');
        const apiKeyInput = document.getElementById('customApiKeyInput');
        const endpointInput = document.getElementById('customEndpointInput');
        const displayName = document.getElementById('customModelDisplayName');
        const displayDesc = document.getElementById('customModelDisplayDesc');

        if (!customOption || !configPanel) return;

        // Carregar configuração existente
        if (typeof NeoAPI !== 'undefined') {
            const config = NeoAPI.getCustomConfig();
            if (config.model) modelNameInput.value = config.model;
            if (config.apiKey) apiKeyInput.value = config.apiKey;
            if (config.endpoint) endpointInput.value = config.endpoint;
            
            // Atualizar display se configurado
            if (config.model && config.endpoint) {
                displayName.textContent = config.model;
                displayDesc.textContent = new URL(config.endpoint).hostname;
            }
        }

        // Toggle do painel de configuração
        const toggleBtn = customOption.querySelector('.model-option-content');
        if (toggleBtn) {
            // Adicionar botão de configuração
            const configToggle = document.createElement('button');
            configToggle.innerHTML = '<i class="fa-solid fa-gear"></i>';
            configToggle.style.cssText = 'background: none; border: none; color: #888; cursor: pointer; padding: 4px 8px; margin-left: auto;';
            configToggle.title = 'Configurar modelo';
            configToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                configPanel.style.display = configPanel.style.display === 'none' ? 'block' : 'none';
            });
            customOption.insertBefore(configToggle, customOption.querySelector('.model-selected-icon'));
        }

        // Salvar configuração
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const endpoint = endpointInput.value.trim();
                const modelName = modelNameInput.value.trim();
                const apiKey = apiKeyInput.value.trim();

                if (!endpoint || !modelName || !apiKey) {
                    alert('⚠️ Preencha todos os campos!');
                    return;
                }

                try {
                    new URL(endpoint); // Validar URL
                } catch (e) {
                    alert('❌ URL do endpoint inválida!');
                    return;
                }

                if (typeof NeoAPI !== 'undefined') {
                    NeoAPI.saveCustomConfig(endpoint, modelName, apiKey);
                }

                // Atualizar display
                displayName.textContent = modelName;
                try {
                    displayDesc.textContent = new URL(endpoint).hostname;
                } catch(e) {
                    displayDesc.textContent = 'Configurado';
                }

                // Fechar painel
                configPanel.style.display = 'none';
                
                alert('✅ Modelo customizado salvo!');
            });
        }

        // Testar configuração
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                const endpoint = endpointInput.value.trim();
                const modelName = modelNameInput.value.trim();
                const apiKey = apiKeyInput.value.trim();

                if (!endpoint || !modelName || !apiKey) {
                    alert('⚠️ Preencha todos os campos antes de testar!');
                    return;
                }

                testBtn.disabled = true;
                testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testando...';

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: modelName,
                            messages: [{ role: 'user', content: 'Responda apenas: OK' }],
                            max_tokens: 10,
                            temperature: 0
                        })
                    });

                    if (response.ok) {
                        alert('✅ Conexão bem sucedida! O modelo está funcionando.');
                        customOption.classList.remove('error');
                        customOption.classList.add('available');
                    } else {
                        const errText = await response.text();
                        alert(`❌ Erro ${response.status}:\n${errText.substring(0, 200)}`);
                        customOption.classList.add('error');
                    }
                } catch (error) {
                    alert(`❌ Erro de conexão:\n${error.message}`);
                    customOption.classList.add('error');
                } finally {
                    testBtn.disabled = false;
                    testBtn.innerHTML = '<i class="fa-solid fa-flask"></i> Testar';
                }
            });
        }
    }

    // Abrir modal
    function openModal() {
        console.log('🔧 Model Selector: Abrindo modal...');
        if (!modalOverlay) {
            console.error('❌ modalOverlay não encontrado');
            return;
        }

        modalOverlay.classList.add('open');
        modalOverlay.classList.remove('closing');
        modalOverlay.setAttribute('aria-hidden', 'false');

        console.log('✅ Modal aberto, classList:', modalOverlay.classList.toString());

        // Iniciar teste de todos os modelos
        testAllModels();
    }

    // Fechar modal
    function closeModal() {
        if (!modalOverlay) return;

        modalOverlay.classList.add('closing');
        modalOverlay.setAttribute('aria-hidden', 'true');

        setTimeout(() => {
            modalOverlay.classList.remove('open', 'closing');
        }, 250);
    }

    // Selecionar modelo - permite selecionar qualquer modelo
    function selectModel(option) {
        const modelName = option.dataset.model;
        const provider = option.dataset.provider;
        const modelSelectEl = document.getElementById('modelSelect');

        console.log('✅ Model Selector: Selecionando modelo:', modelName, '(provider:', provider + ')');

        // Atualizar select oculto
        if (modelSelectEl) {
            modelSelectEl.value = modelName;
            modelSelectEl.dispatchEvent(new Event('change'));
        }
        
        // Salvar modelo selecionado no localStorage
        localStorage.setItem('neo_selected_model', modelName);
        localStorage.setItem('neo_selected_provider', provider);

        // Atualizar visual
        markModelAsSelected(modelName);
        updateSelectedModelDisplay();

        // Salvar nas configurações
        if (typeof saveSettings === 'function') {
            saveSettings();
        }

        // Fechar modal após seleção
        setTimeout(closeModal, 200);
    }

    // Marcar modelo como selecionado
    function markModelAsSelected(modelName) {
        modelOptions.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.model === modelName);
        });
    }

    // Obter provider de um modelo
    function getProviderFromModel(modelName) {
        // Encontrar a opção do modelo e pegar o provider
        const option = Array.from(modelOptions).find(opt => opt.dataset.model === modelName);
        if (option) {
            return option.dataset.provider;
        }
        // Fallback baseado no nome do modelo
        if (modelName === 'custom-model' || modelName.startsWith('custom:')) return 'custom';
        if (modelName.includes('deepseek')) return 'deepseek';
        if (modelName.includes('gemini')) return 'gemini';
        if (modelName.includes('gpt') || modelName.includes('o1')) return 'openai';
        if (modelName.includes('claude')) return 'anthropic';
        if (modelName.includes('llama')) return 'groq';
        if (modelName.includes('openrouter')) return 'openrouter';
        return 'deepseek'; // default
    }

    // Atualizar display do nome e ícone do modelo
    function updateSelectedModelDisplay() {
        // Usar localStorage como fonte de verdade, com fallback para o select
        const savedModel = localStorage.getItem('neo_selected_model');
        const modelSelectEl = document.getElementById('modelSelect');
        const currentModel = savedModel || modelSelectEl?.value || 'gemini-2.5-flash';

        // Atualizar nome
        if (selectedModelNameEl) {
            selectedModelNameEl.textContent = currentModel;
        }

        // Atualizar ícone baseado no provider
        if (selectedModelIconEl) {
            const provider = getProviderFromModel(currentModel);
            const iconUrl = PROVIDER_ICONS[provider] || PROVIDER_ICONS['deepseek'];
            selectedModelIconEl.src = iconUrl;
            selectedModelIconEl.alt = provider;
        }
    }

    // Testar todos os modelos
    async function testAllModels() {
        console.log('🧪 [Model Selector] ====== INICIANDO TESTE DE MODELOS ======');
        
        if (infoEl) {
            infoEl.textContent = 'Testando APIs...';
        }

        // Primeiro, marcar TODOS como "sem chave" (error)
        modelOptions.forEach(option => {
            option.classList.remove('testing', 'available', 'error');
            option.classList.add('error');
        });

        // Obter chaves via NeoAPI (fonte única)
        const providers = ['deepseek', 'gemini', 'openai', 'anthropic', 'groq', 'openrouter'];
        const apiKeys = {};
        providers.forEach(p => {
            apiKeys[p] = getFirstApiKey(p);
            console.log(`🔑 [Model Selector] ${p}: ${apiKeys[p] ? '✅' : '❌'}`);
        });

        // Para cada provider que tem chave, marcar como "testando" (amarelo)
        modelOptions.forEach(option => {
            const provider = option.dataset.provider;
            if (apiKeys[provider]) {
                option.classList.remove('error');
                option.classList.add('testing');
            }
        });

        // Array de promessas de teste
        const testPromises = [];

        modelOptions.forEach(option => {
            const modelName = option.dataset.model;
            const provider = option.dataset.provider;

            if (!apiKeys[provider]) {
                console.log(`⏭️ [Model Selector] ${modelName}: Sem chave, pulando...`);
                return; // Sem chave, já marcado como erro
            }

            console.log(`🧪 [Model Selector] Preparando teste: ${modelName} (${provider})`);

            let testPromise;
            switch (provider) {
                case 'deepseek':
                    testPromise = testDeepSeekModel(modelName, apiKeys.deepseek, option);
                    break;
                case 'gemini':
                    testPromise = testGeminiModel(modelName, apiKeys.gemini, option);
                    break;
                case 'openai':
                    testPromise = testOpenAIModel(modelName, apiKeys.openai, option);
                    break;
                case 'anthropic':
                    testPromise = testAnthropicModel(modelName, apiKeys.anthropic, option);
                    break;
                case 'groq':
                    testPromise = testGroqModel(modelName, apiKeys.groq, option);
                    break;
                case 'openrouter':
                    testPromise = testOpenRouterModel(modelName, apiKeys.openrouter, option);
                    break;
                default:
                    console.warn(`⚠️ [Model Selector] Provider desconhecido: ${provider}`);
                    return;
            }
            
            if (testPromise) {
                testPromises.push(testPromise);
            }
        });

        console.log(`🧪 [Model Selector] ${testPromises.length} testes em andamento...`);

        // Aguardar todos os testes
        await Promise.allSettled(testPromises);

        // Contar resultados
        const available = document.querySelectorAll('.model-option.available').length;
        const errors = document.querySelectorAll('.model-option.error').length;
        const testing = document.querySelectorAll('.model-option.testing').length;

        console.log(`📊 [Model Selector] Resultados: ${available} disponíveis, ${errors} com erro, ${testing} ainda testando`);

        if (infoEl) {
            infoEl.textContent = `${available} disponível(is), ${errors} com erro`;
        }
    }

    // Definir status do modelo com logs
    function setModelStatus(optionElement, status) {
        const modelName = optionElement.dataset.model;
        console.log(`📌 [Model Selector] ${modelName}: Status → ${status}`);
        optionElement.classList.remove('testing', 'available', 'error');
        optionElement.classList.add(status);
    }
    // Testar modelo DeepSeek
    async function testDeepSeekModel(modelName, apiKey, optionElement) {
        console.log(`🧪 [DeepSeek Test] Testando ${modelName}...`);
        
        if (!apiKey) {
            console.log(`❌ [DeepSeek Test] ${modelName}: Sem API key`);
            setModelStatus(optionElement, 'error');
            return;
        }

        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1,
                    stream: false
                }),
                signal: AbortSignal.timeout(15000) // 15s timeout
            });

            console.log(`🧪 [DeepSeek Test] ${modelName}: Status ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [DeepSeek Test] ${modelName}: Sucesso!`);
                setModelStatus(optionElement, 'available');
            } else {
                const errorText = await response.text();
                console.warn(`❌ [DeepSeek Test] ${modelName}: Erro ${response.status}`, errorText.substring(0, 200));
                setModelStatus(optionElement, 'error');
            }
        } catch (error) {
            console.warn(`❌ [DeepSeek Test] ${modelName}: Exception`, error.message);
            setModelStatus(optionElement, 'error');
        }
    }

    // Testar modelo Gemini
    async function testGeminiModel(modelName, apiKey, optionElement) {
        if (!apiKey) {
            console.log(`❌ [Gemini Test] ${modelName}: Sem API key`);
            setModelStatus(optionElement, 'error');
            return;
        }

        // Limpar a chave de espaços e caracteres invisíveis
        const cleanKey = apiKey.replace(/\s/g, '').trim();
        
        try {
            const url = `${GEMINI_API_BASE}${modelName}:generateContent?key=${cleanKey}`;
            console.log(`🧪 [Gemini Test] Testando ${modelName}...`);
            console.log(`🧪 [Gemini Test] URL: ${url.substring(0, 80)}...`);
            console.log(`🧪 [Gemini Test] Key length: ${cleanKey.length}, starts: ${cleanKey.substring(0, 10)}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Hi' }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 1
                    }
                }),
                signal: AbortSignal.timeout(15000) // 15s timeout
            });

            console.log(`🧪 [Gemini Test] ${modelName}: Status ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [Gemini Test] ${modelName}: Sucesso!`, data.candidates ? 'Com candidates' : 'Sem candidates');
                // Qualquer resposta 200 é válida
                setModelStatus(optionElement, 'available');
            } else {
                // Logar erro para debug
                const errorText = await response.text();
                console.warn(`❌ [Gemini Test] ${modelName}: Erro ${response.status}`, errorText.substring(0, 200));
                setModelStatus(optionElement, 'error');
            }
        } catch (error) {
            console.warn(`❌ [Gemini Test] ${modelName}: Exception`, error.message);
            setModelStatus(optionElement, 'error');
        }
    }

    // Testar modelo OpenAI
    async function testOpenAIModel(modelName, apiKey, optionElement) {
        console.log(`🧪 [OpenAI Test] Testando ${modelName}...`);
        
        if (!apiKey) {
            console.log(`❌ [OpenAI Test] ${modelName}: Sem API key`);
            setModelStatus(optionElement, 'error');
            return;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1
                }),
                signal: AbortSignal.timeout(15000)
            });

            console.log(`🧪 [OpenAI Test] ${modelName}: Status ${response.status}`);

            if (response.ok) {
                console.log(`✅ [OpenAI Test] ${modelName}: Sucesso!`);
                setModelStatus(optionElement, 'available');
            } else {
                const errorText = await response.text();
                console.warn(`❌ [OpenAI Test] ${modelName}: Erro ${response.status}`, errorText.substring(0, 200));
                setModelStatus(optionElement, 'error');
            }
        } catch (error) {
            console.warn(`❌ [OpenAI Test] ${modelName}: Exception`, error.message);
            setModelStatus(optionElement, 'error');
        }
    }

    // Testar modelo Anthropic
    async function testAnthropicModel(modelName, apiKey, optionElement) {
        console.log(`🧪 [Anthropic Test] Testando ${modelName}...`);
        
        if (!apiKey) {
            console.log(`❌ [Anthropic Test] ${modelName}: Sem API key`);
            setModelStatus(optionElement, 'error');
            return;
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1
                }),
                signal: AbortSignal.timeout(15000)
            });

            console.log(`🧪 [Anthropic Test] ${modelName}: Status ${response.status}`);

            if (response.ok) {
                console.log(`✅ [Anthropic Test] ${modelName}: Sucesso!`);
                setModelStatus(optionElement, 'available');
            } else {
                const errorText = await response.text();
                console.warn(`❌ [Anthropic Test] ${modelName}: Erro ${response.status}`, errorText.substring(0, 200));
                setModelStatus(optionElement, 'error');
            }
        } catch (error) {
            console.warn(`❌ [Anthropic Test] ${modelName}: Exception`, error.message);
            setModelStatus(optionElement, 'error');
        }
    }

    // Testar modelo Groq
    async function testGroqModel(modelName, apiKey, optionElement) {
        console.log(`🧪 [Groq Test] Testando ${modelName}...`);
        
        if (!apiKey) {
            console.log(`❌ [Groq Test] ${modelName}: Sem API key`);
            setModelStatus(optionElement, 'error');
            return;
        }

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1
                }),
                signal: AbortSignal.timeout(15000)
            });

            console.log(`🧪 [Groq Test] ${modelName}: Status ${response.status}`);

            if (response.ok) {
                console.log(`✅ [Groq Test] ${modelName}: Sucesso!`);
                setModelStatus(optionElement, 'available');
            } else {
                const errorText = await response.text();
                console.warn(`❌ [Groq Test] ${modelName}: Erro ${response.status}`, errorText.substring(0, 200));
                setModelStatus(optionElement, 'error');
            }
        } catch (error) {
            console.warn(`❌ [Groq Test] ${modelName}: Exception`, error.message);
            setModelStatus(optionElement, 'error');
        }
    }

    // Testar modelo OpenRouter
    async function testOpenRouterModel(modelName, apiKey, optionElement) {
        console.log(`🧪 [OpenRouter Test] Testando ${modelName}...`);
        
        if (!apiKey) {
            console.log(`❌ [OpenRouter Test] ${modelName}: Sem API key`);
            setModelStatus(optionElement, 'error');
            return;
        }

        try {
            // Remove prefixo openrouter/
            const actualModel = modelName.replace('openrouter/', '');

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: actualModel,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1
                }),
                signal: AbortSignal.timeout(15000)
            });

            console.log(`🧪 [OpenRouter Test] ${modelName}: Status ${response.status}`);

            if (response.ok) {
                console.log(`✅ [OpenRouter Test] ${modelName}: Sucesso!`);
                setModelStatus(optionElement, 'available');
            } else {
                const errorText = await response.text();
                console.warn(`❌ [OpenRouter Test] ${modelName}: Erro ${response.status}`, errorText.substring(0, 200));
                setModelStatus(optionElement, 'error');
            }
        } catch (error) {
            console.warn(`❌ [OpenRouter Test] ${modelName}: Exception`, error.message);
            setModelStatus(optionElement, 'error');
        }
    }

    // Escutar mudanças no select oculto (para sincronizar)
    function setupSelectSync() {
        const modelSelectEl = document.getElementById('modelSelect');
        if (modelSelectEl) {
            modelSelectEl.addEventListener('change', () => {
                markModelAsSelected(modelSelectEl.value);
                updateSelectedModelDisplay();
            });
        }
    }

    // Tentar inicializar com retry (para casos onde o botão é criado dinamicamente)
    function tryInit(retries = 10) {
        const btn = document.getElementById('openModelSelectorBtn');
        const modal = document.getElementById('modelSelectorModal');
        
        if (btn && modal) {
            console.log('✅ Model Selector: Elementos encontrados, inicializando...');
            init();
            setupSelectSync();
        } else if (retries > 0) {
            console.log(`⏳ Model Selector: Aguardando elementos... (${retries} tentativas restantes)`);
            setTimeout(() => tryInit(retries - 1), 300);
        } else {
            console.warn('❌ Model Selector: Elementos não encontrados após todas as tentativas');
        }
    }

    // Expor função de inicialização global para ser chamada externamente
    window.initModelSelector = function() {
        console.log('🔧 Model Selector: Inicialização externa solicitada');
        init();
        setupSelectSync();
    };

    // Inicializar quando DOM estiver pronto (com retry)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Aguardar um pouco para o local-llm.js criar os elementos
            setTimeout(() => tryInit(), 500);
        });
    } else {
        // DOM já carregado, aguardar local-llm.js
        setTimeout(() => tryInit(), 500);
    }

})();
