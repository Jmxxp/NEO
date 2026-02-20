// ===== NOTES - Sistema de Anotações =====

// Chave para localStorage
const NOTES_KEY = 'neo_notes';
const MAX_PINNED_NOTES = 5;

// Estado
let notes = [];
let currentEditingNoteId = null;
let notesSwipeActive = false;
let notesSwipeStartY = 0;
let notesSwipeCurrentY = 0;

// ===== FUNÇÃO GLOBAL PARA EXECUTAR COMANDOS DA TOOLBAR =====
// Esta função é chamada diretamente pelos onclick dos botões da toolbar
function executeNoteCommand(command) {
    console.log('📝 executeNoteCommand:', command);
    
    const textInput = document.getElementById('noteTextInput');
    if (!textInput) {
        console.error('📝 textInput não encontrado');
        return;
    }
    
    // Vibrar
    if (typeof vibrate === 'function') vibrate(10);
    
    // Garantir foco no editor
    textInput.focus();
    
    // Restaurar seleção se existir
    if (typeof restoreSelection === 'function') {
        restoreSelection();
    }
    
    // Para bold, italic, strikeThrough: usar aplicação manual
    if (command === 'bold' || command === 'italic' || command === 'strikeThrough') {
        if (typeof applyFormatManually === 'function') {
            applyFormatManually(command);
        } else {
            document.execCommand(command, false, null);
        }
    } else {
        // Para outros comandos, usar execCommand
        try {
            document.execCommand(command, false, null);
        } catch (err) {
            console.log('execCommand falhou:', err);
        }
    }
    
    // Salvar nova seleção após operação
    if (typeof saveSelection === 'function') {
        setTimeout(() => saveSelection(), 10);
    }
    
    // Atualizar estado visual dos botões
    if (typeof updateToolbarState === 'function') {
        setTimeout(() => updateToolbarState(), 50);
    }
}

// ===== FUNÇÕES GLOBAIS PARA DROPDOWNS DA TOOLBAR =====

// Toggle dropdown de tamanho
function toggleNoteFontSize() {
    console.log('📝 toggleNoteFontSize');
    if (typeof vibrate === 'function') vibrate(10);
    const dropdown = document.getElementById('fontSizeDropdown');
    if (dropdown) {
        closeAllNoteDropdowns();
        dropdown.classList.toggle('open');
    }
}

// Selecionar tamanho
function selectNoteSize(size) {
    console.log('📝 selectNoteSize:', size);
    if (typeof vibrate === 'function') vibrate(10);
    
    const textInput = document.getElementById('noteTextInput');
    if (textInput) textInput.focus();
    if (typeof restoreSelection === 'function') restoreSelection();
    
    // Aplicar tamanho
    if (typeof applyFontSize === 'function') {
        applyFontSize(size);
    }
    
    // Atualizar visual
    const sizeDisplay = document.querySelector('#fontSizeBtn .size-value');
    if (sizeDisplay) sizeDisplay.textContent = size;
    
    // Atualizar selecionado
    document.querySelectorAll('.size-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.size == size);
    });
    
    closeAllNoteDropdowns();
}

// Toggle dropdown de cor
function toggleNoteColor() {
    console.log('📝 toggleNoteColor');
    if (typeof vibrate === 'function') vibrate(10);
    const dropdown = document.getElementById('textColorDropdown');
    if (dropdown) {
        closeAllNoteDropdowns();
        dropdown.classList.toggle('open');
    }
}

// Selecionar cor
function selectNoteColor(color) {
    console.log('📝 selectNoteColor:', color);
    if (typeof vibrate === 'function') vibrate(10);
    
    const textInput = document.getElementById('noteTextInput');
    if (textInput) textInput.focus();
    if (typeof restoreSelection === 'function') restoreSelection();
    
    // Aplicar cor
    if (typeof applyTextColor === 'function') {
        applyTextColor(color);
    } else {
        document.execCommand('foreColor', false, color);
    }
    
    // Atualizar barra de cor
    const colorBar = document.getElementById('colorBar');
    if (colorBar) colorBar.style.backgroundColor = color;
    
    closeAllNoteDropdowns();
}

// Abrir color picker
function openNoteCustomColor() {
    console.log('📝 openNoteCustomColor');
    const picker = document.getElementById('customColorPicker');
    if (picker) picker.click();
}

// Aplicar cor customizada
function applyNoteCustomColor(color) {
    console.log('📝 applyNoteCustomColor:', color);
    selectNoteColor(color);
}

// Fechar todos os dropdowns
function closeAllNoteDropdowns() {
    document.querySelectorAll('.toolbar-dropdown.open').forEach(d => d.classList.remove('open'));
}

// Expor globalmente
window.executeNoteCommand = executeNoteCommand;
window.toggleNoteFontSize = toggleNoteFontSize;
window.selectNoteSize = selectNoteSize;
window.toggleNoteColor = toggleNoteColor;
window.selectNoteColor = selectNoteColor;
window.openNoteCustomColor = openNoteCustomColor;
window.applyNoteCustomColor = applyNoteCustomColor;

// ===== INICIALIZAÇÃO =====
function initNotes() {
    loadNotes();
    renderNotes();
    setupNotesListeners();
    console.log('✅ Sistema de anotações inicializado');
}

// ===== STORAGE =====
function loadNotes() {
    try {
        const saved = localStorage.getItem(NOTES_KEY);
        notes = saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Erro ao carregar anotações:', e);
        notes = [];
    }
}

function saveNotes() {
    try {
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
        console.error('Erro ao salvar anotações:', e);
    }
}

