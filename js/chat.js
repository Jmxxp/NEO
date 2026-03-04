// ===== CHAT - Gerenciamento de conversas =====

// Estado do chat
let conversations = [];
let currentConversationId = null;
let historyFilterText = "";
let highlightQuery = "";
let isSending = false;
let editingIndex = null;
let abortController = null;
let stopTyping = null;
let thinkingRow = null;
let settingsHistoryFlag = false;
let chatsHistoryFlag = false;
let exitingApp = false;

// ===== BOTÃO DE ENVIO =====
function setSendButtonState(mode) {
    const sendBtn = document.getElementById('sendBtn');
    const sendArrowIcon = sendBtn ? sendBtn.querySelector('.send-arrow-icon') : null;

    if (!sendBtn || !sendArrowIcon) return;

    if (mode === "stop") {
        // Mostrar ícone de stop
        sendArrowIcon.className = "fa-solid fa-stop send-arrow-icon";
        sendArrowIcon.style.transform = "translate(0, 0)";
        sendBtn.setAttribute("aria-label", "Parar resposta");
        sendBtn.setAttribute("title", "Parar resposta");
        sendBtn.classList.add("stop-mode");
        sendBtn.setAttribute("type", "button");
    } else {
        // Restaurar estado normal - mostrar seta de enviar
        sendArrowIcon.className = "fa-solid fa-location-arrow send-arrow-icon";
        sendArrowIcon.style.transform = "translate(-1px, 1px)";
        sendBtn.classList.remove("stop-mode");
        sendBtn.setAttribute("aria-label", "Enviar mensagem");
        sendBtn.setAttribute("title", "Enviar mensagem");
        sendBtn.setAttribute("type", "submit");
    }
}

function stopGeneration() {
    if (abortController) {
        try {
            abortController.abort();
        } catch (e) {
            console.warn("Falha ao abortar requisição:", e);
        }
    }

    // Parar geração do modelo local (llama.cpp nativo)
    if (typeof window.stopLocalLlmGeneration === 'function') {
        window.stopLocalLlmGeneration();
    }

    if (typeof window.cancelAgentUI === 'function') {
        window.cancelAgentUI();
    }

    removeThinkingIndicator();
    
    // Remover indicadores de processamento local/nativo dos bubbles
    document.querySelectorAll('.local-thinking-indicator').forEach(el => {
        const bubble = el.closest('.message-bubble');
        if (bubble) {
            bubble.innerHTML = '*(Geração cancelada)*';
        }
    });

    isSending = false;
    abortController = null;
    setSendButtonState("send");

    // Notificar que geração terminou (para modo background)
    if (typeof window.onGenerationComplete === 'function') {
        window.onGenerationComplete();
    }
}

// ===== INDICADOR DE PENSANDO =====
function showThinkingIndicator() {
    if (thinkingRow) return;
    const row = document.createElement("div");
    row.classList.add("message-row", "ai", "thinking-row");

    const indicator = document.createElement("div");
    indicator.classList.add("thinking-indicator");
    indicator.innerHTML = `
        <span class="thinking-text">Pensando</span>
        <div class="thinking-wave">
            <div class="thinking-bar"></div>
            <div class="thinking-bar"></div>
            <div class="thinking-bar"></div>
            <div class="thinking-bar"></div>
            <div class="thinking-bar"></div>
        </div>
    `;

    row.appendChild(indicator);
    messagesEl.appendChild(row);
    thinkingRow = row;
    scrollMessagesToBottom();
}

function removeThinkingIndicator() {
    if (thinkingRow && thinkingRow.parentNode) {
        thinkingRow.parentNode.removeChild(thinkingRow);
    }
    thinkingRow = null;
}

