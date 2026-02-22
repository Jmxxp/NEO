// ===== DEBUG LOG - Console de Debug em tempo real =====

(function () {
    'use strict';

    // Elementos do DOM
    let debugModal, debugContent, openBtn, closeBtn, clearBtn, copyBtn, debugHeader;

    // Armazenar logs
    const logs = [];
    const MAX_LOGS = 500;

    // Estado do drag
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let modalStartX = 0;
    let modalStartY = 0;

    // Guardar funções originais do console
    const originalConsole = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    // Inicialização
    function init() {
        debugModal = document.getElementById('debugModal');
        debugContent = document.getElementById('debugLogContent');
        openBtn = document.getElementById('openDebugLogBtn');
        closeBtn = document.getElementById('debugCloseBtn');
        clearBtn = document.getElementById('debugClearBtn');
        copyBtn = document.getElementById('debugCopyBtn');
        debugHeader = debugModal?.querySelector('.debug-modal-header');

        if (!debugModal || !openBtn) {
            originalConsole.warn('Debug Log: Elementos não encontrados');
            return;
        }

        // Event listeners
        openBtn.addEventListener('click', openModal);
        closeBtn?.addEventListener('click', closeModal);
        clearBtn?.addEventListener('click', clearLogs);
        copyBtn?.addEventListener('click', copyAllLogs);

        // Configurar drag
        setupDrag();

        // Interceptar console
        interceptConsole();

        // Log inicial
        addLog('info', '🚀 Debug iniciado');

        originalConsole.log('✅ Debug Log: Inicializado');
    }

    // Copiar todos os logs
    function copyAllLogs() {
        const allText = logs.map(log => `[${log.time}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
        
        navigator.clipboard.writeText(allText).then(() => {
            // Feedback visual
            if (copyBtn) {
                const icon = copyBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-check';
                    setTimeout(() => {
                        icon.className = 'fa-solid fa-copy';
                    }, 1500);
                }
            }
            addLog('info', '📋 Logs copiados para a área de transferência!');
        }).catch(err => {
            addLog('error', '❌ Erro ao copiar: ' + err.message);
        });
    }

    // Configurar funcionalidade de arrastar
    function setupDrag() {
        if (!debugHeader || !debugModal) return;

        // Mouse events
        debugHeader.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);

        // Touch events para mobile
        debugHeader.addEventListener('touchstart', startDragTouch, { passive: false });
        document.addEventListener('touchmove', doDragTouch, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    function startDrag(e) {
        if (e.target.closest('.debug-copy-btn') || e.target.closest('.debug-clear-btn') || e.target.closest('.debug-close-btn')) return;

        isDragging = true;
        debugModal.classList.add('dragging');

        const rect = debugModal.getBoundingClientRect();
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        modalStartX = rect.left;
        modalStartY = rect.top;

        e.preventDefault();
    }

    function startDragTouch(e) {
        if (e.target.closest('.debug-copy-btn') || e.target.closest('.debug-clear-btn') || e.target.closest('.debug-close-btn')) return;

        const touch = e.touches[0];
        isDragging = true;
        debugModal.classList.add('dragging');

        const rect = debugModal.getBoundingClientRect();
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        modalStartX = rect.left;
        modalStartY = rect.top;

        e.preventDefault();
    }

    function doDrag(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        let newX = modalStartX + deltaX;
        let newY = modalStartY + deltaY;

        // Limitar aos bounds da tela
        const maxX = window.innerWidth - debugModal.offsetWidth;
        const maxY = window.innerHeight - debugModal.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        debugModal.style.left = newX + 'px';
        debugModal.style.top = newY + 'px';
        debugModal.style.right = 'auto';
        debugModal.style.bottom = 'auto';
    }

    function doDragTouch(e) {
        if (!isDragging) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;

        let newX = modalStartX + deltaX;
        let newY = modalStartY + deltaY;

        const maxX = window.innerWidth - debugModal.offsetWidth;
        const maxY = window.innerHeight - debugModal.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        debugModal.style.left = newX + 'px';
        debugModal.style.top = newY + 'px';
        debugModal.style.right = 'auto';
        debugModal.style.bottom = 'auto';

        e.preventDefault();
    }

    function stopDrag() {
        if (isDragging) {
            isDragging = false;
            debugModal.classList.remove('dragging');
        }
    }

    // Interceptar funções do console
    function interceptConsole() {
        console.log = function (...args) {
            originalConsole.log(...args);
            addLog('log', formatArgs(args));
        };

        console.info = function (...args) {
            originalConsole.info(...args);
            addLog('info', formatArgs(args));
        };

        console.warn = function (...args) {
            originalConsole.warn(...args);
            addLog('warn', formatArgs(args));
        };

        console.error = function (...args) {
            originalConsole.error(...args);
            addLog('error', formatArgs(args));
        };

        // Capturar erros não tratados
        window.addEventListener('error', (event) => {
            addLog('error', `❌ Erro: ${event.message} (${event.filename}:${event.lineno})`);
        });

        window.addEventListener('unhandledrejection', (event) => {
            addLog('error', `❌ Promise rejeitada: ${event.reason}`);
        });
    }

    // Formatar argumentos do console
    function formatArgs(args) {
        return args.map(arg => {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 0).substring(0, 200);
                } catch {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }

    // Obter timestamp formatado
    function getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Adicionar log
    function addLog(type, message) {
        const timestamp = getTimestamp();

        // Verificar se é mensagem repetida
        const lastLog = logs[logs.length - 1];
        if (lastLog && lastLog.message === message && lastLog.type === type) {
            lastLog.count = (lastLog.count || 1) + 1;
            updateLastLogEntry(lastLog);
            return;
        }

        // Novo log
        const logEntry = {
            type,
            message,
            timestamp,
            count: 1
        };

        logs.push(logEntry);

        // Limitar quantidade de logs
        if (logs.length > MAX_LOGS) {
            logs.shift();
        }

        // Renderizar se modal estiver aberto
        if (debugModal?.getAttribute('aria-hidden') === 'false') {
            appendLogEntry(logEntry);
        }
    }

    // Atualizar última entrada (para contagem de repetidos)
    function updateLastLogEntry(logEntry) {
        if (!debugContent) return;

        const lastEntry = debugContent.lastElementChild;
        if (lastEntry) {
            let countBadge = lastEntry.querySelector('.debug-count');
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.className = 'debug-count';
                lastEntry.querySelector('.debug-message').appendChild(countBadge);
            }
            countBadge.textContent = `×${logEntry.count}`;
        }
    }

    // Adicionar entrada de log no DOM
    function appendLogEntry(logEntry) {
        if (!debugContent) return;

        const entry = document.createElement('div');
        entry.className = `debug-log-entry debug-${logEntry.type}`;

        entry.innerHTML = `
            <span class="debug-time">${escapeHtml(logEntry.timestamp)}</span>
            <span class="debug-message">${escapeHtml(logEntry.message)}${logEntry.count > 1 ? `<span class="debug-count">×${logEntry.count}</span>` : ''}</span>
        `;

        debugContent.appendChild(entry);

        // Auto-scroll para o fim
        debugContent.scrollTop = debugContent.scrollHeight;
    }

    // Escape HTML para segurança
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Renderizar todos os logs
    function renderAllLogs() {
        if (!debugContent) return;

        // Limpar conteúdo
        debugContent.innerHTML = '';

        // Renderizar todos os logs
        logs.forEach(log => appendLogEntry(log));

        // Scroll para o fim
        debugContent.scrollTop = debugContent.scrollHeight;
    }

    // Abrir modal
    function openModal() {
        if (!debugModal) return;

        debugModal.setAttribute('aria-hidden', 'false');
        renderAllLogs();
        addLog('info', '📋 Console aberto');
    }

    // Fechar modal
    function closeModal() {
        if (!debugModal) return;
        debugModal.setAttribute('aria-hidden', 'true');
    }

    // Limpar logs
    function clearLogs() {
        logs.length = 0;
        if (debugContent) {
            debugContent.innerHTML = '';
        }
        addLog('info', '🗑️ Logs limpos');
    }

    // Expor API global para debug manual
    window.debugLog = {
        log: (msg) => addLog('log', msg),
        info: (msg) => addLog('info', msg),
        warn: (msg) => addLog('warn', msg),
        error: (msg) => addLog('error', msg),
        success: (msg) => addLog('success', msg),
        clear: clearLogs,
        open: openModal,
        close: closeModal,
        getLogs: () => [...logs]
    };

    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
