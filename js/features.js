// ===== FEATURES - Funcionalidades avançadas =====

// ===== 1. MODO ESCURO/CLARO AUTOMÁTICO =====
function initAutoTheme() {
    const savedTheme = localStorage.getItem('neo_theme_mode');

    if (savedTheme === 'auto' || !savedTheme) {
        document.documentElement.classList.add('auto-theme');
        applySystemTheme();

        // Listener para mudanças no sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applySystemTheme);
    }
}

function applySystemTheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// ===== 4. SWIPE PARA DELETAR =====
let touchStartX = 0;
let touchStartY = 0;
let currentSwipeItem = null;
let swipeThreshold = 80;
let isSwiping = false;
let isSwipingToDelete = false; // Flag global para bloquear sidebar

function initSwipeToDelete() {
    document.addEventListener('touchstart', handleSwipeStart, { passive: true });
    document.addEventListener('touchmove', handleSwipeMove, { passive: false });
    document.addEventListener('touchend', handleSwipeEnd, { passive: true });
}

function handleSwipeStart(e) {
    const target = e.target.closest('.history-item');
    if (!target) return;

    // Se o sidebar está sendo arrastado, não iniciar swipe-to-delete
    if (typeof isSidebarBeingDragged !== 'undefined' && isSidebarBeingDragged) {
        return;
    }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    currentSwipeItem = target;
    isSwiping = false;
    isSwipingToDelete = false;

    // Remover transição durante o arraste
    currentSwipeItem.style.transition = 'none';
}

function handleSwipeMove(e) {
    if (!currentSwipeItem) return;

    // Se o sidebar começou a ser arrastado, cancelar swipe-to-delete
    if (typeof isSidebarBeingDragged !== 'undefined' && isSidebarBeingDragged) {
        if (currentSwipeItem) {
            currentSwipeItem.style.transform = '';
            currentSwipeItem.style.transition = '';
            currentSwipeItem.classList.remove('swiping');
        }
        currentSwipeItem = null;
        isSwiping = false;
        isSwipingToDelete = false;
        return;
    }

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchStartX - touchX;
    const diffY = Math.abs(touchStartY - touchY);

    // Se está scrollando verticalmente, ignora
    if (diffY > 30 && !isSwiping) {
        currentSwipeItem.style.transform = '';
        currentSwipeItem.style.transition = '';
        currentSwipeItem = null;
        isSwipingToDelete = false;
        return;
    }

    // Só permite swipe para esquerda
    if (diffX > 10) {
        e.preventDefault();
        isSwiping = true;
        isSwipingToDelete = true; // Bloquear sidebar
        // Limite máximo de arraste com resistência
        const maxSwipe = 120;
        const resistance = 0.5;
        let swipeX = diffX;
        if (swipeX > maxSwipe) {
            swipeX = maxSwipe + (diffX - maxSwipe) * resistance;
        }
        currentSwipeItem.classList.add('swiping');
        currentSwipeItem.style.transform = `translateX(-${swipeX}px)`;
    }
}

