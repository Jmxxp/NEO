// ===== WEB SEARCH - Sistema de Busca na Internet v2.0 =====
// Usa Gemini Grounding (Google Search nativo) - com extração detalhada de informações

// Estado da busca web
let webSearchEnabled = false;

// Configurações de busca detalhada
const SEARCH_CONFIG = {
    maxDetailedResults: 8,      // Máximo de resultados detalhados
    maxOutputTokens: 4096,      // Tokens na resposta
    temperature: 0.2,           // Baixa para precisão
    enableDeepSearch: true,     // Busca aprofundada
    extractNumbers: true,       // Extrair números/estatísticas
    extractDates: true,         // Extrair datas
    extractEntities: true       // Extrair entidades principais
};

// ===== ANÁLISE DE QUERY - Identifica tipo de informação necessária =====

function analyzeQuery(query) {
    const lowQuery = query.toLowerCase();
    const analysis = {
        type: 'general',
        needs: [],
        entities: [],
        temporal: null
    };
    
    // Detectar tipo de busca
    if (/preço|custo|valor|quanto custa|cotação|dólar|euro|real/i.test(query)) {
        analysis.type = 'price';
        analysis.needs.push('valores numéricos', 'datas de atualização', 'variação');
    }
    if (/notícia|aconteceu|novo|recente|hoje|ontem|esta semana/i.test(query)) {
        analysis.type = 'news';
        analysis.needs.push('data do evento', 'detalhes do acontecimento', 'pessoas envolvidas', 'local');
    }
    if (/como|tutorial|passo a passo|guide|configurar|instalar/i.test(query)) {
        analysis.type = 'howto';
        analysis.needs.push('passos detalhados', 'requisitos', 'exemplos práticos');
    }
    if (/quem é|biografia|nasceu|morreu|idade|história de/i.test(query)) {
        analysis.type = 'person';
        analysis.needs.push('nome completo', 'datas de nascimento/morte', 'profissão', 'principais realizações');
    }
    if (/comparar|diferença|versus|vs|melhor|qual escolher/i.test(query)) {
        analysis.type = 'comparison';
        analysis.needs.push('características de cada item', 'prós e contras', 'tabela comparativa');
    }
    if (/estatística|dados|número|quantidade|porcentagem|%/i.test(query)) {
        analysis.type = 'statistics';
        analysis.needs.push('números exatos', 'fonte dos dados', 'período de referência');
    }
    if (/clima|tempo|previsão|temperatura/i.test(query)) {
        analysis.type = 'weather';
        analysis.needs.push('temperatura', 'condições', 'previsão para os próximos dias');
    }
    if (/resultado|placar|jogo|campeonato|partida/i.test(query)) {
        analysis.type = 'sports';
        analysis.needs.push('placar', 'data do jogo', 'times/atletas', 'competição');
    }
    if (/lançamento|novo produto|anúncio|especificações|specs/i.test(query)) {
        analysis.type = 'product';
        analysis.needs.push('especificações técnicas', 'preço', 'data de lançamento', 'disponibilidade');
    }
    
    // Detectar referências temporais
    if (/hoje|agora|atual/i.test(query)) analysis.temporal = 'today';
    else if (/ontem/i.test(query)) analysis.temporal = 'yesterday';
    else if (/esta semana|essa semana/i.test(query)) analysis.temporal = 'this_week';
    else if (/este mês|esse mês/i.test(query)) analysis.temporal = 'this_month';
    else if (/\d{4}/.test(query)) analysis.temporal = 'specific_year';
    
    // Adicionar necessidades padrão se não detectou específicas
    if (analysis.needs.length === 0) {
        analysis.needs = ['informações detalhadas', 'dados específicos', 'fontes confiáveis'];
    }
    
    return analysis;
}

// ===== CONTROLE DO MODO BUSCA WEB =====

