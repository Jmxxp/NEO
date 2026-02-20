/**
 * ===== ULTRA-FAST LOCAL LLM - DIRECT INFERENCE =====
 * Implementação direta sem servidor, usando llama.rn approach
 * Otimizado para velocidade máxima como Local AI app
 */

// ====== CONFIGURAÇÃO PRINCIPAL ======
const ULTRA_FAST_CONFIG = {
    // Número de threads (usar todos os cores disponíveis)
    get nThreads() {
        return navigator.hardwareConcurrency || 4;
    },
    
    // Tamanho do contexto (menor = mais rápido)
    nCtx: 1024,
    
    // Batch size para processamento paralelo
    nBatch: 512,
    
    // Parâmetros de geração
    generation: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        maxTokens: 1500 // Aumentado para respostas mais completas
    }
};

// ====== SYSTEM PROMPT ======
const UNLOCKED_SYSTEM_PROMPT = `You are NEO, a helpful and detailed AI assistant. Respond in Brazilian Portuguese.

IMPORTANT RULES:
1. Give COMPLETE and DETAILED responses - never short 1-2 line answers
2. Explain concepts with practical examples when appropriate
3. For open questions, provide at least 3-4 paragraphs
4. Use markdown formatting

FORMATTING:
- **bold** for key terms
- *italic* for emphasis
- \`code\` for technical terms
- Use line breaks for clarity
- Code blocks with \`\`\`language

ENGAGEMENT:
- ALWAYS end your response with a question that encourages further exploration of the topic

Be informative, helpful, and engaging.`;

// ====== MODELOS GGUF ULTRA-RÁPIDOS ======
const ULTRA_FAST_MODELS = {
    // MODO RÁPIDO - Máxima velocidade
    fast: {
        id: 'qwen2-0.5b',
        name: 'Qwen2 0.5B',
        description: 'Ultra rápido - 30-50 tok/s',
        url: 'https://huggingface.co/Qwen/Qwen2-0.5B-Instruct-GGUF/resolve/main/qwen2-0_5b-instruct-q4_k_m.gguf',
        size: '400MB',
        contextTemplate: 'chatml'
    },
    
    // MODO BALANCEADO - Velocidade + Qualidade
    balanced: {
        id: 'qwen2-1.5b',
        name: 'Qwen2 1.5B',
        description: 'Bom equilíbrio - 15-25 tok/s',
        url: 'https://huggingface.co/Qwen/Qwen2-1.5B-Instruct-GGUF/resolve/main/qwen2-1_5b-instruct-q4_k_m.gguf',
        size: '1GB',
        contextTemplate: 'chatml'
    },
    
    // MODO PRECISO - Melhor qualidade
    accurate: {
        id: 'phi-3-mini',
        name: 'Phi-3 Mini',
        description: 'Alta qualidade - 8-15 tok/s',
        url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
        size: '2.3GB',
        contextTemplate: 'phi3'
    }
};

