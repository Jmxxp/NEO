/**
 * Native LLM Bridge
 * Integração do plugin llama.cpp nativo com o sistema existente
 * Substitui WebLLM por implementação nativa de alta performance
 */

// System prompt
const NATIVE_SYSTEM_PROMPT = `You are NEO, a helpful and detailed AI assistant. Respond in Brazilian Portuguese.

IMPORTANT RULES:
1. Give COMPLETE and DETAILED responses - never short 1-2 line answers
2. Explain concepts with practical examples when appropriate
3. For open questions, provide at least 3-4 paragraphs
4. Use markdown formatting: **bold**, *italic*, lists with -, code blocks

FORMATTING:
- **bold** for key terms
- *italic* for emphasis  
- \`code\` for technical terms
- Lists with - or numbers
- Line breaks for organization
- Code blocks: \`\`\`language

ENGAGEMENT:
- ALWAYS end your response with a question that encourages further exploration of the topic

Be informative, helpful, and engaging.`;

/**
 * Classe para gerenciar inferência nativa com llama.cpp
 */
class NativeLlamaEngine {
    constructor() {
        this.isInitialized = false;
        this.isModelLoaded = false;
        this.currentModelPath = null;
        this.modelInfo = null;
    }

    /**
     * Verifica se o plugin está disponível
     */
    isAvailable() {
        return typeof LlamaCpp !== 'undefined' && LlamaCpp !== null;
    }

    /**
     * Inicializa o engine nativo
     */
    async initialize() {
        if (!this.isAvailable()) {
            throw new Error('Plugin LlamaCpp não está disponível');
        }

        try {
            await LlamaCpp.initialize();
            this.isInitialized = true;
            console.log('[NativeLlama] Engine inicializado');
            return true;
        } catch (error) {
            console.error('[NativeLlama] Falha na inicialização:', error);
            throw error;
        }
    }

    /**
     * Carrega modelo GGUF
     * @param {string} modelPath - Caminho para o arquivo .gguf
     * @param {Object} options - Opções de carregamento
     */
    async loadModel(modelPath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const config = {
            modelPath: modelPath,
            nCtx: options.nCtx || 2048,
            nThreads: options.nThreads || Math.max(2, navigator.hardwareConcurrency - 2),
            nGpuLayers: options.nGpuLayers || 0,
            useMmap: options.useMmap !== false,
            useMlock: options.useMlock || false
        };

        console.log('[NativeLlama] Carregando modelo:', config);

        try {
            await LlamaCpp.loadModel(config);
            this.isModelLoaded = true;
            this.currentModelPath = modelPath;
            this.modelInfo = await LlamaCpp.getModelInfo();
            console.log('[NativeLlama] Modelo carregado:', this.modelInfo);
            return this.modelInfo;
        } catch (error) {
            console.error('[NativeLlama] Falha ao carregar modelo:', error);
            throw error;
        }
    }

    /**
     * Gera resposta com streaming
     * @param {string} userMessage - Mensagem do usuário
     * @param {Array} conversationHistory - Histórico de conversa
     * @param {Function} onToken - Callback para cada token gerado
     * @param {Object} options - Opções de geração
     */
    async generate(userMessage, conversationHistory = [], onToken = null, options = {}) {
        if (!this.isModelLoaded) {
            throw new Error('Modelo não carregado');
        }

        // Construir prompt no formato ChatML
        let prompt = this.buildPrompt(userMessage, conversationHistory);

        const genConfig = {
            prompt: prompt,
            maxTokens: options.maxTokens || 512,
            temperature: options.temperature || 0.7,
            topP: options.topP || 0.9,
            topK: options.topK || 40,
            repeatPenalty: options.repeatPenalty || 1.1,
            onToken: onToken ? (token) => {
                onToken(token);
                return true;
            } : null
        };

        console.log('[NativeLlama] Gerando resposta...');

        try {
            const result = await LlamaCpp.generate(genConfig);
            return result;
        } catch (error) {
            console.error('[NativeLlama] Erro na geração:', error);
            throw error;
        }
    }

    /**
     * Constrói prompt no formato ChatML com memória
     */
    buildPrompt(userMessage, history = []) {
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

        // Adicionar mensagem atual
        prompt += '<|im_start|>user\n' + userMessage + '<|im_end|>\n';
        prompt += '<|im_start|>assistant\n';

        console.log(`📝 [NativeLlamaBridge] Contexto: ${recentHistory.length} msgs + memória (${memory.length} chars)`);
        return prompt;
    }

    /**
     * Para geração em andamento
     */
    async stopGeneration() {
        if (this.isAvailable()) {
            await LlamaCpp.stopGeneration();
        }
    }

    /**
     * Descarrega modelo atual
     */
    async unloadModel() {
        if (this.isModelLoaded && this.isAvailable()) {
            await LlamaCpp.unloadModel();
            this.isModelLoaded = false;
            this.currentModelPath = null;
            this.modelInfo = null;
        }
    }

