// ===== SERPAPI - Busca na Web =====
// Motor principal de busca usando SerpAPI com rotação de chaves

const SERP_USAGE_STORAGE = 'neo_serp_daily_usage';

// ===== CHAVES API INTERNAS (ROTAÇÃO AUTOMÁTICA) =====
const SERP_API_KEYS_POOL = [
    'df670d54fdee3a8e82da87968c5a75a46ccf12f387f5742441b333bf6eed92d4',
    '9bddd7afab4d64c439160fbd0283f4c39f00c44ac6a2502b9e3db2a8026ca01f',
    '0c800ab8db34725cd7b66232199b0ba6d314709a6b314af54ae3bc6c2cbf1a15',
    '664b456716f284081c7644994a44198ea1ac63e000e0ab15097a7b66979b0ba9',
    'b2e027e6f62434dc3a00b51871c23b542be140b8bcf1ad13726f15a4ad874555'
];

// Limite diário de pesquisas
const SERP_DAILY_LIMIT = 10;

// Proxy CORS para contornar restrições do navegador/webview
const SERP_CORS_PROXY = "https://corsproxy.io/?";

// ===== CONTROLE DE USO DIÁRIO =====

function getSerpUsage() {
    try {
        const data = JSON.parse(localStorage.getItem(SERP_USAGE_STORAGE) || '{}');
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        if (data.date !== today) {
            // Novo dia, resetar contador
            return { date: today, count: 0 };
        }
        return data;
    } catch {
        return { date: new Date().toISOString().slice(0, 10), count: 0 };
    }
}

function incrementSerpUsage() {
    const usage = getSerpUsage();
    usage.count++;
    localStorage.setItem(SERP_USAGE_STORAGE, JSON.stringify(usage));
    updateSerpUsageDisplay();
}

function getSerpSearchesRemaining() {
    return Math.max(0, SERP_DAILY_LIMIT - getSerpUsage().count);
}

function isSerpApiConfigured() {
    // Sempre configurado com chaves internas
    return SERP_API_KEYS_POOL.length > 0;
}

function updateSerpUsageDisplay() {
    const usage = getSerpUsage();
    const usedEl = document.getElementById('serpUsedCount');
    const fillEl = document.getElementById('serpUsageFill');
    const limitEl = document.getElementById('serpLimitCount');

    if (usedEl) usedEl.textContent = usage.count;
    if (limitEl) limitEl.textContent = SERP_DAILY_LIMIT;

    if (fillEl) {
        const pct = Math.min(100, (usage.count / SERP_DAILY_LIMIT) * 100);
        fillEl.style.width = pct + '%';
        fillEl.style.background = pct >= 90 ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
            pct >= 70 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                'linear-gradient(90deg, #34d399, #10b981)';
    }
}

// ===== BUSCA COM ROTAÇÃO DE CHAVES =====

async function serpSearchWithKey(query, apiKey, numResults) {
    console.log('🔑 [SerpAPI] Tentando chave:', apiKey.slice(0, 8) + '...');

    const params = new URLSearchParams({
        api_key: apiKey,
        q: query,
        num: numResults.toString(),
        hl: 'pt-br',
        gl: 'br',
        engine: 'google'
    });

    const serpUrl = `https://serpapi.com/search.json?${params}`;
    
    // Usar proxy CORS se não estiver no Cordova
    const isCordova = !!(window.cordova || window.Cordova || document.URL.indexOf('http://') === -1);
    const fetchUrl = isCordova ? serpUrl : SERP_CORS_PROXY + encodeURIComponent(serpUrl);

    const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[SerpAPI] Chave ${apiKey.slice(0, 8)}... falhou: HTTP ${response.status}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
        console.warn(`[SerpAPI] Chave ${apiKey.slice(0, 8)}... erro:`, data.error);
        throw new Error(data.error);
    }

    return data;
}

async function serpSearch(query, numResults = 5) {
    // Verificar limite diário
    if (getSerpSearchesRemaining() <= 0) {
        console.log('❌ [SerpAPI] Limite diário atingido');
        return { 
            success: false, 
            error: `Limite diário de ${SERP_DAILY_LIMIT} pesquisas atingido! Tente novamente amanhã.` 
        };
    }

    console.log('🔍 [SerpAPI] Buscando:', query);
    console.log(`📊 [SerpAPI] Pesquisas restantes hoje: ${getSerpSearchesRemaining()}`);

    let lastError = null;

    // Tentar cada chave em sequência
    for (let i = 0; i < SERP_API_KEYS_POOL.length; i++) {
        const apiKey = SERP_API_KEYS_POOL[i];
        
        try {
            const data = await serpSearchWithKey(query, apiKey, numResults);

            // Sucesso! Incrementar contador
            incrementSerpUsage();

            // Extrair resultados orgânicos
            const organicResults = data.organic_results || [];
            const results = organicResults.slice(0, numResults).map(r => ({
                title: r.title || 'Sem título',
                link: r.link || '',
                snippet: r.snippet || '',
                source: r.source || r.displayed_link || ''
            }));

            // Extrair answer box se existir
            let answerBox = null;
            if (data.answer_box) {
                answerBox = {
                    type: data.answer_box.type,
                    answer: data.answer_box.answer || data.answer_box.snippet || data.answer_box.result,
                    title: data.answer_box.title
                };
            }

            // Extrair knowledge graph se existir
            let knowledgeGraph = null;
            if (data.knowledge_graph) {
                knowledgeGraph = {
                    title: data.knowledge_graph.title,
                    type: data.knowledge_graph.type,
                    description: data.knowledge_graph.description
                };
            }

            console.log(`✅ [SerpAPI] Sucesso com chave ${i + 1}! ${results.length} resultados`);

            return {
                success: true,
                query: query,
                results: results,
                answerBox: answerBox,
                knowledgeGraph: knowledgeGraph,
                searchesRemaining: getSerpSearchesRemaining(),
                keyUsed: i + 1
            };

        } catch (error) {
            lastError = error;
            console.warn(`⚠️ [SerpAPI] Chave ${i + 1}/${SERP_API_KEYS_POOL.length} falhou:`, error.message);
            
            // Se não é a última chave, tentar a próxima
            if (i < SERP_API_KEYS_POOL.length - 1) {
                console.log(`🔄 [SerpAPI] Tentando próxima chave...`);
            }
        }
    }

    // Todas as chaves falharam
    console.error('❌ [SerpAPI] Todas as 5 chaves falharam!');
    return { 
        success: false, 
        error: `Erro na busca: ${lastError?.message || 'Todas as chaves API falharam'}. Tente novamente mais tarde.` 
    };
}

