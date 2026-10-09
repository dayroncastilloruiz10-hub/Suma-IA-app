// Variables globales
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

const LLAMA_API = 'http://127.0.0.1:8080/completion';
let isProcessing = false;

// Sistema de navegación
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const viewName = item.getAttribute('data-view');
    
    // Cambiar vista activa
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    
    views.forEach(view => {
      if (view.id === `${viewName}View`) {
        view.classList.remove('hidden');
        
        // Si es la vista de cursos, cargar la lista
        if (viewName === 'courses' && typeof courseViewer !== 'undefined') {
          setTimeout(() => {
            courseViewer.showCourseList();
          }, 100);
        }
      } else {
        view.classList.add('hidden');
      }
    });
  });
});

// Verificar estado del servidor
async function checkServerStatus() {
  try {
    const isConnected = await window.electronAPI.checkServerStatus();
    
    if (isConnected) {
      statusDot.classList.add('connected');
      statusDot.classList.remove('disconnected');
      statusText.textContent = 'Conectado';
    } else {
      statusDot.classList.remove('connected');
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Desconectado';
    }
  } catch (error) {
    statusDot.classList.remove('connected');
    statusDot.classList.add('disconnected');
    statusText.textContent = 'Error';
  }
}

// Verificar estado cada 5 segundos
setInterval(checkServerStatus, 5000);
checkServerStatus();

// Auto-expandir textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = chatInput.scrollHeight + 'px';
});

// Agregar mensaje al chat
function addMessage(text, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
    <div class="message-content">
      <div class="message-text">${escapeHtml(text)}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Agregar mensaje de carga
function addLoadingMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  messageDiv.id = 'loadingMessage';
  
  messageDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="message-text">
        <span style="opacity: 0.6;">Pensando...</span>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return messageDiv;
}

// Escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

// Enviar mensaje a llama.cpp
async function sendMessage() {
  const message = chatInput.value.trim();
  
  if (!message || isProcessing) return;
  
  // Agregar mensaje del usuario
  addMessage(message, true);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  
  isProcessing = true;
  sendButton.disabled = true;
  
  const loadingMsg = addLoadingMessage();
  
  try {
    const response = await fetch(LLAMA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Usuario: ${message}\nAsistente:`,
        temperature: 0.7,
        max_tokens: 512,
        stop: ["Usuario:", "\n\n"]
      })
    });
    
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    
    const data = await response.json();
    const assistantMessage = data.content.trim();
    
    // Remover mensaje de carga
    loadingMsg.remove();
    
    // Agregar respuesta del asistente
    addMessage(assistantMessage, false);
    
  } catch (error) {
    loadingMsg.remove();
    addMessage(
      '⚠️ Error: No se pudo conectar con el servidor de IA. ' +
      'Verifica que llama-server esté ejecutándose.',
      false
    );
    console.error('Error:', error);
  } finally {
    isProcessing = false;
    sendButton.disabled = false;
    chatInput.focus();
  }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Focus inicial
chatInput.focus();
