// ===== HEALTH FORM - Sistema de formulário premium para Especialista da Saúde =====

/**
 * Detecta se há um bloco [HEALTH_FORM] incompleto (streaming)
 */
function hasIncompleteHealthForm(text) {
    if (!text) return false;
    
    // Verifica se tem abertura sem fechamento
    const hasOpening = text.includes('[HEALTH_FORM]');
    const hasClosing = text.includes('[/HEALTH_FORM]');
    
    return hasOpening && !hasClosing;
}

/**
 * Remove blocos incompletos e retorna placeholder de streaming
 */
function handleStreamingHealthForm(text) {
    if (!text) return { cleanedText: text, isStreaming: false };
    
    if (hasIncompleteHealthForm(text)) {
        // Encontrar onde começa o bloco incompleto
        const startIndex = text.indexOf('[HEALTH_FORM]');
        const beforeBlock = text.substring(0, startIndex);
        
        return {
            cleanedText: beforeBlock + '\n%%%HEALTH_FORM_STREAMING%%%\n',
            isStreaming: true
        };
    }
    
    return { cleanedText: text, isStreaming: false };
}

/**
 * Extrai blocos [HEALTH_FORM] do texto e retorna dados estruturados
 */
function extractHealthFormBlocks(text) {
    if (!text) return { cleanedText: text, forms: [], isStreaming: false };
    
    // Primeiro verificar se está em streaming
    const streamingCheck = handleStreamingHealthForm(text);
    if (streamingCheck.isStreaming) {
        return { 
            cleanedText: streamingCheck.cleanedText, 
            forms: [],
            isStreaming: true
        };
    }
    
    const forms = [];
    let cleanedText = text;
    
    // Regex para encontrar blocos [HEALTH_FORM]...[/HEALTH_FORM]
    const formRegex = /\[HEALTH_FORM\]([\s\S]*?)\[\/HEALTH_FORM\]/gi;
    
    let match;
    while ((match = formRegex.exec(text)) !== null) {
        const formContent = match[1];
        const questions = [];
        
        // Extrair perguntas [Q]...[/Q]
        const questionRegex = /\[Q\]([\s\S]*?)\[\/Q\]/gi;
        let qMatch;
        let qIndex = 0;
        
        while ((qMatch = questionRegex.exec(formContent)) !== null) {
            questions.push({
                id: `health-q-${Date.now()}-${qIndex}`,
                text: qMatch[1].trim(),
                answer: ''
            });
            qIndex++;
        }
        
        if (questions.length > 0) {
            const formId = `health-form-${Date.now()}-${forms.length}`;
            forms.push({
                id: formId,
                questions: questions
            });
            
            // Substituir bloco por marcador
            cleanedText = cleanedText.replace(match[0], `\n%%%HEALTH_FORM_${formId}%%%\n`);
        }
    }
    
    return { cleanedText, forms, isStreaming: false };
}

/**
 * Escape HTML para evitar XSS
 */