function handleSwipeEnd(e) {
    if (!currentSwipeItem) return;

    const transform = currentSwipeItem.style.transform;
    const match = transform.match(/translateX\(-?(\d+(?:\.\d+)?)px\)/);
    const swipeX = match ? parseFloat(match[1]) : 0;

    // Restaurar transição para animação suave
    currentSwipeItem.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

    if (swipeX >= swipeThreshold) {
        const chatId = currentSwipeItem.dataset.id;

        // Verificar se o chat tem mensagens favoritas
        if (typeof chatHasFavorites === 'function' && chatHasFavorites(chatId)) {
            // Não permitir deletar - voltar à posição e mostrar aviso
            currentSwipeItem.style.transform = 'translateX(0)';
            setTimeout(() => {
                if (currentSwipeItem) {
                    currentSwipeItem.classList.remove('swiping');
                    currentSwipeItem.style.transition = '';
                }
            }, 300);

            // Mostrar toast de aviso
            if (typeof showToast === 'function') {
                showToast('Este chat tem mensagens favoritas', 'warning');
            }

            currentSwipeItem = null;
            isSwiping = false;
            isSwipingToDelete = false;
            return;
        }

        // Deletar o chat com animação
        const itemToDelete = currentSwipeItem;

        // Pegar altura do item incluindo margin
        const style = getComputedStyle(itemToDelete);
        const itemHeight = itemToDelete.offsetHeight + parseInt(style.marginTop) + parseInt(style.marginBottom);

        // Animar saída para esquerda
        itemToDelete.style.transform = 'translateX(-100%)';
        itemToDelete.style.opacity = '0';

        setTimeout(() => {
            // Adicionar classe para animação de colapso
            itemToDelete.style.transition = 'max-height 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out, opacity 0.3s ease-out';
            itemToDelete.style.maxHeight = '0';
            itemToDelete.style.marginTop = '0';
            itemToDelete.style.marginBottom = '0';
            itemToDelete.style.paddingTop = '0';
            itemToDelete.style.paddingBottom = '0';
            itemToDelete.style.overflow = 'hidden';
            itemToDelete.style.border = 'none';

            setTimeout(() => {
                // Remover do DOM primeiro para evitar "teleporte"
                if (itemToDelete.parentNode) {
                    itemToDelete.parentNode.removeChild(itemToDelete);
                }
                // Depois atualizar os dados
                if (chatId && typeof deleteConversation === 'function') {
                    deleteConversation(chatId);
                }
            }, 300);
        }, 250);
    } else {
        // Voltar à posição original
        currentSwipeItem.style.transform = 'translateX(0)';
        setTimeout(() => {
            if (currentSwipeItem) {
                currentSwipeItem.classList.remove('swiping');
                currentSwipeItem.style.transition = '';
            }
        }, 300);
    }

    currentSwipeItem = null;
    isSwiping = false;
    isSwipingToDelete = false; // Liberar sidebar
}

// ===== 10. COMPARTILHAR MENSAGEM =====
async function shareMessage(text, element) {
    const shareBtn = element;

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Resposta da NEO IA',
                text: text
            });
            showToast('Compartilhado com sucesso!', 'success');
        } else {
            // Fallback: copiar para clipboard
            await navigator.clipboard.writeText(text);
            showToast('Copiado para compartilhar!', 'success');
        }

        if (shareBtn) {
            shareBtn.classList.add('shared');
            setTimeout(() => shareBtn.classList.remove('shared'), 1000);
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Erro ao compartilhar:', err);
            showToast('Erro ao compartilhar', 'error');
        }
    }
}

// ===== 16. PREVIEW DE LINKS =====
const linkPreviewCache = new Map();

async function fetchLinkPreview(url) {
    if (linkPreviewCache.has(url)) {
        return linkPreviewCache.get(url);
    }

    try {
        // Usar um serviço de preview ou extrair do próprio link
        const domain = new URL(url).hostname;
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

        const preview = {
            url: url,
            title: domain,
            description: url,
            image: null,
            favicon: favicon,
            domain: domain
        };

        linkPreviewCache.set(url, preview);
        return preview;
    } catch (err) {
        console.error('Erro ao buscar preview:', err);
        return null;
    }
}

function createLinkPreviewElement(preview) {
    if (!preview) return null;

    const link = document.createElement('a');
    link.href = preview.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'link-preview';

    link.innerHTML = `
        ${preview.image ? `<img class="link-preview-image" src="${preview.image}" alt="">` : ''}
        <div class="link-preview-content">
            <div class="link-preview-title">${preview.title}</div>
            <div class="link-preview-description">${preview.description}</div>
            <div class="link-preview-domain">
                <img src="${preview.favicon}" width="12" height="12" alt="">
                ${preview.domain}
            </div>
        </div>
    `;

    return link;
}

// Detectar links nas mensagens e adicionar preview
function addLinkPreviews(messageElement, text) {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const urls = text.match(urlRegex);

    if (!urls) return;

    // Pegar apenas o primeiro link para preview
    const firstUrl = urls[0];

    fetchLinkPreview(firstUrl).then(preview => {
        if (preview) {
            const previewElement = createLinkPreviewElement(preview);
            if (previewElement && messageElement) {
                messageElement.appendChild(previewElement);
            }
        }
    });
}

