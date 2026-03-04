// ===== SISTEMA DE IMAGENS DO TÓPICO =====
// Busca imagens relevantes da Wikipedia/Wikimedia Commons

// Configuração
const TOPIC_IMAGES_ENABLED_KEY = 'neo_topic_images_enabled';

// Padrões que INDICAM busca de imagem (pergunta sobre identidade/entidade)
const IMAGE_TRIGGER_PATTERNS = [
    /^quem\s+(é|foi|era|são|eram|\u00e9)\s+/i,           // "Quem é X"
    /^o\s+que\s+(é|são|foi|eram)\s+/i,                  // "O que é X"
    /^qual\s+(é|foi|era)\s+/i,                           // "Qual é X"
    /^onde\s+fica\s+/i,                                  // "Onde fica X"
    /^como\s+(é|era|são)\s+/i,                          // "Como é X" (aparência)
    /^me\s+(fale|conte|diga)\s+sobre\s+/i,               // "Me fale sobre X"
    /^fale\s+sobre\s+/i,                                 // "Fale sobre X"
    /^o\s+que\s+você\s+sabe\s+sobre\s+/i,                // "O que você sabe sobre X"
];

// Termos que BLOQUEIAM busca de imagem (nunca buscar)
const IMAGE_BLOCK_TERMS = [
    /\bneo\b/i,                    // NEO e variações
    /\bn\.e\.o\b/i,
    /\bmatrix\b/i,                 // Matrix (confunde com o filme)
    /\bcomo\s+fazer\b/i,           // Tutoriais
    /\bcomo\s+criar\b/i,
    /\bcomo\s+programar\b/i,
    /\bcódigo\b/i,
    /\bprogramação\b/i,
    /\bscript\b/i,
    /\balgoritmo\b/i,
    /\bcalcul[aeo]\b/i,
    /\bquanto\s+é\b/i,
    /\bquantos?\b/i,
    /\bcompara\b/i,
    /\bvs\b/i,
    /\bversus\b/i,
    /\bmelhor\b/i,
    /\bpior\b/i,
    /\bdiferenç?a\b/i,
    /\bvantage[nm]s?\b/i,
    /\bdesvantage[nm]s?\b/i,
    /\bprós?\b/i,
    /\bcontras?\b/i,
    /\bexplique\b/i,
    /\bexplica\b/i,
    /\bpor\s*qu[eê]\b/i,
    /\bpra\s+qu[eê]\b/i,
    /\bpara\s+qu[eê]\b/i,
    /\bajud[ae]\b/i,
    /\bpreciso\b/i,
    /\bquero\b/i,
    /\bfaça\b/i,
    /\bgere\b/i,
    /\bcrie\b/i,
    /\bescreva\b/i,
    /\bresuma\b/i,
    /\btraduza?\b/i,
    /\bconverta\b/i,
];

// Verifica se é pergunta que merece imagem
function shouldShowTopicImages(text) {
    if (!text || !isTopicImagesEnabled()) return false;
    
    // NÃO mostrar imagens no modo de busca web
    if (typeof isWebSearchModeActive === 'function' && isWebSearchModeActive()) {
        return false;
    }
    
    const lowerText = text.toLowerCase().trim();
    
    // Verificar se contém termos bloqueados
    for (const pattern of IMAGE_BLOCK_TERMS) {
        if (pattern.test(text)) {
            console.log('🖼️ [TopicImages] Bloqueado por termo:', pattern);
            return false;
        }
    }
    
    // Verificar se corresponde a padrões de trigger
    for (const pattern of IMAGE_TRIGGER_PATTERNS) {
        if (pattern.test(text)) {
            console.log('🖼️ [TopicImages] Trigger encontrado:', pattern);
            return true;
        }
    }
    
    // Se não corresponde a nenhum padrão de trigger, não buscar
    console.log('🖼️ [TopicImages] Nenhum trigger, pulando busca');
    return false;
}

// Verifica se está habilitado
function isTopicImagesEnabled() {
    const saved = localStorage.getItem(TOPIC_IMAGES_ENABLED_KEY);
    return saved === null ? true : saved === 'true';
}