// ===== ABRIR/FECHAR TELA =====
function openNotes() {
    document.body.classList.add('notes-open');
    renderNotes();
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function closeNotes() {
    document.body.classList.remove('notes-open');
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// ===== RENDERIZAÇÃO =====
function renderNotes() {
    const listEl = document.getElementById('notesList');
    const emptyEl = document.getElementById('notesEmpty');
    const deleteAllBtn = document.getElementById('deleteAllNotesBtn');

    if (!listEl || !emptyEl) return;

    // Filtrar apenas notas normais (sem transcrições - elas vão para página separada)
    const regularNotes = notes.filter(n => !n.isTranscription);
    
    if (regularNotes.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        emptyEl.style.display = '';
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        return;
    }

    emptyEl.classList.add('hidden');
    emptyEl.style.display = 'none';
    if (deleteAllBtn) deleteAllBtn.style.display = 'flex';

    // Separar notas fixadas e não fixadas
    const pinnedNotes = regularNotes.filter(n => n.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
    const unpinnedNotes = regularNotes.filter(n => !n.pinned).sort((a, b) => b.updatedAt - a.updatedAt);

    let html = '';

    // Seção de notas fixadas
    if (pinnedNotes.length > 0) {
        html += `
            <div class="pinned-notes-section">
                <div class="pinned-notes-title">
                    <i class="fa-solid fa-thumbtack"></i>
                    Fixadas
                </div>
                <div class="pinned-notes-list">
                    ${pinnedNotes.map(note => renderNoteCard(note, true)).join('')}
                </div>
            </div>
        `;

        // Divider entre fixadas e não fixadas
        if (unpinnedNotes.length > 0) {
            html += '<div class="notes-divider"></div>';
        }
    }

    // Notas não fixadas
    html += unpinnedNotes.map(note => renderNoteCard(note, false)).join('');

    listEl.innerHTML = html;
}

function renderTranscriptionCard(transcription) {
    const createdDate = new Date(transcription.createdAt);
    const createdStr = createdDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const createdTime = createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Limitar conteúdo para exibição
    const preview = escapeHtml(transcription.content).substring(0, 200);
    
    return `
        <div class="transcription-card" data-id="${transcription.id}" onclick="openTranscriptionModal('${transcription.id}')">
            <div class="transcription-card-header">
                <div>
                    <div class="transcription-card-title">${escapeHtml(transcription.title)}</div>
                    <div class="transcription-card-date">Criada em ${createdStr} às ${createdTime}</div>
                </div>
                <div class="transcription-card-badge">
                    <i class="fa-solid fa-microphone"></i>
                    Áudio
                </div>
            </div>
            <div class="transcription-card-content">${preview}${transcription.content.length > 200 ? '...' : ''}</div>
            <div class="note-card-footer">
                <span class="note-card-date">${formatNoteDate(transcription.updatedAt)}</span>
                <div class="note-card-actions">
                    <button class="note-card-delete" onclick="event.stopPropagation(); confirmDeleteNote('${transcription.id}')" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderNoteCard(note, isPinned) {
    const pinnedClass = isPinned ? 'pinned' : '';
    const pinBtnClass = isPinned ? 'pinned' : '';
    const pinIcon = isPinned ? 'fa-solid fa-thumbtack' : 'fa-solid fa-thumbtack';
    const titleColor = note.titleColor ? `style="color: ${note.titleColor}"` : '';

    return `
        <div class="note-card ${pinnedClass}" data-id="${note.id}" onclick="openNoteEditor('${note.id}')">
            <div class="note-card-title" ${titleColor}>${escapeHtml(note.title) || 'Sem título'}</div>
            <div class="note-card-date">Criada em ${formatNoteCreationDate(note.createdAt)}</div>
            <div class="note-card-footer">
                <span class="note-card-date">${formatNoteDate(note.updatedAt)}</span>
                <div class="note-card-actions">
                    <button class="note-card-pin ${pinBtnClass}" onclick="event.stopPropagation(); togglePinNote('${note.id}')" title="${isPinned ? 'Desafixar' : 'Fixar'}">
                        <i class="${pinIcon}"></i>
                    </button>
                    <button class="note-card-delete" onclick="event.stopPropagation(); confirmDeleteNote('${note.id}')" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNoteDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Menos de 1 minuto
    if (diff < 60000) return 'Agora';

    // Menos de 1 hora
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} min atrás`;
    }

    // Menos de 24 horas
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h atrás`;
    }

    // Mesmo ano
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }

    // Ano diferente
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatNoteCreationDate(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatNoteDateFull(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${mins}`;
}

// ===== CRUD =====
function createNote() {
    const note = {
        id: Date.now().toString(),
        title: '',
        text: '',
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    notes.push(note);
    saveNotes();

    openNoteEditor(note.id);
}

// ===== FIXAR/DESAFIXAR NOTA =====
function togglePinNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Verificar se já atingiu o limite de notas fixadas
    const pinnedCount = notes.filter(n => n.pinned).length;

    if (!note.pinned && pinnedCount >= MAX_PINNED_NOTES) {
        // Mostrar toast ou alerta
        if (typeof showToast === 'function') {
            showToast(`Máximo de ${MAX_PINNED_NOTES} notas fixadas`);
        } else {
            alert(`Você só pode fixar até ${MAX_PINNED_NOTES} notas`);
        }
        return;
    }

    note.pinned = !note.pinned;
    saveNotes();
    renderNotes();

    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function openNoteEditor(noteId) {
    const overlay = document.getElementById('noteEditorOverlay');
    const titleInput = document.getElementById('noteTitleInput');
    const textInput = document.getElementById('noteTextInput');

    if (!overlay || !titleInput || !textInput) {
        console.error('Elementos do editor não encontrados');
        return;
    }

    currentEditingNoteId = noteId;

    const note = notes.find(n => n.id === noteId);

    if (note) {
        titleInput.value = note.title || '';
        titleInput.style.color = note.titleColor || '';
        textInput.innerHTML = note.text || '';
    } else {
        titleInput.value = '';
        titleInput.style.color = '';
        textInput.innerHTML = '';
    }

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    // Inicializar toolbar
    initNoteToolbar();

    // Resetar e inicializar undo/redo
    resetUndoRedo();
    initUndoRedoListeners();

    // Definir padrões: tamanho 18, cor branca
    const sizeDisplay = document.querySelector('#fontSizeBtn .size-value');
    if (sizeDisplay) sizeDisplay.textContent = '18';

    const colorBar = document.getElementById('colorBar');
    if (colorBar) colorBar.style.background = '#ffffff';

    // Marcar tamanho 18 como selecionado
    const fontSizeDropdown = document.getElementById('fontSizeDropdown');
    if (fontSizeDropdown) {
        fontSizeDropdown.querySelectorAll('.size-opt').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.size === '18') opt.classList.add('selected');
        });
    }

    // Marcar alinhamento à esquerda como padrão (após pequeno delay)
    setTimeout(() => {
        const alignBtns = document.querySelectorAll('.toolbar-btn[data-command^="justify"]');
        alignBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.command === 'justifyLeft') {
                btn.classList.add('active');
            }
        });
    }, 50);

    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function closeNoteEditor() {
    const overlay = document.getElementById('noteEditorOverlay');
    if (!overlay) return;

    // Fechar dropdowns
    closeAllDropdowns();

    // Resetar flag de inicialização da toolbar
    toolbarInitialized = false;
    focusInTitle = false;

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    currentEditingNoteId = null;
}

function saveCurrentNote() {
    if (!currentEditingNoteId) return;

    const titleInput = document.getElementById('noteTitleInput');
    const textInput = document.getElementById('noteTextInput');

    if (!titleInput || !textInput) return;

    const title = titleInput.value.trim();
    const text = textInput.innerHTML.trim();
    const titleColor = titleInput.style.color || null;

    // Se ambos estão vazios, deletar a nota
    if (!title && !text) {
        deleteNote(currentEditingNoteId, true);
        closeNoteEditor();
        return;
    }

    const noteIndex = notes.findIndex(n => n.id === currentEditingNoteId);

    if (noteIndex !== -1) {
        notes[noteIndex].title = title || 'Sem título';
        notes[noteIndex].text = text;
        notes[noteIndex].titleColor = titleColor;
        notes[noteIndex].updatedAt = Date.now();
    }

    saveNotes();
    renderNotes();
    closeNoteEditor();

    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function deleteNote(noteId, silent = false) {
    if (!silent) {
        // Confirmação visual com vibração
        if (typeof vibrateOnClick === 'function') vibrateOnClick();
    }

    notes = notes.filter(n => n.id !== noteId);
    saveNotes();
    renderNotes();
}

// ===== MODAL DE CONFIRMAÇÃO =====
let noteToDeleteId = null;

function confirmDeleteNote(noteId) {
    noteToDeleteId = noteId;
    const modal = document.getElementById('deleteNoteModal');
    if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function closeDeleteNoteModal() {
    const modal = document.getElementById('deleteNoteModal');
    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
    noteToDeleteId = null;
}

function confirmDeleteNoteAction() {
    if (noteToDeleteId) {
        deleteNote(noteToDeleteId, true);
    }
    closeDeleteNoteModal();
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// ===== EXCLUIR TODAS AS NOTAS =====
let deletingAllNotes = false;

function confirmDeleteAllNotes() {
    deletingAllNotes = true;
    const regularNotes = notes.filter(n => !n.isTranscription);
    const modal = document.getElementById('deleteNoteModal');
    if (modal) {
        // Atualizar texto do modal
        const title = modal.querySelector('.delete-note-modal-title');
        const text = modal.querySelector('.delete-note-modal-text');
        if (title) title.textContent = 'Excluir todas as anotações?';
        if (text) text.textContent = `${regularNotes.length} anotação(ões) serão excluídas permanentemente.`;

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function deleteAllNotes() {
    // Manter transcrições, deletar apenas notas normais
    notes = notes.filter(n => n.isTranscription);
    saveNotes();
    renderNotes();
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// Modificar a função de confirmação para suportar exclusão de todas
const originalConfirmDeleteNoteAction = confirmDeleteNoteAction;
confirmDeleteNoteAction = function () {
    if (deletingAllNotes) {
        deleteAllNotes();
        deletingAllNotes = false;
        // Restaurar texto original do modal
        const modal = document.getElementById('deleteNoteModal');
        if (modal) {
            const title = modal.querySelector('.delete-note-modal-title');
            const text = modal.querySelector('.delete-note-modal-text');
            if (title) title.textContent = 'Excluir esta anotação?';
            if (text) text.textContent = 'Esta ação não pode ser desfeita.';
        }
        closeDeleteNoteModal();
        if (typeof vibrateOnClick === 'function') vibrateOnClick();
    } else {
        if (noteToDeleteId) {
            deleteNote(noteToDeleteId, true);
        }
        closeDeleteNoteModal();
        if (typeof vibrateOnClick === 'function') vibrateOnClick();
    }
};

// Modificar closeDeleteNoteModal para resetar estado
const originalCloseDeleteNoteModal = closeDeleteNoteModal;
closeDeleteNoteModal = function () {
    const modal = document.getElementById('deleteNoteModal');
    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        // Restaurar texto original
        const title = modal.querySelector('.delete-note-modal-title');
        const text = modal.querySelector('.delete-note-modal-text');
        if (title) title.textContent = 'Excluir esta anotação?';
        if (text) text.textContent = 'Esta ação não pode ser desfeita.';
    }
    noteToDeleteId = null;
    deletingAllNotes = false;
};

// ===== MENU DE FERRAMENTAS =====
let toolsMenuOpen = false;

function closeToolsMenu() {
    const menu = document.getElementById('toolsMenu');
    const overlay = document.getElementById('toolsMenuOverlay');
    const toolsBtn = document.getElementById('toolsBtn');
    if (menu && overlay) {
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('open');
        toolsMenuOpen = false;
    }
    if (toolsBtn) {
        toolsBtn.classList.remove('active');
    }
}

function openToolsMenu() {
    const menu = document.getElementById('toolsMenu');
    const overlay = document.getElementById('toolsMenuOverlay');
    const toolsBtn = document.getElementById('toolsBtn');
    if (menu && overlay) {
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
        overlay.classList.add('open');
        toolsMenuOpen = true;
    }
    if (toolsBtn) {
        toolsBtn.classList.add('active');
    }
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function toggleToolsMenu() {
    if (toolsMenuOpen) {
        closeToolsMenu();
    } else {
        openToolsMenu();
    }
}

function setupToolsMenuListeners() {
    // Botão de ferramentas no header
    const toolsBtn = document.getElementById('toolsBtn');
    if (toolsBtn) {
        toolsBtn.addEventListener('click', toggleToolsMenu);
    }

    // Overlay para fechar
    const overlay = document.getElementById('toolsMenuOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeToolsMenu);
    }

    // Botão de notas
    const notesBtn = document.getElementById('toolsNotesBtn');
    if (notesBtn) {
        notesBtn.addEventListener('click', function() {
            closeToolsMenu();
            openNotes();
        });
    }

    // Botão de transcrições
    const transcriptionBtn = document.getElementById('toolsTranscriptionBtn');
    if (transcriptionBtn) {
        transcriptionBtn.addEventListener('click', function() {
            closeToolsMenu();
            openTranscriptionsHistory();
        });
    }
}

// Inicializar menu de ferramentas e listeners de histórico de transcrições
function setupTranscriptionsHistoryListeners() {
    const backBtn = document.getElementById('transcriptionsHistoryBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeTranscriptionsHistory();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setupToolsMenuListeners();
        setupTranscriptionsHistoryListeners();
    });
} else {
    setupToolsMenuListeners();
    setupTranscriptionsHistoryListeners();
}

// Expor funções globalmente
window.openToolsMenu = openToolsMenu;
window.closeToolsMenu = closeToolsMenu;
window.toggleToolsMenu = toggleToolsMenu;

// ===== HISTÓRICO DE TRANSCRIÇÕES =====
function openTranscriptionsHistory() {
    document.body.classList.add('transcriptions-history-open');
    // Adicionar estado no histórico para botão voltar funcionar
    history.pushState({ transcriptionsHistoryOpen: true }, '', '');
    renderTranscriptionsHistory();
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function closeTranscriptionsHistory() {
    document.body.classList.remove('transcriptions-history-open');
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function renderTranscriptionsHistory() {
    const listEl = document.getElementById('transcriptionsHistoryList');
    const emptyEl = document.getElementById('transcriptionsHistoryEmpty');
    const deleteAllBtn = document.getElementById('deleteAllTranscriptionsBtn');
    const fab = document.getElementById('transcriptionsFab');

    if (!listEl || !emptyEl) return;

    // Filtrar apenas transcrições
    const transcriptions = notes.filter(n => n.isTranscription).sort((a, b) => b.updatedAt - a.updatedAt);

    if (transcriptions.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        emptyEl.style.display = '';
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        // FAB volta ao lugar normal quando não há transcrições
        if (fab) fab.classList.remove('fab-raised');
        return;
    }

    emptyEl.classList.add('hidden');
    emptyEl.style.display = 'none';
    if (deleteAllBtn) deleteAllBtn.style.display = 'flex';
    // FAB sobe quando há transcrições (botão excluir visível)
    if (fab) fab.classList.add('fab-raised');

    let html = transcriptions.map(t => renderTranscriptionHistoryCard(t)).join('');
    listEl.innerHTML = html;
}

function renderTranscriptionHistoryCard(transcription) {
    const createdDate = new Date(transcription.createdAt);
    const createdStr = createdDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    return `
        <div class="transcription-history-card" data-id="${transcription.id}" onclick="openTranscriptionModal('${transcription.id}')">
            <div class="transcription-history-card-header">
                <div>
                    <div class="transcription-history-card-title">${escapeHtml(transcription.title)}</div>
                    <div class="transcription-history-card-date">Criado em ${createdStr}</div>
                </div>
                <div class="transcription-history-card-badge" onclick="event.stopPropagation(); playTranscriptionAudio('${transcription.id}')">
                    <i class="fa-solid fa-download"></i>
                    Audio
                </div>
            </div>
            <div class="transcription-history-card-footer">
                <span class="transcription-history-card-time">${formatNoteDate(transcription.updatedAt)}</span>
                <button class="transcription-history-card-delete" onclick="event.stopPropagation(); confirmDeleteTranscription('${transcription.id}')" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function playTranscriptionAudio(transcriptionId) {
    // Placeholder - funcionalidade de áudio a ser implementada
    if (typeof showToast === 'function') {
        showToast('Áudio não disponível');
    }
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

let transcriptionToDeleteId = null;
let deletingAllTranscriptions = false;

function confirmDeleteTranscription(transcriptionId) {
    transcriptionToDeleteId = transcriptionId;
    const modal = document.getElementById('deleteNoteModal');
    if (modal) {
        const title = modal.querySelector('.delete-note-modal-title');
        const text = modal.querySelector('.delete-note-modal-text');
        if (title) title.textContent = 'Excluir esta transcrição?';
        if (text) text.textContent = 'Esta ação não pode ser desfeita.';
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function confirmDeleteAllTranscriptions() {
    deletingAllTranscriptions = true;
    const transcriptions = notes.filter(n => n.isTranscription);
    const modal = document.getElementById('deleteNoteModal');
    if (modal) {
        const title = modal.querySelector('.delete-note-modal-title');
        const text = modal.querySelector('.delete-note-modal-text');
        if (title) title.textContent = 'Excluir todas as transcrições?';
        if (text) text.textContent = `${transcriptions.length} transcrição(ões) serão excluídas permanentemente.`;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function deleteAllTranscriptions() {
    notes = notes.filter(n => !n.isTranscription);
    saveNotes();
    renderTranscriptionsHistory();
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// Extender confirmDeleteNoteAction para suportar transcrições
const prevConfirmDeleteNoteAction = confirmDeleteNoteAction;
confirmDeleteNoteAction = function() {
    if (deletingAllTranscriptions) {
        deleteAllTranscriptions();
        deletingAllTranscriptions = false;
        closeDeleteNoteModal();
    } else if (transcriptionToDeleteId) {
        deleteNote(transcriptionToDeleteId, true);
        transcriptionToDeleteId = null;
        closeDeleteNoteModal();
        renderTranscriptionsHistory();
    } else if (deletingAllNotes) {
        deleteAllNotes();
        deletingAllNotes = false;
        closeDeleteNoteModal();
    } else if (noteToDeleteId) {
        deleteNote(noteToDeleteId, true);
        noteToDeleteId = null;
        closeDeleteNoteModal();
    }
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
};

// Extender closeDeleteNoteModal para resetar estado de transcrições
const prevCloseModal = closeDeleteNoteModal;
closeDeleteNoteModal = function() {
    const modal = document.getElementById('deleteNoteModal');
    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        const title = modal.querySelector('.delete-note-modal-title');
        const text = modal.querySelector('.delete-note-modal-text');
        if (title) title.textContent = 'Excluir esta anotação?';
        if (text) text.textContent = 'Esta ação não pode ser desfeita.';
    }
    noteToDeleteId = null;
    deletingAllNotes = false;
    transcriptionToDeleteId = null;
    deletingAllTranscriptions = false;
};

// Expor funções globalmente
window.openTranscriptionsHistory = openTranscriptionsHistory;
window.closeTranscriptionsHistory = closeTranscriptionsHistory;
window.confirmDeleteTranscription = confirmDeleteTranscription;
window.confirmDeleteAllTranscriptions = confirmDeleteAllTranscriptions;

// ===== EVENT LISTENERS =====
function setupNotesListeners() {
    // Botão voltar
    const backBtn = document.getElementById('notesBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeNotes();
        });
    }

    // Botão nova anotação
    const newBtn = document.getElementById('newNoteBtn');
    if (newBtn) {
        newBtn.addEventListener('click', createNote);
    }

    // Modal - botão fechar
    const closeBtn = document.getElementById('noteEditorCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeNoteEditor);
    }

    // Modal - botão salvar
    const saveBtn = document.getElementById('noteEditorSaveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCurrentNote);
    }
}

// ===== INICIALIZAR QUANDO DOM ESTIVER PRONTO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotes);
} else {
    initNotes();
}

// Expor funções globalmente
window.openNotes = openNotes;
window.closeNotes = closeNotes;
window.createNote = createNote;
window.openNoteEditor = openNoteEditor;
window.closeNoteEditor = closeNoteEditor;
window.saveCurrentNote = saveCurrentNote;
window.deleteNote = deleteNote;
window.confirmDeleteNote = confirmDeleteNote;
window.closeDeleteNoteModal = closeDeleteNoteModal;
window.confirmDeleteNoteAction = confirmDeleteNoteAction;
window.confirmDeleteAllNotes = confirmDeleteAllNotes;
window.deleteAllNotes = deleteAllNotes;
window.togglePinNote = togglePinNote;

// ===== BARRA DE FERRAMENTAS DE FORMATAÇÃO =====

// Salvar seleção para restaurar depois
let savedSelection = null;

function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedSelection = sel.getRangeAt(0).cloneRange();
        console.log('📝 [Notes] Seleção salva:', savedSelection.toString());
    }
}

function restoreSelection() {
    console.log('📝 [Notes] Tentando restaurar seleção, savedSelection:', savedSelection ? savedSelection.toString() : 'null');
    if (savedSelection) {
        try {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
            console.log('📝 [Notes] Seleção restaurada com sucesso');
            return true;
        } catch (e) {
            console.error('📝 [Notes] Erro ao restaurar seleção:', e);
            return false;
        }
    }
    return false;
}

// Variável para rastrear se o foco está no título
let focusInTitle = false;
let toolbarInitialized = false;

function initNoteToolbar() {
    console.log('📝 [Notes] initNoteToolbar() chamada');
    const toolbar = document.getElementById('noteToolbar');
    const textInput = document.getElementById('noteTextInput');
    const titleInput = document.getElementById('noteTitleInput');
    
    console.log('📝 [Notes] toolbar:', toolbar ? 'encontrado' : 'NÃO ENCONTRADO');
    console.log('📝 [Notes] textInput:', textInput ? 'encontrado' : 'NÃO ENCONTRADO');
    
    if (!toolbar) {
        console.error('📝 [Notes] ERRO: toolbar não encontrada!');
        return;
    }

    // Evitar inicialização múltipla
    if (toolbarInitialized) {
        console.log('📝 [Notes] toolbar já inicializada, retornando');
        return;
    }
    toolbarInitialized = true;
    console.log('📝 [Notes] Inicializando toolbar pela primeira vez');

    // Rastrear foco no título vs conteúdo
    if (titleInput) {
        titleInput.addEventListener('focus', () => {
            focusInTitle = true;
            updateToolbarForTitle(true);
        });
        titleInput.addEventListener('blur', () => {
            focusInTitle = false;
            updateToolbarForTitle(false);
        });
    }

    if (textInput) {
        textInput.addEventListener('focus', () => {
            focusInTitle = false;
            updateToolbarForTitle(false);
        });

        // Salvar seleção quando houver mudança (para restaurar depois)
        textInput.addEventListener('mouseup', () => {
            saveSelection();
            setTimeout(updateToolbarState, 10);
        });
        textInput.addEventListener('keyup', (e) => {
            saveSelection();
            // Não atualizar estado no Enter para evitar desativar lista
            if (e.key !== 'Enter') {
                setTimeout(updateToolbarState, 10);
            }
        });
        
        // Salvar seleção no touchend também (mobile)
        textInput.addEventListener('touchend', () => {
            // Salvar imediatamente E com delay para capturar seleção em momentos diferentes
            saveSelection();
            setTimeout(() => {
                saveSelection();
                updateToolbarState();
            }, 50);
            setTimeout(() => {
                saveSelection();
                updateToolbarState();
            }, 150);
        });
        
        // Também salvar na mudança de seleção (selectionchange event)
        document.addEventListener('selectionchange', () => {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                // Verificar se a seleção está dentro do textInput
                if (textInput.contains(range.commonAncestorContainer)) {
                    saveSelection();
                }
            }
        });
    }

    // Prevenir perda de foco ao clicar na toolbar (mouse apenas)
    toolbar.addEventListener('mousedown', (e) => {
        console.log('📝 [Notes] toolbar mousedown:', e.target);
        e.preventDefault();
    });
    
    // Para touch: NÃO bloquear - deixar scroll funcionar
    // Os botões agora usam onclick diretamente no HTML
    // então não precisamos de touchstart para funcionar
    
    // Contar botões encontrados
    const toolbarButtons = toolbar.querySelectorAll('.toolbar-btn[data-command]');
    console.log('📝 [Notes] Botões com data-command encontrados:', toolbarButtons.length);

    // Função para executar comando de formatação
    function executeCommand(command) {
        console.log('📝 [Notes] Executando comando:', command);
        
        // Não permitir formatação no título
        if (focusInTitle) {
            if (typeof vibrateOnClick === 'function') vibrateOnClick();
            return;
        }

        // Garantir foco no editor primeiro
        if (textInput) {
            textInput.focus();
        }
        
        // Restaurar seleção depois do foco
        restoreSelection();

        // Para bold, italic, strikeThrough: sempre usar fallback manual
        // O execCommand falha silenciosamente em alguns Android WebViews
        if (command === 'bold' || command === 'italic' || command === 'strikeThrough') {
            applyFormatManually(command);
        } else {
            // Para outros comandos (underline, justify, etc), tentar execCommand
            try {
                document.execCommand(command, false, null);
            } catch (err) {
                console.log('execCommand falhou:', err);
            }
        }

        // Salvar nova seleção após operação
        setTimeout(() => saveSelection(), 10);
        
        // Atualizar estado visual dos botões (com delays para garantir)
        setTimeout(() => updateToolbarState(), 10);
        setTimeout(() => updateToolbarState(), 100);
        setTimeout(() => updateToolbarState(), 300);
        if (typeof vibrateOnClick === 'function') vibrateOnClick();
    }

    // Botões de comando simples (negrito, itálico, etc)
    toolbarButtons.forEach(btn => {
        const command = btn.dataset.command;
        console.log('📝 [Notes] Configurando botão:', command);
        
        // Handler unificado
        function handleBtnAction(e) {
            console.log('📝 [Notes] Ação no botão:', command, e.type);
            e.preventDefault();
            e.stopPropagation();
            executeCommand(command);
        }
        
        // Evento click (desktop e fallback)
        btn.addEventListener('click', handleBtnAction);
        
        // Evento touchend (mobile) - NÃO touchstart
        btn.addEventListener('touchend', handleBtnAction, { passive: false });
        
        // O touchstart é tratado na toolbar para prevenir perda de foco
    });

    // Dropdown de tamanho de fonte
    const fontSizeBtn = document.getElementById('fontSizeBtn');
    const fontSizeDropdown = document.getElementById('fontSizeDropdown');
    if (fontSizeBtn && fontSizeDropdown) {
        // Handler para abrir dropdown de tamanho
        function handleFontSizeOpen(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 [Notes] Abrindo dropdown de tamanho');

            // Não permitir alterar tamanho no título
            if (focusInTitle) {
                if (typeof vibrateOnClick === 'function') vibrateOnClick();
                return;
            }
            toggleDropdown(fontSizeDropdown);
        }
        
        fontSizeBtn.onclick = handleFontSizeOpen;
        fontSizeBtn.addEventListener('touchend', handleFontSizeOpen, { passive: false });

        fontSizeDropdown.querySelectorAll('.size-opt').forEach(item => {
            function handleSizeSelect(e) {
                e.preventDefault();
                e.stopPropagation();
                const size = item.dataset.size;
                console.log('📝 [Notes] Selecionado tamanho:', size);

                // Atualizar visual
                fontSizeDropdown.querySelectorAll('.size-opt').forEach(opt => opt.classList.remove('selected'));
                item.classList.add('selected');
                const sizeDisplay = fontSizeBtn.querySelector('.size-value');
                if (sizeDisplay) sizeDisplay.textContent = size;

                // Aplicar tamanho
                applyFontSize(size);

                closeAllDropdowns();
                if (typeof vibrateOnClick === 'function') vibrateOnClick();
            }
            
            item.onclick = handleSizeSelect;
            item.addEventListener('touchend', handleSizeSelect, { passive: false });
        });
    }

    // Dropdown de cor do texto
    const textColorBtn = document.getElementById('textColorBtn');
    const textColorDropdown = document.getElementById('textColorDropdown');
    const colorBar = document.getElementById('colorBar');
    const customColorPicker = document.getElementById('customColorPicker');

    if (textColorBtn && textColorDropdown) {
        // Handler para abrir dropdown de cor
        function handleColorOpen(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 [Notes] Abrindo dropdown de cor');
            toggleDropdown(textColorDropdown);
        }
        
        textColorBtn.onclick = handleColorOpen;
        textColorBtn.addEventListener('touchend', handleColorOpen, { passive: false });

        textColorDropdown.querySelectorAll('.color-dot').forEach(item => {
            function handleColorSelect(e) {
                e.preventDefault();
                e.stopPropagation();
                const color = item.dataset.color;
                console.log('📝 [Notes] Selecionada cor:', color);

                // Se é o botão arco-íris, abrir color picker
                if (color === 'custom' && customColorPicker) {
                    customColorPicker.click();
                    return;
                }

                // Atualizar visual
                textColorDropdown.querySelectorAll('.color-dot').forEach(dot => dot.classList.remove('selected'));
                item.classList.add('selected');
                if (colorBar) colorBar.style.background = color;

                // Se foco está no título, aplicar cor diretamente no input
                if (focusInTitle) {
                    const titleInput = document.getElementById('noteTitleInput');
                    if (titleInput) {
                        titleInput.style.color = color;
                    }
                    closeAllDropdowns();
                    if (typeof vibrateOnClick === 'function') vibrateOnClick();
                    return;
                }

                // Aplicar cor no conteúdo
                try {
                    document.execCommand('foreColor', false, color);
                } catch (err) {
                    console.log('foreColor falhou:', err);
                    applyTextColor(color);
                }

                closeAllDropdowns();
                if (typeof vibrateOnClick === 'function') vibrateOnClick();
            }
            
            item.onclick = handleColorSelect;
            item.addEventListener('touchend', handleColorSelect, { passive: false });
        });

        // Color picker personalizado
        if (customColorPicker) {
            customColorPicker.oninput = (e) => {
                const color = e.target.value;
                if (colorBar) colorBar.style.background = color;

                // Se foco está no título, aplicar cor diretamente
                if (focusInTitle) {
                    const titleInput = document.getElementById('noteTitleInput');
                    if (titleInput) {
                        titleInput.style.color = color;
                    }
                    return;
                }

                try {
                    document.execCommand('foreColor', false, color);
                } catch (err) {
                    applyTextColor(color);
                }
            };
            customColorPicker.onchange = () => {
                closeAllDropdowns();
            };
        }
    }

    // Dropdown de destaque (highlight)
    const highlightBtn = document.getElementById('highlightBtn');
    const highlightDropdown = document.getElementById('highlightDropdown');
    const customHighlightPicker = document.getElementById('customHighlightColorPicker');

    if (highlightBtn && highlightDropdown) {
        highlightBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(highlightDropdown);
        };

        highlightDropdown.querySelectorAll('.color-option').forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                const color = item.dataset.color;

                if (color === 'custom' && customHighlightPicker) {
                    // Abrir color picker nativo
                    customHighlightPicker.click();
                } else if (color === 'transparent') {
                    document.execCommand('removeFormat', false, null);
                    updateColorIndicator('highlightIndicator', color);
                    closeAllDropdowns();
                } else {
                    document.execCommand('hiliteColor', false, color);
                    updateColorIndicator('highlightIndicator', color);
                    closeAllDropdowns();
                }
                if (typeof vibrateOnClick === 'function') vibrateOnClick();
            };
        });

        // Listener para color picker de highlight personalizado
        if (customHighlightPicker) {
            customHighlightPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                const rgba = hexToRgba(color, 0.4);
                document.execCommand('hiliteColor', false, rgba);
                updateColorIndicator('highlightIndicator', rgba);
            });
            customHighlightPicker.addEventListener('change', () => {
                closeAllDropdowns();
            });
        }
    }

    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.toolbar-group')) {
            closeAllDropdowns();
        }
    });

    // Atualizar estado dos botões ao selecionar texto
    if (textInput) {
        textInput.addEventListener('mouseup', updateToolbarState);
        textInput.addEventListener('keyup', updateToolbarState);
        textInput.addEventListener('focus', updateToolbarState);
    }
}

