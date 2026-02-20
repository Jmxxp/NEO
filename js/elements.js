// ===== ELEMENTOS DOM =====

// Formulário e input
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const inputWrapper = document.getElementById("inputWrapper");
const messagesEl = document.getElementById("messages");

// Barra superior
const chatBtn = document.querySelector(".chat-btn");
const tempChatBtn = document.querySelector(".temp-chat-btn");
const settingsBtn = document.querySelector(".settings-btn");

// Sidebar de chats
const overlay = document.getElementById("chatSidebarOverlay");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatsBtn = document.getElementById("clearChatsBtn");
const historyList = document.getElementById("historyList");
const historySearchInput = document.getElementById("historySearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

// Configurações
const settingsContainer = document.getElementById("settingsContainer");

// Sliders de personalidade
const humorRange = document.getElementById("humorRange");
const freedomRange = document.getElementById("freedomRange");
const professionalRange = document.getElementById("professionalRange");
const formalidadeRange = document.getElementById("formalidadeRange");

// Valores dos sliders
const humorValue = document.getElementById("humorValue");
const freedomValue = document.getElementById("freedomValue");
const professionalValue = document.getElementById("professionalValue");
const formalidadeValue = document.getElementById("formalidadeValue");

// Campos de texto
const memoryText = document.getElementById("memoryText");
const styleCustom = document.getElementById("styleCustom");

// Configuração de API
const modelSelect = document.getElementById("modelSelect");
// Nota: API keys agora são múltiplas por provedor - usar getAllApiKeys() de api.js

// Cores
const bgColorPicker = document.getElementById("bgColorPicker");
const presetDefault = document.getElementById("presetDefault");
const presetPink = document.getElementById("presetPink");
const presetGreen = document.getElementById("presetGreen");
const presetYellow = document.getElementById("presetYellow");
const presetRed = document.getElementById("presetRed");
const presetBlack = document.getElementById("presetBlack");
const presetCustom = document.getElementById("presetCustom");

// Cor secundária
const secondaryColorPicker = document.getElementById("secondaryColorPicker");
const secondaryPresetCustom = document.getElementById("secondaryPresetCustom");
const secondaryPresetWhite = document.getElementById("secondaryPresetWhite");
const secondaryPresetBlack = document.getElementById("secondaryPresetBlack");
const secondaryPresetCyan = document.getElementById("secondaryPresetCyan");
const secondaryPresetLime = document.getElementById("secondaryPresetLime");
const secondaryPresetPink = document.getElementById("secondaryPresetPink");
const secondaryPresetOrange = document.getElementById("secondaryPresetOrange");
const secondaryPresetRed = document.getElementById("secondaryPresetRed");

// Cor de fundo - botão branco
const presetWhite = document.getElementById("presetWhite");

// Modo de tema
const themeModeLight = document.getElementById("themeModeLight");
const themeModeDark = document.getElementById("themeModeDark");
const themeModeAuto = document.getElementById("themeModeAuto");

// Código fonte
const lockedBtn = document.getElementById("lockedBtn");
const codeSourceOverlay = document.getElementById("codeSourceOverlay");
const codeSourceText = document.getElementById("codeSourceText");
const codeSourceCloseBtn = document.getElementById("codeSourceCloseBtn");
const codeSourceCancelBtn = document.getElementById("codeSourceCancelBtn");
const codeSourceSaveBtn = document.getElementById("codeSourceSaveBtn");

// Modal de senha
const codePasswordOverlay = document.getElementById("codePasswordOverlay");
const codePasswordInput = document.getElementById("codePasswordInput");
const codePasswordError = document.getElementById("codePasswordError");
const codePasswordCancelBtn = document.getElementById("codePasswordCancelBtn");
const codePasswordConfirmBtn = document.getElementById("codePasswordConfirmBtn");

// Fonte
const fontSelectBtn = document.getElementById("fontSelectBtn");
const fontPreviewText = document.getElementById("fontPreviewText");
const fontModal = document.getElementById("fontModal");
const fontModalCloseBtn = document.getElementById("fontModalCloseBtn");
const fontList = document.getElementById("fontList");

// Botão de envio/call dinâmico
const sendBtn = document.getElementById("sendCallBtn");
const sendIcon = sendBtn ? sendBtn.querySelector(".send-arrow-icon") : null;

// Microfone
const micBtn = document.getElementById("micBtn");

// Content area
const contentEl = document.querySelector(".content");

// Modais
const exitModal = document.getElementById("exitModal");
const btnStay = document.getElementById("btnStay");
const btnExit = document.getElementById("btnExit");

const historyModal = document.getElementById("historyModal");
const btnCancelHistory = document.getElementById("btnCancelHistory");
const btnConfirmHistory = document.getElementById("btnConfirmHistory");

const deleteChatModal = document.getElementById("deleteChatModal");
const btnCancelDeleteChat = document.getElementById("btnCancelDeleteChat");
const btnConfirmDeleteChat = document.getElementById("btnConfirmDeleteChat");

const memoryModal = document.getElementById("memoryModal");
const memoryModalText = document.getElementById("memoryModalText");
const memoryModalCloseBtn = document.getElementById("memoryModalCloseBtn");
const memoryModalEditBtn = document.getElementById("memoryModalEditBtn");

const clearMemoryBtn = document.getElementById("clearMemoryBtn");
const clearMemoryModal = document.getElementById("clearMemoryModal");
const btnCancelClearMemory = document.getElementById("btnCancelClearMemory");
const btnConfirmClearMemory = document.getElementById("btnConfirmClearMemory");

// Network modal
const networkModal = document.getElementById("networkModal");
const btnRetryNetwork = document.getElementById("btnRetryNetwork");
const btnCloseNetwork = document.getElementById("btnCloseNetwork");

// Toast e efeito digitação
const exitToast = document.getElementById("exitToast");
const textElement = document.getElementById("typed-text");

// Elementos de anexo (PDF e Imagens)
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const pdfFileInput = document.getElementById("fileInput"); // Alias para compatibilidade
const imageFileInput = document.getElementById("fileInput"); // Alias para compatibilidade
const attachmentPreview = document.getElementById("attachmentPreview");

// Controle de tokens
const dailyTokenLimitInput = document.getElementById("dailyTokenLimitInput");
const tokenResetHourInput = document.getElementById("tokenResetHourInput");
const resetTokensBtn = document.getElementById("resetTokensBtn");

// Configuração de voz
const voiceProviderSelect = document.getElementById("voiceProviderSelect");
const elevenLabsApiKey = document.getElementById("elevenLabsApiKey");
const elevenLabsVoiceSelect = document.getElementById("elevenLabsVoiceSelect");
const elevenLabsConfig = document.getElementById("elevenLabsConfig");
const googleTtsInfo = document.getElementById("googleTtsInfo");
const testVoiceBtn = document.getElementById("testVoiceBtn");