// ====== FORMATADORES DE PROMPT ======
const PROMPT_FORMATTERS = {
    chatml: (systemPrompt, messages) => {
        let prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
            } else if (msg.role === 'assistant') {
                prompt += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
            }
        }
        
        prompt += '<|im_start|>assistant\n';
        return prompt;
    },
    
    phi3: (systemPrompt, messages) => {
        let prompt = `<|system|>\n${systemPrompt}<|end|>\n`;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `<|user|>\n${msg.content}<|end|>\n`;
            } else if (msg.role === 'assistant') {
                prompt += `<|assistant|>\n${msg.content}<|end|>\n`;
            }
        }
        
        prompt += '<|assistant|>\n';
        return prompt;
    },
    
    llama3: (systemPrompt, messages) => {
        let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `<|start_header_id|>user<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
            } else if (msg.role === 'assistant') {
                prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
            }
        }
        
        prompt += '<|start_header_id|>assistant<|end_header_id|>\n\n';
        return prompt;
    }
};

// ====== CLASSE PRINCIPAL ======
class UltraFastLLM {
    constructor() {
        this.isLoaded = false;
        this.currentModel = null;
        this.modelPath = null;
        this.kvCache = null; // Cache de contexto para reutilização
        this.lastContextHash = null;
        this.tokensPerSecond = 0;
    }
    
    /**
     * Inicializa com o modelo especificado
     */
    async initialize(mode = 'fast') {
        const modelInfo = ULTRA_FAST_MODELS[mode] || ULTRA_FAST_MODELS.fast;
        this.currentModel = modelInfo;
        
        console.log(`[UltraFastLLM] Inicializando modo: ${mode}`);
        console.log(`[UltraFastLLM] Modelo: ${modelInfo.name}`);
        console.log(`[UltraFastLLM] Threads: ${ULTRA_FAST_CONFIG.nThreads}`);
        
        // Verificar se modelo já está baixado
        const modelExists = await this.checkModelExists(modelInfo.id);
        
        if (!modelExists) {
            console.log(`[UltraFastLLM] Modelo não encontrado, precisa baixar`);
            return { needsDownload: true, model: modelInfo };
        }
        
        // Carregar modelo
        await this.loadModel();
        this.isLoaded = true;
        
        return { needsDownload: false, model: modelInfo };
    }
    
    /**
     * Verifica se modelo existe no dispositivo
     */
    async checkModelExists(modelId) {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.llamaServer) {
            return new Promise((resolve) => {
                cordova.plugins.llamaServer.listModels(
                    (models) => {
                        const exists = models.some(m => m.name.includes(modelId));
                        resolve(exists);
                    },
                    () => resolve(false)
                );
            });
        }
        
        // Fallback para localStorage
        const downloadedModels = JSON.parse(localStorage.getItem('downloadedModels') || '[]');
        return downloadedModels.includes(modelId);
    }
    
    /**
     * Baixa o modelo com progresso
     */
    async downloadModel(onProgress = null) {
        if (!this.currentModel) {
            throw new Error('Nenhum modelo selecionado');
        }
        
        console.log(`[UltraFastLLM] Baixando ${this.currentModel.name}...`);
        
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.llamaServer) {
            return new Promise((resolve, reject) => {
                cordova.plugins.llamaServer.downloadModel(
                    {
                        url: this.currentModel.url,
                        filename: `${this.currentModel.id}.gguf`
                    },
                    (percent) => {
                        if (onProgress) onProgress(percent);
                    },
                    (path) => {
                        this.modelPath = path;
                        resolve(path);
                    },
                    (error) => reject(error)
                );
            });
        }
        
        throw new Error('Plugin de download não disponível');
    }
    
    /**
     * Carrega o modelo na memória
     */
    async loadModel() {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.llamaServer) {
            const config = {
                model: this.modelPath,
                ctx_size: ULTRA_FAST_CONFIG.nCtx,
                threads: ULTRA_FAST_CONFIG.nThreads,
                port: 8080
            };
            
            return new Promise((resolve, reject) => {
                cordova.plugins.llamaServer.start(
                    config,
                    () => resolve(true),
                    (error) => reject(error)
                );
            });
        }
        
        throw new Error('Plugin não disponível');
    }
    
    /**
     * Gera resposta com streaming
     */
    async generate(userMessage, history = [], onToken = null) {
        if (!this.isLoaded) {
            throw new Error('Modelo não carregado');
        }
        
        const startTime = performance.now();
        let tokenCount = 0;
        
        // Limitar histórico para economizar contexto
        const recentHistory = history.slice(-4); // Últimas 2 trocas
        
        // Formatar prompt
        const formatter = PROMPT_FORMATTERS[this.currentModel.contextTemplate];
        const prompt = formatter(UNLOCKED_SYSTEM_PROMPT, [
            ...recentHistory,
            { role: 'user', content: userMessage }
        ]);
        
        console.log(`[UltraFastLLM] Gerando resposta...`);
        console.log(`[UltraFastLLM] Prompt length: ${prompt.length} chars`);
        
        let fullResponse = '';
        
        // Usar servidor HTTP local para inferência
        try {
            const response = await fetch('http://127.0.0.1:8080/completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    n_predict: ULTRA_FAST_CONFIG.generation.maxTokens,
                    temperature: ULTRA_FAST_CONFIG.generation.temperature,
                    top_p: ULTRA_FAST_CONFIG.generation.topP,
                    top_k: ULTRA_FAST_CONFIG.generation.topK,
                    repeat_penalty: ULTRA_FAST_CONFIG.generation.repeatPenalty,
                    stream: true,
                    stop: ['<|im_end|>', '</s>', '<|end|>', '<|eot_id|>']
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
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
                                tokenCount++;
                                
                                if (onToken) {
                                    onToken(data.content);
                                }
                            }
                        } catch (e) {
                            // Ignorar linha mal formada
                        }
                    }
                }
            }
            
        } catch (fetchError) {
            console.error('[UltraFastLLM] Fetch error:', fetchError);
            throw fetchError;
        }
        
        // Calcular velocidade
        const elapsed = (performance.now() - startTime) / 1000;
        this.tokensPerSecond = tokenCount / elapsed;
        
        console.log(`[UltraFastLLM] Gerado ${tokenCount} tokens em ${elapsed.toFixed(2)}s`);
        console.log(`[UltraFastLLM] Velocidade: ${this.tokensPerSecond.toFixed(1)} tok/s`);
        
        return fullResponse;
    }
    
    /**
     * Limpa recursos
     */
    async cleanup() {
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.llamaServer) {
            return new Promise((resolve) => {
                cordova.plugins.llamaServer.stop(resolve, resolve);
            });
        }
    }
    
    /**
     * Obtém estatísticas
     */
    getStats() {
        return {
            model: this.currentModel?.name || 'Não carregado',
            tokensPerSecond: this.tokensPerSecond,
            threads: ULTRA_FAST_CONFIG.nThreads,
            contextSize: ULTRA_FAST_CONFIG.nCtx
        };
    }
}

// ====== INTEGRAÇÃO COM O APP ======
class LocalAIManager {
    constructor() {
        this.llm = new UltraFastLLM();
        this.conversationHistory = [];
        this.mode = localStorage.getItem('aiMode') || 'fast';
    }
    
    /**
     * Define o modo de operação
     */
    setMode(mode) {
        this.mode = mode;
        localStorage.setItem('aiMode', mode);
    }
    
    /**
     * Inicializa a IA local
     */
    async init(onProgress = null) {
        const result = await this.llm.initialize(this.mode);
        
        if (result.needsDownload) {
            if (onProgress) {
                onProgress({ status: 'downloading', model: result.model });
            }
            
            await this.llm.downloadModel((percent) => {
                if (onProgress) {
                    onProgress({ status: 'downloading', percent: percent });
                }
            });
            
            await this.llm.loadModel();
        }
        
        if (onProgress) {
            onProgress({ status: 'ready', model: result.model });
        }
        
        return true;
    }
    
    /**
     * Envia mensagem e recebe resposta
     */
    async sendMessage(message, onToken = null) {
        // Adicionar mensagem do usuário ao histórico
        this.conversationHistory.push({
            role: 'user',
            content: message
        });
        
        // Gerar resposta
        const response = await this.llm.generate(
            message,
            this.conversationHistory.slice(0, -1), // Histórico sem a mensagem atual
            onToken
        );
        
        // Adicionar resposta ao histórico
        this.conversationHistory.push({
            role: 'assistant',
            content: response
        });
        
        return response;
    }
    
    /**
     * Limpa histórico de conversa
     */
    clearHistory() {
        this.conversationHistory = [];
    }
    
    /**
     * Obtém estatísticas
     */
    getStats() {
        return this.llm.getStats();
    }
}

// ====== SINGLETON E EXPORT ======
let localAIManager = null;

function getLocalAIManager() {
    if (!localAIManager) {
        localAIManager = new LocalAIManager();
    }
    return localAIManager;
}

// Exportar globalmente
window.UltraFastLLM = UltraFastLLM;
window.LocalAIManager = LocalAIManager;
window.getLocalAIManager = getLocalAIManager;
window.ULTRA_FAST_MODELS = ULTRA_FAST_MODELS;
window.ULTRA_FAST_CONFIG = ULTRA_FAST_CONFIG;
window.UNLOCKED_SYSTEM_PROMPT = UNLOCKED_SYSTEM_PROMPT;

console.log('[UltraFastLLM] Módulo carregado');
console.log('[UltraFastLLM] Cores disponíveis:', navigator.hardwareConcurrency || 'desconhecido');
