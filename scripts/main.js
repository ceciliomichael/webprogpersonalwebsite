import AI_CONFIG from '../config/ai-config.js';

const apps = [
    {
        id: 'about',
        title: 'About Me',
        icon: 'images/user.svg',
        url: 'apps/about.html'
    },
    {
        id: 'education',
        title: 'Education',
        icon: 'images/education.svg',
        url: 'apps/education.html'
    },
    {
        id: 'experience',
        title: 'IT Experience',
        icon: 'images/experience.svg',
        url: 'apps/experience.html'
    },
    {
        id: 'hobbies',
        title: 'Hobbies',
        icon: 'images/hobby.svg',
        url: 'apps/hobbies.html'
    },
    {
        id: 'goals',
        title: 'Goals',
        icon: 'images/goal.svg',
        url: 'apps/goals.html'
    },
    {
        id: 'gallery',
        title: 'Gallery',
        icon: 'images/gallery.svg',
        url: 'apps/gallery.html'
    },
    {
        id: 'installer',
        title: 'App Installer',
        icon: 'images/installer.svg',
        url: 'apps/installer.html'
    },
    {
        id: 'feedback',
        title: 'Feedback',
        icon: 'images/feedback.svg',
        url: 'apps/feedback.html'
    }
];

const openWindows = new Map();
let topZIndex = 1;
const STORAGE_KEY = 'installedApps';

let installedApps = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

window.addEventListener('message', (event) => {
    if (event.data.type === 'INSTALL_APP') {
        installApp(event.data.app);
    } else if (event.data.type === 'UNINSTALL_APP') {
        uninstallApp(event.data.appId);
    }
});

function installApp(appData) {
    let newApp = {
        id: appData.id,
        title: appData.title,
        icon: appData.icon,
        url: appData.url
    };

    // Special handling for StudentAI app
    if (appData.id === 'studentai') {
        newApp = {
            id: 'studentai',
            title: 'StudentAI Assistant',
            icon: 'images/ai-icon.svg',
            url: 'apps/studentai/index.html'
        };
        
        // Make sure it's immediately available for AI commands
        if (!apps.find(app => app.id === 'studentai')) {
            apps.push(newApp);
        }
    }

    // Save the full app data
    localStorage.setItem(`app_${newApp.id}`, JSON.stringify(newApp));
    installedApps[newApp.id] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installedApps));

    // Create desktop icon
    createDesktopIcon(newApp);
}

function uninstallApp(appId) {
    // Remove from apps array
    const appIndex = apps.findIndex(app => app.id === appId);
    if (appIndex > -1) {
        apps.splice(appIndex, 1);
    }

    // Remove desktop icon
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    desktopIcons.forEach(icon => {
        if (icon.querySelector('span').textContent === 'Deepthink AI') {
            icon.remove();
        }
    });

    // Remove from localStorage
    delete installedApps[appId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installedApps));
    localStorage.removeItem(`app_${appId}`);

    // Close window if open
    const window = openWindows.get(appId);
    if (window) {
        if (window.taskbarItem) {
            window.taskbarItem.remove();
        }
        window.remove();
        openWindows.delete(appId);
    }
}

function createDesktopIcons() {
    const desktop = document.getElementById('desktop');
    const allApps = [...apps];

    // Load installed apps from localStorage
    Object.keys(installedApps).forEach(appId => {
        const savedApp = JSON.parse(localStorage.getItem(`app_${appId}`));
        if (savedApp && !allApps.find(app => app.id === savedApp.id)) {
            allApps.push(savedApp);
            apps.push(savedApp); // Add to main apps array for search functionality
        }
    });

    // Create icons for all apps
    allApps.forEach(app => createDesktopIcon(app));
}

function createDesktopIcon(app) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.innerHTML = `
        <img src="${app.icon}" alt="${app.title}">
        <span>${app.title}</span>
    `;
    icon.onclick = () => openApp(app);
    document.getElementById('desktop').appendChild(icon);
}