// ===== RENDERIZAÇÃO =====
function renderFavorites() {
    const favoritesList = document.getElementById("favoritesList");
    if (!favoritesList) return;

    const favorites = loadFavorites();
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        const emptyMsg = document.createElement("li");
        emptyMsg.classList.add("favorites-empty");
        emptyMsg.textContent = "Nenhuma mensagem favorita";
        favoritesList.appendChild(emptyMsg);
        return;
    }

    favorites.slice().reverse().forEach(fav => {
        const li = document.createElement("li");
        li.classList.add("favorite-item");
        li.dataset.messageId = fav.messageId;
        li.dataset.chatId = fav.chatId;

        // Se é uma imagem gerada, mostrar preview
        if (fav.isImageGeneration && fav.generatedImageUrl) {
            li.classList.add("favorite-item-image");

            const imgPreview = document.createElement("div");
            imgPreview.classList.add("favorite-image-preview");
            imgPreview.innerHTML = `<img src="${fav.generatedImageUrl}" alt="Imagem gerada" />`;
            li.appendChild(imgPreview);

            const contentDiv = document.createElement("div");
            contentDiv.classList.add("favorite-item-content");

            const textDiv = document.createElement("div");
            textDiv.classList.add("favorite-item-text");
            textDiv.innerHTML = `<i class="fa-solid fa-image" style="margin-right: 6px; color: var(--accent-color);"></i>${fav.generatedPrompt || 'Imagem gerada'}`;
            contentDiv.appendChild(textDiv);

            const chatDiv = document.createElement("div");
            chatDiv.classList.add("favorite-item-chat");
            chatDiv.textContent = fav.chatTitle;
            contentDiv.appendChild(chatDiv);

            li.appendChild(contentDiv);
        } else {
            const contentDiv = document.createElement("div");
            contentDiv.classList.add("favorite-item-content");

            const textDiv = document.createElement("div");
            textDiv.classList.add("favorite-item-text");
            textDiv.textContent = fav.text.replace(/[#*`_~\[\]]/g, '').substring(0, 100);
            contentDiv.appendChild(textDiv);

            const chatDiv = document.createElement("div");
            chatDiv.classList.add("favorite-item-chat");
            chatDiv.textContent = fav.chatTitle;
            contentDiv.appendChild(chatDiv);

            li.appendChild(contentDiv);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-favorite-btn");
        deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFavorite(fav.messageId);
        });
        li.appendChild(deleteBtn);

        li.addEventListener("click", () => {
            goToFavoriteMessage(fav.chatId, fav.messageId);
        });

        favoritesList.appendChild(li);
    });
}

function goToFavoriteMessage(chatId, messageId) {
    if (chatsHistoryFlag) {
        history.back();
        chatsHistoryFlag = false;
    } else {
        document.body.classList.remove("chats-open");
    }

    if (chatId && chatId !== currentConversationId) {
        const conv = conversations.find(c => c.id === chatId);
        if (conv) {
            currentConversationId = chatId;
            editingIndex = null;
            document.body.classList.remove('editing-message');
        }
    }

    renderHistory();
    renderMessages();

    setTimeout(() => {
        const msgElements = document.querySelectorAll('.message-row.ai');
        msgElements.forEach(row => {
            const favBtn = row.querySelector(`.favorite-btn[data-message-id="${messageId}"]`);
            if (favBtn) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.transition = 'background 0.3s ease';
                row.style.background = 'rgba(255, 215, 0, 0.1)';
                setTimeout(() => {
                    row.style.background = '';
                }, 2000);
            }
        });
    }, 100);
}