function toggleWebSearch() {
    // Verificar se tem chave Gemini configurada
    if (!webSearchEnabled) {
        const hasGeminiKey = checkGeminiKeyAvailable();
        if (!hasGeminiKey) {
            alert('⚠️ Configure sua chave Gemini!\n\nVá em Configurações e adicione uma chave API do Google AI Studio.\n\nObtenha gratuitamente em: aistudio.google.com');
            return;
        }
    }
    
    webSearchEnabled = !webSearchEnabled;
    updateWebSearchUI();
    
    console.log(webSearchEnabled ? "🌐 Busca na web ATIVADA (Gemini Grounding v2)" : "🌐 Busca na web DESATIVADA");
}

function checkGeminiKeyAvailable() {
    if (typeof getGeminiApiKey === 'function') {
        const key = getGeminiApiKey();
        if (key) return true;
    }
    try {
        const saved = localStorage.getItem('chatAppSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings.apiKeysGemini?.[0]) return true;
        }
    } catch (e) {}
    return false;
}

function toggleWebSearchMode() {
    toggleWebSearch();
}

function enableWebSearch() {
    if (!webSearchEnabled) {
        webSearchEnabled = true;
        updateWebSearchUI();
    }
}

function disableWebSearch() {
    if (webSearchEnabled) {
        webSearchEnabled = false;
        updateWebSearchUI();
    }
}

function isWebSearchEnabled() {
    return webSearchEnabled;
}

function updateWebSearchUI() {
    updateWebSearchButtonState();
    updateWebSearchPlaceholder();
}

function updateWebSearchPlaceholder() {
    const input = document.getElementById('user-input');
    if (!input) return;
    
    input.placeholder = webSearchEnabled 
        ? '🌐 O que deseja pesquisar na web?' 
        : 'Digite sua mensagem...';
}

function updateWebSearchButtonState() {
    const attachWebSearchBtn = document.getElementById("attachWebSearchBtn");
    const inputWrapper = document.getElementById("inputWrapper");

    if (attachWebSearchBtn) {
        if (webSearchEnabled) {
            attachWebSearchBtn.classList.add("active");
            attachWebSearchBtn.title = "Busca na web ATIVADA (modo detalhado)";
        } else {
            attachWebSearchBtn.classList.remove("active");
            attachWebSearchBtn.title = "Buscar na web";
        }
    }

    if (inputWrapper) {
        inputWrapper.classList.toggle("web-search-mode", webSearchEnabled);
    }
}

// ===== FUNÇÃO PRINCIPAL DE BUSCA =====

async function webSearch(userMessage) {
    if (!webSearchEnabled) {
        return null;
    }

    console.log("🌐 [Web Search v2] Iniciando busca detalhada:", userMessage);
    
    // Analisar query para entender o que o usuário precisa
    const queryAnalysis = analyzeQuery(userMessage);
    console.log("🔍 [Web Search v2] Análise da query:", queryAnalysis);

    try {
        // Usar Gemini com Google Search Grounding e prompt otimizado
        const result = await searchWithGeminiGroundingDetailed(userMessage, queryAnalysis);
        
        if (result) {
            console.log("✅ [Web Search v2] Busca detalhada retornou resultados");
            return result;
        }

        // Nenhum resultado
        return formatNoResults(userMessage);

    } catch (error) {
        console.error("❌ [Web Search v2] Erro:", error);
        return formatSearchError(error.message);
    }
}

// ===== GEMINI GROUNDING v2 - BUSCA DETALHADA =====