// ===== BUSCA COM CONTEXTO FORMATADO =====

async function serpSearchWithContext(query, numResults = 5) {
    const result = await serpSearch(query, numResults);

    if (!result || !result.success) {
        return result;
    }

    // Formatar resultados para contexto da IA
    let context = `\n\n========== 🔍 RESULTADOS DA BUSCA WEB ==========\n`;
    context += `📝 Pesquisa: "${query}"\n`;
    context += `📅 ${new Date().toLocaleString('pt-BR')}\n`;
    context += `📊 Pesquisas restantes hoje: ${result.searchesRemaining}/${SERP_DAILY_LIMIT}\n\n`;

    // Answer Box (resposta direta do Google)
    if (result.answerBox && result.answerBox.answer) {
        context += `💡 **Resposta Direta:**\n${result.answerBox.answer}\n\n`;
    }

    // Knowledge Graph
    if (result.knowledgeGraph) {
        if (result.knowledgeGraph.title) {
            context += `📚 **${result.knowledgeGraph.title}**`;
            if (result.knowledgeGraph.type) {
                context += ` (${result.knowledgeGraph.type})`;
            }
            context += '\n';
        }
        if (result.knowledgeGraph.description) {
            context += `${result.knowledgeGraph.description}\n\n`;
        }
    }

    // Resultados orgânicos com links
    context += `─────────────────────────────────────────\n`;
    context += `\n**📰 Fontes consultadas:**\n\n`;
    
    result.results.forEach((r, i) => {
        context += `${i + 1}. **${r.title}**\n`;
        if (r.snippet) {
            context += `   ${r.snippet}\n`;
        }
        context += `   🔗 ${r.link}\n\n`;
    });

    context += `─────────────────────────────────────────\n`;
    context += `========== FIM DOS RESULTADOS ==========\n\n`;
    context += `⚠️ INSTRUÇÃO: Use estas informações da web para responder ao usuário. `;
    context += `SEMPRE inclua os links das fontes relevantes na sua resposta usando o formato: [Título](URL). `;
    context += `Cite dados específicos e suas fontes.\n`;

    return {
        ...result,
        formattedContext: context
    };
}

// ===== TESTE DE CONEXÃO =====

async function testSerpApi() {
    try {
        if (getSerpSearchesRemaining() <= 0) {
            alert(`⚠️ Limite diário atingido!\n\nVocê já usou ${SERP_DAILY_LIMIT} pesquisas hoje.\nTente novamente amanhã.`);
            return;
        }

        const result = await serpSearch('teste brasil', 1);

        if (result && result.success) {
            const firstResult = result.results[0];
            alert(`✅ Busca Web funcionando!\n\n📄 ${firstResult?.title || 'OK'}\n\n📊 Pesquisas restantes hoje: ${getSerpSearchesRemaining()}/${SERP_DAILY_LIMIT}`);
        } else {
            alert(`❌ Erro: ${result?.error || 'Erro desconhecido'}`);
        }
    } catch (e) {
        alert(`❌ Erro: ${e.message}`);
    }
}

// ===== FUNÇÕES LEGADAS (COMPATIBILIDADE) =====

function getAllSerpApiKeys() {
    return ['interno']; // Retorna algo para compatibilidade
}

function getSerpApiKey() {
    return SERP_API_KEYS_POOL[0];
}

function saveSerpApiKeys() {
    // Não faz nada - chaves são internas
}

function loadSerpApiKeys() {
    updateSerpUsageDisplay();
}

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateSerpUsageDisplay, 500);
});

// ===== EXPOR GLOBALMENTE =====
window.serpSearch = serpSearch;
window.serpSearchWithContext = serpSearchWithContext;
window.isSerpApiConfigured = isSerpApiConfigured;
window.getSerpSearchesRemaining = getSerpSearchesRemaining;
window.saveSerpApiKeys = saveSerpApiKeys;
window.loadSerpApiKeys = loadSerpApiKeys;
window.testSerpApi = testSerpApi;
window.getAllSerpApiKeys = getAllSerpApiKeys;
window.SERP_DAILY_LIMIT = SERP_DAILY_LIMIT;

console.log("✅ [SerpAPI] Módulo carregado");