function renderMessages() {
    const conv = conversations.find(c => c.id === currentConversationId);
    messagesEl.innerHTML = "";
    if (!conv) return;

    if (textElement) {
        if (conv.messages.length > 0) {
            stopTypingEffect();
            textElement.classList.add("hidden");
            // Esconder cards de sugestão quando há mensagens
            if (typeof hideSuggestionCards === 'function') {
                hideSuggestionCards();
            }
        } else {
            textElement.classList.remove("hidden");
        }
    }

    conv.messages.forEach((msg, index) => {
        const row = document.createElement("div");
        row.classList.add("message-row");
        row.classList.add(msg.role === "user" ? "user" : "ai");

        // Marcar se a mensagem foi enviada com busca web
        if (msg.role === "user" && msg.webSearch) {
            row.classList.add("web-search");
        }
        // Marcar se foi enviada com modo agente
        if (msg.role === "user" && msg.agentMode) {
            row.classList.add("agent-mode");
        }
        // Marcar se foi enviada com modo gerar imagem
        if (msg.role === "user" && msg.imageGenMode) {
            row.classList.add("image-gen-mode");
        }

        if (msg.role === "user" && index === editingIndex) {
            row.classList.add("editing");
        }

        // Só criar balão de texto se tiver texto
        // Para IA, sempre criar o balão pois ele será preenchido pelo stream
        // Para usuário, não mostrar balão vazio se só tem anexos
        const hasText = msg.text && msg.text.trim().length > 0;
        const hasPDFs = msg.pdfAttachments && msg.pdfAttachments.length > 0;
        const hasImages = msg.imageAttachments && msg.imageAttachments.length > 0;
        const hasAttachments = hasPDFs || hasImages;
        const shouldShowBubble = msg.role === "ai" || (msg.role === "user" && hasText);

        if (shouldShowBubble) {
            // Se é uma resposta do agente com passos salvos, renderizar UI do agente
            if (msg.isAgentResponse && msg.agentSteps && msg.agentSteps.length > 0) {
                const agentUI = renderAgentResponseUI(msg.agentSteps, msg.text);
                row.appendChild(agentUI);
            } else {
                // ===== CARROSSEL DE IMAGENS DO TÓPICO (para mensagens da IA) =====
                if (msg.role === "ai" && msg.topicImagesHtml) {
                    const imagesContainer = document.createElement('div');
                    imagesContainer.innerHTML = msg.topicImagesHtml;
                    const carousel = imagesContainer.firstElementChild;
                    if (carousel) {
                        row.appendChild(carousel);
                    }
                }
                // ===== FIM CARROSSEL =====
                
                const bubble = document.createElement("div");
                bubble.classList.add("message-bubble");
                let text = msg.text || "";
                if (highlightQuery) {
                    const regex = new RegExp(`(${highlightQuery})`, 'gi');
                    text = text.replace(regex, '<mark>$1</mark>');
                }

                // Se é uma mensagem de geração de imagem, preservar HTML ou regenerar
                if (msg.isImageGeneration) {
                    console.log('[Chat] Renderizando mensagem de imagem:', {
                        hasImageUrl: !!msg.generatedImageUrl,
                        hasStorageId: !!msg.imageStorageId,
                        hasStoredImage: msg.hasStoredImage,
                        provider: msg.imageProvider
                    });
                    
                    // Se temos os dados salvos, regenerar o HTML fresco
                    if (msg.generatedImageUrl && msg.generatedPrompt) {
                        const result = {
                            success: true,
                            imageUrl: msg.generatedImageUrl,
                            prompt: msg.generatedPrompt,
                            provider: msg.imageProvider || 'Gemini',
                            width: 768,
                            height: 768,
                            seed: 'salvo'
                        };
                        // Usar a função correta baseada no provider
                        if (msg.imageProvider && (msg.imageProvider.includes('gemini') || msg.imageProvider.includes('imagen'))) {
                            bubble.innerHTML = typeof displayGoogleGeneratedImage === 'function' 
                                ? displayGoogleGeneratedImage(result) 
                                : displayGeneratedImage(result);
                        } else {
                            bubble.innerHTML = displayGeneratedImage(result);
                        }
                    } else if (msg.imageStorageId || msg.hasStoredImage) {
                        // Carregar do IndexedDB
                        console.log('[Chat] Carregando imagem do IndexedDB:', msg.imageStorageId);
                        bubble.innerHTML = '<div class="loading-image"><i class="fas fa-spinner fa-spin"></i> Carregando imagem...</div>';
                        
                        const storageId = msg.imageStorageId;
                        const msgProvider = msg.imageProvider || 'gemini';
                        const msgPrompt = msg.generatedPrompt || '';
                        
                        // Carregar assincronamente
                        if (typeof ImageStorage !== 'undefined' && storageId) {
                            ImageStorage.getImage(storageId).then(imgData => {
                                console.log('[Chat] Imagem recuperada do IndexedDB:', imgData ? 'sucesso' : 'não encontrada');
                                if (imgData && imgData.imageUrl) {
                                    const result = {
                                        success: true,
                                        imageUrl: imgData.imageUrl,
                                        prompt: imgData.prompt || msgPrompt,
                                        provider: imgData.provider || msgProvider
                                    };
                                    if (result.provider && (result.provider.includes('gemini') || result.provider.includes('imagen'))) {
                                        bubble.innerHTML = typeof displayGoogleGeneratedImage === 'function' 
                                            ? displayGoogleGeneratedImage(result) 
                                            : displayGeneratedImage(result);
                                    } else {
                                        bubble.innerHTML = displayGeneratedImage(result);
                                    }
                                } else {
                                    bubble.innerHTML = '<p class="error">❌ Imagem não encontrada no armazenamento</p>';
                                }
                            }).catch(err => {
                                console.error('[Chat] Erro ao carregar imagem:', err);
                                bubble.innerHTML = '<p class="error">❌ Erro ao carregar imagem</p>';
                            });
                        }
                    } else {
                        bubble.innerHTML = text;
                    }
                } else {
                    bubble.innerHTML = formatMarkdown(text);
                }

                if (msg.role === "user") {
                    bubble.style.cursor = "pointer";
                    bubble.addEventListener("click", () => startEditingMessage(index));
                }

                row.appendChild(bubble);
            }
        }

        // Adicionar balões de PDF se houver anexos (suporta múltiplos)
        if (msg.role === "user" && msg.pdfAttachments && msg.pdfAttachments.length > 0) {
            const container = createPDFBubblesContainer(msg.pdfAttachments);
            row.appendChild(container);
        }
        // Compatibilidade com formato antigo (único PDF)
        else if (msg.role === "user" && msg.pdfAttachment) {
            const pdfBubble = createPDFBubble(msg.pdfAttachment);
            row.appendChild(pdfBubble);
        }

        // Adicionar miniaturas de imagens se houver anexos
        if (msg.role === "user" && msg.imageAttachments && msg.imageAttachments.length > 0) {
            const imageContainer = createImageBubblesContainer(msg.imageAttachments);
            row.appendChild(imageContainer);
        }

        if (msg.role === "ai") {
            const copyRow = document.createElement("div");
            copyRow.classList.add("copy-row");

            const copyBtn = document.createElement("button");
            copyBtn.type = "button";
            copyBtn.classList.add("copy-btn");
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i><span>copiar</span>';

            copyBtn.addEventListener("click", () => {
                // Remover formatação markdown do texto
                const textToCopy = stripMarkdownFormatting(msg.text || "");
                if (!navigator.clipboard) {
                    const tmp = document.createElement("textarea");
                    tmp.value = textToCopy;
                    tmp.style.position = "fixed";
                    tmp.style.left = "-9999px";
                    document.body.appendChild(tmp);
                    tmp.select();
                    document.execCommand("copy");
                    document.body.removeChild(tmp);
                } else {
                    navigator.clipboard.writeText(textToCopy).catch(err => console.error(err));
                }
                copyBtn.classList.add("copied");
                setTimeout(() => {
                    copyBtn.classList.remove("copied");
                }, 900);
            });

            copyRow.appendChild(copyBtn);

            // Botão de favoritar
            if (msg.id) {
                const favBtn = document.createElement("button");
                favBtn.type = "button";
                favBtn.classList.add("favorite-btn");
                favBtn.dataset.messageId = msg.id;

                const isFav = isFavorited(msg.id);
                if (isFav) {
                    favBtn.classList.add("favorited");
                    favBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
                    favBtn.title = "Remover dos favoritos";
                } else {
                    favBtn.innerHTML = '<i class="fa-regular fa-star"></i>';
                    favBtn.title = "Adicionar aos favoritos";
                }

                favBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    // Passar dados da imagem gerada se houver
                    const imageData = msg.isImageGeneration ? {
                        imageUrl: msg.generatedImageUrl,
                        prompt: msg.generatedPrompt
                    } : null;
                    toggleFavorite(msg.id, msg.text, conv.id, conv.title, imageData);
                });

                copyRow.appendChild(favBtn);
            }

            // Botão de memória
            if (msg.id) {
                const mems = getMemoriesForMessage(msg.id);
                const hasMemoryChanges = msg.memoryChanges && msg.memoryChanges.length > 0;
                const hadMemory = msg.hadMemory || mems.length > 0 || hasMemoryChanges;

                if (hadMemory) {
                    const memBtn = document.createElement("button");
                    memBtn.type = "button";
                    memBtn.classList.add("memory-btn");

                    if (hasMemoryChanges || mems.length > 0) {
                        memBtn.innerHTML = '<i class="fa-solid fa-sd-card" style="color: #f0c040;"></i>';
                        memBtn.title = "Ver memória salva desta resposta";
                        memBtn.addEventListener("click", (e) => {
                            e.stopPropagation();
                            // Priorizar memoryChanges (novo sistema) sobre mems (sistema antigo)
                            if (hasMemoryChanges) {
                                openMemoryChangesModal(msg.memoryChanges);
                            } else if (mems.length > 0) {
                                openMemoryModal(mems[0]);
                            }
                        });
                    } else {
                        memBtn.innerHTML = '<i class="fa-solid fa-sd-card" style="opacity: 0.4;"></i>';
                        memBtn.title = "Memória desta resposta foi removida";
                        memBtn.style.cursor = "default";
                        memBtn.disabled = true;
                    }

                    copyRow.appendChild(memBtn);
                }
            }

            row.appendChild(copyRow);
        }

        // ===== BOTÃO "CONFIGURAR IA" PARA ERROS DE API KEY =====
        if (msg.needsApiKeyButton) {
            const configBtnContainer = document.createElement("div");
            configBtnContainer.classList.add("config-api-btn-container");
            
            const configBtn = document.createElement("button");
            configBtn.type = "button";
            configBtn.classList.add("config-api-btn");
            configBtn.innerHTML = '<i class="fa-solid fa-key"></i> Configurar IA';
            
            configBtn.addEventListener("click", () => {
                // Abrir a sidebar de configuração de IA
                if (typeof openLocalLlmModal === 'function') {
                    openLocalLlmModal();
                } else if (typeof openSettings === 'function') {
                    openSettings();
                }
            });
            
            configBtnContainer.appendChild(configBtn);
            row.appendChild(configBtnContainer);
        }

        messagesEl.appendChild(row);
    });

    scrollMessagesToBottom();
}