// Aplicar tamanho de fonte
function applyFontSize(size) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const textInput = document.getElementById('noteTextInput');
    if (textInput) textInput.focus();
    restoreSelection();

    const range = sel.getRangeAt(0);

    if (range.collapsed) {
        // Sem seleção - criar span para próximo texto
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        span.innerHTML = '\u200B'; // zero-width space
        range.insertNode(span);

        // Mover cursor para dentro do span
        const newRange = document.createRange();
        newRange.setStart(span, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
    } else {
        // Com seleção - envolver em span
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';

        try {
            span.appendChild(range.extractContents());
            range.insertNode(span);

            // Selecionar o texto inserido
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            sel.removeAllRanges();
            sel.addRange(newRange);
        } catch (e) {
            console.log('Fallback fontSize:', e);
        }
    }
}

// Aplicar formatação manualmente (fallback para quando execCommand falha)
function applyFormatManually(command) {
    console.log('📝 [Notes] applyFormatManually:', command);
    const textInput = document.getElementById('noteTextInput');
    
    // Primeiro, sempre restaurar a seleção salva (antes de focar)
    // Isso é crucial porque clicar no botão remove a seleção
    console.log('📝 [Notes] savedSelection antes de restaurar:', savedSelection ? `"${savedSelection.toString()}"` : 'null');
    
    const hadSavedSelection = restoreSelection();
    console.log('📝 [Notes] Restaurou seleção:', hadSavedSelection);
    
    // Agora verificar a seleção atual
    const sel = window.getSelection();
    console.log('📝 [Notes] Seleção atual rangeCount:', sel.rangeCount);
    
    if (sel.rangeCount > 0) {
        const currentRange = sel.getRangeAt(0);
        console.log('📝 [Notes] Texto selecionado:', `"${currentRange.toString()}"`, 'collapsed:', currentRange.collapsed);
    }
    
    if (!sel.rangeCount) {
        console.log('📝 [Notes] applyFormatManually: Sem seleção disponível, abortando');
        return;
    }

    const range = sel.getRangeAt(0);

    // Mapear comando para tag/estilo
    const tagMap = {
        'bold': { tag: 'strong', altTag: 'b', style: 'fontWeight', value: 'bold' },
        'italic': { tag: 'em', altTag: 'i', style: 'fontStyle', value: 'italic' },
        'underline': { tag: 'u', altTag: null, style: 'textDecoration', value: 'underline' },
        'strikeThrough': { tag: 's', altTag: 'strike', style: 'textDecoration', value: 'line-through' }
    };

    const format = tagMap[command];
    if (!format) return;

    // Função auxiliar para encontrar elemento formatado subindo na árvore
    function findFormattedAncestor(node) {
        while (node && node !== textInput) {
            if (node.nodeType === 1) {
                const tagName = node.tagName.toLowerCase();
                if (tagName === format.tag || (format.altTag && tagName === format.altTag)) {
                    return node;
                }
            }
            node = node.parentNode;
        }
        return null;
    }

    // Verificar se a seleção está dentro de elemento formatado
    // Usar range.startContainer e endContainer (já normalizados independente da direção)
    let formattedParent = findFormattedAncestor(range.startContainer);
    if (!formattedParent && !range.collapsed) {
        formattedParent = findFormattedAncestor(range.endContainer);
    }
    // Também verificar anchorNode e focusNode para cobrir todos os casos
    if (!formattedParent && !range.collapsed) {
        formattedParent = findFormattedAncestor(sel.anchorNode) || findFormattedAncestor(sel.focusNode);
    }
    
    // Verificar se o conteúdo selecionado contém tags de formatação E texto não formatado
    let selectionHasFormatTags = false;
    let selectionHasUnformattedText = false;
    let isMixedContent = false;
    
    if (!range.collapsed) {
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(range.cloneContents());
        
        // Verificar se há tags de formatação
        selectionHasFormatTags = !!(tempDiv.querySelector(format.tag) || 
                       (format.altTag && tempDiv.querySelector(format.altTag)));
        
        // Verificar se há texto fora das tags de formatação (texto não formatado)
        if (selectionHasFormatTags || formattedParent) {
            // Clonar para análise
            const analysisDiv = tempDiv.cloneNode(true);
            
            // Remover todas as tags de formatação para ver se sobra texto
            const formattedEls = analysisDiv.querySelectorAll(format.tag + (format.altTag ? ', ' + format.altTag : ''));
            formattedEls.forEach(el => el.remove());
            
            // Se ainda tem texto depois de remover as tags formatadas, há conteúdo misto
            const remainingText = analysisDiv.textContent.trim();
            selectionHasUnformattedText = remainingText.length > 0;
            
            // É conteúdo misto se tem tanto formatado quanto não formatado
            isMixedContent = selectionHasFormatTags && selectionHasUnformattedText && !formattedParent;
        }
    }
    
    // Só remover formato se TODO o conteúdo está formatado (não é misto)
    const shouldRemoveFormat = (formattedParent || selectionHasFormatTags) && !isMixedContent;

    if (range.collapsed) {
        // Cursor sem seleção
        if (formattedParent) {
            // Cursor está dentro de texto formatado - SAIR do modo formatado
            // Precisamos dividir o elemento no ponto do cursor
            
            // Obter a posição do cursor dentro do texto (usar range que é normalizado)
            const cursorNode = range.startContainer;
            const cursorOffset = range.startOffset;
            
            // Se o cursor está em um text node dentro do elemento formatado
            if (cursorNode.nodeType === 3) { // Text node
                const textContent = cursorNode.textContent;
                const textBefore = textContent.substring(0, cursorOffset);
                const textAfter = textContent.substring(cursorOffset);
                
                const parent = formattedParent.parentNode;
                
                // Criar fragmento com: [antes formatado] [zero-width] [depois formatado]
                const fragment = document.createDocumentFragment();
                
                // Parte antes do cursor (mantém formatação)
                if (textBefore) {
                    const beforeEl = document.createElement(format.tag);
                    beforeEl.textContent = textBefore;
                    fragment.appendChild(beforeEl);
                }
                
                // Zero-width space onde o cursor ficará (sem formatação)
                const zeroWidthSpace = document.createTextNode('\u200B');
                fragment.appendChild(zeroWidthSpace);
                
                // Parte depois do cursor (mantém formatação)
                if (textAfter) {
                    const afterEl = document.createElement(format.tag);
                    afterEl.textContent = textAfter;
                    fragment.appendChild(afterEl);
                }
                
                // Substituir o elemento formatado original
                parent.replaceChild(fragment, formattedParent);
                
                // Posicionar cursor após o zero-width space
                const newRange = document.createRange();
                newRange.setStartAfter(zeroWidthSpace);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
            } else {
                // Fallback: inserir após o elemento
                const zeroWidthSpace = document.createTextNode('\u200B');
                if (formattedParent.nextSibling) {
                    formattedParent.parentNode.insertBefore(zeroWidthSpace, formattedParent.nextSibling);
                } else {
                    formattedParent.parentNode.appendChild(zeroWidthSpace);
                }
                
                const newRange = document.createRange();
                newRange.setStartAfter(zeroWidthSpace);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        } else {
            // Cursor em texto normal - criar elemento para próximo texto
            const wrapper = document.createElement(format.tag);
            wrapper.innerHTML = '\u200B';
            range.insertNode(wrapper);

            const newRange = document.createRange();
            newRange.setStart(wrapper, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
        }
    } else {
        // Com seleção
        if (shouldRemoveFormat) {
            // Remover formatação da seleção
            const selectedText = range.toString();
            
            if (formattedParent) {
                // A seleção está dentro de um elemento formatado
                const parentText = formattedParent.textContent;
                
                if (selectedText === parentText) {
                    // Seleção cobre tudo - substituir o elemento inteiro por texto
                    const textNode = document.createTextNode(selectedText);
                    formattedParent.parentNode.replaceChild(textNode, formattedParent);
                    
                    // Selecionar o texto
                    const newRange = document.createRange();
                    newRange.selectNodeContents(textNode);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                } else {
                    // Seleção parcial - precisamos dividir o elemento
                    // Encontrar posições relativas dentro do elemento formatado
                    const fullText = formattedParent.textContent;
                    
                    // Calcular posição do início e fim da seleção no texto do elemento
                    let startOffset = 0;
                    let endOffset = 0;
                    
                    // Usar TreeWalker para encontrar posições exatas
                    const treeWalker = document.createTreeWalker(
                        formattedParent,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    let currentOffset = 0;
                    let foundStart = false;
                    let foundEnd = false;
                    let node;
                    
                    while ((node = treeWalker.nextNode())) {
                        const nodeLength = node.textContent.length;
                        
                        if (!foundStart && node === range.startContainer) {
                            startOffset = currentOffset + range.startOffset;
                            foundStart = true;
                        }
                        if (!foundEnd && node === range.endContainer) {
                            endOffset = currentOffset + range.endOffset;
                            foundEnd = true;
                        }
                        
                        currentOffset += nodeLength;
                    }
                    
                    // Se não encontrou via TreeWalker, tentar método alternativo
                    if (!foundStart || !foundEnd) {
                        // Método alternativo: buscar pela string selecionada
                        const selIdx = fullText.indexOf(selectedText);
                        if (selIdx !== -1) {
                            startOffset = selIdx;
                            endOffset = selIdx + selectedText.length;
                        } else {
                            // Fallback: usar posições baseadas em range
                            startOffset = 0;
                            endOffset = selectedText.length;
                        }
                    }
                    
                    const textBefore = fullText.substring(0, startOffset);
                    const textSelected = fullText.substring(startOffset, endOffset);
                    const textAfter = fullText.substring(endOffset);
                    
                    // Criar fragmento com: [antes formatado] [seleção sem formato] [depois formatado]
                    const fragment = document.createDocumentFragment();
                    
                    if (textBefore) {
                        const beforeEl = document.createElement(format.tag);
                        beforeEl.textContent = textBefore;
                        fragment.appendChild(beforeEl);
                    }
                    
                    // Texto selecionado sem formatação
                    const middleText = document.createTextNode(textSelected);
                    fragment.appendChild(middleText);
                    
                    if (textAfter) {
                        const afterEl = document.createElement(format.tag);
                        afterEl.textContent = textAfter;
                        fragment.appendChild(afterEl);
                    }
                    
                    // Substituir o elemento formatado original
                    formattedParent.parentNode.replaceChild(fragment, formattedParent);
                    
                    // Selecionar o texto que foi desformatado
                    const newRange = document.createRange();
                    newRange.selectNodeContents(middleText);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }
            } else {
                // Não tem formattedParent mas tem tags dentro da seleção
                // Extrair conteúdo, limpar tags e reinserir
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(range.cloneContents());
                
                // Remover todas as tags de formatação
                const formattedElements = tempDiv.querySelectorAll(format.tag + (format.altTag ? ', ' + format.altTag : ''));
                formattedElements.forEach(el => {
                    const parent = el.parentNode;
                    while (el.firstChild) {
                        parent.insertBefore(el.firstChild, el);
                    }
                    parent.removeChild(el);
                });
                
                const cleanText = tempDiv.textContent;
                
                range.deleteContents();
                const textNode = document.createTextNode(cleanText);
                range.insertNode(textNode);
                
                const newRange = document.createRange();
                newRange.selectNodeContents(textNode);
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        } else {
            // Aplicar formatação
            if (isMixedContent) {
                // Conteúdo misto - aplicar formato apenas nas partes não formatadas
                const fragment = range.extractContents();
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(fragment);
                
                // Função recursiva para processar nós
                function processNode(node) {
                    if (node.nodeType === 3) {
                        // Text node - verificar se está dentro de tag formatada
                        let parent = node.parentNode;
                        let isFormatted = false;
                        
                        while (parent && parent !== tempDiv) {
                            const tagName = parent.tagName ? parent.tagName.toLowerCase() : '';
                            if (tagName === format.tag || (format.altTag && tagName === format.altTag)) {
                                isFormatted = true;
                                break;
                            }
                            parent = parent.parentNode;
                        }
                        
                        // Se não está formatado e tem conteúdo, envolver na tag
                        if (!isFormatted && node.textContent.trim()) {
                            const wrapper = document.createElement(format.tag);
                            node.parentNode.insertBefore(wrapper, node);
                            wrapper.appendChild(node);
                        }
                    } else if (node.nodeType === 1) {
                        // Element node - processar filhos (fazer cópia do array pois vamos modificar)
                        const children = Array.from(node.childNodes);
                        children.forEach(child => processNode(child));
                    }
                }
                
                processNode(tempDiv);
                
                // Mover conteúdo processado de volta para o documento
                const resultFragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    resultFragment.appendChild(tempDiv.firstChild);
                }
                
                range.insertNode(resultFragment);
                
                // Tentar selecionar o conteúdo inserido
                try {
                    sel.removeAllRanges();
                    // Não conseguimos facilmente selecionar fragmento, então não selecionamos
                } catch (e) {}
            } else {
                // Conteúdo simples sem formatação - envolver tudo
                const wrapper = document.createElement(format.tag);
                try {
                    wrapper.appendChild(range.extractContents());
                    range.insertNode(wrapper);

                    // Selecionar o conteúdo formatado
                    const newRange = document.createRange();
                    newRange.selectNodeContents(wrapper);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                } catch (e) {
                    console.log('Erro ao aplicar formatação:', e);
                }
            }
        }
    }
}

// Aplicar cor do texto (fallback)
function applyTextColor(color) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);

    if (range.collapsed) {
        const span = document.createElement('span');
        span.style.color = color;
        span.innerHTML = '\u200B';
        range.insertNode(span);

        const newRange = document.createRange();
        newRange.setStart(span, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
    } else {
        const span = document.createElement('span');
        span.style.color = color;

        try {
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } catch (e) {
            console.log('Fallback textColor');
        }
    }
}

// Converter hex para rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toggleDropdown(dropdown) {
    const isOpen = dropdown.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) {
        // Posicionar dropdown acima do botão pai
        const btn = dropdown.previousElementSibling || dropdown.parentElement.querySelector('.toolbar-btn');
        if (btn) {
            const rect = btn.getBoundingClientRect();
            dropdown.style.bottom = (window.innerHeight - rect.top + 20) + 'px';

            // Para dropdown de cores, centralizar na tela
            if (dropdown.classList.contains('color-dropdown')) {
                dropdown.style.left = '50%';
                dropdown.style.transform = 'translateX(-50%)';
            } else {
                dropdown.style.left = rect.left + 'px';
                dropdown.style.transform = 'none';
            }
        }
        dropdown.classList.add('open');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.toolbar-dropdown.open').forEach(d => {
        d.classList.remove('open');
    });
}

