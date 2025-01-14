const CHAT_HISTORY_KEY = 'studentai_chat_history';
let conversationHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    setupEventListeners();
});

function loadChatHistory() {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = savedHistory;
        // Reconstruct conversation history for API
        const messages = chatMessages.querySelectorAll('.message');
        conversationHistory = Array.from(messages).map(msg => ({
            role: msg.classList.contains('user-message') ? 'user' : 'assistant',
            content: msg.querySelector('.message-content').textContent
        }));
    }
}

function saveChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    localStorage.setItem(CHAT_HISTORY_KEY, chatMessages.innerHTML);
}

function formatMessage(text) {
    return text
        // Convert line breaks to <br>
        .replace(/\n/g, '<br>')
        // Convert code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
        // Convert inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Convert bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert bullet points
        .replace(/^- (.*)/gm, '<li>$1</li>')
        // Wrap bullet points in ul
        .replace(/<li>.*(?:\n<li>.*)*/, match => `<ul>${match}</ul>`);
}

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.innerHTML = `
        <div class="message-content">${isUser ? content : formatMessage(content)}</div>
    `;
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to history
    saveChatHistory();
}

function addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    document.getElementById('chatMessages').appendChild(indicator);
    return indicator;
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    userInput.value = '';
    
    // Update conversation history
    conversationHistory.push({ role: 'user', content: message });

    try {
        const typingIndicator = addTypingIndicator();
        
        // Send to API
        const response = await fetch(AI_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    { role: 'system', content: AI_CONFIG.promptTemplate },
                    ...conversationHistory
                ]
            })
        });

        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI response
        addMessage(aiResponse);
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, I encountered an error. Please try again.');
    }
}

function setupEventListeners() {
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const clearButton = document.getElementById('clearChat');

    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the chat history?')) {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = `
                <div class="message ai-message">
                    <div class="message-content">
                        Hello! I'm your StudentAI Assistant. I can help you with study planning and coding questions. How can I assist you today?
                    </div>
                </div>
            `;
            conversationHistory = [];
            localStorage.removeItem(CHAT_HISTORY_KEY);
        }
    });

    // Update the textarea to support line breaks
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Add some CSS for the typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing .message-content {
        color: #666;
        font-style: italic;
    }
`;
document.head.appendChild(style);