function renderHistory() {
    historyList.innerHTML = "";
    const q = (historyFilterText || "").toLowerCase();

    // Filtrar conversas temporárias E conversas vazias (sem mensagens)
    const visibleConversations = conversations.filter(c => 
        !c.isTemporary && c.messages && c.messages.length > 0
    );

    visibleConversations.slice().reverse().forEach(conv => {
        let matches = false;
        let snippet = "";

        if (q) {
            const inTitle = (conv.title || "").toLowerCase().includes(q);
            const matchingMsgs = (conv.messages || []).filter(m => (m.text || "").toLowerCase().includes(q));
            matches = inTitle || matchingMsgs.length > 0;
            if (matches && matchingMsgs.length > 0) {
                const firstMatch = matchingMsgs[0].text;
                const idx = firstMatch.toLowerCase().indexOf(q);
                const start = Math.max(0, idx - 20);
                const end = Math.min(firstMatch.length, idx + q.length + 20);
                snippet = "..." + firstMatch.slice(start, end) + "...";
                const regex = new RegExp(`(${q})`, 'gi');
                snippet = snippet.replace(regex, '<mark>$1</mark>');
            }
        } else {
            matches = true;
        }

        if (!matches) return;

        const li = document.createElement("li");
        li.classList.add("history-item");
        if (conv.id === currentConversationId) {
            li.classList.add("active");
        }
        if (conv.isVoiceCall) {
            li.classList.add("voice-call-chat");
        }
        li.dataset.id = conv.id;

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("history-item-content");

        const titleDiv = document.createElement("div");
        titleDiv.classList.add("history-item-title");

        // Ícone de telefone para chamadas de voz
        if (conv.isVoiceCall) {
            const phoneIcon = document.createElement("i");
            phoneIcon.className = "fa-solid fa-phone history-item-phone";
            titleDiv.appendChild(phoneIcon);
        }

        // Ícone de agente para chats com respostas do agente
        const hasAgentResponse = conv.messages && conv.messages.some(m => m.isAgentResponse);
        if (hasAgentResponse) {
            const agentIcon = document.createElement("i");
            agentIcon.className = "fa-solid fa-code-branch history-item-agent";
            titleDiv.appendChild(agentIcon);
        }

        if (chatHasFavorites(conv.id)) {
            const starIcon = document.createElement("i");
            starIcon.className = "fa-solid fa-star history-item-star";
            titleDiv.appendChild(starIcon);
        }

        const titleText = document.createTextNode(conv.title || "Chat sem título");
        titleDiv.appendChild(titleText);
        contentDiv.appendChild(titleDiv);

        if (snippet) {
            const subtitleDiv = document.createElement("div");
            subtitleDiv.classList.add("history-item-subtitle");
            subtitleDiv.innerHTML = snippet;
            contentDiv.appendChild(subtitleDiv);
        }

        li.appendChild(contentDiv);

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-chat-btn");
        deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openDeleteChatModal(conv.id);
        });
        li.appendChild(deleteBtn);

        historyList.appendChild(li);
    });
}