function updateColorIndicator(indicatorId, color) {
    const indicator = document.getElementById(indicatorId);
    if (indicator) {
        indicator.style.background = color === 'transparent' ? 'rgba(255, 255, 255, 0.3)' : color;
    }
}

function updateToolbarState() {
    // Atualizar estado ativo dos botões de formatação de texto
    const textCommands = ['bold', 'italic', 'underline', 'strikeThrough'];

    textCommands.forEach(command => {
        const btn = document.querySelector(`.toolbar-btn[data-command="${command}"]`);
        if (btn) {
            try {
                const isActive = document.queryCommandState(command);
                if (isActive) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            } catch (e) {
                btn.classList.remove('active');
            }
        }
    });

    // Atualizar estado dos botões de alinhamento (apenas um pode estar ativo)
    // Só atualizar se o editor tem foco real
    const textInput = document.getElementById('noteTextInput');
    const sel = window.getSelection();
    const isInEditor = textInput && sel.rangeCount > 0 && textInput.contains(sel.anchorNode);

    if (isInEditor) {
        const alignCommands = ['justifyLeft', 'justifyCenter', 'justifyRight'];
        let anyAlignActive = false;

        alignCommands.forEach(command => {
            const btn = document.querySelector(`.toolbar-btn[data-command="${command}"]`);
            if (btn) {
                try {
                    const isActive = document.queryCommandState(command);
                    if (isActive) {
                        btn.classList.add('active');
                        anyAlignActive = true;
                    } else {
                        btn.classList.remove('active');
                    }
                } catch (e) {
                    btn.classList.remove('active');
                }
            }
        });

        // Se nenhum alinhamento está ativo, marcar esquerda como padrão
        if (!anyAlignActive) {
            const leftBtn = document.querySelector('.toolbar-btn[data-command="justifyLeft"]');
            if (leftBtn) leftBtn.classList.add('active');
        }
    }

    // Atualizar estado dos botões de lista
    const listCommands = ['insertUnorderedList', 'insertOrderedList'];
    listCommands.forEach(command => {
        const btn = document.querySelector(`.toolbar-btn[data-command="${command}"]`);
        if (btn) {
            try {
                const isActive = document.queryCommandState(command);
                if (isActive) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            } catch (e) {
                btn.classList.remove('active');
            }
        }
    });

    // Detectar cor do texto selecionado e atualizar indicador
    try {
        const color = document.queryCommandValue('foreColor');
        if (color) {
            const colorBar = document.getElementById('colorBar');
            if (colorBar) {
                colorBar.style.background = color;
            }
        }
    } catch (e) {
        // Ignorar erro
    }

    // Detectar tamanho da fonte do texto selecionado
    try {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            let node = sel.anchorNode;
            // Se é um nó de texto, pegar o elemento pai
            if (node.nodeType === 3) {
                node = node.parentElement;
            }

            if (node) {
                // Pegar o computed style do elemento
                const computedStyle = window.getComputedStyle(node);
                let fontSize = computedStyle.fontSize;

                if (fontSize) {
                    // Converter de px para número inteiro
                    const sizeNum = Math.round(parseFloat(fontSize));

                    // Atualizar display do botão de tamanho
                    const sizeDisplay = document.querySelector('#fontSizeBtn .size-value');
                    if (sizeDisplay) {
                        sizeDisplay.textContent = sizeNum;
                    }

                    // Atualizar seleção no dropdown
                    const fontSizeDropdown = document.getElementById('fontSizeDropdown');
                    if (fontSizeDropdown) {
                        fontSizeDropdown.querySelectorAll('.size-opt').forEach(opt => {
                            opt.classList.remove('selected');
                            if (parseInt(opt.dataset.size) === sizeNum) {
                                opt.classList.add('selected');
                            }
                        });
                    }
                }
            }
        }
    } catch (e) {
        // Ignorar erro
    }
}