function buildDetailedSearchPrompt(query, analysis) {
    const today = new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let prompt = `TAREFA: Pesquise na internet e forneça informações DETALHADAS e ESPECÍFICAS sobre: "${query}"

📅 DATA ATUAL: ${today}

INSTRUÇÕES OBRIGATÓRIAS:
1. Seja ESPECÍFICO - inclua NÚMEROS, DATAS, NOMES e FATOS CONCRETOS
2. NÃO seja vago ou genérico - forneça DADOS REAIS encontrados na busca
3. Cite FONTES específicas sempre que possível
4. Se houver informação conflitante, mencione as diferentes versões
5. Inclua informações ATUALIZADAS (prefira dados recentes)

`;

    // Adicionar instruções específicas baseadas no tipo de query
    switch(analysis.type) {
        case 'price':
            prompt += `
FOCO ESPECIAL (Preços/Valores):
- Valor EXATO atual (com moeda)
- Data/hora da cotação
- Variação percentual recente (dia, semana, mês)
- Máxima e mínima recentes
- Fatores que influenciam o preço
`;
            break;
            
        case 'news':
            prompt += `
FOCO ESPECIAL (Notícias):
- O QUE aconteceu (fatos específicos)
- QUANDO aconteceu (data e hora se possível)
- ONDE aconteceu (local específico)
- QUEM está envolvido (nomes completos)
- POR QUE/COMO aconteceu (contexto e causas)
- Desdobramentos e reações
- Fontes jornalísticas que cobriram
`;
            break;
            
        case 'howto':
            prompt += `
FOCO ESPECIAL (Tutorial/Como fazer):
- Pré-requisitos necessários
- Passo a passo DETALHADO e NUMERADO
- Comandos/códigos EXATOS se aplicável
- Avisos importantes e erros comuns
- Alternativas disponíveis
- Tempo estimado para completar
`;
            break;
            
        case 'person':
            prompt += `
FOCO ESPECIAL (Pessoa/Biografia):
- Nome completo
- Data e local de nascimento
- Idade atual (ou data de falecimento)
- Profissão/ocupação principal
- Principais realizações/obras
- Prêmios e reconhecimentos
- Informações recentes/atuais
`;
            break;
            
        case 'comparison':
            prompt += `
FOCO ESPECIAL (Comparação):
- TABELA comparativa com características principais
- Preços de cada opção
- Prós e contras de cada um
- Para que tipo de uso cada um é melhor
- Recomendação baseada em diferentes necessidades
- Avaliações de usuários/especialistas
`;
            break;
            
        case 'statistics':
            prompt += `
FOCO ESPECIAL (Estatísticas/Dados):
- Números EXATOS com casas decimais quando relevante
- Período de referência dos dados
- Fonte oficial dos dados
- Comparação com períodos anteriores
- Tendência (crescimento/queda)
- Metodologia se disponível
`;
            break;
            
        case 'weather':
            prompt += `
FOCO ESPECIAL (Clima/Tempo):
- Temperatura atual (em °C)
- Sensação térmica
- Umidade relativa do ar
- Condições (sol, nublado, chuva, etc)
- Previsão para as próximas horas
- Previsão para os próximos dias
- Alertas meteorológicos se houver
`;
            break;
            
        case 'sports':
            prompt += `
FOCO ESPECIAL (Esportes):
- Placar EXATO
- Data e horário do jogo/evento
- Local (estádio/arena)
- Competição/campeonato
- Destaques (gols, pontos marcados, por quem e quando)
- Classificação/tabela atual
- Próximos jogos
`;
            break;
            
        case 'product':
            prompt += `
FOCO ESPECIAL (Produto):
- Especificações TÉCNICAS COMPLETAS
- Preço oficial e em lojas
- Data de lançamento
- Disponibilidade (onde comprar)
- Comparação com modelo anterior
- Avaliações de reviewers
- Pontos positivos e negativos
`;
            break;
            
        default:
            prompt += `
INCLUA OBRIGATORIAMENTE:
- Dados numéricos específicos quando existirem
- Datas relevantes
- Nomes de pessoas/empresas/lugares envolvidos
- Fatos verificáveis
- Contexto histórico se relevante
`;
    }

    // Adicionar necessidades específicas detectadas
    if (analysis.needs.length > 0) {
        prompt += `\nINFORMAÇÕES ESPECÍFICAS NECESSÁRIAS:\n`;
        analysis.needs.forEach(need => {
            prompt += `• ${need}\n`;
        });
    }

    prompt += `
FORMATO DA RESPOSTA:
- Use tópicos e subtópicos organizados
- Destaque números e dados importantes
- Separe claramente diferentes aspectos do tema
- No final, liste as principais fontes consultadas

Responda em português do Brasil de forma COMPLETA e DETALHADA.`;

    return prompt;
}