// ===== CONVERSAS =====
function deleteConversation(id) {
    removeFavoritesByChatId(id);

    conversations = conversations.filter(c => c.id !== id);
    if (currentConversationId === id) {
        if (conversations.length > 0) {
            currentConversationId = conversations[conversations.length - 1].id;
        } else {
            createNewConversation();
        }
    }
    saveConversations();
    renderHistory();
    renderMessages();
}

function switchConversation(id) {
    if (currentConversationId) {
        const currentConv = conversations.find(c => c.id === currentConversationId);
        if (currentConv && currentConv.isTemporary) {
            conversations = conversations.filter(c => c.id !== currentConversationId);
        }
    }

    // Mover o chat selecionado para o topo (ordem de uso)
    const convIndex = conversations.findIndex(c => c.id === id);
    if (convIndex > -1) {
        const conv = conversations.splice(convIndex, 1)[0];
        conversations.push(conv);
        saveConversations();
    }

    currentConversationId = id;
    editingIndex = null;
    document.body.classList.remove('editing-message');
    highlightQuery = historyFilterText;

    if (historySearchInput) {
        historySearchInput.value = "";
    }
    if (typeof clearSearchBtn !== "undefined" && clearSearchBtn) {
        clearSearchBtn.style.display = "none";
    }

    if (chatsHistoryFlag) {
        history.back();
        chatsHistoryFlag = false;
    } else {
        document.body.classList.remove("chats-open");
    }

    renderHistory();
    renderMessages();

    // Posicionar no fim do chat (última mensagem)
    scrollChatToEnd();

    if (highlightQuery) {
        setTimeout(() => {
            highlightQuery = "";
            historyFilterText = "";
            renderMessages();
        }, 3000);
    }

    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv && conv.messages.length === 0) {
        setTimeout(() => {
            startTypingLoop();
            // Cards de sugestão são mostrados automaticamente pelo startTypingLoop
        }, 100);
    } else {
        stopTypingEffect();
        // Cards de sugestão são escondidos automaticamente pelo stopTypingEffect
    }

    updateTempButtonState();
}