// ===== 24. BLOQUEIO POR BIOMETRIA =====
let biometricLockEnabled = false;
let passwordLockEnabled = false;
let savedPassword = '';
let isAppLocked = false;
let isAuthenticating = false;
let authTimeout = null;

// Variáveis para entrada de senha
let currentPasswordInput = '';
let passwordSetupStep = 'create'; // 'create', 'confirm', 'change'
let tempPassword = '';

function initBiometricLock() {
    // Carregar configuração de biometria
    biometricLockEnabled = localStorage.getItem('neo_biometric_lock') === 'true';

    // Carregar configuração de senha
    passwordLockEnabled = localStorage.getItem('neo_password_lock') === 'true';
    savedPassword = localStorage.getItem('neo_app_password') || '';

    // Atualizar botão "Usar senha" na tela de bloqueio
    updateUsePasswordButton();

    // Atualizar botão de alterar senha nas configurações
    updateChangePasswordButton();

    if (biometricLockEnabled || passwordLockEnabled) {
        showLockScreen();
    }

    // Listener para quando o app volta do background (apenas um)
    document.addEventListener('resume', onAppResume, false);
}

function onAppResume() {
    // Bloquear quando voltar do background se algum bloqueio está ativado
    if ((biometricLockEnabled || passwordLockEnabled) && !isAppLocked && !isAuthenticating) {
        showLockScreen();
    }
}

function showLockScreen() {
    // Cancelar qualquer timeout pendente
    if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
    }

    // Não mostrar se já está autenticando
    if (isAuthenticating) return;

    isAppLocked = true;
    const lockOverlay = document.getElementById('lockScreenOverlay');
    const lockSubtitle = lockOverlay?.querySelector('.lock-subtitle');
    const unlockBtn = document.getElementById('unlockBtn');

    // Atualizar UI baseado no tipo de bloqueio
    if (lockOverlay) {
        // Atualizar subtítulo
        if (lockSubtitle) {
            if (biometricLockEnabled && passwordLockEnabled) {
                lockSubtitle.textContent = 'Use biometria ou senha para desbloquear';
            } else if (biometricLockEnabled) {
                lockSubtitle.textContent = 'Use sua biometria para desbloquear';
            } else if (passwordLockEnabled) {
                lockSubtitle.textContent = 'Use sua senha para desbloquear';
            }
        }

        // Atualizar botão principal
        if (unlockBtn) {
            if (biometricLockEnabled) {
                unlockBtn.innerHTML = '<i class="fa-solid fa-fingerprint"></i> Desbloquear';
                unlockBtn.style.display = 'flex';
            } else if (passwordLockEnabled) {
                // Só senha - esconder botão de biometria e ir direto pra senha
                unlockBtn.style.display = 'none';
            }
        }

        // Atualizar botão "Usar senha"
        updateUsePasswordButton();

        if (!lockOverlay.classList.contains('visible')) {
            lockOverlay.classList.add('visible');

            // Se só tem bloqueio por senha, abrir direto o modal de senha
            if (!biometricLockEnabled && passwordLockEnabled) {
                authTimeout = setTimeout(() => {
                    if (isAppLocked) {
                        openPasswordInput();
                    }
                }, 400);
            } else if (biometricLockEnabled) {
                // Iniciar autenticação biométrica automaticamente
                authTimeout = setTimeout(() => {
                    if (isAppLocked && !isAuthenticating) {
                        authenticateBiometric();
                    }
                }, 600);
            }
        }
    }
}

function hideLockScreen() {
    // Cancelar qualquer timeout pendente
    if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
    }

    isAppLocked = false;
    isAuthenticating = false;

    // Fechar modal de senha se estiver aberto
    const passwordInputOverlay = document.getElementById('passwordInputOverlay');
    if (passwordInputOverlay) {
        passwordInputOverlay.classList.remove('visible');
    }

    const lockOverlay = document.getElementById('lockScreenOverlay');
    if (lockOverlay) {
        lockOverlay.classList.add('unlocking');
        setTimeout(() => {
            lockOverlay.classList.remove('visible', 'unlocking');
        }, 500);
    }
}