// Atualizar toolbar quando foco está no título (desabilitar tudo exceto cor)
function updateToolbarForTitle(inTitle) {
    const toolbar = document.getElementById('noteToolbar');
    if (!toolbar) return;

    // Botões de formatação que não funcionam no título
    const disabledInTitle = [
        '[data-command="bold"]',
        '[data-command="italic"]',
        '[data-command="underline"]',
        '[data-command="strikeThrough"]',
        '[data-command="justifyLeft"]',
        '[data-command="justifyCenter"]',
        '[data-command="justifyRight"]',
        '[data-command="insertUnorderedList"]',
        '[data-command="insertOrderedList"]',
        '#fontSizeBtn'
    ];

    disabledInTitle.forEach(selector => {
        const btn = toolbar.querySelector(selector);
        if (btn) {
            if (inTitle) {
                btn.classList.add('toolbar-disabled');
                btn.style.opacity = '0.3';
                btn.style.pointerEvents = 'none';
            } else {
                btn.classList.remove('toolbar-disabled');
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
            }
        }
    });
}

// Expor funções da toolbar
window.initNoteToolbar = initNoteToolbar;
window.closeAllDropdowns = closeAllDropdowns;

// ===== UNDO/REDO SYSTEM =====
let undoStack = [];
let redoStack = [];
let isUndoRedoing = false;
const MAX_UNDO_STACK = 50;

// Salvar estado atual para undo
function saveUndoState() {
    if (isUndoRedoing) return;

    const textInput = document.getElementById('noteTextInput');
    const titleInput = document.getElementById('noteTitleInput');
    if (!textInput) return;

    const currentState = {
        text: textInput.innerHTML,
        title: titleInput ? titleInput.value : '',
        timestamp: Date.now()
    };

    // Evitar salvar estados duplicados
    if (undoStack.length > 0) {
        const lastState = undoStack[undoStack.length - 1];
        if (lastState.text === currentState.text && lastState.title === currentState.title) {
            return;
        }
    }

    undoStack.push(currentState);

    // Limitar tamanho do stack
    if (undoStack.length > MAX_UNDO_STACK) {
        undoStack.shift();
    }

    // Limpar redo stack quando nova ação é feita
    redoStack = [];

    updateUndoRedoButtons();
}

// Desfazer (Ctrl+Z)
function noteUndo() {
    if (undoStack.length < 2) return; // Precisa ter pelo menos 2 estados (atual + anterior)

    const textInput = document.getElementById('noteTextInput');
    const titleInput = document.getElementById('noteTitleInput');
    if (!textInput) return;

    isUndoRedoing = true;

    // Mover estado atual para redo stack
    const currentState = undoStack.pop();
    redoStack.push(currentState);

    // Restaurar estado anterior
    const previousState = undoStack[undoStack.length - 1];
    textInput.innerHTML = previousState.text;
    if (titleInput) titleInput.value = previousState.title;

    isUndoRedoing = false;
    updateUndoRedoButtons();

    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// Refazer (Ctrl+Shift+Z ou Ctrl+Y)
function noteRedo() {
    if (redoStack.length === 0) return;

    const textInput = document.getElementById('noteTextInput');
    const titleInput = document.getElementById('noteTitleInput');
    if (!textInput) return;

    isUndoRedoing = true;

    // Pegar estado do redo stack
    const nextState = redoStack.pop();
    undoStack.push(nextState);

    // Restaurar
    textInput.innerHTML = nextState.text;
    if (titleInput) titleInput.value = nextState.title;

    isUndoRedoing = false;
    updateUndoRedoButtons();

    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// Atualizar estado visual dos botões
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('noteUndoBtn');
    const redoBtn = document.getElementById('noteRedoBtn');

    if (undoBtn) {
        undoBtn.disabled = undoStack.length < 2;
    }
    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
    }
}

// Resetar stacks quando abrir nova nota
function resetUndoRedo() {
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();

    // Salvar estado inicial
    setTimeout(() => saveUndoState(), 100);
}

// Inicializar listeners de undo/redo
function initUndoRedoListeners() {
    const textInput = document.getElementById('noteTextInput');
    const titleInput = document.getElementById('noteTitleInput');

    if (textInput) {
        // Debounce para não salvar estado a cada tecla
        let saveTimeout = null;
        textInput.addEventListener('input', () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveUndoState, 500);
        });

        // Atalhos de teclado
        textInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                noteUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                noteRedo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                noteRedo();
            }
        });
    }

    if (titleInput) {
        let saveTimeout = null;
        titleInput.addEventListener('input', () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveUndoState, 500);
        });
    }
}

// Expor funções de undo/redo
window.noteUndo = noteUndo;
window.noteRedo = noteRedo;
window.resetUndoRedo = resetUndoRedo;

// ===== IA MELHORAR TEXTO =====
let aiImprovedText = '';

function openAiImproveModal() {
    const textInput = document.getElementById('noteTextInput');

    console.log('🔵 [AI Notes] textInput element:', textInput);

    if (!textInput) {
        console.error('🔴 [AI Notes] noteTextInput não encontrado!');
        if (typeof showToast === 'function') {
            showToast('Erro: editor não encontrado');
        }
        return;
    }

    // Pegar texto puro sem HTML
    const originalText = textInput.innerText.trim();

    console.log('🔵 [AI Notes] Texto capturado:', originalText);
    console.log('🔵 [AI Notes] innerHTML:', textInput.innerHTML);

    if (!originalText) {
        if (typeof showToast === 'function') {
            showToast('Escreva algo para melhorar com IA');
        }
        return;
    }

    const modal = document.getElementById('aiImproveModal');
    const loadingEl = document.getElementById('aiImproveLoading');
    const resultEl = document.getElementById('aiImproveResult');
    const actionsEl = document.getElementById('aiImproveActions');

    console.log('🔵 [AI Notes] Modal:', modal);
    console.log('🔵 [AI Notes] Loading:', loadingEl);

    if (!modal) {
        console.error('🔴 [AI Notes] Modal não encontrado!');
        if (typeof showToast === 'function') {
            showToast('Erro: modal não encontrado');
        }
        return;
    }

    // Mostrar loading, esconder resultado
    if (loadingEl) loadingEl.style.display = 'flex';
    if (resultEl) {
        resultEl.style.display = 'none';
        resultEl.classList.remove('active');
    }
    if (actionsEl) actionsEl.classList.remove('active');
    aiImprovedText = '';

    // Abrir modal
    modal.classList.add('active');

    console.log('🔵 [AI Notes] Modal aberto, chamando API...');
    console.log('🔵 [AI Notes] getModelName disponível:', typeof getModelName);
    console.log('🔵 [AI Notes] getApiKey disponível:', typeof getApiKey);

    // Chamar API de IA
    improveTextWithAI(originalText).then(improvedText => {
        console.log('🟢 [AI Notes] Texto melhorado recebido:', improvedText);
        aiImprovedText = improvedText;
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="ai-result-label">Resultado</div>
                <div class="ai-result-text">${improvedText}</div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('active');
        }
        if (loadingEl) loadingEl.style.display = 'none';
        if (actionsEl) actionsEl.classList.add('active');
    }).catch(error => {
        console.error('🔴 [AI Notes] Erro ao melhorar texto:', error);
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="ai-result-label">Erro</div>
                <div class="ai-result-text">${error.message || 'Não foi possível processar o texto. Verifique sua conexão e tente novamente.'}</div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('active');
        }
        if (loadingEl) loadingEl.style.display = 'none';
        if (actionsEl) actionsEl.classList.add('active');
    });
}

function closeAiImproveModal() {
    const modal = document.getElementById('aiImproveModal');
    if (!modal) return;

    modal.classList.remove('active');
    aiImprovedText = '';
}

function applyAiImprovedText() {
    if (!aiImprovedText) return;

    const textInput = document.getElementById('noteTextInput');
    if (!textInput) return;

    // Substituir o texto mantendo formatação básica (parágrafos)
    const paragraphs = aiImprovedText.split('\n').filter(p => p.trim());
    const htmlContent = paragraphs.map(p => `<p>${p}</p>`).join('');
    textInput.innerHTML = htmlContent || `<p>${aiImprovedText}</p>`;

    closeAiImproveModal();

    if (typeof vibrateOnClick === 'function') vibrateOnClick();
    if (typeof showToast === 'function') {
        showToast('Texto aplicado!');
    }
}

