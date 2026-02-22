// ===== SISTEMA DE CARDS DE SUGESTÃO =====
// Mostra sugestões personalizadas na tela inicial baseadas na memória do usuário

// Função para remover emojis de texto
function removeEmojis(text) {
    if (!text) return text;
    return text
        // Remover todos os emojis Unicode
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
        .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols Extended-A
        .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
        .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media controls
        .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Media controls
        .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
        .replace(/[\u{25B6}]/gu, '')            // Play button
        .replace(/[\u{25C0}]/gu, '')            // Reverse button
        .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
        .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
        .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
        .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
        .replace(/[\u{2B50}]/gu, '')            // Star
        .replace(/[\u{2B55}]/gu, '')            // Circle
        .replace(/[\u{3030}]/gu, '')            // Wavy dash
        .replace(/[\u{303D}]/gu, '')            // Part alternation mark
        .replace(/[\u{3297}]/gu, '')            // Circled Ideograph Congratulation
        .replace(/[\u{3299}]/gu, '')            // Circled Ideograph Secret
        .replace(/[\u{00A9}]/gu, '')            // Copyright
        .replace(/[\u{00AE}]/gu, '')            // Registered
        .replace(/[\u{2122}]/gu, '')            // Trademark
        // Remover espaços extras
        .replace(/\s+/g, ' ')
        .trim();
}

const SUGGESTION_ICONS = [
    'fa-lightbulb',
    'fa-compass', 
    'fa-star',
    'fa-rocket',
    'fa-book',
    'fa-music',
    'fa-gamepad',
    'fa-code',
    'fa-film',
    'fa-utensils'
];

// Sugestões genéricas para quando não há memória
// Sempre em primeira pessoa do usuário ou neutras
const GENERIC_SUGGESTIONS = [
    "Quero saber uma curiosidade sobre o universo",
    "Como posso ser mais produtivo?",
    "Qual filme devo assistir hoje?",
    "Preciso de uma ideia criativa",
    "O que vale a pena aprender em 2026?",
    "Qual receita fácil posso fazer hoje?",
    "Quero uma recomendação de livro",
    "O que posso fazer para relaxar?",
    "Estou entediado, o que fazer?",
    "Preciso de motivação hoje",
    "Quero aprender algo novo",
    "Qual série devo assistir?",
    "Preciso de dicas para dormir melhor",
    "Como posso economizar dinheiro?",
    "Quero começar um novo hobby"
];

// Gera sugestões baseadas na memória do usuário
async function generateSuggestions() {
    const memory = getMemoryText();
    
    if (!memory || memory.trim().length < 20) {
        // Sem memória suficiente - retorna sugestões genéricas aleatórias
        return getRandomGenericSuggestions();
    }
    
    // Tenta gerar sugestões personalizadas com IA
    const apiKey = getApiKey();
    if (!apiKey) {
        return getRandomGenericSuggestions();
    }
    
    try {
        const suggestions = await generateWithAI(memory, apiKey);
        if (suggestions && suggestions.length >= 3) {
            return suggestions.slice(0, 3);
        }
    } catch (e) {
        console.error('🎯 [Suggestions] Erro ao gerar:', e);
    }
    
    return getRandomGenericSuggestions();
}

// Gera sugestões usando IA
async function generateWithAI(memory, apiKey) {
    const prompt = `Com base nas informações do usuário, gere 3 sugestões de conversa interessantes e personalizadas.

MEMÓRIA DO USUÁRIO:
${memory}

REGRAS:
- Cada sugestão deve ter no máximo 50 caracteres
- Deve ser em PRIMEIRA PESSOA do usuário (como se ele estivesse falando)
- Baseie nas preferências, hobbies, trabalho ou interesses do usuário
- Seja específico e relevante para a pessoa
- NÃO use emojis
- NÃO comece com "Me" seguido de verbo imperativo (ex: "Me conte", "Me ajude")
- Use frases como: "Quero...", "Preciso de...", "Como posso...", "O que...", "Qual..."
- Formato: uma sugestão por linha, sem numeração

EXEMPLOS CORRETOS:
Quero dicas para meu projeto em Python
Qual jogo de terror devo jogar?
Como melhoro meu portfolio?

EXEMPLOS INCORRETOS (não use):
Me ajude com um projeto
Me conte sobre algo
Sugira algo para mim

Gere 3 sugestões:`;

    try {
        const provider = getModelProvider(getModelName());
        let response = null;
        
        if (provider === 'gemini') {
            response = await fetchGeminiSuggestions(prompt, apiKey);
        } else if (provider === 'deepseek') {
            response = await fetchDeepSeekSuggestions(prompt, apiKey);
        } else if (provider === 'openai') {
            response = await fetchOpenAISuggestions(prompt, apiKey);
        }
        
        if (response) {
            const lines = response.trim().split('\n')
                .map(l => l.trim())
                .map(l => removeEmojis(l)) // Limpa emojis
                .filter(l => l.length > 5 && l.length < 80);
            
            if (lines.length >= 3) {
                return lines.slice(0, 3);
            }
        }
    } catch (e) {
        console.error('[Suggestions] Erro na API:', e);
    }
    
    return null;
}

async function fetchGeminiSuggestions(prompt, apiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 150, temperature: 0.8 }
        })
    });
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

async function fetchDeepSeekSuggestions(prompt, apiKey) {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.8
        })
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim();
}

async function fetchOpenAISuggestions(prompt, apiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.8
        })
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim();
}

