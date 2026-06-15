/**
 * AI Portfolio Chatbot Integration Logic
 * Owner: Meet Prajapati
 * Integrated with n8n Self-hosted Agent
 */

(function () {
  // Config & API Endpoints
  const WEBHOOK_URL = 'https://meet-n8n-qt8e.onrender.com/webhook/meet-portfolio-chatbot';

  const STORAGE_KEY_SESSION = 'meet_portfolio_chatbot_session';
  const STORAGE_KEY_HISTORY = 'meet_portfolio_chatbot_history';

  // Initialize Elements
  let launcherBtn, chatWindow, chatContainer, chatInput, sendBtn, closeBtn, resetBtn, toggleSizeBtn;
  let sessionId = '';
  let chatHistory = [];
  let isAITyping = false;

  // Run initial setup once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

  /**
   * Main Initialization
   */
  function initChatbot() {
    // 1. Generate or load Session ID
    sessionId = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
    }

    // 2. Load Chat History
    const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (storedHistory) {
      try {
        chatHistory = JSON.parse(storedHistory);
      } catch (e) {
        chatHistory = [];
      }
    }

    // 3. Inject Chatbot HTML Elements into DOM
    injectChatbotDOM();

    // 4. Bind DOM References
    launcherBtn = document.getElementById('pcLauncher');
    chatWindow = document.getElementById('pcWindow');
    chatContainer = document.getElementById('pcChatContainer');
    chatInput = document.getElementById('pcChatInput');
    sendBtn = document.getElementById('pcSendBtn');
    closeBtn = document.getElementById('pcCloseBtn');
    resetBtn = document.getElementById('pcResetBtn');
    toggleSizeBtn = document.getElementById('pcToggleSizeBtn');

    // 5. Setup Listeners
    setupEventListeners();

    // 6. Render Stored Messages or Initial Welcome State
    if (chatHistory.length > 0) {
      renderChatFromHistory();
    } else {
      renderWelcomeState();
    }
  }

  /**
   * Generates a secure-enough custom UUID for session tracking
   */
  function generateUUID() {
    return 'pc-session-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Injects chatbot UI markup to the page end
   */
  function injectChatbotDOM() {
    // Check if it already exists
    if (document.getElementById('pcLauncher')) return;

    // Create container for chatbot elements
    const botContainer = document.createElement('div');
    botContainer.id = 'pc-chatbot-root';

    botContainer.innerHTML = `
      <!-- Launcher Floating Button -->
      <button class="pc-launcher" id="pcLauncher" aria-label="Open AI Assistant">
        <i class="ri-chat-voice-line"></i>
      </button>

      <!-- Glassmorphic Chat Window -->
      <div class="pc-window" id="pcWindow">
        <!-- Window Header -->
        <header class="pc-header">
          <div class="pc-header-left">
            <div class="pc-bot-avatar">
              <i class="ri-robot-2-line"></i>
            </div>
            <div class="pc-bot-title">
              <span class="pc-bot-name">Meet's Assistant <span class="pc-bot-badge">AI</span></span>
              <span class="pc-bot-status"><span class="pc-bot-status-dot"></span>Online</span>
            </div>
          </div>
          <div class="pc-header-actions">
            <button class="pc-action-btn pc-size-toggle-btn" id="pcToggleSizeBtn" title="Maximize" aria-label="Maximize">
              <svg class="pc-svg-icon pc-icon-maximize" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
              <svg class="pc-svg-icon pc-icon-minimize" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>
              </svg>
            </button>
            <button class="pc-action-btn" id="pcResetBtn" title="Reset Conversation" aria-label="Reset Conversation">
              <i class="ri-refresh-line"></i>
            </button>
            <button class="pc-action-btn" id="pcCloseBtn" title="Close Chat" aria-label="Close Chat">
              <i class="ri-close-line"></i>
            </button>
          </div>
        </header>

        <!-- Messages Container -->
        <div class="pc-chat-container" id="pcChatContainer">
          <!-- Dynamically populated messages or welcome screen will go here -->
        </div>

        <!-- Footer Input Area -->
        <footer class="pc-footer">
          <div class="pc-input-wrapper">
            <textarea 
              class="pc-input" 
              id="pcChatInput" 
              placeholder="Ask me anything about Meet..." 
              rows="1"
              autocomplete="off"
            ></textarea>
            <button class="pc-send-btn" id="pcSendBtn" disabled aria-label="Send Message">
              <i class="ri-send-plane-2-fill"></i>
            </button>
          </div>
          <div class="pc-footer-credit">AI Assistant • Meet Prajapati</div>
        </footer>
      </div>
    `;

    document.body.appendChild(botContainer);
  }

  /**
   * Bind event handlers
   */
  function setupEventListeners() {
    // Open/Close toggle
    launcherBtn.addEventListener('click', toggleChatWindow);
    closeBtn.addEventListener('click', closeChatWindow);

    // Size toggle (Maximize/Minimize)
    if (toggleSizeBtn) {
      toggleSizeBtn.addEventListener('click', toggleChatSize);
    }

    // Reset Chat click
    resetBtn.addEventListener('click', resetConversation);

    // Send Button click
    sendBtn.addEventListener('click', handleSendMessage);

    // Textarea key listener (Enter sends message, Shift+Enter inputs newline)
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    // Auto-expand textarea & enable/disable send button
    chatInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
      
      const value = this.value.trim();
      sendBtn.disabled = value === '' || isAITyping;
    });

    // Close on escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && chatWindow.classList.contains('pc-open')) {
        closeChatWindow();
      }
    });
  }

  /**
   * Toggles chat window visual state
   */
  function toggleChatWindow() {
    const isOpen = chatWindow.classList.contains('pc-open');
    if (isOpen) {
      closeChatWindow();
    } else {
      openChatWindow();
    }
  }

  function openChatWindow() {
    chatWindow.classList.add('pc-open');
    launcherBtn.classList.add('pc-active');
    launcherBtn.innerHTML = '<i class="ri-close-line"></i>';
    chatInput.focus();
    scrollToBottom();
  }

  function closeChatWindow() {
    chatWindow.classList.remove('pc-open');
    // Smoothly restore original size when closed so it doesn't reopen maximized
    if (chatWindow.classList.contains('pc-maximized')) {
      chatWindow.classList.remove('pc-maximized');
      if (toggleSizeBtn) {
        toggleSizeBtn.setAttribute('title', 'Maximize');
        toggleSizeBtn.setAttribute('aria-label', 'Maximize');
      }
    }
    launcherBtn.classList.remove('pc-active');
    launcherBtn.innerHTML = '<i class="ri-chat-voice-line"></i>';
  }

  /**
   * Toggles chatbot window size (Maximize/Minimize)
   */
  function toggleChatSize() {
    const isMaximized = chatWindow.classList.toggle('pc-maximized');
    if (toggleSizeBtn) {
      if (isMaximized) {
        toggleSizeBtn.setAttribute('title', 'Minimize');
        toggleSizeBtn.setAttribute('aria-label', 'Minimize');
      } else {
        toggleSizeBtn.setAttribute('title', 'Maximize');
        toggleSizeBtn.setAttribute('aria-label', 'Maximize');
      }
    }
    // Retain focus on textarea for dynamic keyboard UX
    if (chatInput) {
      chatInput.focus();
    }
  }

  /**
   * Clears state, localStorage, and triggers new welcome
   */
  function resetConversation() {
    if (confirm("Are you sure you want to clear your chat history and start a new session?")) {
      sessionId = generateUUID();
      chatHistory = [];
      localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
      localStorage.removeItem(STORAGE_KEY_HISTORY);
      chatContainer.innerHTML = '';
      renderWelcomeState();
      chatInput.value = '';
      chatInput.style.height = 'auto';
      sendBtn.disabled = true;
    }
  }

  /**
   * Sends user message to Webhook
   */
  async function handleSendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText === '' || isAITyping) return;

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Add user message to UI & history
    addMessageToUI('user', messageText);
    saveMessageToHistory('user', messageText);

    // Show AI Typing Indicator
    showTypingIndicator();

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          sessionId: sessionId
        })
      });

      // Handle server-side HTTP errors (e.g. 429 quota issues from n8n backend)
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API_QUOTA_EXCEEDED');
        }
        throw new Error('SERVER_COMMUNICATION_ERROR');
      }

      const data = await response.json();
      
      // Parse the JSON response robustly to map n8n's output format correctly
      let aiReply = '';
      if (data) {
        const targetObj = Array.isArray(data) ? data[0] : data;
        if (typeof targetObj === 'string') {
          aiReply = targetObj;
        } else if (typeof targetObj === 'object') {
          aiReply = targetObj.reply || targetObj.output || targetObj.response || targetObj.text || targetObj.message || '';
          
          if (!aiReply) {
            const values = Object.values(targetObj);
            const firstString = values.find(val => typeof val === 'string');
            if (firstString) {
              aiReply = firstString;
            } else {
              aiReply = JSON.stringify(targetObj);
            }
          }
        }
      }

      if (!aiReply) {
        aiReply = "I didn't receive a valid reply. Please try again.";
      }

      // Front-end API Error Interceptor: Gracefully catches quota errors returned in JSON
      if (aiReply.includes('[GoogleGenerativeAI Error]') || 
          aiReply.includes('Quota exceeded') || 
          aiReply.includes('429 Too Many Requests') || 
          aiReply.includes('Too Many Requests') ||
          aiReply.includes('error fetching') ||
          aiReply.includes('quota') ||
          aiReply.includes('Rate limit')) {
        aiReply = "Meet's AI Assistant is currently receiving high traffic and has reached its temporary free-tier API limit (Meet is a highly sought-after AI Automation Engineer!). Please try asking again in a minute, or feel free to download his resumes or reach out directly via the buttons in the welcome panel.";
      }

      // Remove typing indicator & show reply
      hideTypingIndicator();
      addMessageToUI('bot', aiReply);
      saveMessageToHistory('bot', aiReply);

    } catch (error) {
      console.error('Chatbot error:', error);
      hideTypingIndicator();
      
      let errorMessage = "I'm having trouble connecting to Meet's brain server right now. Please check your internet or try again shortly! You can also email him directly at [pmeet9174@gmail.com](mailto:pmeet9174@gmail.com).";
      
      // Customize message if we explicitly detected a 429 quota block
      if (error.message === 'API_QUOTA_EXCEEDED') {
        errorMessage = "Meet's AI Assistant is currently receiving high traffic and has reached its temporary free-tier API limit (Meet is a highly sought-after AI Automation Engineer!). Please try asking again in a minute, or feel free to download his resumes or reach out directly via the buttons in the welcome panel.";
      }
      
      addMessageToUI('bot', errorMessage);
      saveMessageToHistory('bot', errorMessage);
    }
  }

  /**
   * Adds message bubble to the chat container
   */
  function addMessageToUI(sender, text, isLive = true) {
    const messageRow = document.createElement('div');
    messageRow.className = `pc-message-row pc-${sender}-row`;

    let avatarHTML = '';
    if (sender === 'bot') {
      avatarHTML = `
        <div class="pc-msg-avatar">
          <i class="ri-robot-2-line"></i>
        </div>
      `;
    }

    const bubble = document.createElement('div');
    bubble.className = 'pc-bubble';
    bubble.innerHTML = sender === 'bot' ? parseMarkdown(text) : escapeHtml(text);

    messageRow.appendChild(avatarHTML ? new DOMParser().parseFromString(avatarHTML, 'text/html').body.firstChild : document.createTextNode(''));
    if (sender === 'bot') {
      messageRow.appendChild(bubble);
    } else {
      messageRow.appendChild(bubble);
    }

    chatContainer.appendChild(messageRow);
    
    if (isLive) {
      if (sender === 'bot') {
        messageRow.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        scrollToBottom();
      }
    }
  }

  /**
   * Renders the welcome screen with suggestions and resume download buttons
   */
  function renderWelcomeState() {
    chatContainer.innerHTML = '';

    // Welcome message card
    const welcomeCard = document.createElement('div');
    welcomeCard.className = 'pc-welcome-card';
    welcomeCard.innerHTML = `
      <h4>Hi! I'm Meet's Portfolio Assistant 🚀</h4>
      <p>I can tell you about Meet's projects, automation workflows, internship experience, skills, or recommend the right resume for your hiring needs. Ask me anything!</p>
      
      <div class="pc-suggestions-title">💡 Suggested Questions</div>
      <div class="pc-suggestions" id="pcSuggestions">
        <button class="pc-suggestion-chip" data-prompt="Tell me about Meet's AI projects">
          <i class="ri-lightbulb-line"></i>Tell me about Meet's AI projects
        </button>
        <button class="pc-suggestion-chip" data-prompt="What technologies does Meet use?">
          <i class="ri-cpu-line"></i>What technologies does Meet use?
        </button>
        <button class="pc-suggestion-chip" data-prompt="Explain the WhatsApp AI Agent">
          <i class="ri-whatsapp-line"></i>Explain the WhatsApp AI Agent
        </button>
        <button class="pc-suggestion-chip" data-prompt="Explain internship experience">
          <i class="ri-briefcase-line"></i>Explain internship experience
        </button>
      </div>

      <div class="pc-resume-section">
        <div class="pc-resume-title">📄 Direct Resume Access</div>
        <div class="pc-resume-buttons">
          <a class="pc-resume-btn" href="https://drive.google.com/file/d/1095KZHEbS6-5Fsf_jeIujfAkYvggMzr7/view" target="_blank" rel="noopener noreferrer">
            <span>Full Stack Resume</span><i class="ri-arrow-right-up-line"></i>
          </a>
          <a class="pc-resume-btn" href="https://drive.google.com/file/d/1BZMbWSa0YP7X3oPzojm8GZhQVdZaQTGq/view" target="_blank" rel="noopener noreferrer">
            <span>Mobile Developer Resume</span><i class="ri-arrow-right-up-line"></i>
          </a>
          <a class="pc-resume-btn" href="https://drive.google.com/file/d/1pj2yWkuZvXGxyl2hVUgYxaxYTQLYVh3t/view" target="_blank" rel="noopener noreferrer">
            <span>AI Automation Resume</span><i class="ri-arrow-right-up-line"></i>
          </a>
        </div>
      </div>
    `;

    chatContainer.appendChild(welcomeCard);

    // Setup suggestion click handlers
    const chips = welcomeCard.querySelectorAll('.pc-suggestion-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', function () {
        const promptText = this.getAttribute('data-prompt');
        chatInput.value = promptText;
        handleSendMessage();
      });
    });

    scrollToBottom();
  }

  /**
   * Renders the chat container contents from stored message history
   */
  function renderChatFromHistory() {
    chatContainer.innerHTML = '';
    chatHistory.forEach(msg => {
      addMessageToUI(msg.sender, msg.text, false);
    });
    scrollToBottom();
  }

  /**
   * Saves a message to the history and syncs with localStorage
   */
  function saveMessageToHistory(sender, text) {
    chatHistory.push({ sender, text });
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(chatHistory));
  }

  /**
   * Displays the typing indicator dots bubble
   */
  function showTypingIndicator() {
    if (isAITyping) return;
    isAITyping = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;

    const typingRow = document.createElement('div');
    typingRow.className = 'pc-message-row pc-bot-row';
    typingRow.id = 'pcTypingIndicatorRow';

    typingRow.innerHTML = `
      <div class="pc-msg-avatar">
        <i class="ri-robot-2-line"></i>
      </div>
      <div class="pc-bubble" style="padding: 10px 14px;">
        <div class="pc-typing-indicator">
          <span class="pc-typing-dot"></span>
          <span class="pc-typing-dot"></span>
          <span class="pc-typing-dot"></span>
        </div>
      </div>
    `;

    chatContainer.appendChild(typingRow);
    scrollToBottom();
  }

  /**
   * Removes the typing indicator bubble
   */
  function hideTypingIndicator() {
    if (!isAITyping) return;
    isAITyping = false;
    chatInput.disabled = false;
    chatInput.focus();

    const indicator = document.getElementById('pcTypingIndicatorRow');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Scroll helper
   */
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  /**
   * Escape HTML to prevent code injection
   */
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Highly robust Mini-Markdown to HTML converter
   * Renders bold words, neat lists, links, paragraphs, and handles double spacing
   */
  function parseMarkdown(mdText) {
    let html = escapeHtml(mdText);

    // 1. Convert bold syntax (**bold**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 2. Convert standard markdown links ([text](url))
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 3. Convert multi-line bullet points / lists
    const lines = html.split('\n');
    let insideList = false;
    let listHTML = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Match starts with "- " or "* " or "• "
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        const itemContent = line.substring(2).trim();
        if (!insideList) {
          listHTML += '<ul>';
          insideList = true;
        }
        listHTML += `<li>${itemContent}</li>`;
      } else {
        if (insideList) {
          listHTML += '</ul>';
          insideList = false;
        }
        listHTML += (line === '' ? '<br>' : (listHTML === '' ? '' : '<br>') + line);
      }
    }

    if (insideList) {
      listHTML += '</ul>';
    }

    // Replace line break characters with appropriate structure
    return listHTML;
  }

})();
