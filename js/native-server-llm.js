/**
 * ===== NATIVE LLAMA.CPP SERVER INTEGRATION =====
 * Alternativa de alta performance ao WebLLM
 * Usa servidor llama.cpp nativo rodando em localhost
 * Similar à arquitetura do app Local AI
 */

// Configuração do servidor nativo
const NATIVE_SERVER_CONFIG = {
    host: '127.0.0.1',
    port: 8080,
    baseUrl: 'http://127.0.0.1:8080',
    endpoints: {
        health: '/health',
        completion: '/completion',
        chat: '/v1/chat/completions',
        models: '/v1/models',
        props: '/props'
    }
};

// System prompt
const NATIVE_SYSTEM_PROMPT = `You are NEO, a helpful and detailed AI assistant. Respond in Brazilian Portuguese.

IMPORTANT: Give COMPLETE and DETAILED responses - never short answers. For open questions, provide at least 3-4 paragraphs with examples.

FORMATTING: **bold**, *italic*, \`code\`, lists with -, code blocks \`\`\`lang.

ENGAGEMENT: ALWAYS end your response with a question that encourages further exploration of the topic.

Be informative, helpful, and engaging.`;

/**
 * Verifica se o servidor nativo está rodando
 */
async function checkNativeServer() {
    try {
        const response = await fetch(`${NATIVE_SERVER_CONFIG.baseUrl}${NATIVE_SERVER_CONFIG.endpoints.health}`, {
            method: 'GET',
            timeout: 2000
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Gera resposta usando servidor nativo llama.cpp
 * @param {string} prompt - Prompt completo
 * @param {Object} options - Opções de geração
 * @param {Function} onToken - Callback para streaming
 */
async function generateNativeResponse(prompt, options = {}, onToken = null) {
    const config = {
        prompt: prompt,
        n_predict: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        top_k: options.topK || 40,
        repeat_penalty: options.repeatPenalty || 1.1,
        stop: options.stop || ['<|im_end|>', '</s>', '<|eot_id|>'],
        stream: true
    };

    const response = await fetch(`${NATIVE_SERVER_CONFIG.baseUrl}${NATIVE_SERVER_CONFIG.endpoints.completion}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    // Processar streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.content) {
                        fullResponse += data.content;
                        if (onToken) {
                            onToken(data.content);
                        }
                    }
                    if (data.stop) {
                        break;
                    }
                } catch (e) {
                    // Ignorar linhas mal formadas
                }
            }
        }
    }

    return fullResponse;
}

/**
 * Gera resposta usando endpoint de chat (OpenAI compatible)
 */
async function generateNativeChatResponse(messages, options = {}, onToken = null) {
    const config = {
        model: 'local',
        messages: messages,
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        stream: true
    };

    const response = await fetch(`${NATIVE_SERVER_CONFIG.baseUrl}${NATIVE_SERVER_CONFIG.endpoints.chat}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                        fullResponse += content;
                        if (onToken) {
                            onToken(content);
                        }
                    }
                } catch (e) {
                    // Ignorar
                }
            }
        }
    }

    return fullResponse;
}

/**
 * Constrói prompt no formato ChatML para llama.cpp com memória
 */
function buildChatMLPrompt(userMessage, history = []) {
    // Obter memória do app
    let memory = "";
    const memTextEl = typeof memoryText !== 'undefined' ? memoryText : document.getElementById('memoryText');
    if (memTextEl?.value) {
        memory += memTextEl.value.trim();
    }
    if (typeof getAllMemoryTexts === 'function') {
        const structured = getAllMemoryTexts().join("\n").trim();
        if (structured) {
            memory += (memory ? "\n" : "") + structured;
        }
    }
    
    // System prompt com memória
    let systemPrompt = NATIVE_SYSTEM_PROMPT;
    if (memory) {
        systemPrompt += `\n\nUSER MEMORY:\n${memory}`;
    }
    
    let prompt = '<|im_start|>system\n' + systemPrompt + '<|im_end|>\n';

    // Adicionar histórico (últimas 4 mensagens)
    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
        // Normalizar role: 'ai' -> 'assistant'
        const role = (msg.role === 'user') ? 'user' : 'assistant';
        // Mensagens podem ter 'text' ou 'content'
        const content = msg.text || msg.content || '';
        if (role === 'user') {
            prompt += '<|im_start|>user\n' + content.substring(0, 800) + '<|im_end|>\n';
        } else {
            prompt += '<|im_start|>assistant\n' + content.substring(0, 800) + '<|im_end|>\n';
        }
    }

    // Mensagem atual
    prompt += '<|im_start|>user\n' + userMessage + '<|im_end|>\n';
    prompt += '<|im_start|>assistant\n';

    console.log(`📝 [NativeServer] Contexto: ${recentHistory.length} msgs + memória (${memory.length} chars)`);
    return prompt;
}

/**
 * Classe principal para integração com servidor nativo
 */
class NativeLlamaServer {
    constructor() {
        this.isRunning = false;
        this.modelLoaded = false;
        this.serverProcess = null;
    }

