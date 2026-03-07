document.addEventListener('DOMContentLoaded', () => {
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.querySelector('.chat-header .close-btn');
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    let initialGreeting = false;

    // Toggle chat window
    chatBubble.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open') && !initialGreeting) {
            addMessage('bot', 'Hello! I am Spidy, your friendly assistant. How can I help you today?');
            initialGreeting = true;
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    // Handle sending messages
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const userInput = chatInput.value.trim();
        if (userInput) {
            addMessage('user', userInput);
            chatInput.value = '';
            
            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: userInput })
                });
                const data = await res.json();
                addMessage('bot', data.response);
            } catch (error) {
                addMessage('bot', 'Sorry, something went wrong. Please try again.');
            }
        }
    }

    // Add a message to the chat window
    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the bottom
    }
}); 