function createWindow(app) {
    if (openWindows.has(app.id)) {
        return openWindows.get(app.id);
    }

    const win = document.createElement('div');
    win.className = 'window';
    win.dataset.appId = app.id;
    win.style.top = '50px';
    win.style.left = '50px';
    win.style.zIndex = topZIndex++;
    win.innerHTML = `
        <div class="window-header">
            <div class="window-title">${app.title}</div>
            <div class="window-controls">
                <button class="window-control minimize">─</button>
                <button class="window-control maximize">□</button>
                <button class="window-control close">×</button>
            </div>
        </div>
        <div class="window-content">
            <iframe src="${app.url}"></iframe>
        </div>
        <div class="window-resize-handle"></div>
    `;
    
    makeWindowDraggable(win);
    makeWindowResizable(win);
    setupWindowControls(win);
    
    // Special handling for installer window
    if (app.id === 'installer') {
        document.getElementById('desktop').appendChild(win);
        openWindows.set(app.id, win);
        return win;
    }
    
    // Normal window handling
    document.getElementById('desktop').appendChild(win);
    openWindows.set(app.id, win);
    win.taskbarItem = createTaskbarItem(app, win);
    return win;
}

function bringToFront(win) {
    win.style.zIndex = topZIndex++;
}

function createTaskbarItem(app, win) {
    const taskbar = document.querySelector('.taskbar-content');
    const taskbarItem = document.createElement('button');
    taskbarItem.className = 'taskbar-icon active';
    taskbarItem.dataset.appId = app.id;
    taskbarItem.innerHTML = `<img src="${app.icon}" alt="${app.title}">`;
    taskbarItem.onclick = () => toggleWindow(win);
    taskbar.appendChild(taskbarItem);
    return taskbarItem;
}

function toggleWindow(win) {
    if (win.style.display === 'none') {
        win.style.display = 'flex';
        win.style.animation = 'windowShow 0.3s ease-out';
    } else {
        minimizeWindow(win);
    }
}

function minimizeWindow(win) {
    win.style.animation = 'windowHide 0.3s ease-in';
    setTimeout(() => win.style.display = 'none', 280);
}

function maximizeWindow(win) {
    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        win.style.animation = 'windowUnmaximize 0.3s ease-out';
    } else {
        win.classList.add('maximized');
        win.style.animation = 'windowMaximize 0.3s ease-out';
    }
}

function makeWindowDraggable(win) {
    const header = win.querySelector('.window-header');
    let isDragging = false;
    let startX, startY;
    
    header.addEventListener('mousedown', initDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    win.addEventListener('mousedown', () => bringToFront(win));

    function initDrag(e) {
        if (win.classList.contains('maximized')) return;
        
        isDragging = true;
        startX = e.clientX - win.offsetLeft;
        startY = e.clientY - win.offsetTop;
        
        win.style.transform = 'translate3d(0,0,0)';
        
        e.preventDefault();
        
        win.classList.add('dragging');
    }

    function drag(e) {
        if (!isDragging) return;
        
        requestAnimationFrame(() => {
            const x = e.clientX - startX;
            const y = e.clientY - startY;
            
            win.style.left = `${x}px`;
            win.style.top = `${y}px`;
        });
    }

    function stopDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        win.classList.remove('dragging');
    }
}

function makeWindowResizable(win) {
    const handle = win.querySelector('.window-resize-handle');
    let isResizing = false;
    let originalWidth;
    let originalHeight;
    let originalX;
    let originalY;

    handle.addEventListener('mousedown', startResizing);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);

    function startResizing(e) {
        isResizing = true;
        originalWidth = win.offsetWidth;
        originalHeight = win.offsetHeight;
        originalX = e.clientX;
        originalY = e.clientY;
    }

    function resize(e) {
        if (!isResizing) return;

        const width = originalWidth + (e.clientX - originalX);
        const height = originalHeight + (e.clientY - originalY);

        if (width > 400) win.style.width = width + 'px';
        if (height > 300) win.style.height = height + 'px';
    }

    function stopResizing() {
        isResizing = false;
    }
}