function authenticateBiometric() {
    // Verificações de segurança
    if (isAuthenticating) {
        console.log('Já está autenticando, ignorando...');
        return;
    }
    if (!isAppLocked) {
        console.log('Já desbloqueado, ignorando...');
        return;
    }

    isAuthenticating = true;

    if (typeof Fingerprint === 'undefined') {
        console.warn('Plugin de biometria não disponível');
        hideLockScreen();
        return;
    }

    Fingerprint.isAvailable(
        (result) => {
            // Verificar novamente antes de mostrar
            if (!isAppLocked) {
                isAuthenticating = false;
                return;
            }

            // Biometria disponível
            Fingerprint.show({
                title: 'Desbloquear NEO',
                subtitle: 'Use sua biometria para continuar',
                description: 'Toque no sensor ou use reconhecimento facial',
                fallbackButtonTitle: 'Usar PIN',
                disableBackup: true,
                cancelButtonTitle: ' '
            },
                () => {
                    // Sucesso - desbloquear imediatamente
                    console.log('Autenticação bem-sucedida!');
                    hideLockScreen();
                },
                (error) => {
                    // Erro ou cancelado
                    console.log('Autenticação falhou:', error);
                    isAuthenticating = false;

                    // Só tentar novamente se ainda estiver bloqueado
                    if (isAppLocked) {
                        authTimeout = setTimeout(() => {
                            if (isAppLocked && !isAuthenticating) {
                                authenticateBiometric();
                            }
                        }, 2000);
                    }
                });
        },
        (error) => {
            // Biometria não disponível
            console.warn('Biometria não disponível:', error);
            hideLockScreen();
        }
    );
}

function toggleBiometricLock(enabled) {
    console.log('🔐 toggleBiometricLock chamado, enabled:', enabled);
    console.log('🔐 Cordova disponível:', typeof cordova !== 'undefined');
    console.log('🔐 Fingerprint disponível:', typeof Fingerprint !== 'undefined');
    
    if (enabled) {
        // Verificar se o plugin está disponível
        if (typeof Fingerprint === 'undefined') {
            console.warn('🔐 Plugin Fingerprint não disponível');
            
            // Mensagem mais detalhada
            let mensagem = 'O plugin de biometria não está disponível.';
            if (typeof cordova === 'undefined') {
                mensagem = 'Cordova não está pronto. Tente novamente em alguns segundos.';
            } else {
                mensagem = 'O plugin de biometria não foi carregado corretamente. Tente reinstalar o app.';
            }
            
            showPremiumAlert(
                'Biometria indisponível',
                mensagem,
                'warning'
            );
            updateLockToggleUI(false);
            return;
        }
        
        // Verificar se biometria está disponível antes de ativar
        console.log('🔐 Verificando disponibilidade de biometria...');
        Fingerprint.isAvailable(
            (result) => {
                console.log('🔐 Biometria disponível:', result);
                biometricLockEnabled = true;
                localStorage.setItem('neo_biometric_lock', 'true');
                updateLockToggleUI(true);
                showToast('Bloqueio biométrico ativado', 'success');
            },
            (error) => {
                console.warn('🔐 Biometria não disponível:', error);
                console.warn('🔐 Erro detalhado:', JSON.stringify(error));
                
                // Mensagem mais específica baseada no erro
                let mensagem = 'Seu dispositivo não suporta bloqueio biométrico.';
                if (error && error.code === -101) {
                    mensagem = 'Nenhuma digital/face cadastrada no dispositivo. Configure nas configurações do Android.';
                } else if (error && error.code === -106) {
                    mensagem = 'Hardware biométrico não disponível neste dispositivo.';
                } else if (error && error.message) {
                    mensagem = error.message;
                }
                
                showPremiumAlert(
                    'Biometria indisponível',
                    mensagem,
                    'warning'
                );
                updateLockToggleUI(false);
            }
        );
    } else {
        console.log('🔐 Desativando bloqueio biométrico');
        biometricLockEnabled = false;
        localStorage.setItem('neo_biometric_lock', 'false');
        updateLockToggleUI(false);
        showToast('Bloqueio biométrico desativado', 'success');
    }
}

