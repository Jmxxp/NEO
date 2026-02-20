/**
 * ===== FAST LOCAL LLM - llama.cpp NATIVO =====
 * 
 * Este módulo agora é apenas um wrapper fino sobre o local-llm.js
 * que já usa llama.cpp nativo diretamente via plugin Cordova.
 * 
 * Performance esperada: 40-60 tok/s em dispositivos modernos
 */

// ====== CONFIGURAÇÕES (sincronizar com local-llm.js) ======
const FAST_CONFIG = {
    maxContext: 4096,
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repeatPenalty: 1.1
};

// ====== DETECTAR ENGINE (sempre nativo agora) ======
async function detectBestEngine() {
    console.log("[FastLLM] Detectando engine nativo...");
    
    // Verificar LlamaNative plugin
    if (typeof LlamaNative !== 'undefined' && LlamaNative !== null) {
        try {
            const isLoaded = await new Promise((resolve) => {
                if (LlamaNative.isModelLoaded) {
                    LlamaNative.isModelLoaded((loaded) => resolve(loaded), () => resolve(false));
                } else {
                    // Se não tem método isModelLoaded, checar via state
                    resolve(window.localLlmState?.engine ? true : false);
                }
            });
            if (isLoaded) {
                console.log("[FastLLM] ✅ LlamaNative com modelo carregado!");
                return 'native-plugin';
            }
        } catch (e) {
            console.warn("[FastLLM] Erro verificando plugin:", e);
        }
    }
    
    // Verificar local-llm.js nativo
    if (window.localLlmState?.engine && window.localLlmState?.enabled) {
        console.log("[FastLLM] ✅ LocalLLM nativo ativo!");
        return 'native-local';
    }
    
    console.log("[FastLLM] ⚠️ Nenhum engine nativo disponível");
    return 'none';
}

// ====== GERAÇÃO RÁPIDA (delega para local-llm.js) ======
async function generateFastResponse(messages, onChunk) {
    const engine = await detectBestEngine();
    console.log(`[FastLLM] Engine: ${engine}`);
    
    if (engine === 'none') {
        throw new Error("Nenhum modelo nativo carregado");
    }
    
    // Delegar para generateLocalResponse do local-llm.js
    if (typeof window.generateLocalResponse === 'function') {
        return await window.generateLocalResponse(messages, onChunk);
    }
    
    throw new Error("generateLocalResponse não disponível");
}

// ====== EXPORTS ======
window.FastLLMConfig = FAST_CONFIG;
window.detectBestEngine = detectBestEngine;
window.generateFastLocalResponse = generateFastResponse;

console.log("[FastLLM] ⚡ Módulo de velocidade carregado (nativo)!");
console.log("[FastLLM] Usando llama.cpp via plugin Cordova");