    /**
     * Verifica status do servidor
     */
    async checkStatus() {
        this.isRunning = await checkNativeServer();
        return this.isRunning;
    }

    /**
     * Inicia o servidor nativo (requer plugin Cordova)
     */
    async startServer(modelPath, options = {}) {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.llamaServer) {
            const config = {
                model: modelPath,
                ctx_size: options.nCtx || 2048,
                threads: options.nThreads || 4,
                port: NATIVE_SERVER_CONFIG.port,
                host: NATIVE_SERVER_CONFIG.host
            };

            return new Promise((resolve, reject) => {
                cordova.plugins.llamaServer.start(
                    config,
                    () => {
                        this.isRunning = true;
                        this.modelLoaded = true;
                        resolve(true);
                    },
                    (error) => reject(error)
                );
            });
        } else {
            throw new Error('Plugin llamaServer não disponível');
        }
    }

    /**
     * Para o servidor
     */
    async stopServer() {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.llamaServer) {
            return new Promise((resolve, reject) => {
                cordova.plugins.llamaServer.stop(
                    () => {
                        this.isRunning = false;
                        this.modelLoaded = false;
                        resolve(true);
                    },
                    (error) => reject(error)
                );
            });
        }
    }

    /**
     * Gera resposta com streaming
     */
    async generate(userMessage, history = [], onToken = null, options = {}) {
        if (!this.isRunning) {
            const serverUp = await this.checkStatus();
            if (!serverUp) {
                throw new Error('Servidor nativo não está rodando');
            }
        }

        const prompt = buildChatMLPrompt(userMessage, history);
        return await generateNativeResponse(prompt, options, onToken);
    }

    /**
     * Gera usando formato de chat
     */
    async chat(messages, onToken = null, options = {}) {
        if (!this.isRunning) {
            const serverUp = await this.checkStatus();
            if (!serverUp) {
                throw new Error('Servidor nativo não está rodando');
            }
        }

        // Adicionar system prompt se não existir
        if (!messages.find(m => m.role === 'system')) {
            messages = [
                { role: 'system', content: NATIVE_SYSTEM_PROMPT },
                ...messages
            ];
        }

        return await generateNativeChatResponse(messages, options, onToken);
    }

    /**
     * Obtém info do modelo carregado
     */
    async getModelInfo() {
        try {
            const response = await fetch(`${NATIVE_SERVER_CONFIG.baseUrl}${NATIVE_SERVER_CONFIG.endpoints.props}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.error('Erro ao obter info do modelo:', e);
        }
        return null;
    }
}

// Modelos GGUF recomendados para performance
const FAST_GGUF_MODELS = [
    {
        id: 'tinyllama-1.1b-q4',
        name: 'TinyLlama 1.1B (Q4)',
        description: 'Ultra rápido, ~20-30 tok/s em mobile',
        size: '670MB',
        url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
        recommended: true,
        mode: 'fast'
    },
    {
        id: 'qwen2-0.5b-q8',
        name: 'Qwen2 0.5B (Q8)',
        description: 'Muito rápido, boa qualidade',
        size: '530MB',
        url: 'https://huggingface.co/Qwen/Qwen2-0.5B-Instruct-GGUF/resolve/main/qwen2-0_5b-instruct-q8_0.gguf',
        recommended: true,
        mode: 'fast'
    },
    {
        id: 'smollm-360m-q8',
        name: 'SmolLM 360M (Q8)',
        description: 'Mais rápido possível, básico',
        size: '380MB',
        url: 'https://huggingface.co/bartowski/SmolLM-360M-Instruct-GGUF/resolve/main/SmolLM-360M-Instruct-Q8_0.gguf',
        recommended: false,
        mode: 'fast'
    },
    {
        id: 'qwen2-1.5b-q4',
        name: 'Qwen2 1.5B (Q4)',
        description: 'Bom equilíbrio velocidade/qualidade',
        size: '1GB',
        url: 'https://huggingface.co/Qwen/Qwen2-1.5B-Instruct-GGUF/resolve/main/qwen2-1_5b-instruct-q4_k_m.gguf',
        recommended: true,
        mode: 'balanced'
    },
    {
        id: 'phi-2-q4',
        name: 'Phi-2 (Q4)',
        description: 'Muito inteligente, mais lento',
        size: '1.6GB',
        url: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
        recommended: false,
        mode: 'accurate'
    }
];

// Singleton
let nativeLlamaServer = null;

function getNativeLlamaServer() {
    if (!nativeLlamaServer) {
        nativeLlamaServer = new NativeLlamaServer();
    }
    return nativeLlamaServer;
}

// Exportar
window.NativeLlamaServer = NativeLlamaServer;
window.getNativeLlamaServer = getNativeLlamaServer;
window.FAST_GGUF_MODELS = FAST_GGUF_MODELS;
window.checkNativeServer = checkNativeServer;
window.generateNativeResponse = generateNativeResponse;
window.buildChatMLPrompt = buildChatMLPrompt;