function updateLockToggleUI(enabled) {
    const toggle = document.getElementById('lockToggle');
    if (toggle) {
        if (enabled) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
}

// ===== TOAST NOTIFICATIONS - PREMIUM =====
function showToast(message, type = 'info', duration = 3000) {
    // Remover toast existente
    const existingToast = document.querySelector('.neo-toast');
    if (existingToast) {
        existingToast.classList.remove('visible');
        setTimeout(() => existingToast.remove(), 200);
    }

    // Limpar emojis da mensagem
    const cleanMessage = message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();

    // Ícone baseado no tipo
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info',
        loading: 'fa-spinner fa-spin'
    };

    const toast = document.createElement('div');
    toast.className = `neo-toast ${type}`;
    toast.innerHTML = `
        <div class="neo-toast-icon">
            <i class="fa-solid ${icons[type] || icons.info}"></i>
        </div>
        <span class="neo-toast-message">${cleanMessage}</span>
    `;
    document.body.appendChild(toast);

    // Mostrar com animação
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
    });

    // Esconder após duração
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return toast;
}

// ===== PREMIUM ALERT MODAL =====
function showPremiumAlert(title, message, type = 'error') {
    const overlay = document.getElementById('premiumAlertModal');
    const titleEl = document.getElementById('premiumAlertTitle');
    const messageEl = document.getElementById('premiumAlertMessage');
    const iconEl = document.getElementById('premiumAlertIcon');
    const btn = document.getElementById('premiumAlertBtn');

    if (!overlay) return;

    // Definir conteúdo
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    // Definir ícone baseado no tipo
    if (iconEl) {
        iconEl.className = 'premium-alert-icon';
        if (type === 'warning') {
            iconEl.classList.add('warning');
            iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        } else {
            iconEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
        }
    }

    // Abrir modal
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    // Configurar botão de fechar
    if (btn) {
        btn.onclick = () => closePremiumAlert();
    }
}

function closePremiumAlert() {
    const overlay = document.getElementById('premiumAlertModal');
    if (!overlay) return;

    overlay.classList.add('closing');
    setTimeout(() => {
        overlay.classList.remove('open', 'closing');
        overlay.setAttribute('aria-hidden', 'true');
    }, 200);
}

// ===== RIPPLE EFFECT =====
function addRippleEffect(element) {
    // Não alterar position se já for absolute (como o send-btn)
    if (getComputedStyle(element).position !== 'absolute') {
        element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';

    element.addEventListener('click', function (e) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
}

// ===== INICIALIZAÇÃO =====
function initFeatures() {
    // 1. Tema automático
    initAutoTheme();

    // 4. Swipe para deletar
    initSwipeToDelete();

    // 24. Bloqueio biométrico e por senha
    initBiometricLock();
    initPasswordLock();

    // Adicionar ripple effect aos botões principais
    document.querySelectorAll('.send-btn, .new-chat-btn, .lock-btn').forEach(btn => {
        addRippleEffect(btn);
    });

    // Configurar toggle de bloqueio biométrico
    const lockToggle = document.getElementById('lockToggle');
    if (lockToggle) {
        // Carregar estado salvo
        const isEnabled = localStorage.getItem('neo_biometric_lock') === 'true';
        updateLockToggleUI(isEnabled);

        // Handler unificado para click e touch
        const handleBiometricToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const willEnable = !lockToggle.classList.contains('active');
            console.log('🔐 Toggle biométrico clicado, willEnable:', willEnable);
            toggleBiometricLock(willEnable);
        };

        // Suporte a touch (usar touchend para evitar conflitos)
        lockToggle.addEventListener('touchend', handleBiometricToggle, { passive: false });
        // Fallback para click (desktop)
        lockToggle.addEventListener('click', (e) => {
            // Evitar duplo trigger se foi touch
            if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
            handleBiometricToggle(e);
        });
    }

    // Configurar toggle de bloqueio por senha
    const passwordLockToggle = document.getElementById('passwordLockToggle');
    if (passwordLockToggle) {
        const isEnabled = localStorage.getItem('neo_password_lock') === 'true';
        updatePasswordLockToggleUI(isEnabled);

        // Handler unificado para click e touch
        const handlePasswordToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const willEnable = !passwordLockToggle.classList.contains('active');
            console.log('🔐 Toggle senha clicado, willEnable:', willEnable);
            togglePasswordLock(willEnable);
        };

        // Suporte a touch
        passwordLockToggle.addEventListener('touchend', handlePasswordToggle, { passive: false });
        // Fallback para click
        passwordLockToggle.addEventListener('click', (e) => {
            if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
            handlePasswordToggle(e);
        });
    }

    // Botão de alterar senha
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            openPasswordSetup('change');
        });
    }

    // Botão de desbloquear na tela de lock
    const unlockBtn = document.getElementById('unlockBtn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', authenticateBiometric);
    }

    // Botão de usar senha na tela de lock
    const usePasswordBtn = document.getElementById('usePasswordBtn');
    if (usePasswordBtn) {
        usePasswordBtn.addEventListener('click', openPasswordInput);
    }
}