// Usa a IA para decidir se precisa de imagem E extrair o termo
async function analyzeForImage(userQuestion) {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    
    const prompt = `Analise a pergunta e decida se uma IMAGEM ajudaria a contextualizar a resposta.

MOSTRAR IMAGEM QUANDO for sobre:
- Pessoa específica (político, artista, cientista, etc)
- Lugar físico (cidade, monumento, país, etc)
- Objeto/coisa física (aparelho, instrumento, animal, planta, etc)
- Obra de arte, filme, série, jogo (poster/capa)

NÃO MOSTRAR IMAGEM quando for:
- Conceitos abstratos (amor, felicidade, economia)
- Perguntas de como fazer algo
- Cálculos, código, programação
- Conversas casuais, piadas
- Comparações ou listas

RESPONDA em formato JSON:
{"show": true/false, "term": "termo para buscar"}

Se show=false, term pode ser vazio.

Pergunta: "${userQuestion}"
JSON:`;

    try {
        const provider = getModelProvider(getModelName());
        let response = null;
        
        if (provider === 'gemini') {
            response = await extractWithGemini(prompt, apiKey);
        } else if (provider === 'deepseek') {
            response = await extractWithDeepSeek(prompt, apiKey);
        } else if (provider === 'openai') {
            response = await extractWithOpenAI(prompt, apiKey);
        }
        
        if (response) {
            // Limpa a resposta e tenta fazer parse do JSON
            response = response.trim();
            // Remove possíveis markdown code blocks
            response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            try {
                const result = JSON.parse(response);
                console.log('🖼️ [TopicImages] IA decidiu:', result);
                
                if (result.show && result.term) {
                    return result.term.trim();
                }
            } catch (e) {
                // Se não conseguiu fazer parse, tenta extrair manualmente
                if (response.toLowerCase().includes('"show": true') || response.toLowerCase().includes('"show":true')) {
                    const termMatch = response.match(/"term":\s*"([^"]+)"/);
                    if (termMatch) {
                        return termMatch[1].trim();
                    }
                }
            }
        }
    } catch (e) {
        console.error('🖼️ [TopicImages] Erro na análise:', e);
    }
    
    return null;
}

// Extração com Gemini
async function extractWithGemini(prompt, apiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 50, temperature: 0.1 }
        })
    });
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

// Extração com DeepSeek
async function extractWithDeepSeek(prompt, apiKey) {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 0.1
        })
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim();
}

// Extração com OpenAI
async function extractWithOpenAI(prompt, apiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 0.1
        })
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim();
}

// ========== BUSCA DE IMAGENS ==========

// Busca imagem principal da Wikipedia (mais precisa)
async function searchWikipediaImages(term) {
    console.log('🖼️ [TopicImages] Buscando imagem para:', term);
    
    // Tenta PT primeiro
    let result = await tryWikipediaMainImage(term, 'pt');
    
    // Se não achou, tenta EN
    if (!result) {
        result = await tryWikipediaMainImage(term, 'en');
    }
    
    // Retornar resultado sem validação rigorosa
    if (result) {
        console.log('🖼️ [TopicImages] Imagem encontrada:', result.title);
        return [result];
    }
    
    return [];
}

// Verifica se o título da página é relevante para o termo buscado
async function validateImageRelevance(searchTerm, pageTitle) {
    const apiKey = getApiKey();
    if (!apiKey) {
        // Sem API, faz validação simples por texto
        return simpleRelevanceCheck(searchTerm, pageTitle);
    }
    
    const prompt = `Verifique se a página da Wikipedia encontrada é sobre o mesmo assunto buscado.

Termo buscado: "${searchTerm}"
Página encontrada: "${pageTitle}"

A página "${pageTitle}" é sobre "${searchTerm}" ou algo muito relacionado?

Responda APENAS "sim" ou "nao" (sem acento):`;

    try {
        const provider = getModelProvider(getModelName());
        let response = null;
        
        if (provider === 'gemini') {
            response = await extractWithGemini(prompt, apiKey);
        } else if (provider === 'deepseek') {
            response = await extractWithDeepSeek(prompt, apiKey);
        } else if (provider === 'openai') {
            response = await extractWithOpenAI(prompt, apiKey);
        }
        
        if (response) {
            const answer = response.trim().toLowerCase();
            console.log('🖼️ [TopicImages] Validação IA:', answer);
            return answer.includes('sim');
        }
    } catch (e) {
        console.error('🖼️ [TopicImages] Erro na validação:', e);
    }
    
    // Fallback: validação simples
    return simpleRelevanceCheck(searchTerm, pageTitle);
}