async function searchWithGeminiGroundingDetailed(query, analysis) {
    // Obter chave Gemini
    let geminiKey = '';
    if (typeof getGeminiApiKey === 'function') {
        geminiKey = getGeminiApiKey();
    }
    if (!geminiKey) {
        try {
            const saved = localStorage.getItem('chatAppSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.apiKeysGemini?.[0]) {
                    geminiKey = settings.apiKeysGemini[0];
                }
            }
        } catch (e) {}
    }

    if (!geminiKey) {
        console.log("❌ [Grounding v2] Sem chave Gemini");
        return null;
    }

    console.log("🔍 [Grounding v2] Buscando com prompt otimizado...");

    try {
        // Usar modelo que suporta grounding
        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(url) : url;
        
        // Construir prompt detalhado baseado na análise
        const detailedPrompt = buildDetailedSearchPrompt(query, analysis);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: 'user', 
                    parts: [{ text: detailedPrompt }] 
                }],
                tools: [{ 
                    googleSearch: {} 
                }],
                generationConfig: { 
                    temperature: SEARCH_CONFIG.temperature, 
                    maxOutputTokens: SEARCH_CONFIG.maxOutputTokens,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ [Grounding v2] Erro HTTP:", response.status, errorText);
            
            // Tentar modelo alternativo se o principal falhar
            return await tryFallbackSearch(query, analysis, geminiKey);
        }

        const data = await response.json();
        
        // Extrair texto da resposta
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Extrair metadados de grounding (fontes)
        const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
        
        if (!resultText) {
            console.log("⚠️ [Grounding v2] Sem texto na resposta, tentando fallback");
            return await tryFallbackSearch(query, analysis, geminiKey);
        }

        // Formatar resultado com análise e fontes
        return formatDetailedGroundingResult(query, resultText, groundingMetadata, analysis);

    } catch (error) {
        console.error("❌ [Grounding v2] Erro:", error);
        return null;
    }
}

// Fallback para modelo alternativo
async function tryFallbackSearch(query, analysis, geminiKey) {
    console.log("🔄 [Grounding v2] Tentando modelo fallback...");
    
    try {
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(url) : url;
        
        const simplePrompt = `Pesquise na internet informações atualizadas e DETALHADAS sobre: "${query}"

Seja ESPECÍFICO: inclua números, datas, nomes e fatos concretos.
Não seja vago. Forneça dados reais.
Responda em português do Brasil.`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: 'user', 
                    parts: [{ text: simplePrompt }] 
                }],
                tools: [{ googleSearch: {} }],
                generationConfig: { 
                    temperature: 0.3, 
                    maxOutputTokens: 3000 
                }
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
        
        if (!resultText) return null;

        return formatDetailedGroundingResult(query, resultText, groundingMetadata, analysis);

    } catch (error) {
        console.error("❌ [Fallback] Erro:", error);
        return null;
    }
}

// ===== FORMATAÇÃO DOS RESULTADOS v2 =====

