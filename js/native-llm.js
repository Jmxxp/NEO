/**
 * ===== NATIVE LLM UTILITIES - Promise Wrappers =====
 * 
 * Este arquivo fornece wrappers baseados em Promise para o plugin LlamaNative.
 * A funcionalidade principal está em local-llm.js que usa callbacks diretamente.
 * 
 * Use LlamaNativeAsync quando precisar de código async/await mais limpo.
 */

// ===== PROMISE WRAPPERS PARA PLUGIN CORDOVA =====
const LlamaNativeAsync = {
    init: (options = {}) => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.init(() => resolve(true), (err) => reject(err));
    }),
    
    loadModel: (options) => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.loadModel(options, (result) => resolve(result), (err) => reject(err));
    }),
    
    unloadModel: () => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.unloadModel(() => resolve(true), (err) => reject(err));
    }),
    
    generate: (options, onToken) => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.generate(options, onToken, (result) => resolve(result), (err) => reject(err));
    }),
    
    stopGeneration: () => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.stopGeneration(() => resolve(true), (err) => reject(err));
    }),
    
    getModelInfo: () => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.getModelInfo((info) => resolve(info), (err) => reject(err));
    }),
    
    isModelLoaded: () => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        if (LlamaNative.isModelLoaded) {
            LlamaNative.isModelLoaded((loaded) => resolve(loaded), (err) => reject(err));
        } else {
            // Fallback se método não existe
            resolve(window.localLlmState?.engine ? true : false);
        }
    }),
    
    listModels: () => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.listModels((models) => resolve(models || []), (err) => reject(err));
    }),
    
    downloadModel: (options, onProgress) => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        LlamaNative.downloadModel(options, onProgress, (path) => resolve(path), (err) => reject(err));
    }),
    
    deleteModel: (filename) => new Promise((resolve, reject) => {
        if (typeof LlamaNative === 'undefined') {
            reject(new Error('LlamaNative plugin não disponível'));
            return;
        }
        if (LlamaNative.deleteModel) {
            LlamaNative.deleteModel({ filename }, () => resolve(true), (err) => reject(err));
        } else {
            resolve(false);
        }
    }),
    
    // Verificar se plugin está disponível
    isAvailable: () => typeof LlamaNative !== 'undefined' && LlamaNative !== null
};

// Expor globalmente
window.LlamaNativeAsync = LlamaNativeAsync;

console.log("[NativeLLM] ⚡ Wrappers Promise carregados");
console.log("[NativeLLM] Plugin disponível:", LlamaNativeAsync.isAvailable());