function updateConversationTitleFallback(conv) {
    if (!conv) return;
    const firstUser = conv.messages.find(m => m.role === "user");
    if (firstUser) {
        conv.title = firstUser.text.length > 25
            ? firstUser.text.slice(0, 25) + "..."
            : firstUser.text;
    } else {
        conv.title = "Novo chat";
    }
}

function startEditingMessage(index) {
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) return;
    const msg = conv.messages[index];
    if (!msg || msg.role !== "user") return;
    if (isSending) return;

    if (editingIndex === index) {
        exitEditingMessage();
        return;
    }

    editingIndex = index;
    input.value = msg.text || "";
    input.focus();
    document.body.classList.add('editing-message');
    
    // Adicionar estado no histórico para o botão voltar funcionar
    history.pushState({ editing: true }, '');

    // Ativar modos que a mensagem original usou
    // Primeiro desativar todos os modos
    if (typeof webSearchEnabled !== 'undefined' && webSearchEnabled) {
        if (typeof toggleWebSearch === 'function') toggleWebSearch();
    }
    if (typeof isAgentModeActive === 'function' && isAgentModeActive()) {
        if (typeof toggleAgentMode === 'function') toggleAgentMode();
    }
    if (typeof isImageGenModeActive === 'function' && isImageGenModeActive()) {
        if (typeof toggleImageGenMode === 'function') toggleImageGenMode();
    }
    if (typeof isVideoGenModeActive === 'function' && isVideoGenModeActive()) {
        if (typeof toggleVideoGenMode === 'function') toggleVideoGenMode();
    }

    // Agora ativar o modo que a mensagem usava
    if (msg.webSearch && typeof toggleWebSearch === 'function') {
        toggleWebSearch();
    }
    if (msg.agentMode && typeof toggleAgentMode === 'function') {
        toggleAgentMode();
    }
    if (msg.imageGenMode && typeof toggleImageGenMode === 'function') {
        toggleImageGenMode();
    }
    if (msg.videoGenMode && typeof toggleVideoGenMode === 'function') {
        toggleVideoGenMode();
    }

    // Expandir barra de input para o texto
    if (typeof autoResize === 'function') {
        autoResize();
    }

    renderMessages();
}