// Função para chamar a API de IA
async function improveTextWithAI(text) {
    console.log('🔵 [AI Notes] Iniciando improveTextWithAI');
    console.log('🔵 [AI Notes] Texto recebido:', text);

    // Usar o modelo e API configurados no app
    const modelName = typeof getModelName === 'function' ? getModelName() : 'gemini-2.5-flash';
    const apiKey = typeof getApiKey === 'function' ? getApiKey() : null;
    const provider = typeof getModelProvider === 'function' ? getModelProvider(modelName) : 'gemini';

    console.log('🔵 [AI Notes] Modelo:', modelName);
    console.log('🔵 [AI Notes] Provider:', provider);
    console.log('🔵 [AI Notes] API Key existe:', !!apiKey);
    console.log('🔵 [AI Notes] getApiUrl disponível:', typeof getApiUrl);

    if (!apiKey) {
        throw new Error('API key não configurada. Configure nas configurações do app.');
    }

    const prompt = `Melhore o seguinte texto corrigindo:
- Erros de acentuação e ortografia
- Problemas de pontuação
- Organização e clareza das ideias
- Coesão e coerência textual

Mantenha o sentido original e o tom do texto. Retorne APENAS o texto melhorado, sem explicações ou comentários adicionais.

Texto original:
${text}`;

    console.log('🔵 [AI Notes] Prompt criado, fazendo requisição...');

    // Helper para obter URL (com proxy se necessário)
    const buildUrl = (url) => {
        if (typeof getApiUrl === 'function') {
            return getApiUrl(url);
        }
        return url;
    };

    try {
        let improvedText = null;

        if (provider === 'gemini') {
            // Gemini API
            const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const geminiUrl = buildUrl(baseUrl);

            console.log('🔵 [AI Notes] Gemini URL (masked):', geminiUrl.substring(0, 50) + '...');

            const res = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
                })
            });

            console.log('🔵 [AI Notes] Gemini response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('🔴 [AI Notes] Gemini error:', errorText);
                throw new Error('Erro na API Gemini: ' + res.status);
            }
            const json = await res.json();
            console.log('🟢 [AI Notes] Gemini response OK');
            improvedText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        } else if (provider === 'openai') {
            // OpenAI API
            console.log('🔵 [AI Notes] Chamando OpenAI...');
            const openaiUrl = buildUrl('https://api.openai.com/v1/chat/completions');
            const res = await fetch(openaiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2048
                })
            });
            console.log('🔵 [AI Notes] OpenAI response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('🔴 [AI Notes] OpenAI error:', errorText);
                throw new Error('Erro na API OpenAI: ' + res.status);
            }
            const json = await res.json();
            improvedText = json.choices?.[0]?.message?.content?.trim();

        } else if (provider === 'anthropic') {
            // Anthropic API
            console.log('🔵 [AI Notes] Chamando Anthropic...');
            const anthropicUrl = buildUrl('https://api.anthropic.com/v1/messages');
            const res = await fetch(anthropicUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: modelName,
                    max_tokens: 2048,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            console.log('🔵 [AI Notes] Anthropic response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('🔴 [AI Notes] Anthropic error:', errorText);
                throw new Error('Erro na API Anthropic: ' + res.status);
            }
            const json = await res.json();
            improvedText = json.content?.[0]?.text?.trim();

        } else if (provider === 'groq') {
            // Groq API
            console.log('🔵 [AI Notes] Chamando Groq...');
            const groqUrl = buildUrl('https://api.groq.com/openai/v1/chat/completions');
            const res = await fetch(groqUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2048
                })
            });
            console.log('🔵 [AI Notes] Groq response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('🔴 [AI Notes] Groq error:', errorText);
                throw new Error('Erro na API Groq: ' + res.status);
            }
            const json = await res.json();
            improvedText = json.choices?.[0]?.message?.content?.trim();

        } else if (provider === 'openrouter') {
            // OpenRouter API
            console.log('🔵 [AI Notes] Chamando OpenRouter...');
            const openrouterUrl = buildUrl('https://openrouter.ai/api/v1/chat/completions');
            const res = await fetch(openrouterUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2048
                })
            });
            console.log('🔵 [AI Notes] OpenRouter response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('🔴 [AI Notes] OpenRouter error:', errorText);
                throw new Error('Erro na API OpenRouter: ' + res.status);
            }
            const json = await res.json();
            improvedText = json.choices?.[0]?.message?.content?.trim();

        } else {
            // DeepSeek (default)
            console.log('🔵 [AI Notes] Chamando DeepSeek...');
            const deepseekUrl = buildUrl('https://api.deepseek.com/v1/chat/completions');
            const res = await fetch(deepseekUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2048
                })
            });
            console.log('🔵 [AI Notes] DeepSeek response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('🔴 [AI Notes] DeepSeek error:', errorText);
                throw new Error('Erro na API DeepSeek: ' + res.status);
            }
            const json = await res.json();
            improvedText = json.choices?.[0]?.message?.content?.trim();
        }

        if (!improvedText) {
            throw new Error('Resposta vazia da API');
        }

        console.log('🟢 [AI Notes] Texto melhorado com sucesso!');
        return improvedText;

    } catch (error) {
        console.error('🔴 [AI Notes] Erro na API:', error);
        throw error;
    }
}

// Expor funções de IA
window.openAiImproveModal = openAiImproveModal;
window.closeAiImproveModal = closeAiImproveModal;
window.applyAiImprovedText = applyAiImprovedText;

// ===== SISTEMA DE TRANSCRIÇÃO DE REUNIÕES/AULAS =====

// Estado da transcrição
let transcriptionRecognition = null;
let isTranscribing = false;
let transcriptionText = '';
let transcriptionStartTime = null;
let transcriptionTimerInterval = null;
let transcriptionSegments = [];
let lastAddedTranscript = ''; // Para evitar duplicação
let lastProcessedResultIndex = -1; // Índice do último resultado final processado

// Elementos DOM
const transcriptionPage = document.getElementById('transcriptionPage');
const transcriptionBackBtn = document.getElementById('transcriptionBackBtn');
const transcriptionClearBtn = document.getElementById('transcriptionClearBtn');
const transcriptionScreenOffBtn = document.getElementById('transcriptionScreenOffBtn');
const transcriptionStatus = document.getElementById('transcriptionStatus');
const transcriptionTimer = document.getElementById('transcriptionTimer');
const transcriptionTextEl = document.getElementById('transcriptionText');
const transcriptionPlaceholder = document.getElementById('transcriptionPlaceholder');
const startTranscriptionBtn = document.getElementById('startTranscriptionBtn');
const summarizeTranscriptionBtn = document.getElementById('summarizeTranscriptionBtn');
const fakeScreenOff = document.getElementById('fakeScreenOff');

// Estado da tela falsa desligada
let screenOffHoldTimer = null;
let screenOffHoldStart = 0;

// Abrir página de transcrição
function openTranscriptionPage() {
    if (!transcriptionPage) return;
    transcriptionPage.classList.add('open');
    transcriptionPage.setAttribute('aria-hidden', 'false');
    // Adicionar estado no histórico para botão voltar funcionar
    history.pushState({ transcriptionPageOpen: true }, '', '');
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// Fechar página de transcrição
function closeTranscriptionPage() {
    if (!transcriptionPage) return;
    
    // Parar transcrição se estiver ativa
    if (isTranscribing) {
        stopTranscription();
    }
    
    // Salvar automaticamente se tiver conteúdo
    if (transcriptionText.trim().length > 0) {
        saveTranscriptionAsNote(true); // true = silencioso (sem toast)
    }
    
    transcriptionPage.classList.add('closing');
    setTimeout(() => {
        transcriptionPage.classList.remove('open', 'closing');
        transcriptionPage.setAttribute('aria-hidden', 'true');
        // Atualizar lista de notas e histórico de transcrições após fechar
        if (typeof renderNotes === 'function') {
            renderNotes();
        }
        if (typeof renderTranscriptionsHistory === 'function') {
            renderTranscriptionsHistory();
        }
    }, 350);
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// Inicializar reconhecimento de voz para transcrição
function initTranscriptionRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('❌ [Transcription] Web Speech Recognition não disponível');
        if (startTranscriptionBtn) {
            startTranscriptionBtn.disabled = true;
            startTranscriptionBtn.querySelector('.btn-hint').textContent = 'Não suportado';
        }
        return;
    }
    
    transcriptionRecognition = new SpeechRecognition();
    transcriptionRecognition.lang = 'pt-BR';
    transcriptionRecognition.continuous = false; // Usar false para evitar duplicação - reinicia automaticamente no onend
    transcriptionRecognition.interimResults = true;
    transcriptionRecognition.maxAlternatives = 1;
    
    transcriptionRecognition.onstart = () => {
        console.log('🎤 [Transcription] Iniciado');
        isTranscribing = true;
        updateTranscriptionUI();
    };
    
    transcriptionRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalText = '';
        
        // Processar todos os resultados (como no mic-voice.js)
        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalText += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript = event.results[i][0].transcript;
            }
        }
        
        // Adicionar texto final
        if (finalText.trim()) {
            addTranscriptionSegment(finalText.trim());
        }
        
        // Atualizar display com texto provisório
        renderTranscriptionText(interimTranscript);
    };
    
    transcriptionRecognition.onerror = (event) => {
        console.error('❌ [Transcription] Erro:', event.error);
        
        if (event.error === 'no-speech') {
            // Sem fala detectada - continuar escutando
            if (isTranscribing) {
                setTimeout(() => {
                    if (isTranscribing) {
                        try {
                            transcriptionRecognition.start();
                        } catch (e) {
                            console.warn('[Transcription] Erro ao reiniciar:', e);
                        }
                    }
                }, 100);
            }
            return;
        }
        
        if (event.error === 'aborted') {
            return; // Ignorar quando é cancelado intencionalmente
        }
        
        // Erro crítico - parar
        stopTranscription();
    };
    
    transcriptionRecognition.onend = () => {
        console.log('⏹ [Transcription] Parou');
        
        // Reiniciar automaticamente se ainda estiver no modo de transcrição
        if (isTranscribing) {
            setTimeout(() => {
                if (isTranscribing) {
                    try {
                        // Resetar índice antes de reiniciar para evitar duplicação
                        lastProcessedResultIndex = -1;
                        transcriptionRecognition.start();
                    } catch (e) {
                        console.warn('[Transcription] Erro ao reiniciar:', e);
                        stopTranscription();
                    }
                }
            }, 100);
        }
    };
    
    console.log('✅ [Transcription] Reconhecimento inicializado');
}

// Iniciar transcrição
function startTranscription() {
    if (!transcriptionRecognition) {
        initTranscriptionRecognition();
    }
    
    if (!transcriptionRecognition) {
        alert('Reconhecimento de voz não disponível neste dispositivo');
        return;
    }
    
    // Solicitar permissão no Android
    if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
        cordova.plugins.permissions.requestPermission(
            cordova.plugins.permissions.RECORD_AUDIO,
            function(status) {
                if (status.hasPermission) {
                    doStartTranscription();
                } else {
                    alert('Permissão de microfone negada');
                }
            },
            function() {
                console.error('[Transcription] Erro ao solicitar permissão');
                doStartTranscription(); // Tentar mesmo assim
            }
        );
    } else {
        doStartTranscription();
    }
}

function doStartTranscription() {
    try {
        // Resetar rastreamento de duplicação
        lastProcessedResultIndex = -1;
        lastAddedTranscript = '';
        
        transcriptionRecognition.start();
        transcriptionStartTime = Date.now();
        startTranscriptionTimer();
        isTranscribing = true;
        updateTranscriptionUI();
        
        // Esconder placeholder
        if (transcriptionPlaceholder) {
            transcriptionPlaceholder.style.display = 'none';
        }
        
        if (typeof vibrateOnClick === 'function') vibrateOnClick();
        console.log('🎤 [Transcription] Transcrição iniciada');
    } catch (e) {
        console.error('[Transcription] Erro ao iniciar:', e);
    }
}

// Parar transcrição
function stopTranscription() {
    if (transcriptionRecognition) {
        try {
            transcriptionRecognition.stop();
        } catch (e) {
            console.warn('[Transcription] Erro ao parar:', e);
        }
    }
    
    isTranscribing = false;
    stopTranscriptionTimer();
    updateTranscriptionUI();
    
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
    console.log('⏹ [Transcription] Transcrição parada');
}

// Timer da transcrição
function startTranscriptionTimer() {
    if (transcriptionTimerInterval) {
        clearInterval(transcriptionTimerInterval);
    }
    
    transcriptionTimerInterval = setInterval(() => {
        if (!transcriptionStartTime) return;
        
        const elapsed = Date.now() - transcriptionStartTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (transcriptionTimer) {
            transcriptionTimer.textContent = timeStr;
        }
    }, 1000);
}