// Retorna 3 sugestões genéricas aleatórias
function getRandomGenericSuggestions() {
    const shuffled = [...GENERIC_SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
}

// Obtém texto da memória
function getMemoryText() {
    // Tenta pegar do elemento
    const memoryEl = document.getElementById('memoryText');
    if (memoryEl && memoryEl.value && memoryEl.value.trim()) {
        return memoryEl.value.trim();
    }
    
    // Tenta pegar do localStorage
    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.text) return parsed.text.trim();
        }
    } catch (e) {}
    
    return '';
}

// Mostra os cards de sugestão - SÓ aparece se o loop de animação estiver ativo
async function showSuggestionCards() {
    const container = document.getElementById('suggestion-cards');
    if (!container) return;
    
    // VERIFICAÇÃO: Se sugestões estão desabilitadas nas configurações
    if (typeof areSuggestionsEnabled === 'function' && !areSuggestionsEnabled()) {
        container.classList.add('hidden');
        return;
    }
    
    // Verificação alternativa via localStorage diretamente
    // PADRÃO: desabilitado (só ativa se = 'true')
    if (localStorage.getItem('neo_suggestions_enabled') !== 'true') {
        container.classList.add('hidden');
        return;
    }
    
    // VERIFICAÇÃO: só mostrar se o loop de animação estiver ativo
    // Usa a variável global typingLoopRunning do ui.js
    if (typeof typingLoopRunning === 'undefined' || !typingLoopRunning) {
        container.classList.add('hidden');
        return;
    }
    
    // Verificação adicional: se há mensagens na conversa atual, não mostrar
    if (typeof conversations !== 'undefined' && typeof currentConversationId !== 'undefined') {
        const conv = conversations.find(c => c.id === currentConversationId);
        if (conv && conv.messages && conv.messages.length > 0) {
            container.classList.add('hidden');
            return;
        }
    }
    
    // Gera sugestões
    let suggestions = await generateSuggestions();
    
    // Ordena do maior para o menor
    suggestions.sort((a, b) => b.length - a.length);
    
    // Atualiza os cards
    const cards = container.querySelectorAll('.suggestion-card');
    
    // Ícones FontAwesome para usar nos cards
    const iconClasses = ['fa-lightbulb', 'fa-compass', 'fa-rocket'];
    
    cards.forEach((card, index) => {
        if (suggestions[index]) {
            const textEl = card.querySelector('.suggestion-text');
            const iconEl = card.querySelector('.suggestion-icon');
            
            if (textEl) textEl.textContent = suggestions[index];
            // Usar ícone FontAwesome em vez de emoji
            if (iconEl) iconEl.innerHTML = `<i class="fa-solid ${iconClasses[index] || 'fa-star'}"></i>`;
            
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mostra container
    container.classList.remove('hidden');
    
    // Re-trigger animations
    cards.forEach(card => {
        card.style.animation = 'none';
        card.offsetHeight; // Trigger reflow
        card.style.animation = '';
    });
}

// Esconde os cards de sugestão
function hideSuggestionCards() {
    const container = document.getElementById('suggestion-cards');
    if (container) {
        container.classList.add('hidden');
    }
}

// Mostra sugestões já carregadas (sem regenerar - economiza tokens)
function showCachedSuggestionCards() {
    const container = document.getElementById('suggestion-cards');
    if (!container) return;
    
    // VERIFICAÇÃO: Se sugestões estão desabilitadas nas configurações
    // PADRÃO: desabilitado (só ativa se = 'true') - economiza tokens
    if (localStorage.getItem('neo_suggestions_enabled') !== 'true') {
        container.classList.add('hidden');
        return;
    }
    
    // Verificar se o loop está ativo
    if (typeof typingLoopRunning === 'undefined' || !typingLoopRunning) {
        container.classList.add('hidden');
        return;
    }
    
    // Verificar se já tem conteúdo nos cards
    const cards = container.querySelectorAll('.suggestion-card');
    let hasContent = false;
    
    cards.forEach(card => {
        const textEl = card.querySelector('.suggestion-text');
        if (textEl && textEl.textContent && textEl.textContent.trim()) {
            hasContent = true;
        }
    });
    
    // Se já tem conteúdo, apenas mostrar sem regenerar
    if (hasContent) {
        container.classList.remove('hidden');
        return;
    }
    
    // Se não tem conteúdo, gerar pela primeira vez
    showSuggestionCards();
}

// Inicializa eventos dos cards
function initSuggestionCards() {
    const container = document.getElementById('suggestion-cards');
    if (!container) {
        console.log('🎯 [Suggestions] Container não encontrado!');
        return;
    }
    
    console.log('🎯 [Suggestions] Inicializando eventos...');
    
    // Adiciona evento em cada card individualmente
    const cards = container.querySelectorAll('.suggestion-card');
    cards.forEach((card, index) => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const textEl = this.querySelector('.suggestion-text');
            if (!textEl) return;
            
            const suggestionText = textEl.textContent.trim();
            if (!suggestionText) return;
            
            // Esconde cards imediatamente
            hideSuggestionCards();
            
            // Coloca no input e envia direto
            const input = document.getElementById('user-input');
            const form = document.getElementById('chat-form');
            
            if (input && form) {
                input.value = suggestionText;
                
                // Dispara submit do form diretamente
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        });
    });
    
    console.log('🎯 [Suggestions] Eventos adicionados a', cards.length, 'cards');
}

// Exportar
window.showSuggestionCards = showSuggestionCards;
window.showCachedSuggestionCards = showCachedSuggestionCards;
window.hideSuggestionCards = hideSuggestionCards;
window.initSuggestionCards = initSuggestionCards;
