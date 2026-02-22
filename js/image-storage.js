/**
 * ===== IMAGE STORAGE =====
 * Sistema de armazenamento de imagens geradas usando IndexedDB
 * Resolve o problema de localStorage não suportar imagens grandes (base64 > 5MB)
 */

const ImageStorage = (function() {
    const DB_NAME = 'neo_images_db';
    const DB_VERSION = 1;
    const STORE_NAME = 'generated_images';
    
    let db = null;
    
    /**
     * Inicializa o banco de dados IndexedDB
     */
    async function init() {
        if (db) return db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('❌ [ImageStorage] Erro ao abrir IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                db = request.result;
                console.log('✅ [ImageStorage] IndexedDB inicializado');
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                
                // Criar store para imagens
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('conversationId', 'conversationId', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('📦 [ImageStorage] Store de imagens criado');
                }
            };
        });
    }
    
    /**
     * Gera um ID único para a imagem
     */
    function generateImageId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Salva uma imagem no IndexedDB
     * @param {string} imageUrl - URL da imagem (base64 data URL)
     * @param {string} conversationId - ID da conversa
     * @param {string} prompt - Prompt usado para gerar
     * @param {string} provider - Provedor que gerou (gemini, pollinations, etc)
     * @returns {Promise<string>} - ID da imagem salva
     */
    async function saveImage(imageUrl, conversationId, prompt, provider) {
        await init();
        
        const imageId = generateImageId();
        
        const imageData = {
            id: imageId,
            conversationId: conversationId,
            imageUrl: imageUrl,
            prompt: prompt || '',
            provider: provider || 'unknown',
            timestamp: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(imageData);
            
            request.onsuccess = () => {
                console.log(`💾 [ImageStorage] Imagem salva: ${imageId}`);
                resolve(imageId);
            };
            
            request.onerror = () => {
                console.error('❌ [ImageStorage] Erro ao salvar imagem:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * Recupera uma imagem pelo ID
     * @param {string} imageId - ID da imagem
     * @returns {Promise<object|null>} - Dados da imagem ou null
     */
    async function getImage(imageId) {
        if (!imageId) return null;
        await init();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(imageId);
            
            request.onsuccess = () => {
                if (request.result) {
                    console.log(`📤 [ImageStorage] Imagem recuperada: ${imageId}`);
                }
                resolve(request.result || null);
            };
            
            request.onerror = () => {
                console.error('❌ [ImageStorage] Erro ao recuperar imagem:', request.error);
                resolve(null);
            };
        });
    }
    
    /**
     * Recupera todas as imagens de uma conversa
     * @param {string} conversationId - ID da conversa
     * @returns {Promise<array>} - Array de imagens
     */
    async function getImagesByConversation(conversationId) {
        await init();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('conversationId');
            const request = index.getAll(conversationId);
            
            request.onsuccess = () => {
                console.log(`📤 [ImageStorage] ${request.result.length} imagens da conversa ${conversationId}`);
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('❌ [ImageStorage] Erro ao recuperar imagens:', request.error);
                resolve([]);
            };
        });
    }
    
    /**
     * Remove uma imagem pelo ID
     * @param {string} imageId - ID da imagem
     */
    async function deleteImage(imageId) {
        await init();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(imageId);
            
            request.onsuccess = () => {
                console.log(`🗑️ [ImageStorage] Imagem removida: ${imageId}`);
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('❌ [ImageStorage] Erro ao remover imagem:', request.error);
                resolve(false);
            };
        });
    }
    
    /**
     * Remove todas as imagens de uma conversa
     * @param {string} conversationId - ID da conversa
     */
    async function deleteByConversation(conversationId) {
        const images = await getImagesByConversation(conversationId);
        for (const img of images) {
            await deleteImage(img.id);
        }
        console.log(`🗑️ [ImageStorage] ${images.length} imagens removidas da conversa ${conversationId}`);
    }
    
    /**
     * Limpa imagens antigas (mais de 30 dias)
     */
    async function cleanOldImages(maxAgeDays = 30) {
        await init();
        
        const maxAge = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
        
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const range = IDBKeyRange.upperBound(maxAge);
            
            let deletedCount = 0;
            const request = index.openCursor(range);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    deletedCount++;
                    cursor.continue();
                } else {
                    console.log(`🧹 [ImageStorage] ${deletedCount} imagens antigas removidas`);
                    resolve(deletedCount);
                }
            };
            
            request.onerror = () => resolve(0);
        });
    }
    
    /**
     * Obtém estatísticas do armazenamento
     */
    async function getStats() {
        await init();
        
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
                resolve({
                    count: countRequest.result,
                    dbName: DB_NAME,
                    storeName: STORE_NAME
                });
            };
            
            countRequest.onerror = () => resolve({ count: 0 });
        });
    }
    
    // Inicializar ao carregar
    init().catch(console.error);
    
    // API pública
    return {
        init,
        saveImage,
        getImage,
        getImagesByConversation,
        deleteImage,
        deleteByConversation,
        cleanOldImages,
        getStats
    };
})();

// Expor globalmente
window.ImageStorage = ImageStorage;

console.log('📦 [ImageStorage] Módulo carregado');