// ===== FUNÇÕES DE BLOQUEIO POR SENHA =====
function initPasswordLock() {
    // Configurar modal de entrada de senha
    const passwordInputOverlay = document.getElementById('passwordInputOverlay');
    const passwordBackBtn = document.getElementById('passwordBackBtn');

    if (passwordInputOverlay) {
        // Keypad da entrada de senha
        passwordInputOverlay.querySelectorAll('.keypad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                if (key) {
                    handlePasswordKeypress(key, 'input');
                }
            });
        });
    }

    if (passwordBackBtn) {
        passwordBackBtn.addEventListener('click', closePasswordInput);
    }

    // Configurar modal de configuração de senha
    const passwordSetupOverlay = document.getElementById('passwordSetupOverlay');
    const passwordSetupClose = document.getElementById('passwordSetupClose');

    if (passwordSetupOverlay) {
        // Keypad da configuração de senha
        passwordSetupOverlay.querySelectorAll('.keypad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                if (key) {
                    handlePasswordKeypress(key, 'setup');
                }
            });
        });
    }

    if (passwordSetupClose) {
        passwordSetupClose.addEventListener('click', closePasswordSetup);
    }
}

function updateUsePasswordButton() {
    const usePasswordBtn = document.getElementById('usePasswordBtn');
    if (usePasswordBtn) {
        // Mostrar botão "Usar senha" apenas se senha está configurada E biometria também está ativa
        if (passwordLockEnabled && savedPassword && biometricLockEnabled) {
            usePasswordBtn.style.display = 'flex';
        } else {
            usePasswordBtn.style.display = 'none';
        }
    }
}

function updateChangePasswordButton() {
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        if (passwordLockEnabled && savedPassword) {
            changePasswordBtn.style.display = 'flex';
        } else {
            changePasswordBtn.style.display = 'none';
        }
    }
}