    /**
     * Executa benchmark
     */
    async benchmark(promptLength = 128) {
        if (!this.isModelLoaded) {
            throw new Error('Modelo não carregado');
        }
        return await LlamaCpp.benchmark(promptLength);
    }

    /**
     * Obtém informações do modelo
     */
    async getModelInfo() {
        if (!this.isModelLoaded) {
            return null;
        }
        return await LlamaCpp.getModelInfo();
    }

    /**
     * Libera todos os recursos
     */
    async cleanup() {
        await this.unloadModel();
        if (this.isAvailable()) {
            await LlamaCpp.cleanup();
        }
        this.isInitialized = false;
    }
}

// Catálogo de modelos GGUF recomendados
const GGUF_MODEL_CATALOG = [
    {
        id: 'tinyllama-1.1b',
        name: 'TinyLlama 1.1B',
        description: 'Modelo compacto e rápido, ideal para dispositivos com pouca RAM',
        size: '700MB',
        ram: '~1.2GB',
        url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
        filename: 'tinyllama-1.1b-q4.gguf',
        recommended: true
    },
    {
        id: 'qwen2-1.5b',
        name: 'Qwen2 1.5B',
        description: 'Excelente qualidade em português, bom equilíbrio',
        size: '1GB',
        ram: '~1.8GB',
        url: 'https://huggingface.co/Qwen/Qwen2-1.5B-Instruct-GGUF/resolve/main/qwen2-1_5b-instruct-q4_k_m.gguf',
        filename: 'qwen2-1.5b-q4.gguf',
        recommended: true
    },
    {
        id: 'phi-2',
        name: 'Microsoft Phi-2',
        description: 'Muito inteligente para o tamanho, bom em raciocínio',
        size: '1.6GB',
        ram: '~2.5GB',
        url: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
        filename: 'phi-2-q4.gguf',
        recommended: false
    },
    {
        id: 'smollm-1.7b',
        name: 'SmolLM 1.7B',
        description: 'Modelo novo otimizado para mobile',
        size: '1GB',
        ram: '~1.8GB',
        url: 'https://huggingface.co/bartowski/SmolLM-1.7B-Instruct-GGUF/resolve/main/SmolLM-1.7B-Instruct-Q4_K_M.gguf',
        filename: 'smollm-1.7b-q4.gguf',
        recommended: true
    }
];

// Singleton do engine
let nativeLlamaEngine = null;

/**
 * Obtém instância do engine nativo
 */
function getNativeLlamaEngine() {
    if (!nativeLlamaEngine) {
        nativeLlamaEngine = new NativeLlamaEngine();
    }
    return nativeLlamaEngine;
}

/**
 * Função auxiliar para baixar modelo GGUF
 */
async function downloadGGUFModel(modelInfo, progressCallback) {
    return new Promise((resolve, reject) => {
        if (typeof FileTransfer === 'undefined') {
            reject(new Error('Plugin FileTransfer não disponível'));
            return;
        }

        const fileTransfer = new FileTransfer();
        const targetDir = cordova.file.dataDirectory + 'models/';
        const targetPath = targetDir + modelInfo.filename;

        // Criar diretório se não existir
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dir) => {
            dir.getDirectory('models', { create: true }, () => {
                // Baixar arquivo
                fileTransfer.onprogress = (progressEvent) => {
                    if (progressEvent.lengthComputable && progressCallback) {
                        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        progressCallback(percent, progressEvent.loaded, progressEvent.total);
                    }
                };

                fileTransfer.download(
                    modelInfo.url,
                    targetPath,
                    (entry) => {
                        console.log('[Download] Modelo baixado:', entry.toURL());
                        resolve(entry.toURL());
                    },
                    (error) => {
                        console.error('[Download] Erro:', error);
                        reject(error);
                    },
                    true,
                    { headers: {} }
                );
            }, reject);
        }, reject);
    });
}

/**
 * Verifica se modelo existe localmente
 */
async function checkModelExists(filename) {
    return new Promise((resolve) => {
        const modelPath = cordova.file.dataDirectory + 'models/' + filename;
        window.resolveLocalFileSystemURL(modelPath, 
            () => resolve(true),
            () => resolve(false)
        );
    });
}

/**
 * Obtém path completo do modelo
 */
function getModelPath(filename) {
    return cordova.file.dataDirectory + 'models/' + filename;
}

// Exportar para uso global
window.NativeLlamaEngine = NativeLlamaEngine;
window.getNativeLlamaEngine = getNativeLlamaEngine;
window.GGUF_MODEL_CATALOG = GGUF_MODEL_CATALOG;
window.downloadGGUFModel = downloadGGUFModel;
window.checkModelExists = checkModelExists;
window.getModelPath = getModelPath;