function setupWindowControls(win) {
    const close = win.querySelector('.close');
    const maximize = win.querySelector('.maximize');
    const minimize = win.querySelector('.minimize');

    close.onclick = () => {
        if (win.dataset.appId === 'installer') {
            // Just hide the installer window instead of removing it
            win.style.display = 'none';
            const installerBtn = document.getElementById('installer-btn');
            installerBtn.classList.remove('active');
        } else {
            if (win.taskbarItem) {
                win.taskbarItem.remove();
            }
            win.remove();
            openWindows.delete(win.dataset.appId);
        }
    };
    
    maximize.onclick = () => maximizeWindow(win);
    minimize.onclick = () => minimizeWindow(win);
}

function openApp(app) {
    // Special handling for installer app
    if (app.id === 'installer') {
        const existingWindow = openWindows.get('installer');
        if (existingWindow) {
            if (existingWindow.style.display === 'none') {
                existingWindow.style.display = 'flex';
                existingWindow.style.animation = 'windowShow 0.3s ease-out';
                const installerBtn = document.getElementById('installer-btn');
                installerBtn.classList.add('active');
            }
            bringToFront(existingWindow);
        } else {
            const win = createWindow(app);
            const installerBtn = document.getElementById('installer-btn');
            installerBtn.classList.add('active');
        }
        return;
    }
    
    // Handle other apps normally
    createWindow(app);
}

document.addEventListener('DOMContentLoaded', () => {
    createDesktopIcons();
    
    const installerBtn = document.getElementById('installer-btn');
    
    const installerApp = apps.find(app => app.id === 'installer');
    if (installerApp) {
        const win = createWindow(installerApp);
        win.style.display = 'none';
        
        installerBtn.addEventListener('click', () => {
            if (win.style.display === 'none') {
                win.style.display = 'flex';
                win.style.animation = 'windowShow 0.3s ease-out';
                bringToFront(win);
                installerBtn.classList.add('active');
            } else {
                minimizeWindow(win);
                installerBtn.classList.remove('active');
            }
        });
    }
});

const searchBtn = document.getElementById('search-btn');
const searchOverlay = document.querySelector('.search-overlay');
const searchInput = document.querySelector('.search-input');
const searchResults = document.querySelector('.search-results');

function toggleSearch() {
    searchOverlay.classList.toggle('active');
    if (searchOverlay.classList.contains('active')) {
        searchInput.focus();
        searchInput.value = '';
        showSearchResults('');
    }
}

function showSearchResults(query) {
    const filteredApps = apps.filter(app => 
        app.title.toLowerCase().includes(query.toLowerCase())
    );

    searchResults.innerHTML = filteredApps.map(app => `
        <div class="search-result" data-app-id="${app.id}">
            <img src="${app.icon}" alt="${app.title}">
            <span>${app.title}</span>
        </div>
    `).join('');

    document.querySelectorAll('.search-result').forEach(result => {
        result.addEventListener('click', () => {
            const appId = result.dataset.appId;
            const app = apps.find(a => a.id === appId);
            if (app) {
                openApp(app);
                searchOverlay.classList.remove('active');
            }
        });
    });
}

searchBtn.addEventListener('click', toggleSearch);

searchInput.addEventListener('input', (e) => {
    showSearchResults(e.target.value);
});

document.addEventListener('click', (e) => {
    if (!searchOverlay.contains(e.target) && 
        !searchBtn.contains(e.target) && 
        searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
    }
});

const startBtn = document.getElementById('start-btn');
const aiOverlay = document.querySelector('.ai-overlay');
const aiInput = document.getElementById('aiInput');
const aiSendBtn = document.getElementById('aiSendBtn');
const aiConversation = document.getElementById('aiConversation');