function formatDetailedGroundingResult(query, text, groundingMetadata, analysis) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Identificar tipo de busca para label
    const typeLabels = {
        'price': '💰 Preços/Cotações',
        'news': '📰 Notícias',
        'howto': '📝 Tutorial',
        'person': '👤 Biografia',
        'comparison': '⚖️ Comparação',
        'statistics': '📊 Estatísticas',
        'weather': '🌤️ Clima',
        'sports': '⚽ Esportes',
        'product': '📦 Produto',
        'general': '🔍 Pesquisa Geral'
    };
    
    const typeLabel = typeLabels[analysis.type] || typeLabels['general'];
    
    let formatted = `\n\n╔══════════════════════════════════════════════════════════════╗
║                    🌐 PESQUISA WEB DETALHADA                   ║
╠══════════════════════════════════════════════════════════════╣
║ 📝 Pesquisa: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"
║ 📅 ${dateStr}
║ 🏷️ Tipo: ${typeLabel}
║ ✅ Fonte: Google Search (tempo real)
╚══════════════════════════════════════════════════════════════╝

`;
    
    // Adicionar conteúdo principal
    formatted += text;
    
    // Extrair e adicionar estatísticas/números encontrados
    const extractedData = extractKeyData(text);
    if (extractedData.numbers.length > 0 || extractedData.dates.length > 0) {
        formatted += `\n\n┌─────────────────────────────────────────┐\n`;
        formatted += `│ 📊 DADOS-CHAVE EXTRAÍDOS                │\n`;
        formatted += `├─────────────────────────────────────────┤\n`;
        
        if (extractedData.numbers.length > 0) {
            formatted += `│ 🔢 Números: ${extractedData.numbers.slice(0, 5).join(', ')}\n`;
        }
        if (extractedData.dates.length > 0) {
            formatted += `│ 📅 Datas: ${extractedData.dates.slice(0, 3).join(', ')}\n`;
        }
        if (extractedData.percentages.length > 0) {
            formatted += `│ 📈 Percentuais: ${extractedData.percentages.slice(0, 3).join(', ')}\n`;
        }
        formatted += `└─────────────────────────────────────────┘`;
    }
    
    // Adicionar fontes se disponíveis
    if (groundingMetadata) {
        const sources = extractDetailedSources(groundingMetadata);
        if (sources.length > 0) {
            formatted += `\n\n┌─────────────────────────────────────────┐\n`;
            formatted += `│ 📚 FONTES CONSULTADAS (${sources.length})              │\n`;
            formatted += `└─────────────────────────────────────────┘\n`;
            
            sources.forEach((source, index) => {
                formatted += `\n${index + 1}. ${source.title || 'Fonte'}\n`;
                if (source.uri) {
                    formatted += `   🔗 ${source.uri}\n`;
                }
                if (source.snippet) {
                    formatted += `   📄 "${source.snippet.substring(0, 100)}..."\n`;
                }
            });
        }
        
        // Mostrar queries usadas pelo Google
        if (groundingMetadata.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) {
            formatted += `\n🔍 Queries pesquisadas: ${groundingMetadata.webSearchQueries.join(' | ')}\n`;
        }
    }
    
    formatted += `\n╔══════════════════════════════════════════════════════════════╗
║                      FIM DA PESQUISA WEB                       ║
╚══════════════════════════════════════════════════════════════╝

⚠️ INSTRUÇÃO PARA O ASSISTENTE: 
Use estas informações DETALHADAS da pesquisa web para responder ao usuário.
- Cite os números e dados específicos encontrados
- Mencione as fontes quando relevante
- Se alguma informação estiver incompleta, indique claramente
- NÃO invente informações além do que foi encontrado na busca
`;

    return formatted;
}

// Extrair dados-chave do texto
function extractKeyData(text) {
    const data = {
        numbers: [],
        dates: [],
        percentages: [],
        currencies: []
    };
    
    // Extrair números com contexto (valores monetários, quantidades)
    const numberRegex = /(?:R\$|US\$|\$|€|£)?\s*[\d.,]+(?:\s*(?:milhões?|bilhões?|trilhões?|mil|K|M|B))?\b/gi;
    const numbers = text.match(numberRegex) || [];
    data.numbers = [...new Set(numbers)].filter(n => n.trim().length > 0);
    
    // Extrair percentuais
    const percentRegex = /[\d.,]+\s*%/g;
    const percentages = text.match(percentRegex) || [];
    data.percentages = [...new Set(percentages)];
    
    // Extrair datas
    const dateRegex = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+(?:de\s+)?(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+\d{4})?/gi;
    const dates = text.match(dateRegex) || [];
    data.dates = [...new Set(dates)];
    
    return data;
}