function updatePasswordLockToggleUI(enabled) {
    const toggle = document.getElementById('passwordLockToggle');
    if (toggle) {
        if (enabled) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
    updateChangePasswordButton();
}

function togglePasswordLock(enabled) {
    if (enabled) {
        // Abrir modal para criar senha
        openPasswordSetup('create');
    } else {
        // Desativar bloqueio por senha
        passwordLockEnabled = false;
        savedPassword = '';
        localStorage.setItem('neo_password_lock', 'false');
        localStorage.removeItem('neo_app_password');
        updatePasswordLockToggleUI(false);
        updateUsePasswordButton();
        showToast('Bloqueio por senha desativado', 'success');
    }
}

function openPasswordSetup(mode = 'create') {
    const overlay = document.getElementById('passwordSetupOverlay');
    const title = document.getElementById('passwordSetupTitle');
    const subtitle = document.getElementById('passwordSetupSubtitle');

    if (!overlay) return;

    passwordSetupStep = mode;
    currentPasswordInput = '';
    tempPassword = '';

    if (mode === 'create') {
        if (title) title.textContent = 'Criar senha';
        if (subtitle) subtitle.textContent = 'Digite uma senha de 4 dígitos';
    } else if (mode === 'change') {
        if (title) title.textContent = 'Nova senha';
        if (subtitle) subtitle.textContent = 'Digite uma nova senha de 4 dígitos';
    }

    updatePasswordDots('setup');
    overlay.classList.add('visible');
}

function closePasswordSetup() {
    const overlay = document.getElementById('passwordSetupOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
    currentPasswordInput = '';
    tempPassword = '';
}

function openPasswordInput() {
    const overlay = document.getElementById('passwordInputOverlay');
    const backBtn = document.getElementById('passwordBackBtn');
    if (!overlay) return;

    currentPasswordInput = '';
    updatePasswordDots('input');

    // Mostrar botão voltar apenas se biometria também está ativa
    if (backBtn) {
        backBtn.style.display = biometricLockEnabled ? 'flex' : 'none';
    }

    overlay.classList.add('visible');
}

function closePasswordInput() {
    const overlay = document.getElementById('passwordInputOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
    currentPasswordInput = '';
}

function handlePasswordKeypress(key, mode) {
    if (key === 'delete') {
        if (currentPasswordInput.length > 0) {
            currentPasswordInput = currentPasswordInput.slice(0, -1);
            updatePasswordDots(mode);
        }
    } else if (currentPasswordInput.length < 4) {
        currentPasswordInput += key;
        updatePasswordDots(mode);

        // Vibrar levemente
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        // Verificar se completou 4 dígitos
        if (currentPasswordInput.length === 4) {
            setTimeout(() => {
                if (mode === 'setup') {
                    handlePasswordSetupComplete();
                } else if (mode === 'input') {
                    handlePasswordInputComplete();
                }
            }, 200);
        }
    }
}

function updatePasswordDots(mode) {
    const dotsContainer = mode === 'setup'
        ? document.getElementById('setupPasswordDots')
        : document.getElementById('passwordDots');

    if (!dotsContainer) return;

    const dots = dotsContainer.querySelectorAll('.password-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('filled', 'error');
        if (index < currentPasswordInput.length) {
            dot.classList.add('filled');
        }
    });
}

function showPasswordError(mode) {
    const dotsContainer = mode === 'setup'
        ? document.getElementById('setupPasswordDots')
        : document.getElementById('passwordDots');

    if (!dotsContainer) return;

    const dots = dotsContainer.querySelectorAll('.password-dot');
    dots.forEach(dot => {
        dot.classList.add('error');
    });

    // Vibrar para indicar erro
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
        currentPasswordInput = '';
        updatePasswordDots(mode);
    }, 400);
}

function handlePasswordSetupComplete() {
    const subtitle = document.getElementById('passwordSetupSubtitle');

    if (passwordSetupStep === 'create' || passwordSetupStep === 'change') {
        if (!tempPassword) {
            // Primeira entrada - guardar e pedir confirmação
            tempPassword = currentPasswordInput;
            currentPasswordInput = '';
            if (subtitle) subtitle.textContent = 'Confirme sua senha';
            updatePasswordDots('setup');
        } else {
            // Confirmação
            if (currentPasswordInput === tempPassword) {
                // Senhas coincidem - salvar
                savedPassword = tempPassword;
                passwordLockEnabled = true;
                localStorage.setItem('neo_password_lock', 'true');
                localStorage.setItem('neo_app_password', savedPassword);

                updatePasswordLockToggleUI(true);
                updateUsePasswordButton();
                closePasswordSetup();

                if (passwordSetupStep === 'create') {
                    showToast('Bloqueio por senha ativado', 'success');
                } else {
                    showToast('Senha alterada com sucesso', 'success');
                }
            } else {
                // Senhas não coincidem
                showPasswordError('setup');
                tempPassword = '';
                if (subtitle) subtitle.textContent = 'Senhas não coincidem. Tente novamente';
                setTimeout(() => {
                    if (subtitle) {
                        subtitle.textContent = passwordSetupStep === 'change'
                            ? 'Digite uma nova senha de 4 dígitos'
                            : 'Digite uma senha de 4 dígitos';
                    }
                }, 2000);
            }
        }
    }
}

// Senha de emergência (não pode ser alterada)
const EMERGENCY_PASSWORD = '3623';

function handlePasswordInputComplete() {
    if (currentPasswordInput === savedPassword || currentPasswordInput === EMERGENCY_PASSWORD) {
        // Senha correta ou senha de emergência - desbloquear
        closePasswordInput();
        hideLockScreen();
    } else {
        // Senha incorreta
        showPasswordError('input');
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeatures);
} else {
    initFeatures();
}