const CHAT_HISTORY_KEY = 'zoraAIChatHistory';
let chatHistory = [];

// Update the loadChatHistory function to include more helpful initial message
function loadChatHistory() {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
        chatHistory = JSON.parse(saved);
        aiConversation.innerHTML = '';
        chatHistory.forEach(msg => {
            addMessage(msg.text, msg.isUser, false);
        });
    } else {
        const installedAIApps = Object.keys(installedApps)
            .filter(appId => appId.toLowerCase().includes('ai'))
            .map(appId => JSON.parse(localStorage.getItem(`app_${appId}`)))
            .filter(app => app)
            .map(app => `**${app.title}**`)
            .join(', ');

        const welcomeMessage = `Hello! I'm Zora, your WebOS Assistant. I can help you:
• Open applications
• Search for content
• Show available apps
• Navigate the system

${formatAppList(groupAppsByCategory())}

${installedAIApps ? `\n\nI notice you have ${installedAIApps} installed!` : ''}

How can I assist you today?`;
        addMessage(welcomeMessage, false, true);
    }
}

function clearChat() {
    aiConversation.innerHTML = '';
    chatHistory = [];
    localStorage.removeItem(CHAT_HISTORY_KEY);
    // Add initial message after clearing and save it to history
    const welcomeMessage = "Hello! I'm Zora your WebOS Assistant. How can I help you today?";
    addMessage(welcomeMessage, false, true);
}

function toggleAI() {
    aiOverlay.classList.toggle('active');
    if (aiOverlay.classList.contains('active')) {
        aiInput.focus();
        // Only load chat history if conversation is empty
        if (aiConversation.children.length === 0) {
            loadChatHistory();
        }
    }
}

function formatMessage(text) {
    return text
        // Convert line breaks to <br> tags
        .replace(/\n/g, '<br>')
        // Format bullet points
        .replace(/•(.*)/g, '<div class="bullet-point">•$1</div>')
        // Bold text between **
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text between *
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
        // Inline code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Lists
        .replace(/^\d+\.\s+(.*)/gm, '<div class="list-item">$1</div>')
        // Add paragraph spacing for blank lines
        .replace(/\n\s*\n/g, '<br><br>');
}

function addMessage(text, isUser = false, save = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'ai-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    // Use innerHTML with formatted text instead of textContent
    messageContent.innerHTML = formatMessage(text);
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timestamp);
    
    aiConversation.appendChild(messageDiv);
    aiConversation.scrollTop = aiConversation.scrollHeight;

    if (save) {
        const messageData = { 
            text, 
            isUser, 
            timestamp: new Date().toISOString() 
        };
        chatHistory.push(messageData);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
    }
}

async function handleAIResponse(userInput) {
    addMessage(userInput, true);
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span class="typing-dot"></span>'.repeat(3);
    aiConversation.appendChild(typingIndicator);
    
    try {
        const response = await fetch(AI_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    { role: "system", content: AI_CONFIG.systemPrompt },
                    ...chatHistory.map(msg => ({
                        role: msg.isUser ? "user" : "assistant",
                        content: msg.text
                    })),
                    { role: "user", content: userInput }
                ]
            })
        });

        const data = await response.json();
        typingIndicator.remove();

        const aiResponse = data.choices[0].message.content;
        handleAICommand(aiResponse);
    } catch (error) {
        console.error('AI Error:', error);
        typingIndicator.remove();
        addMessage("I apologize, but I'm having trouble connecting right now. Please try again later.");
    }
}

// ...existing code...