// Extrair fontes com mais detalhes
function extractDetailedSources(groundingMetadata) {
    const sources = [];
    
    // Extrair de groundingChunks
    if (groundingMetadata.groundingChunks) {
        groundingMetadata.groundingChunks.forEach(chunk => {
            if (chunk.web) {
                sources.push({
                    title: chunk.web.title,
                    uri: chunk.web.uri,
                    snippet: chunk.web.snippet || ''
                });
            }
        });
    }
    
    // Extrair de searchEntryPoint se disponível
    if (groundingMetadata.searchEntryPoint?.renderedContent) {
        console.log("🔍 [Grounding v2] SearchEntryPoint disponível");
    }
    
    // Extrair de groundingSupports para snippets
    if (groundingMetadata.groundingSupports) {
        groundingMetadata.groundingSupports.forEach(support => {
            if (support.segment?.text && support.groundingChunkIndices) {
                support.groundingChunkIndices.forEach(idx => {
                    if (sources[idx] && !sources[idx].snippet) {
                        sources[idx].snippet = support.segment.text;
                    }
                });
            }
        });
    }
    
    // Remover duplicatas por URI
    const uniqueSources = sources.filter((source, index, self) => 
        index === self.findIndex(s => s.uri === source.uri)
    );
    
    return uniqueSources.slice(0, SEARCH_CONFIG.maxDetailedResults);
}

// Função de compatibilidade com código antigo
function formatGroundingResult(query, text, groundingMetadata) {
    return formatDetailedGroundingResult(query, text, groundingMetadata, { type: 'general', needs: [] });
}

function extractSources(groundingMetadata) {
    return extractDetailedSources(groundingMetadata);
}

// ===== FORMATAÇÃO DE ERROS =====

function formatNoResults(query) {
    return `\n\n╔══════════════════════════════════════════════════════════════╗
║                    ⚠️ PESQUISA SEM RESULTADOS                  ║
╠══════════════════════════════════════════════════════════════╣
║ Pesquisa: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"
║ Resultado: Não foi possível obter informações detalhadas.
╚══════════════════════════════════════════════════════════════╝

⚠️ INSTRUÇÃO: Responda com seu conhecimento, mas avise que não foi possível 
buscar dados atualizados da web. A informação pode estar desatualizada.\n`;
}

function formatSearchError(errorMessage) {
    return `\n\n╔══════════════════════════════════════════════════════════════╗
║                    ❌ ERRO NA PESQUISA WEB                     ║
╠══════════════════════════════════════════════════════════════╣
║ Erro: ${errorMessage.substring(0, 50)}${errorMessage.length > 50 ? '...' : ''}
╚══════════════════════════════════════════════════════════════╝

⚠️ INSTRUÇÃO: Responda com seu conhecimento e informe que a busca web falhou.
A informação pode estar desatualizada.\n`;
}

// ===== FUNÇÃO DE COMPATIBILIDADE (para código legado) =====
function isSerpApiConfigured() {
    // Agora usamos Gemini Grounding, então retorna true se tiver chave Gemini
    return checkGeminiKeyAvailable();
}

// Função de compatibilidade com código antigo
async function searchWithGeminiGrounding(query) {
    const analysis = analyzeQuery(query);
    return searchWithGeminiGroundingDetailed(query, analysis);
}

// ===== EXPOR GLOBALMENTE =====
window.webSearch = webSearch;
window.toggleWebSearch = toggleWebSearch;
window.toggleWebSearchMode = toggleWebSearchMode;
window.isWebSearchEnabled = isWebSearchEnabled;
window.enableWebSearch = enableWebSearch;
window.disableWebSearch = disableWebSearch;
window.updateWebSearchButtonState = updateWebSearchButtonState;
window.isSerpApiConfigured = isSerpApiConfigured; // Compatibilidade
window.searchWithGeminiGrounding = searchWithGeminiGrounding;
window.analyzeQuery = analyzeQuery;
window.SEARCH_CONFIG = SEARCH_CONFIG;

console.log("✅ [Web Search v2] Módulo carregado - Busca Detalhada com Gemini Grounding");