function stopTranscriptionTimer() {
    if (transcriptionTimerInterval) {
        clearInterval(transcriptionTimerInterval);
        transcriptionTimerInterval = null;
    }
}

// Atualizar UI
function updateTranscriptionUI() {
    if (startTranscriptionBtn) {
        if (isTranscribing) {
            startTranscriptionBtn.classList.add('recording');
            startTranscriptionBtn.querySelector('.btn-icon i').className = 'fa-solid fa-stop';
            startTranscriptionBtn.querySelector('.btn-label').textContent = 'Parar';
            startTranscriptionBtn.querySelector('.btn-hint').textContent = 'Toque para parar';
        } else {
            startTranscriptionBtn.classList.remove('recording');
            startTranscriptionBtn.querySelector('.btn-icon i').className = 'fa-solid fa-microphone';
            startTranscriptionBtn.querySelector('.btn-label').textContent = 'Transcrever';
            startTranscriptionBtn.querySelector('.btn-hint').textContent = 'Toque para iniciar';
        }
    }
    
    if (transcriptionStatus) {
        if (isTranscribing) {
            transcriptionStatus.classList.add('recording');
            transcriptionStatus.querySelector('span').textContent = 'Gravando...';
        } else {
            transcriptionStatus.classList.remove('recording');
            transcriptionStatus.querySelector('span').textContent = transcriptionText.trim().length > 0 ? 'Pausado' : 'Pronto para transcrever';
        }
    }
    
    // Habilitar/desabilitar botão de resumir
    if (summarizeTranscriptionBtn) {
        const hasContent = transcriptionText.trim().length > 0;
        summarizeTranscriptionBtn.disabled = !hasContent || isTranscribing;
    }
    
    // Habilitar/desabilitar botão de limpar
    if (transcriptionClearBtn) {
        const hasContent = transcriptionText.trim().length > 0;
        transcriptionClearBtn.disabled = !hasContent;
    }
}

// Adicionar segmento de transcrição (texto contínuo)
function addTranscriptionSegment(text) {
    if (!text.trim()) return;
    
    const cleanText = text.trim();
    
    // Evitar duplicação - verificar se é o mesmo texto que o último adicionado
    if (cleanText === lastAddedTranscript) {
        console.log('[Transcription] Texto duplicado ignorado');
        return;
    }
    
    lastAddedTranscript = cleanText;
    
    // Adicionar ao texto contínuo com espaço
    if (transcriptionText.length > 0) {
        transcriptionText += ' ' + cleanText;
    } else {
        transcriptionText = cleanText;
    }
    
    // Manter segmentos para histórico (usado no resumo)
    const now = new Date();
    transcriptionSegments.push({
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: cleanText
    });
    
    console.log('[Transcription] Adicionado:', cleanText.substring(0, 50) + '...');
    
    // Renderizar texto contínuo
    renderTranscriptionText();
    updateTranscriptionUI();
}


// Atualizar display com texto provisório
function updateTranscriptionDisplay(interimText) {
    renderTranscriptionText(interimText);
}

// Renderizar texto contínuo (sem cards separados)
function renderTranscriptionText(interimText = '') {
    if (!transcriptionTextEl) return;
    
    // Se não há texto, mostrar placeholder
    if (transcriptionText.trim().length === 0 && !interimText) {
        if (transcriptionPlaceholder) {
            transcriptionPlaceholder.style.display = '';
        }
        transcriptionTextEl.innerHTML = '';
        if (transcriptionPlaceholder) {
            transcriptionTextEl.appendChild(transcriptionPlaceholder);
        }
        return;
    }
    
    // Esconder placeholder
    if (transcriptionPlaceholder) {
        transcriptionPlaceholder.style.display = 'none';
    }
    
    // Montar texto contínuo
    let fullText = transcriptionText.trim();
    
    // Adicionar texto provisório em destaque
    if (interimText) {
        fullText += ' <span class="interim-text">' + escapeHtml(interimText) + '...</span>';
    }
    
    // Renderizar como texto simples com quebras de linha naturais
    transcriptionTextEl.innerHTML = `<div class="transcript-continuous">${fullText.replace(/\n/g, '<br>')}</div>`;
    
    // Scroll suave para o final
    const content = document.getElementById('transcriptionContent');
    if (content) {
        content.scrollTop = content.scrollHeight;
    }
}

// Renderizar segmentos (mantido para compatibilidade, mas redireciona)
function renderTranscriptionSegments(interimText = '') {
    renderTranscriptionText(interimText);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Limpar transcrição
function clearTranscription() {
    if (transcriptionText.trim().length === 0) return;
    
    if (confirm('Deseja limpar toda a transcrição?')) {
        transcriptionSegments = [];
        transcriptionText = '';
        transcriptionStartTime = null;
        lastAddedTranscript = '';
        lastProcessedResultIndex = -1;
        
        if (transcriptionTimer) {
            transcriptionTimer.textContent = '00:00:00';
        }
        
        renderTranscriptionText();
        updateTranscriptionUI();
        
        if (typeof vibrateOnClick === 'function') vibrateOnClick();
    }
}

// Resumir com IA
async function summarizeTranscription() {
    if (transcriptionText.trim().length === 0) {
        alert('Nenhum texto para resumir');
        return;
    }
    
    // Usar texto completo
    const fullText = transcriptionText.trim();
    
    if (fullText.length < 50) {
        alert('Texto muito curto para resumir');
        return;
    }
    
    // Verificar API
    const apiKey = typeof getApiKey === 'function' ? getApiKey() : null;
    if (!apiKey) {
        alert('Configure uma API de IA nas configurações para usar o resumo');
        return;
    }
    
    // UI de loading
    if (summarizeTranscriptionBtn) {
        summarizeTranscriptionBtn.classList.add('processing');
        summarizeTranscriptionBtn.disabled = true;
        summarizeTranscriptionBtn.querySelector('.btn-label').textContent = 'Analisando...';
        summarizeTranscriptionBtn.querySelector('.btn-icon i').className = 'fa-solid fa-spinner';
    }
    
    try {
        const summary = await callSummarizeAPI(fullText, apiKey);
        
        if (summary) {
            // Adicionar resumo à tela
            displaySummary(summary);
        }
    } catch (error) {
        console.error('[Transcription] Erro ao resumir:', error);
        alert('Erro ao gerar resumo: ' + error.message);
    } finally {
        // Restaurar UI
        if (summarizeTranscriptionBtn) {
            summarizeTranscriptionBtn.classList.remove('processing');
            summarizeTranscriptionBtn.disabled = false;
            summarizeTranscriptionBtn.querySelector('.btn-label').textContent = 'Resumir com IA';
            summarizeTranscriptionBtn.querySelector('.btn-icon i').className = 'fa-solid fa-wand-magic-sparkles';
        }
    }
}

// Chamar API para resumir
async function callSummarizeAPI(text, apiKey) {
    const modelName = typeof getModelName === 'function' ? getModelName() : 'gemini-2.5-flash';
    const provider = typeof getModelProvider === 'function' ? getModelProvider(modelName) : 'gemini';
    
    const prompt = `Você é um assistente especializado em resumir transcrições de reuniões e aulas.

Analise o texto transcrito abaixo e gere um resumo estruturado com:
1. **Resumo Geral** (2-3 frases do contexto principal)
2. **Pontos Principais** (lista com os tópicos mais importantes)
3. **Ações/Tarefas** (se houver menção de ações ou tarefas a fazer)
4. **Conclusões** (se houver)

Seja conciso mas completo. Use português brasileiro.

TRANSCRIÇÃO:
${text}

RESUMO:`;

    let summary = null;
    
    if (provider === 'gemini') {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
            })
        });
        
        if (!res.ok) throw new Error('Erro na API Gemini');
        const json = await res.json();
        summary = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
    } else if (provider === 'deepseek') {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 2048
            })
        });
        
        if (!res.ok) throw new Error('Erro na API DeepSeek');
        const json = await res.json();
        summary = json.choices?.[0]?.message?.content?.trim();
        
    } else if (provider === 'openai' || provider === 'groq') {
        const baseUrl = provider === 'groq' 
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';
        
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({
                model: provider === 'groq' ? 'llama-3.1-70b-versatile' : modelName,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 2048
            })
        });
        
        if (!res.ok) throw new Error('Erro na API');
        const json = await res.json();
        summary = json.choices?.[0]?.message?.content?.trim();
    }
    
    return summary;
}

// Exibir resumo na tela
function displaySummary(summary) {
    if (!transcriptionTextEl) return;
    
    // Converter markdown básico para HTML
    let html = summary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n- /g, '\n• ')
        .replace(/\n/g, '<br>');
    
    const summaryHtml = `
        <div class="transcription-summary">
            <div class="transcription-summary-header">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <span>Resumo da IA</span>
            </div>
            <div class="transcription-summary-content">${html}</div>
        </div>
    `;
    
    // Adicionar após os segmentos
    transcriptionTextEl.innerHTML += summaryHtml;
    
    // Scroll para o resumo
    const content = document.getElementById('transcriptionContent');
    if (content) {
        content.scrollTop = content.scrollHeight;
    }
}

// Event Listeners para Transcrição
function setupTranscriptionListeners() {
    // Botão de voltar
    if (transcriptionBackBtn) {
        transcriptionBackBtn.addEventListener('click', closeTranscriptionPage);
    }
    
    // Botão de limpar
    if (transcriptionClearBtn) {
        transcriptionClearBtn.addEventListener('click', clearTranscription);
    }
    
    // Botão de tela falsa desligada
    if (transcriptionScreenOffBtn) {
        transcriptionScreenOffBtn.addEventListener('click', activateFakeScreenOff);
    }
    
    // Eventos da tela falsa desligada
    if (fakeScreenOff) {
        // Touch events
        fakeScreenOff.addEventListener('touchstart', handleScreenOffTouchStart, { passive: false });
        fakeScreenOff.addEventListener('touchend', handleScreenOffTouchEnd);
        fakeScreenOff.addEventListener('touchcancel', handleScreenOffTouchEnd);
        
        // Mouse events (para teste no navegador)
        fakeScreenOff.addEventListener('mousedown', handleScreenOffTouchStart);
        fakeScreenOff.addEventListener('mouseup', handleScreenOffTouchEnd);
        fakeScreenOff.addEventListener('mouseleave', handleScreenOffTouchEnd);
    }
    
    // Botão de iniciar/parar
    if (startTranscriptionBtn) {
        startTranscriptionBtn.addEventListener('click', () => {
            if (isTranscribing) {
                stopTranscription();
            } else {
                startTranscription();
            }
        });
    }
    
    // Botão de resumir
    if (summarizeTranscriptionBtn) {
        summarizeTranscriptionBtn.addEventListener('click', summarizeTranscription);
    }
    
    console.log('✅ [Transcription] Event listeners configurados');
}