function escapeHtmlHealthForm(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Remove pontuação final das perguntas (., ?, :)
 */
function cleanQuestionText(text) {
    if (!text) return '';
    // Remove pontos, interrogações e dois-pontos do final
    return text.replace(/[.?:]+$/g, '').trim();
}

/**
 * Cria o HTML do formulário premium
 */
function createHealthFormCard(formData) {
    const container = document.createElement('div');
    container.className = 'health-form-container';
    container.id = formData.id;
    
    container.innerHTML = `
        <div class="health-form-card">
            <div class="health-form-header">
                <div class="health-form-icon">
                    <i class="fa-solid fa-clipboard-question"></i>
                </div>
                <div class="health-form-title">
                    <span class="health-form-title-text">Questionário de Saúde</span>
                    <span class="health-form-subtitle">Responda para uma análise mais precisa</span>
                </div>
            </div>
            <div class="health-form-body">
                ${formData.questions.map((q, idx) => `
                    <div class="health-form-question" data-question-id="${q.id}">
                        <label class="health-form-label">
                            <span class="health-form-number">${idx + 1}</span>
                            <span class="health-form-question-text">${escapeHtmlHealthForm(cleanQuestionText(q.text))}</span>
                        </label>
                        <textarea 
                            class="health-form-input" 
                            placeholder="Digite sua resposta"
                            rows="2"
                            data-question-id="${q.id}"
                        ></textarea>
                    </div>
                `).join('')}
            </div>
            <div class="health-form-footer">
                <div class="health-form-tip">
                    <i class="fa-solid fa-lightbulb"></i>
                    <span>Quanto mais detalhes, melhor a análise</span>
                </div>
                <button type="button" class="health-form-submit" onclick="submitHealthForm('${formData.id}')">
                    <i class="fa-solid fa-stethoscope"></i>
                    <span>Analisar</span>
                </button>
            </div>
        </div>
    `;
    
    // Guardar dados das perguntas no elemento
    container._formData = formData;
    
    return container;
}

/**
 * Submete o formulário de saúde - coleta respostas e envia
 */
window.submitHealthForm = function(formId) {
    const container = document.getElementById(formId);
    if (!container) {
        console.error('Formulário não encontrado:', formId);
        return;
    }
    
    const formData = container._formData;
    if (!formData) {
        console.error('Dados do formulário não encontrados');
        return;
    }
    
    // Coletar respostas
    const answers = [];
    let hasEmptyAnswers = false;
    
    formData.questions.forEach(q => {
        const textarea = container.querySelector(`textarea[data-question-id="${q.id}"]`);
        const answer = textarea ? textarea.value.trim() : '';
        
        if (!answer) {
            hasEmptyAnswers = true;
            if (textarea) {
                textarea.classList.add('health-form-input-error');
                setTimeout(() => textarea.classList.remove('health-form-input-error'), 2000);
            }
        }
        
        answers.push({
            question: q.text,
            answer: answer || '(não respondido)'
        });
    });
    
    // Permitir envio mesmo com campos vazios, mas avisar
    if (hasEmptyAnswers) {
        // Vibrar se disponível
        if (typeof vibrateOnClick === 'function') vibrateOnClick();
    }
    
    // Construir mensagem formatada
    let message = '📋 **Respostas do questionário:**\n\n';
    answers.forEach((a, idx) => {
        message += `**${idx + 1}. ${a.question}**\n${a.answer}\n\n`;
    });
    
    // Desabilitar formulário após envio
    const submitBtn = container.querySelector('.health-form-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analisando...';
    }
    
    // Desabilitar inputs
    container.querySelectorAll('.health-form-input').forEach(input => {
        input.disabled = true;
        input.classList.add('submitted');
    });
    
    // Adicionar classe de enviado
    container.classList.add('health-form-submitted');
    
    // Enviar mensagem
    if (typeof sendMessageProgrammatically === 'function') {
        sendMessageProgrammatically(message);
    } else if (typeof input !== 'undefined' && typeof form !== 'undefined') {
        // Fallback: usar input padrão
        input.value = message;
        form.dispatchEvent(new Event('submit'));
    } else {
        // Último fallback: chamar função de chat
        if (typeof sendMessage === 'function') {
            sendMessage(message);
        } else {
            console.error('Nenhuma função de envio disponível');
        }
    }
    
    // Vibrar feedback
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
};

/**
 * Função auxiliar para enviar mensagem programaticamente
 */
window.sendMessageProgrammatically = function(text) {
    const inputEl = document.getElementById('user-input');
    const formEl = document.getElementById('chat-form');
    
    if (inputEl && formEl) {
        inputEl.value = text;
        
        // Disparar evento de input para atualizar estado
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Submeter formulário
        setTimeout(() => {
            formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }, 100);
    }
};

/**
 * Renderiza formulários de saúde pendentes
 */
function renderHealthForms(forms) {
    if (!forms || forms.length === 0) return;
    
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    forms.forEach(formData => {
        // Buscar placeholder
        const placeholder = messagesContainer.querySelector(`[data-health-form-id="${formData.id}"]`);
        
        if (placeholder && !placeholder.classList.contains('health-form-rendered')) {
            placeholder.classList.add('health-form-rendered');
            const card = createHealthFormCard(formData);
            placeholder.replaceWith(card);
        } else {
            // Tentar encontrar pelo marcador de texto
            const allBubbles = messagesContainer.querySelectorAll('.message-bubble');
            allBubbles.forEach(bubble => {
                if (bubble.innerHTML.includes(`%%%HEALTH_FORM_${formData.id}%%%`)) {
                    const card = createHealthFormCard(formData);
                    bubble.innerHTML = bubble.innerHTML.replace(
                        new RegExp(`(<p>)?%%%HEALTH_FORM_${formData.id}%%%(<\\/p>)?`, 'g'),
                        ''
                    );
                    bubble.appendChild(card);
                }
            });
        }
    });
}

// Armazenar formulários pendentes para renderização
let pendingHealthForms = [];

/**
 * Cria HTML do placeholder de streaming animado
 */
function createStreamingPlaceholder() {
    return `<div class="health-form-streaming">
        <div class="health-form-streaming-icon">
            <i class="fa-solid fa-stethoscope"></i>
        </div>
        <div class="health-form-streaming-text">
            Preparando questionário de saúde<span class="health-form-text-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
        <div class="health-form-streaming-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>`;
}

/**
 * Hook para o formatMarkdown - processa formulários de saúde
 * Aplicado após DOMContentLoaded para garantir que formatMarkdown original existe
 */
let healthFormHookApplied = false;

function applyHealthFormHook() {
    if (healthFormHookApplied) return;
    if (typeof formatMarkdown !== 'function') {
        console.warn('⚠️ Health Form: formatMarkdown não encontrado, tentando novamente...');
        setTimeout(applyHealthFormHook, 100);
        return;
    }
    
    healthFormHookApplied = true;
    const originalFormatMarkdown = formatMarkdown;
    
    window.formatMarkdown = function(text, bubbleElement = null) {
        if (!text) return "";
        
        // Extrair formulários de saúde ANTES do processamento markdown
        const healthData = extractHealthFormBlocks(text);
        let processedText = healthData.cleanedText;
        
        // Processar com formatMarkdown original
        let html = originalFormatMarkdown(processedText, bubbleElement);
        
        // Se está em streaming, mostrar placeholder animado
        if (healthData.isStreaming) {
            html = html.replace(
                /(<p>)?%%%HEALTH_FORM_STREAMING%%%(<\/p>)?/g,
                createStreamingPlaceholder()
            );
        }
        
        // Converter marcadores para placeholders HTML
        healthData.forms.forEach(formData => {
            html = html.replace(
                new RegExp(`(<p>)?%%%HEALTH_FORM_${formData.id}%%%(<\\/p>)?`, 'g'),
                `<div class="health-form-placeholder" data-health-form-id="${formData.id}"></div>`
            );
        });
        
        // Agendar renderização dos formulários
        if (healthData.forms.length > 0) {
            pendingHealthForms = [...pendingHealthForms, ...healthData.forms];
            setTimeout(() => {
                renderHealthForms(pendingHealthForms);
                pendingHealthForms = [];
            }, 250);
        }
        
        return html;
    };
    
    console.log('✅ Health Form hook aplicado com sucesso');
}

// Aplicar hook quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyHealthFormHook);
} else {
    // DOM já carregou, aplicar após um pequeno delay para garantir que utils.js já definiu formatMarkdown
    setTimeout(applyHealthFormHook, 50);
}

// Exportar funções
window.extractHealthFormBlocks = extractHealthFormBlocks;
window.createHealthFormCard = createHealthFormCard;
window.renderHealthForms = renderHealthForms;
window.hasIncompleteHealthForm = hasIncompleteHealthForm;
window.createStreamingPlaceholder = createStreamingPlaceholder;

console.log('✅ Health Form system loaded');