// Validação simples sem IA - compara palavras
function simpleRelevanceCheck(searchTerm, pageTitle) {
    const searchWords = searchTerm.toLowerCase().split(/\s+/);
    const titleLower = pageTitle.toLowerCase();
    
    // Pelo menos uma palavra importante do termo deve estar no título
    const matches = searchWords.filter(word => 
        word.length > 3 && titleLower.includes(word)
    );
    
    return matches.length > 0;
}

// Busca APENAS a imagem principal (infobox) - mais precisa
async function tryWikipediaMainImage(term, lang) {
    try {
        // 1. Busca a página na Wikipedia
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=1&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchJson = await searchRes.json();
        
        const pageTitle = searchJson?.query?.search?.[0]?.title;
        if (!pageTitle) return null;
        
        console.log(`🖼️ [TopicImages] Página (${lang}):`, pageTitle);
        
        // 2. Busca imagem principal (infobox)
        const mainImgUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=500&format=json&origin=*`;
        const mainImgRes = await fetch(mainImgUrl);
        const mainImgJson = await mainImgRes.json();
        
        const mainPage = Object.values(mainImgJson?.query?.pages || {})[0];
        if (mainPage?.thumbnail?.source) {
            return {
                url: mainPage.thumbnail.source,
                title: pageTitle
            };
        }
        
        return null;
    } catch (e) {
        console.error(`🖼️ [TopicImages] Erro (${lang}):`, e);
        return null;
    }
}

// ========== FUNÇÃO PRINCIPAL ==========

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Função principal - chamada quando mensagem é enviada
async function getTopicImagesHtml(userMessage) {
    if (!shouldShowTopicImages(userMessage)) {
        return '';
    }
    
    console.log('🖼️ [TopicImages] Processando:', userMessage);
    
    const placeholderId = 'topic-imgs-' + Date.now();
    
    // Buscar em background e atualizar DOM
    (async () => {
        try {
            // IA decide se precisa de imagem E qual termo buscar
            const searchTerm = await analyzeForImage(userMessage);
            if (!searchTerm) {
                console.log('🖼️ [TopicImages] IA decidiu: não precisa de imagem');
                document.getElementById(placeholderId)?.remove();
                return;
            }
            
            console.log('🖼️ [TopicImages] Buscando imagem para:', searchTerm);
            
            // Buscar imagens
            const images = await searchWikipediaImages(searchTerm);
            
            if (images.length === 0) {
                document.getElementById(placeholderId)?.remove();
                return;
            }
            
            console.log('🖼️ [TopicImages] Imagem encontrada');
            
            // Criar HTML das imagens
            const imagesHtml = images.map(img => `
                <div class="topic-img-card">
                    <img src="${img.url}" alt="${escapeHtml(img.title)}" onerror="this.parentElement.style.display='none'">
                </div>
            `).join('');
            
            // Atualizar placeholder no DOM
            const el = document.getElementById(placeholderId);
            if (el) {
                el.innerHTML = imagesHtml;
                el.classList.remove('loading');
            }
            
            // Salvar na mensagem da IA para persistir
            const conv = conversations.find(c => c.id === currentConversationId);
            if (conv && conv.messages.length > 0) {
                for (let i = conv.messages.length - 1; i >= 0; i--) {
                    if (conv.messages[i].role === 'ai') {
                        conv.messages[i].topicImagesHtml = `<div class="topic-images-carousel">${imagesHtml}</div>`;
                        if (typeof saveConversations === 'function') {
                            saveConversations();
                        }
                        break;
                    }
                }
            }
        } catch (e) {
            console.error('🖼️ [TopicImages] Erro:', e);
            document.getElementById(placeholderId)?.remove();
        }
    })();
    
    // Retorna placeholder com 1 skeleton (mostra só o que encontrar)
    return `<div class="topic-images-carousel loading" id="${placeholderId}">
        <div class="topic-img-card skeleton"></div>
    </div>`;
}

// Exportar funções globais
window.getTopicImagesHtml = getTopicImagesHtml;
window.shouldShowTopicImages = shouldShowTopicImages;
window.isTopicImagesEnabled = isTopicImagesEnabled;