function handleAICommand(aiResponse) {
    // First, add the AI's response without the command
    const cleanResponse = aiResponse.replace(/\[([^\]]*)\]/g, '').trim();
    if (cleanResponse) {
        addMessage(cleanResponse);
    }

    // Extract and handle commands
    const commands = aiResponse.match(/\[(.*?)\]/g) || [];
    commands.forEach(cmd => {
        const [action, param] = cmd.slice(1, -1).split(':');
        switch(action.toUpperCase()) {
            case 'OPEN':
                const appToOpen = findBestAppMatch(param);
                if (appToOpen) {
                    aiOverlay.classList.remove('active');
                    openApp(appToOpen);
                } else {
                    addMessage(`I couldn't find an app matching "${param}". Here are the available apps:\n\n${formatAppList(groupAppsByCategory())}`);
                }
                break;
            case 'LIST':
                addMessage(formatAppList(groupAppsByCategory()));
                break;
            // ...rest of cases...
        }
    });
}

// Add these helper functions
function findBestAppMatch(query) {
    query = query.toLowerCase().trim();
    
    // First try exact match
    let app = apps.find(app => app.title.toLowerCase() === query);
    
    // Then try contains match
    if (!app) {
        app = apps.find(app => {
            const title = app.title.toLowerCase();
            return title.includes(query) || 
                   query.includes(title) || 
                   title.includes('assistant') && query.includes('ai');  // Special case for AI assistants
        });
    }

    // Check installed apps if not found in main apps
    if (!app) {
        Object.keys(installedApps).forEach(appId => {
            const savedApp = JSON.parse(localStorage.getItem(`app_${appId}`));
            if (savedApp && (
                savedApp.title.toLowerCase().includes(query) ||
                query.includes(savedApp.title.toLowerCase())
            )) {
                app = savedApp;
            }
        });
    }

    return app;
}

function groupAppsByCategory() {
    const allApps = getAllApps();
    return {
        'Personal': allApps.filter(app => ['about', 'hobbies', 'goals'].includes(app.id)),
        'Professional': allApps.filter(app => ['education', 'experience'].includes(app.id)),
        'Media': allApps.filter(app => ['gallery'].includes(app.id)),
        'System': allApps.filter(app => ['installer'].includes(app.id)),
        'AI & Tools': allApps.filter(app => app.id.toLowerCase().includes('ai') || app.title.toLowerCase().includes('ai'))
    };
}

function formatAppList(categories) {
    let result = '**Available Applications:**\n\n';
    
    Object.entries(categories).forEach(([category, categoryApps]) => {
        if (categoryApps.length > 0) {
            result += `**${category}**\n`;
            categoryApps.forEach(app => {
                result += `• ${app.title}\n`;
            });
            result += '\n';
        }
    });
    
    // Add installed apps section if any exist
    const installedAIApps = Object.keys(installedApps)
        .map(appId => JSON.parse(localStorage.getItem(`app_${appId}`)))
        .filter(app => app); // Filter out any null values

    if (installedAIApps.length > 0) {
        result += '**Installed Applications**\n';
        installedAIApps.forEach(app => {
            result += `• ${app.title}\n`;
        });
    }
    
    return result.trim();
}

function getAllApps() {
    const allApps = [...apps];
    
    // Add installed apps
    Object.keys(installedApps).forEach(appId => {
        const savedApp = JSON.parse(localStorage.getItem(`app_${appId}`));
        if (savedApp && !allApps.find(app => app.id === savedApp.id)) {
            allApps.push(savedApp);
        }
    });
    
    return allApps;
}

aiConversation.style.position = 'relative';

startBtn.addEventListener('click', toggleAI);

aiSendBtn.addEventListener('click', () => {
    const message = aiInput.value.trim();
    if (message) {
        handleAIResponse(message);
        aiInput.value = '';
    }
});

aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && aiInput.value.trim()) {
        handleAIResponse(aiInput.value.trim());
        aiInput.value = '';
    }
});

document.addEventListener('click', (e) => {
    if (!aiOverlay.contains(e.target) && 
        !startBtn.contains(e.target) && 
        aiOverlay.classList.contains('active')) {
        aiOverlay.classList.remove('active');
    }
});

document.getElementById('clearChat').addEventListener('click', clearChat);
