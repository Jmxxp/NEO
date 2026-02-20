// ============================================================
// NEO API - Sistema Unificado de Chamadas de API
// ============================================================
// Módulo central que gerencia TODAS as chaves, modelos e chamadas.
// Todas as partes do app (chat, voice, code-studio, video-studio)
// devem usar este módulo como fonte única de verdade.
// ============================================================

window.NeoAPI = (function() {
    'use strict';

    // ===== CONFIGURAÇÃO DOS PROVIDERS =====
    const PROVIDERS = {
        gemini: {
            name: 'Gemini',
            storageKey: 'neo_user_api_key',
            format: 'gemini',
            defaultModel: 'gemini-2.5-flash',
            endpoints: {
                generate: (model, key) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
                stream: (model, key) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`
            }
        },
        deepseek: {
            name: 'DeepSeek',
            storageKey: 'neo_api_deepseek',
            format: 'openai',
            defaultModel: 'deepseek-chat',
            endpoint: 'https://api.deepseek.com/v1/chat/completions',
            authType: 'bearer'
        },
        openai: {
            name: 'OpenAI',
            storageKey: 'neo_api_openai',
            format: 'openai',
            defaultModel: 'gpt-4o-mini',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            authType: 'bearer'
        },
        anthropic: {
            name: 'Anthropic',
            storageKey: 'neo_api_anthropic',
            format: 'anthropic',
            defaultModel: 'claude-3-5-sonnet-20241022',
            endpoint: 'https://api.anthropic.com/v1/messages',
            authType: 'x-api-key'
        },
        groq: {
            name: 'Groq',
            storageKey: 'neo_api_groq',
            format: 'openai',
            defaultModel: 'llama-3.3-70b-versatile',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            authType: 'bearer'
        },
        openrouter: {
            name: 'OpenRouter',
            storageKey: 'neo_api_openrouter',
            format: 'openai',
            defaultModel: 'openrouter/auto',
            endpoint: 'https://openrouter.ai/api/v1/chat/completions',
            authType: 'bearer',
            extraHeaders: {
                'HTTP-Referer': 'https://neo-chat.app',
                'X-Title': 'Neo Chat'
            }
        },
        custom: {
            name: 'Modelo Customizado',
            storageKey: 'neo_api_custom',
            format: 'openai', // Usa formato OpenAI por padrão
            defaultModel: 'custom-model',
            authType: 'bearer',
            // Endpoint e modelo são dinâmicos - buscados do localStorage
            getEndpoint: () => localStorage.getItem('neo_custom_endpoint') || '',
            getModel: () => localStorage.getItem('neo_custom_model') || 'custom-model'
        }
    };

    // ===== MODEL → PROVIDER MAP =====
    function detectProvider(model) {
        if (!model) return 'gemini';
        if (model === 'custom-model' || model.startsWith('custom:')) return 'custom';
        if (model.startsWith('gemini-')) return 'gemini';
        if (model.startsWith('deepseek-')) return 'deepseek';
        if (model.startsWith('gpt-') || model.startsWith('o1-')) return 'openai';
        if (model.startsWith('claude-')) return 'anthropic';
        if (model.startsWith('llama-') || model.startsWith('mixtral-')) return 'groq';
        if (model.startsWith('openrouter/')) return 'openrouter';
        return 'gemini'; // fallback
    }

    // ===== CHAVES API =====
    
    // Obter chave de API para um provider
    function getKey(provider) {
        if (!provider) provider = getProvider();
        const config = PROVIDERS[provider];
        if (!config) {
            console.warn(`[NeoAPI] Provider desconhecido: ${provider}`);
            return null;
        }
        
        // 1. Fonte principal: localStorage com a key específica do provider
        const key = localStorage.getItem(config.storageKey);
        if (key && key.trim()) {
            return key.trim();
        }
        
        // 2. Fallback: chave genérica neo_api_{provider}
        if (config.storageKey !== `neo_api_${provider}`) {
            const fallback = localStorage.getItem(`neo_api_${provider}`);
            if (fallback && fallback.trim()) {
                return fallback.trim();
            }
        }
        
        return null;
    }

    // Salvar chave de API
    function saveKey(provider, value) {
        const config = PROVIDERS[provider];
        if (!config) return;
        
        const trimmed = (value || '').trim();
        if (trimmed) {
            localStorage.setItem(config.storageKey, trimmed);
            console.log(`🔑 [NeoAPI] Chave ${provider} salva: ${trimmed.substring(0, 10)}...`);
        } else {
            localStorage.removeItem(config.storageKey);
            console.log(`🔑 [NeoAPI] Chave ${provider} removida`);
        }
    }

    // Verificar se um provider tem chave configurada
    function hasKey(provider) {
        return !!getKey(provider);
    }

    // Obter chave Gemini (atalho usado por video-studio e outros)
    function getGeminiKey() {
        return getKey('gemini');
    }

    // ===== MODELO E PROVIDER =====
    
    const DEFAULT_MODEL = 'gemini-2.5-flash';

    function getModel() {
        // 1. localStorage (salvo pelo model-selector)
        const saved = localStorage.getItem('neo_selected_model');
        if (saved && saved.trim()) return saved.trim();
        
        // 2. Hidden select element
        const select = document.getElementById('modelSelect');
        if (select && select.value) return select.value;
        
        // 3. Default
        return DEFAULT_MODEL;
    }

    function getProvider(model) {
        if (!model) model = getModel();
        
        // Primeiro verificar localStorage
        const savedProvider = localStorage.getItem('neo_selected_provider');
        const savedModel = localStorage.getItem('neo_selected_model');
        
        // Se o modelo pedido é o salvo, usar o provider salvo
        if (savedProvider && savedModel === model) {
            return savedProvider;
        }
        
        // Detectar pelo nome do modelo
        return detectProvider(model);
    }

    function getProviderConfig(provider) {
        if (!provider) provider = getProvider();
        return PROVIDERS[provider] || PROVIDERS.gemini;
    }

    // ===== URL HELPER (CORS proxy para browser) =====
    function getUrl(originalUrl) {
        if (typeof isCordovaApp === 'function' && isCordovaApp()) {
            return originalUrl;
        }
        return 'https://corsproxy.io/?' + encodeURIComponent(originalUrl);
    }

    // ===== CHAMADA UNIFICADA - FORMATO OPENAI (DeepSeek, OpenAI, Groq, OpenRouter, Custom) =====
    async function callOpenAICompatible(provider, options) {
        const config = PROVIDERS[provider];
        const apiKey = options.apiKey || getKey(provider);
        
        if (!apiKey) {
            const error = new Error(`🔑 **Chave API ${config.name} não configurada!**\n\nAdicione sua chave em Configurações > IA > Avançado.`);
            error.isApiError = true;
            error.needsApiKey = true;
            throw error;
        }

        let model = options.model || getModel();

        // Provider customizado: usar modelo e endpoint dinâmicos
        let endpoint = config.endpoint;
        if (provider === 'custom') {
            endpoint = config.getEndpoint ? config.getEndpoint() : '';
            if (!endpoint) {
                const error = new Error(`⚠️ **Endpoint não configurado!**\n\nConfigure o endpoint do modelo customizado em Configurações.`);
                error.isApiError = true;
                throw error;
            }
            // Usar modelo customizado configurado
            model = config.getModel ? config.getModel() : model;
        }

        // OpenRouter: remover prefixo
        if (provider === 'openrouter' && model.startsWith('openrouter/')) {
            model = model.replace('openrouter/', '');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(config.extraHeaders || {})
        };

        // Ajuste especial Anthropic que usa x-api-key - mas isso não entra aqui
        // (Anthropic tem sua própria função)

        const body = {
            model: model,
            messages: options.messages,
            temperature: options.temperature ?? 0.5,
            top_p: options.top_p ?? 0.6,
            max_tokens: options.max_tokens ?? 4096,
            stream: options.stream !== false,
            ...(options.stream !== false ? { stream_options: { include_usage: true } } : {}),
            ...(options.stop ? { stop: options.stop } : {}),
            ...(options.frequency_penalty ? { frequency_penalty: options.frequency_penalty } : {}),
            ...(options.presence_penalty !== undefined ? { presence_penalty: options.presence_penalty } : {})
        };

        const url = getUrl(endpoint);
        console.log(`🔵 [NeoAPI:${config.name}] Chamando ${model}...`);

        const fetchOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };

        if (options.signal) fetchOptions.signal = options.signal;

        const response = await (typeof fetchWithTimeout === 'function' ? fetchWithTimeout : fetch)(url, fetchOptions);

        if (!response.ok) {
            const status = response.status;
            let errorMsg = '';

            switch (status) {
                case 429:
                    errorMsg = `⚠️ **Limite atingido! (${config.name})**\n\nAguarde alguns minutos ou troque de modelo.`;
                    break;
                case 401:
                    errorMsg = `🔑 **Chave API ${config.name} inválida! (Erro ${status})**\n\nVerifique sua chave em Configurações.`;
                    break;
                case 402:
                    errorMsg = `💳 **Créditos insuficientes! (${config.name})**\n\nRecarregue seus créditos.`;
                    break;
                case 400:
                    let detail = '';
                    try { detail = await response.text(); } catch(e) {}
                    errorMsg = `❌ **Requisição inválida! (${config.name} ${status})**\n\n${detail ? detail.substring(0, 200) : 'Verifique o modelo e a chave API.'}`;
                    break;
                case 500: case 503:
                    errorMsg = `🔧 **${config.name} indisponível! (Erro ${status})**\n\nTente novamente em alguns minutos.`;
                    break;
                default:
                    errorMsg = `❌ **Erro ${config.name} (${status})**\n\nTente novamente ou troque de modelo.`;
            }

            const error = new Error(errorMsg);
            error.isApiError = true;
            error.statusCode = status;
            throw error;
        }

        return response;
    }

    // ===== CHAMADA UNIFICADA - FORMATO ANTHROPIC =====
    async function callAnthropic(options) {
        const config = PROVIDERS.anthropic;
        const apiKey = options.apiKey || getKey('anthropic');

        if (!apiKey) {
            const error = new Error(`🔑 **Chave API Anthropic não configurada!**\n\nAdicione sua chave em Configurações > IA > Avançado.`);
            error.isApiError = true;
            error.needsApiKey = true;
            throw error;
        }

        const model = options.model || getModel();

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        };

        // Separar system prompt das messages (Anthropic requer isso)
        let systemPrompt = '';
        const messages = [];
        for (const msg of options.messages) {
            if (msg.role === 'system') {
                systemPrompt = msg.content;
            } else {
                messages.push(msg);
            }
        }

        const body = {
            model: model,
            system: systemPrompt,
            messages: messages,
            max_tokens: options.max_tokens ?? 4096,
            stream: options.stream !== false
        };

        const url = getUrl(config.endpoint);
        console.log(`🟣 [NeoAPI:Anthropic] Chamando ${model}...`);

        const fetchOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };

        if (options.signal) fetchOptions.signal = options.signal;

        const response = await (typeof fetchWithTimeout === 'function' ? fetchWithTimeout : fetch)(url, fetchOptions);

        if (!response.ok) {
            const status = response.status;
            let errorMsg = '';
            switch (status) {
                case 429:
                    errorMsg = `⚠️ **Rate Limit Anthropic!**\n\nAguarde alguns minutos.`;
                    break;
                case 401:
                    errorMsg = `🔑 **Chave API Anthropic inválida! (Erro ${status})**\n\nVerifique em Configurações.`;
                    break;
                default:
                    errorMsg = `❌ **Erro Anthropic (${status})**\n\nTente novamente ou troque de modelo.`;
            }
            const error = new Error(errorMsg);
            error.isApiError = true;
            error.statusCode = status;
            throw error;
        }

        return response;
    }

    // ===== CHAMADA UNIFICADA - FORMATO GEMINI =====
    async function callGemini(options) {
        const config = PROVIDERS.gemini;
        const apiKey = options.apiKey || getKey('gemini');

        if (!apiKey) {
            const error = new Error(`🔑 **Chave API Gemini não configurada!**\n\nInsira sua chave API do Google AI Studio em Configurações.`);
            error.isApiError = true;
            error.needsApiKey = true;
            throw error;
        }

        const model = options.model || getModel();
        const streaming = options.stream === true;

        // Construir contents no formato Gemini
        let contents = options.geminiContents; // já formatado
        if (!contents && options.messages) {
            // Converter do formato OpenAI para Gemini
            contents = [];
            let systemText = '';
            for (const msg of options.messages) {
                if (msg.role === 'system') {
                    systemText = msg.content;
                } else {
                    contents.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content || msg.text || '' }]
                    });
                }
            }
            if (!options.systemPrompt && systemText) {
                options.systemPrompt = systemText;
            }
        }

        const requestBody = {
            contents
        };

        if (options.systemPrompt) {
            requestBody.systemInstruction = {
                parts: [{ text: options.systemPrompt }]
            };
        }

        requestBody.generationConfig = {
            temperature: options.temperature ?? 0.5,
            topP: options.top_p ?? 0.9,
            maxOutputTokens: options.max_tokens ?? 4096
        };

        if (options.safetySettings) {
            requestBody.safetySettings = options.safetySettings;
        }

        const endpoint = streaming
            ? config.endpoints.stream(model, apiKey)
            : config.endpoints.generate(model, apiKey);
        
        const url = getUrl(endpoint);
        console.log(`🟢 [NeoAPI:Gemini] Chamando ${model} (stream=${streaming})...`);

        const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        };

        if (options.signal) fetchOptions.signal = options.signal;

        let response;
        try {
            response = await (typeof fetchWithTimeout === 'function' ? fetchWithTimeout : fetch)(url, fetchOptions);
        } catch (fetchError) {
            const error = new Error(`❌ **Erro de conexão com o Gemini**\n\n${fetchError.message}`);
            error.isApiError = true;
            throw error;
        }

        if (!response.ok) {
            const status = response.status;
            let errorDetails = '';
            try {
                const errBody = await response.text();
                const errJson = JSON.parse(errBody);
                errorDetails = errJson.error?.message || errBody.substring(0, 200);
            } catch(e) {}

            let errorMsg = '';
            let needsApiKey = false;

            switch (status) {
                case 400:
                    const isKeyError = errorDetails.toLowerCase().includes('api key') || 
                                       errorDetails.toLowerCase().includes('api_key_invalid');
                    if (isKeyError) {
                        errorMsg = `🔑 **Chave API inválida!**\n\n${errorDetails}`;
                        needsApiKey = true;
                    } else if (errorDetails.toLowerCase().includes('not found') || errorDetails.toLowerCase().includes('does not exist')) {
                        errorMsg = `❌ **Modelo "${model}" não disponível!**\n\n${errorDetails}`;
                    } else {
                        errorMsg = `❌ **Requisição inválida! (${status})**\n\n${errorDetails || 'Verifique modelo e chave.'}`;
                    }
                    break;
                case 404:
                    errorMsg = `❌ **Modelo "${model}" não encontrado!**\n\n${errorDetails}`;
                    break;
                case 429:
                    errorMsg = `⚠️ **Limite diário Gemini atingido!**\n\nUse o modo offline ou aguarde 24h.`;
                    break;
                case 401: case 403:
                    errorMsg = `🔑 **Chave API Gemini inválida! (${status})**\n\nConfigure uma nova chave.`;
                    needsApiKey = true;
                    break;
                case 500: case 503:
                    errorMsg = `🔧 **Gemini indisponível! (${status})**\n\nTente novamente em minutos.`;
                    break;
                default:
                    errorMsg = `❌ **Erro Gemini (${status})**\n\nTente novamente.`;
            }

            const error = new Error(errorMsg);
            error.isApiError = true;
            error.statusCode = status;
            if (needsApiKey) error.needsApiKey = true;
            throw error;
        }

        return response;
    }

    // ===== CHAMADA UNIVERSAL =====
    // Determina automaticamente o provider e chama a função correta
    async function call(options) {
        const model = options.model || getModel();
        const provider = options.provider || detectProvider(model);
        const config = PROVIDERS[provider];

        if (!config) {
            throw new Error(`Provider desconhecido: ${provider}`);
        }

        console.log(`🌐 [NeoAPI] call() → provider=${provider}, model=${model}`);

        switch (config.format) {
            case 'openai':
                return callOpenAICompatible(provider, { ...options, model });
            case 'anthropic':
                return callAnthropic({ ...options, model });
            case 'gemini':
                return callGemini({ ...options, model });
            default:
                return callOpenAICompatible(provider, { ...options, model });
        }
    }

    // ===== CHAMADA SIMPLES (para voice-call, code-studio) =====
    // Retorna texto diretamente, sem streaming
    async function callSimple(options) {
        const model = options.model || getModel();
        const provider = options.provider || detectProvider(model);
        const config = PROVIDERS[provider];
        const apiKey = options.apiKey || getKey(provider);

        if (!apiKey) {
            throw new Error(`Chave API ${config.name} não configurada`);
        }

        const messages = options.messages || [
            { role: 'system', content: options.systemPrompt || '' },
            { role: 'user', content: options.userMessage || '' }
        ];

        // Gemini: formato especial
        if (config.format === 'gemini') {
            let effectiveModel = model;
            if (!model.startsWith('gemini-')) effectiveModel = config.defaultModel;
            
            const url = config.endpoints.generate(effectiveModel, apiKey);
            const systemContent = messages.find(m => m.role === 'system')?.content || '';
            const userContent = messages.find(m => m.role === 'user')?.content || '';

            const response = await fetch(getUrl(url), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: userContent }] }],
                    systemInstruction: systemContent ? { parts: [{ text: systemContent }] } : undefined,
                    generationConfig: {
                        temperature: options.temperature ?? 0.7,
                        maxOutputTokens: options.max_tokens ?? 500,
                        topP: 0.9
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`Erro ${config.name}: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        // Anthropic: formato especial
        if (config.format === 'anthropic') {
            let effectiveModel = model;
            if (!model.startsWith('claude-')) effectiveModel = config.defaultModel;

            const systemContent = messages.find(m => m.role === 'system')?.content || '';
            const userContent = messages.find(m => m.role === 'user')?.content || '';

            const response = await fetch(getUrl(config.endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: effectiveModel,
                    max_tokens: options.max_tokens ?? 500,
                    system: systemContent,
                    messages: [{ role: 'user', content: userContent }]
                }),
                signal: options.signal
            });

            if (!response.ok) {
                throw new Error(`Erro ${config.name}: ${response.status}`);
            }

            const data = await response.json();
            return data.content?.[0]?.text || '';
        }

        // OpenAI-compatible (DeepSeek, OpenAI, Groq, OpenRouter)
        let effectiveModel = model;
        if (provider === 'openrouter' && effectiveModel.startsWith('openrouter/')) {
            effectiveModel = effectiveModel.replace('openrouter/', '');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(config.extraHeaders || {})
        };

        const response = await fetch(getUrl(config.endpoint), {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: effectiveModel,
                messages: messages.filter(m => m.role !== 'system' || config.format === 'openai' ? true : false),
                max_tokens: options.max_tokens ?? 500,
                temperature: options.temperature ?? 0.7
            }),
            signal: options.signal
        });

        if (!response.ok) {
            throw new Error(`Erro ${config.name}: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    // ===== TESTE RÁPIDO DE PROVIDER =====
    async function testProvider(provider, timeout = 15000) {
        const apiKey = getKey(provider);
        if (!apiKey) return { ok: false, error: 'no_key' };

        const config = PROVIDERS[provider];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const result = await callSimple({
                provider,
                model: config.defaultModel,
                apiKey,
                messages: [
                    { role: 'system', content: 'Responda apenas: OK' },
                    { role: 'user', content: 'Teste' }
                ],
                max_tokens: 10,
                temperature: 0,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return { ok: true, response: result };
        } catch (error) {
            clearTimeout(timeoutId);
            return { ok: false, error: error.message };
        }
    }

    // ===== MODELO CUSTOMIZADO =====
    function saveCustomConfig(endpoint, modelName, apiKey) {
        if (endpoint) localStorage.setItem('neo_custom_endpoint', endpoint.trim());
        if (modelName) localStorage.setItem('neo_custom_model', modelName.trim());
        if (apiKey) saveKey('custom', apiKey);
        console.log('🔧 [NeoAPI] Configuração customizada salva:', { endpoint, modelName });
    }

    function getCustomConfig() {
        return {
            endpoint: localStorage.getItem('neo_custom_endpoint') || '',
            model: localStorage.getItem('neo_custom_model') || '',
            apiKey: getKey('custom') || ''
        };
    }

    function isCustomConfigured() {
        const config = getCustomConfig();
        return !!(config.endpoint && config.model && config.apiKey);
    }

    // ===== API PÚBLICA =====
    return {
        // Chaves
        getKey,
        saveKey,
        hasKey,
        getGeminiKey,
        
        // Modelo e Provider
        getModel,
        getProvider,
        detectProvider,
        getProviderConfig,
        
        // Chamadas
        call,                       // Streaming (para chat principal)
        callSimple,                 // Sem streaming (para voice, code-studio)
        callOpenAICompatible,       // Direto OpenAI-compatible
        callAnthropic,              // Direto Anthropic
        callGemini,                 // Direto Gemini
        
        // Modelo customizado
        saveCustomConfig,
        getCustomConfig,
        isCustomConfigured,
        
        // Utilitários
        testProvider,
        getUrl,
        
        // Constantes
        PROVIDERS,
        DEFAULT_MODEL
    };
})();