// ===== SALVAR TRANSCRIÇÃO COMO NOTA =====
function saveTranscriptionAsNote(silent = false) {
    if (!transcriptionText.trim()) {
        if (!silent) alert('Nenhuma transcrição para salvar');
        return;
    }
    
    // Gerar título automático com data/hora
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const title = `Transcrição ${dateStr} ${timeStr}`;
    
    // Criar nota com marcador de transcrição
    const note = {
        id: 'note_' + Date.now(),
        title: title,
        content: transcriptionText.trim(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        color: '#8B5CF6', // Roxo para diferenciar transcrições
        pinned: false,
        isTranscription: true // Marcador para identificar transcrições
    };
    
    // Adicionar ao array de notas
    if (typeof notes === 'undefined' || !Array.isArray(notes)) {
        console.error('[Transcription] Array notes não encontrado');
        return;
    }
    
    notes.unshift(note);
    
    // Salvar no localStorage
    if (typeof saveNotes === 'function') {
        saveNotes();
    } else {
        // Fallback direto
        localStorage.setItem('neo_notes', JSON.stringify(notes));
    }
    
    console.log('[Transcription] Nota salva com sucesso! Total de notas:', notes.length);
    
    // Limpar transcrição após salvar
    transcriptionSegments = [];
    transcriptionText = '';
    lastAddedTranscript = '';
    lastProcessedResultIndex = -1;
    transcriptionStartTime = null;
    
    if (transcriptionTimer) {
        transcriptionTimer.textContent = '00:00:00';
    }
    
    renderTranscriptionText();
    updateTranscriptionUI();
    
    // Feedback
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
    
    // Mostrar confirmação (apenas se não for silencioso)
    if (!silent) {
        const toast = document.createElement('div');
        toast.className = 'transcription-toast';
        toast.innerHTML = '<i class="fa-solid fa-check"></i> Salvo em Anotações';
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.95);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 500;
            z-index: 100000;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: fadeInUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOutDown 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    console.log('[Transcription] Nota salva:', title);
}

// ===== TELA FALSA DESLIGADA =====
function activateFakeScreenOff() {
    if (!fakeScreenOff) return;
    
    // Ativar tela preta (transcrição continua em background)
    fakeScreenOff.classList.add('active');
    
    // Tentar fullscreen e esconder barras do sistema
    enterImmersiveMode();
    
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
    console.log('[Transcription] Tela falsa ativada - transcrição continua');
}

function deactivateFakeScreenOff() {
    if (!fakeScreenOff) return;
    
    fakeScreenOff.classList.remove('active');
    
    // Sair do modo imersivo
    exitImmersiveMode();
    
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
    console.log('[Transcription] Tela falsa desativada');
}

function handleScreenOffTouchStart(e) {
    e.preventDefault();
    
    screenOffHoldStart = Date.now();
    
    // Timer para verificar os 3 segundos
    screenOffHoldTimer = setTimeout(() => {
        deactivateFakeScreenOff();
    }, 3000);
}

function handleScreenOffTouchEnd() {
    // Cancelar timer se soltar antes dos 3 segundos
    if (screenOffHoldTimer) {
        clearTimeout(screenOffHoldTimer);
        screenOffHoldTimer = null;
    }
}

// Modo imersivo (esconder barras do sistema)
function enterImmersiveMode() {
    // Usar plugin cordova-plugin-fullscreen
    if (typeof AndroidFullScreen !== 'undefined') {
        // Modo imersivo completo - esconde status bar e navigation bar
        AndroidFullScreen.immersiveMode(
            () => console.log('[Immersive] Modo imersivo ativado'),
            (err) => console.warn('[Immersive] Erro no immersiveMode:', err)
        );
    } else if (window.AndroidFullScreen) {
        window.AndroidFullScreen.immersiveMode(
            () => console.log('[Immersive] Modo imersivo ativado (window)'),
            (err) => console.warn('[Immersive] Erro:', err)
        );
    } else {
        console.warn('[Immersive] Plugin AndroidFullScreen não disponível');
        // Fallback: tentar Web Fullscreen API
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    }
}

function exitImmersiveMode() {
    // Sair do modo imersivo Android
    if (typeof AndroidFullScreen !== 'undefined') {
        AndroidFullScreen.showSystemUI(
            () => console.log('[Immersive] Barras restauradas'),
            (err) => console.warn('[Immersive] Erro ao restaurar:', err)
        );
    } else if (window.AndroidFullScreen) {
        window.AndroidFullScreen.showSystemUI(
            () => console.log('[Immersive] Barras restauradas (window)'),
            (err) => console.warn('[Immersive] Erro:', err)
        );
    } else {
        // Fallback: sair do fullscreen web
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

// Inicializar transcrição
function initTranscription() {
    setupTranscriptionListeners();
    initTranscriptionRecognition();
    console.log('✅ [Transcription] Sistema inicializado');
}

// ===== MODAL DE VISUALIZAÇÃO DE TRANSCRIÇÃO =====
function openTranscriptionModal(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.isTranscription) return;

    const modal = document.getElementById('transcriptionModal');
    const modalTitle = document.querySelector('.transcription-modal-title');
    const modalDate = document.querySelector('.transcription-modal-date');
    const modalContent = document.getElementById('transcriptionModalContent');

    if (!modal || !modalTitle || !modalDate || !modalContent) {
        console.error('Elementos do modal de transcrição não encontrados');
        return;
    }

    // Preenchendo dados do modal
    modalTitle.textContent = note.title || 'Transcrição sem título';
    
    const createdDate = new Date(note.createdAt);
    const dateStr = createdDate.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
    });
    const timeStr = createdDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    modalDate.textContent = `${dateStr} às ${timeStr}`;
    
    // Exibindo conteúdo completo
    modalContent.textContent = note.content;
    
    // Mostrando modal com animação
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    // Adicionar estado no histórico para botão voltar funcionar
    history.pushState({ transcriptionModalOpen: true }, '', '');
    
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

function closeTranscriptionModal() {
    const modal = document.getElementById('transcriptionModal');
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    
    // Limpar conteúdo
    const modalContent = document.getElementById('transcriptionModalContent');
    if (modalContent) {
        modalContent.textContent = '';
    }
    
    if (typeof vibrateOnClick === 'function') vibrateOnClick();
}

// Fechar modal ao clicar no overlay ou botão de fechar
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('transcriptionModal');
    const closeBtn = document.querySelector('.transcription-modal-close');
    
    if (modal) {
        // Fechar ao clicar no overlay (fora do modal)
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeTranscriptionModal();
            }
        });
    }
    
    if (closeBtn) {
        // Fechar ao clicar no botão X
        closeBtn.addEventListener('click', closeTranscriptionModal);
    }
});

// Chamar init quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranscription);
} else {
    initTranscription();
}

// Expor funções globalmente
window.openTranscriptionPage = openTranscriptionPage;
window.closeTranscriptionPage = closeTranscriptionPage;
window.startTranscription = startTranscription;
window.stopTranscription = stopTranscription;
window.clearTranscription = clearTranscription;
window.summarizeTranscription = summarizeTranscription;
window.saveTranscriptionAsNote = saveTranscriptionAsNote;
window.activateFakeScreenOff = activateFakeScreenOff;
window.openTranscriptionModal = openTranscriptionModal;
window.closeTranscriptionModal = closeTranscriptionModal;

// ===== DOWNLOAD DE NOTAS =====
function openNoteDownloadMenu() {
    const overlay = document.getElementById('noteDownloadMenuOverlay');
    if (overlay) {
        overlay.classList.add('open');
        if (typeof vibrate === 'function') vibrate(10);
    }
}

function closeNoteDownloadMenu(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('noteDownloadMenuOverlay');
    if (overlay) {
        overlay.classList.remove('open');
    }
}

async function downloadNoteAsPDF() {
    closeNoteDownloadMenu();
    
    const titleInput = document.getElementById('noteTitleInput');
    const textInput = document.getElementById('noteTextInput');
    
    if (!textInput) {
        if (typeof showToast === 'function') showToast('Erro ao obter conteúdo');
        return;
    }
    
    const title = titleInput?.value?.trim() || 'Nota sem título';
    const content = textInput.innerText.trim();
    
    if (!content) {
        if (typeof showToast === 'function') showToast('A nota está vazia');
        return;
    }
    
    try {
        if (typeof showToast === 'function') showToast('Gerando PDF...');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;
        
        // Título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(title, maxWidth);
        doc.text(titleLines, margin, yPosition);
        yPosition += (titleLines.length * 8) + 10;
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        // Data
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        doc.text(dateStr, margin, yPosition);
        yPosition += 10;
        
        // Conteúdo
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const paragraphs = content.split('\n');
        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                yPosition += 4;
                continue;
            }
            
            const lines = doc.splitTextToSize(paragraph, maxWidth);
            
            // Verificar quebra de página
            if (yPosition + (lines.length * 5) > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            
            doc.text(lines, margin, yPosition);
            yPosition += (lines.length * 5) + 3;
        }
        
        // Rodapé
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Gerado por NEO', margin, pageHeight - 10);
        
        // Salvar
        const filename = title.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s]/g, '').replace(/\s+/g, '-').toLowerCase().substring(0, 50) || 'nota';
        
        // Usar cordova-plugin-file para salvar
        if (typeof cordova !== 'undefined' && cordova.file) {
            const pdfBlob = doc.output('blob');
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64 = reader.result.split(',')[1];
                saveFileToDownloads(filename + '.pdf', base64, 'application/pdf');
            };
            reader.readAsDataURL(pdfBlob);
        } else {
            doc.save(filename + '.pdf');
        }
        
        if (typeof showToast === 'function') showToast('PDF salvo com sucesso!');
        if (typeof vibrate === 'function') vibrate(50);
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        if (typeof showToast === 'function') showToast('Erro ao gerar PDF');
    }
}

async function downloadNoteAsPNG() {
    closeNoteDownloadMenu();
    
    const titleInput = document.getElementById('noteTitleInput');
    const textInput = document.getElementById('noteTextInput');
    
    if (!textInput) {
        if (typeof showToast === 'function') showToast('Erro ao obter conteúdo');
        return;
    }
    
    const title = titleInput?.value?.trim() || 'Nota sem título';
    const content = textInput.innerText.trim();
    
    if (!content) {
        if (typeof showToast === 'function') showToast('A nota está vazia');
        return;
    }
    
    try {
        if (typeof showToast === 'function') showToast('Gerando imagem...');
        
        // Criar canvas off-screen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const padding = 40;
        const width = 800;
        const lineHeight = 28;
        const titleSize = 28;
        const contentSize = 18;
        const dateSize = 14;
        
        // Calcular altura necessária
        ctx.font = `${contentSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const lines = wrapText(ctx, content, width - (padding * 2));
        const totalHeight = padding + titleSize + 20 + dateSize + 30 + (lines.length * lineHeight) + padding;
        
        canvas.width = width;
        canvas.height = totalHeight;
        
        // Fundo
        const isDark = document.body.classList.contains('theme-dark') || !document.body.classList.contains('theme-light');
        ctx.fillStyle = isDark ? '#1a1a1a' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Título
        ctx.font = `bold ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.fillText(title, padding, padding + titleSize);
        
        // Data
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        ctx.font = `${dateSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        ctx.fillText(dateStr, padding, padding + titleSize + 25);
        
        // Linha separadora
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding + titleSize + 40);
        ctx.lineTo(width - padding, padding + titleSize + 40);
        ctx.stroke();
        
        // Conteúdo
        ctx.font = `${contentSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
        
        let y = padding + titleSize + 60;
        for (const line of lines) {
            ctx.fillText(line, padding, y);
            y += lineHeight;
        }
        
        // Converter para blob e salvar
        canvas.toBlob(async (blob) => {
            const filename = title.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s]/g, '').replace(/\s+/g, '-').toLowerCase().substring(0, 50) || 'nota';
            
            if (typeof cordova !== 'undefined' && cordova.file) {
                const reader = new FileReader();
                reader.onloadend = function() {
                    const base64 = reader.result.split(',')[1];
                    saveFileToDownloads(filename + '.png', base64, 'image/png');
                };
                reader.readAsDataURL(blob);
            } else {
                // Fallback para web
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename + '.png';
                a.click();
                URL.revokeObjectURL(url);
            }
            
            if (typeof showToast === 'function') showToast('Imagem salva com sucesso!');
            if (typeof vibrate === 'function') vibrate(50);
        }, 'image/png');
        
    } catch (error) {
        console.error('Erro ao gerar PNG:', error);
        if (typeof showToast === 'function') showToast('Erro ao gerar imagem');
    }
}

// Função auxiliar para quebrar texto em linhas
function wrapText(ctx, text, maxWidth) {
    const paragraphs = text.split('\n');
    const lines = [];
    
    for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
            lines.push('');
            continue;
        }
        
        const words = paragraph.split(' ');
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
    }
    
    return lines;
}

// Função para salvar arquivo na pasta Downloads do Android
function saveFileToDownloads(filename, base64Data, mimeType) {
    if (typeof cordova === 'undefined' || !cordova.file) {
        console.error('cordova.file não disponível');
        return;
    }
    
    const folderPath = cordova.file.externalRootDirectory + 'Download/';
    
    window.resolveLocalFileSystemURL(folderPath, function(dirEntry) {
        dirEntry.getFile(filename, { create: true, exclusive: false }, function(fileEntry) {
            fileEntry.createWriter(function(writer) {
                // Converter base64 para blob
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                
                writer.onwriteend = function() {
                    console.log('Arquivo salvo:', filename);
                    if (typeof showToast === 'function') {
                        showToast('Salvo em Downloads/' + filename);
                    }
                };
                
                writer.onerror = function(err) {
                    console.error('Erro ao escrever arquivo:', err);
                };
                
                writer.write(blob);
            });
        }, function(err) {
            console.error('Erro ao criar arquivo:', err);
        });
    }, function(err) {
        console.error('Erro ao acessar pasta Downloads:', err);
        // Tentar salvar em pasta alternativa
        const altPath = cordova.file.externalDataDirectory || cordova.file.dataDirectory;
        if (altPath) {
            window.resolveLocalFileSystemURL(altPath, function(dirEntry) {
                dirEntry.getFile(filename, { create: true, exclusive: false }, function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        const byteCharacters = atob(base64Data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: mimeType });
                        
                        writer.onwriteend = function() {
                            if (typeof showToast === 'function') {
                                showToast('Arquivo salvo: ' + filename);
                            }
                        };
                        writer.write(blob);
                    });
                });
            });
        }
    });
}

// Expor funções de download globalmente
window.openNoteDownloadMenu = openNoteDownloadMenu;
window.closeNoteDownloadMenu = closeNoteDownloadMenu;
window.downloadNoteAsPDF = downloadNoteAsPDF;
window.downloadNoteAsPNG = downloadNoteAsPNG;
