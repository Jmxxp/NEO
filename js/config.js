// ===== CONFIGURAÇÃO E CONSTANTES =====

// Estado do Cordova (usado em vários módulos)
let isCordovaReady = false;

// Chaves de armazenamento
const STORAGE_KEY = "neo_conversations";
const SETTINGS_KEY = "neo_settings";
const MEMORY_KEY = "neo_user_memory";
const MEMORY_HISTORY_KEY = "neo_user_memory_history";
const MAX_MEMORY_HISTORY = 10;
const MEMORY_BY_MESSAGE_KEY = "neo_memory_by_message";
const FAVORITES_KEY = "neo_favorites";

// Configurações padrão de API
// ATENÇÃO: Não há chaves pré-configuradas. O usuário deve inserir suas próprias chaves.
// NÃO COLOQUE NENHUMA CHAVE AQUI!
const DEFAULT_API_KEY = null;
const DEFAULT_GEMINI_API_KEY = null;
const DEFAULT_SERP_API_KEY = null;
const DEFAULT_MODEL_NAME = "gemini-2.5-flash";
const FALLBACK_MODEL_NAME = "gemini-2.5-flash-lite";

// ╔════════════════════════════════════════════════════════════════╗
// ║  LIMITE DIÁRIO DE TOKENS - ALTERE AQUI SE NECESSÁRIO       ║
// ╚════════════════════════════════════════════════════════════════╝
const DAILY_TOKEN_LIMIT = 200000; // 200k tokens por dia
const TOKEN_STORAGE_KEY = 'neo_daily_tokens';
// ════════════════════════════════════════════════════════════════════

// Sistema de controle de tokens diários
function getTokenUsage() {
    try {
        const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            // Verificar se é o mesmo dia
            const today = new Date().toDateString();
            if (data.date === today) {
                return data;
            }
        }
    } catch (e) {}
    // Novo dia ou sem dados - resetar
    return { date: new Date().toDateString(), used: 0, limit: DAILY_TOKEN_LIMIT };
}

function saveTokenUsage(used) {
    const data = {
        date: new Date().toDateString(),
        used: used,
        limit: DAILY_TOKEN_LIMIT
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(data));
}

function addTokensUsed(tokens) {
    const usage = getTokenUsage();
    usage.used += tokens;
    saveTokenUsage(usage.used);
    updateTokenDisplay();
    return usage;
}

function getRemainingTokens() {
    const usage = getTokenUsage();
    return Math.max(0, usage.limit - usage.used);
}

function isTokenLimitReached() {
    return getRemainingTokens() <= 0;
}

function updateTokenDisplay() {
    // Usa a função updateTokenUsageUI do storage.js que mostra a barra correta
    if (typeof updateTokenUsageUI === 'function') {
        updateTokenUsageUI();
    }
}

// Verificar reset à meia-noite
function checkMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
        console.log('🌙 [Tokens] Meia-noite! Resetando limite diário...');
        // Forçar reset via checkAndResetTokens ou updateTokenUsageUI
        if (typeof updateTokenUsageUI === 'function') {
            updateTokenUsageUI();
        }
        // Agendar próximo reset
        checkMidnightReset();
    }, msUntilMidnight);
    
    console.log(`⏰ [Tokens] Próximo reset em ${Math.round(msUntilMidnight / 1000 / 60)} minutos`);
}

// Verificar se limite foi excedido
function isTokenLimitExceeded() {
    return getRemainingTokens() <= 0;
}

// Mensagem amigável quando limite é atingido
function getTokenLimitMessage() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const hoursUntilReset = Math.ceil((tomorrow - now) / (1000 * 60 * 60));
    
    return `⚠️ **Limite diário atingido!**

Você usou todos os seus ${(DAILY_TOKEN_LIMIT / 1000).toFixed(0)}k tokens de hoje.

🕐 Seu limite será renovado em aproximadamente **${hoursUntilReset} hora${hoursUntilReset > 1 ? 's' : ''}** (à meia-noite).

💡 **Dica:** Para economizar tokens, tente fazer perguntas mais objetivas e evite conversas muito longas em uma única sessão.`;
}

// Tamanhos do textarea
const MIN_TEXTAREA_HEIGHT = 24;
const MIN_WRAPPER_HEIGHT = 52;

// Gradientes predefinidos
const GRADIENT_PRESETS = {
    default: `linear-gradient(180deg, #000000 0%, #202020 100%)`,
    pink: `radial-gradient(circle at 70% 120%, rgba(255, 105, 180, 0.35), transparent 60%),
                    radial-gradient(circle at -10% -20%, rgba(200, 0, 100, 0.25), transparent 65%),
                    linear-gradient(to top, #1a0014, #2d0033, #3d0052, #2d0033)`,
    green: `radial-gradient(circle at 70% 120%, rgba(0, 255, 100, 0.35), transparent 60%),
                    radial-gradient(circle at -10% -20%, rgba(0, 200, 100, 0.25), transparent 65%),
                    linear-gradient(to top, #001a0a, #002d1a, #003d2a, #002d1a)`,
    yellow: `radial-gradient(circle at 70% 120%, rgba(255, 200, 0, 0.35), transparent 60%),
                    radial-gradient(circle at -10% -20%, rgba(200, 150, 0, 0.25), transparent 65%),
                    linear-gradient(to top, #1a1400, #2d2200, #3d3200, #2d2200)`,
    red: `radial-gradient(circle at 70% 120%, rgba(255, 50,  50, 0.35), transparent 60%),
                    radial-gradient(circle at -10% -20%, rgba(200, 0, 0, 0.25), transparent 65%),
                    linear-gradient(to top, #1a0000, #2d0000, #3d0000, #2d0000)`,
    black: `radial-gradient(circle at 70% 120%, rgba(0, 100, 255, 0.35), transparent 60%),
                    radial-gradient(circle at -10% -20%, rgba(150, 0, 255, 0.25), transparent 65%),
                    linear-gradient(to top, #050014, #080022, #0a0033, #080022)`,
    white: `radial-gradient(circle at 70% 120%, rgba(150, 150, 170, 0.4), transparent 50%),
                    radial-gradient(circle at -10% -20%, rgba(170, 170, 190, 0.3), transparent 55%),
                    linear-gradient(to bottom, #ffffff, #f5f5f5, #e8e8e8, #d0d0d0)`
};

// Presets de cor secundária
const SECONDARY_COLOR_PRESETS = {
    white: "#ffffff",
    black: "#1a1a1a",
    cyan: "#00ffff",
    lime: "#00ff88",
    pink: "#ff69b4",
    orange: "#ff8c00",
    red: "#ff3b30"
};

// Configurações de limite de tokens
const TOKEN_USAGE_KEY = "neo_token_usage";
const DEFAULT_DAILY_TOKEN_LIMIT = 0; // 0 = sem limite
const DEFAULT_RESET_HOUR = 0; // Meia-noite (00:00)