/**
 * Sair do modo de edição de mensagem
 * Limpa campo de input, modo de edição, e reseta a UI
 */
function exitEditingMessage() {
    editingIndex = null;
    input.value = "";
    document.body.classList.remove('editing-message');
    
    // Desativar modos ao cancelar edição
    if (typeof webSearchEnabled !== 'undefined' && webSearchEnabled) {
        if (typeof toggleWebSearch === 'function') toggleWebSearch();
    }
    if (typeof isAgentModeActive === 'function' && isAgentModeActive()) {
        if (typeof toggleAgentMode === 'function') toggleAgentMode();
    }
    if (typeof isImageGenModeActive === 'function' && isImageGenModeActive()) {
        if (typeof toggleImageGenMode === 'function') toggleImageGenMode();
    }
    if (typeof isVideoGenModeActive === 'function' && isVideoGenModeActive()) {
        if (typeof toggleVideoGenMode === 'function') toggleVideoGenMode();
    }
    // Atualizar barra ao cancelar edição
    if (typeof autoResize === 'function') {
        autoResize();
    }
    renderMessages();
}

function createNewConversation(switchToNew = false, isTemp = false) {
    if (!isTemp && currentConversationId) {
        const currentConv = conversations.find(c => c.id === currentConversationId);
        if (currentConv && currentConv.isTemporary) {
            conversations = conversations.filter(c => c.id !== currentConversationId);
            currentConversationId = null;
        }
    }
    
    // Resetar persona para automático em nova conversa
    if (typeof selectPersona === 'function') {
        selectPersona('auto');
    }

    const id = Date.now().toString();
    const conv = {
        id: id,
        title: isTemp ? "Chat Temporário" : "Novo chat",
        titleGenerated: false,
        messages: [],
        isTemporary: isTemp
    };
    conversations.push(conv);

    if (switchToNew) {
        currentConversationId = id;
        editingIndex = null;
        document.body.classList.remove('editing-message');

        historyFilterText = "";
        if (historySearchInput) {
            historySearchInput.value = "";
        }
        if (typeof clearSearchBtn !== "undefined" && clearSearchBtn) {
            clearSearchBtn.style.display = "none";
        }

        document.body.classList.remove("chats-open");
        chatsHistoryFlag = false;

        if (input) {
            input.value = "";
            input.style.height = MIN_TEXTAREA_HEIGHT + "px";
            input.style.overflowY = "hidden";
        }
        if (inputWrapper) {
            inputWrapper.style.height = MIN_WRAPPER_HEIGHT + "px";
            inputWrapper.classList.remove("multiline");
        }
    }

    // NÃO salvar conversa vazia - só salvar quando tiver mensagens
    // saveConversations();
    renderHistory();
    renderMessages();

    if (switchToNew) {
        setTimeout(() => {
            startTypingLoop();
            // Cards de sugestão são mostrados automaticamente pelo startTypingLoop
        }, 100);
    }

    updateTempButtonState();
}

function clearAllChats() {
    const favorites = loadFavorites();
    const chatIdsWithFavorites = new Set(favorites.map(f => f.chatId));

    conversations = conversations.filter(c => chatIdsWithFavorites.has(c.id));

    if (conversations.length === 0) {
        createNewConversation(true);
    } else {
        currentConversationId = conversations[0].id;
        editingIndex = null;
        document.body.classList.remove('editing-message');
    }

    saveConversations();
    renderHistory();
    renderMessages();
}

function updateTempButtonState() {
    // Buscar elemento caso não esteja definido
    const btn = tempChatBtn || document.querySelector(".temp-chat-btn");
    if (!btn) {
        console.warn('⚠️ Botão temp-chat-btn não encontrado');
        return;
    }

    const conv = conversations.find(c => c.id === currentConversationId);

    if (conv && conv.isTemporary === true) {
        btn.classList.add("active");
        btn.title = "Chat temporário ligado";
    } else {
        btn.classList.remove("active");
        btn.title = "Chat temporário desligado";
    }

    // Forçar repaint imediato
    void btn.offsetWidth;
    
    console.log('🔐 Estado temp chat atualizado:', conv?.isTemporary, btn.classList.contains('active'));
}
