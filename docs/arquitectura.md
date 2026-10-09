# Documentación Técnica Detallada - Arquitectura del Sistema

> **Versión:** 2.0 - Análisis Arquitectónico Exhaustivo  
> **Última actualización:** 2026-01-12  
> **Nivel de detalle:** Arquitectura empresarial

## 📑 Índice

1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Arquitectura de Capas Detallada](#arquitectura-de-capas-detallada)
3. [Componentes y Sus Interacciones](#componentes-y-sus-interacciones)
4. [Patrones de Diseño Implementados](#patrones-de-diseño-implementados)
5. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
6. [Seguridad en Profundidad](#seguridad-en-profundidad)
7. [Escalabilidad y Rendimiento](#escalabilidad-y-rendimiento)
8. [Análisis de Dependencias](#análisis-de-dependencias)

---

## Visión General del Sistema

### 🎯 Propósito Arquitectónico

LlamaSabIA es una **aplicación de escritorio educativa offline-first** que implementa una arquitectura de **proceso dual** (Main-Renderer) característica de Electron, complementada con un **servidor de IA local** para procesamiento de lenguaje natural.

### 📊 Características Arquitectónicas Clave

| Característica | Implementación | Beneficio |
|----------------|----------------|-----------|
| **Offline-First** | Sin dependencias de red | Funciona sin internet |
| **Proceso Dual** | Main (Node.js) + Renderer (Browser) | Seguridad y rendimiento |
| **IA Local** | llama.cpp server | Privacidad total |
| **Persistencia Local** | localStorage + JSON files | Sin base de datos |
| **Portabilidad** | Ejecutable único | USB-ready |
| **Modularidad** | Separación de responsabilidades | Mantenibilidad |

### 🏗️ Stack Tecnológico Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   HTML5    │  │   CSS3     │  │ JavaScript │            │
│  │  (Markup)  │  │  (Styles)  │  │   (ES6+)   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE FRAMEWORK                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Electron 28.0.0                           │ │
│  │  - Chromium (Rendering Engine)                         │ │
│  │  - Node.js (Backend Runtime)                           │ │
│  │  - V8 (JavaScript Engine)                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE SERVICIOS                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              llama.cpp Server                          │ │
│  │  - HTTP Server (Puerto 8080)                           │ │
│  │  - GGUF Model Loader                                   │ │
│  │  - Inference Engine (CPU/GPU)                          │ │
│  │  - Token Generation                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE PERSISTENCIA                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ localStorage │  │  JSON Files  │  │  GGUF Model  │      │
│  │  (Browser)   │  │(File System) │  │(File System) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Capas Detallada

### Capa 1: Presentación (UI Layer)

**Responsabilidad**: Renderizado visual y captura de interacciones del usuario.

**Tecnologías**:
- HTML5 para estructura semántica
- CSS3 con variables CSS para theming
- JavaScript ES6+ para lógica de UI
- DOM API para manipulación dinámica

**Componentes principales**:

```
app/renderer/
├── index.html          # Estructura principal
├── splash.html         # Pantalla de carga
├── styles.css          # Sistema de diseño (47KB)
├── renderer.js         # Controlador de UI
└── courses/
    ├── course-viewer.js    # Renderizado de cursos
    └── courses-manager.js  # Lógica de negocio
```

**Patrón de diseño**: **MVC (Model-View-Controller)**
- **Model**: Datos de cursos (JSON) + Progreso (localStorage)
- **View**: HTML + CSS
- **Controller**: renderer.js + course-viewer.js

**Flujo de renderizado**:

```
Usuario interactúa con UI
         ↓
Event Listener captura evento
         ↓
Controller procesa lógica
         ↓
Model se actualiza (si necesario)
         ↓
View se re-renderiza
         ↓
DOM actualizado
         ↓
Usuario ve cambios
```

**Ejemplo de flujo completo**:

```javascript
// 1. Usuario hace click en curso
document.querySelector('.course-card').addEventListener('click', (e) => {
  const courseId = e.currentTarget.dataset.courseId;
  
  // 2. Controller procesa
  courseViewer.loadCourse(courseId);
});

// 3. Carga de datos (Model)
async loadCourse(courseId) {
  const course = await coursesManager.loadCourse(courseId);
  
  // 4. Actualización de vista
  this.renderCourseOverview(course);
}

// 5. Renderizado (View)
renderCourseOverview(course) {
  this.container.innerHTML = `
    <h1>${course.title}</h1>
    <div class="chapters">...</div>
  `;
}
```

### Capa 2: Lógica de Negocio (Business Logic Layer)

**Responsabilidad**: Gestión de estado, validación de reglas de negocio, y orquestación de flujos.

**Componentes**:

#### CoursesManager (Gestor de Estado)

```javascript
class CoursesManager {
  // Estado de la aplicación
  constructor() {
    this.currentCourse = null;
    this.currentChapter = null;
    this.currentSheet = null;
    this.progress = this.loadProgress();
  }
  
  // Reglas de negocio
  isSheetUnlocked(chapterId, sheetId) {
    // Lógica compleja de desbloqueo
    if (sheet.unlocked) return true;
    if (sheet.type === 'test') {
      return this.isRequiredSheetCompleted(sheet.requiresCompletion);
    }
    return this.isPreviousSheetCompleted(sheetId - 1);
  }
  
  // Persistencia
  saveProgress() {
    localStorage.setItem('course_progress', JSON.stringify(this.progress));
  }
}
```

**Reglas de negocio implementadas**:

1. **Desbloqueo secuencial**: Hojas se desbloquean al completar la anterior
2. **Tests condicionales**: Requieren completar hoja específica
3. **Progreso persistente**: Se guarda automáticamente
4. **Puntuación**: Calculada como (correctas / total) * 100
5. **Contexto de IA**: Generado dinámicamente según hoja actual

### Capa 3: Comunicación (IPC Layer)

**Responsabilidad**: Comunicación segura entre procesos Main y Renderer.

**Arquitectura de seguridad**:

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDERER PROCESS                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  window.electronAPI.checkServerStatus()                │ │
│  │  ↓                                                      │ │
│  │  Llamada a API expuesta por preload                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    PRELOAD SCRIPT                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  contextBridge.exposeInMainWorld('electronAPI', {      │ │
│  │    checkServerStatus: () =>                            │ │
│  │      ipcRenderer.invoke('check-server-status')         │ │
│  │  })                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    MAIN PROCESS                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ipcMain.handle('check-server-status', async () => {   │ │
│  │    return new Promise((resolve) => {                   │ │
│  │      http.get('http://127.0.0.1:8080/health', ...)     │ │
│  │    });                                                 │ │
│  │  })                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Ventajas de esta arquitectura**:
1. **Seguridad**: Renderer no puede acceder directamente a Node.js
2. **Control**: Main process controla qué funcionalidades exponer
3. **Tipado**: API bien definida y documentada
4. **Testing**: Fácil de mockear para pruebas

### Capa 4: Servicios (Services Layer)

**Responsabilidad**: Servidor de IA local para procesamiento de lenguaje natural.

**Arquitectura del servidor llama.cpp**:

```
┌─────────────────────────────────────────────────────────────┐
│                   llama.cpp Server                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  HTTP Server (localhost:8080)                          │ │
│  │  ┌──────────────┐  ┌──────────────┐                   │ │
│  │  │ GET /health  │  │POST/completion│                   │ │
│  │  └──────────────┘  └──────────────┘                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↓                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Request Handler                                       │ │
│  │  - Parse JSON body                                     │ │
│  │  - Validate parameters                                 │ │
│  │  - Queue request                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↓                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Inference Engine                                      │ │
│  │  - Tokenize prompt                                     │ │
│  │  - Load context                                        │ │
│  │  - Generate tokens                                     │ │
│  │  - Apply sampling                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↓                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Model Layer                                           │ │
│  │  - GGUF file reader                                    │ │
│  │  - Tensor operations                                   │ │
│  │  - Attention mechanism                                 │ │
│  │  - Feed-forward network                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Parámetros de configuración**:

```javascript
// Configuración actual (balanceada)
{
  port: 8080,
  ctx_size: 2048,        // Tokens de contexto
  n_gpu_layers: 0,       // Solo CPU
  threads: 4,            // Threads de CPU
  batch_size: 512        // Tokens por batch (default)
}

// Uso de memoria estimado:
// RAM = Modelo + (ctx_size * 2 bytes * hidden_size)
// Ejemplo Phi-3 Mini:
// RAM = 2.4GB + (2048 * 2 * 3072) = 2.4GB + 12MB ≈ 2.5GB
```

### Capa 5: Persistencia (Data Layer)

**Responsabilidad**: Almacenamiento y recuperación de datos.

**Tres tipos de persistencia**:

#### 1. localStorage (Progreso del usuario)

```javascript
// Estructura de datos
{
  "course_progress": {
    "fundamentos-ia": {
      "startedAt": "2026-01-12T10:00:00.000Z",
      "completedSheets": ["fundamentos-ia-1-1", "fundamentos-ia-1-2"],
      "scores": {
        "fundamentos-ia-1-2": 90
      },
      "testProgress": {
        "fundamentos-ia-1-4": {
          "currentExercise": 3,
          "answers": [0, 2, 1],
          "lastUpdate": "2026-01-12T10:30:00.000Z"
        }
      }
    }
  }
}
```

**Ventajas**:
- Sincrónico y rápido
- Límite de ~10MB (suficiente para progreso)
- Persiste entre sesiones
- No requiere servidor

**Desventajas**:
- Solo strings (requiere JSON.stringify/parse)
- No compartido entre usuarios
- Vulnerable a borrado de caché del navegador

#### 2. JSON Files (Contenido de cursos)

```javascript
// Estructura de curso
{
  "id": "fundamentos-ia",
  "title": "Fundamentos de Matemática para IA",
  "chapters": [
    {
      "id": 1,
      "sheets": [
        {
          "id": 1,
          "type": "content",
          "content": {
            "sections": [...]
          }
        }
      ]
    }
  ]
}
```

**Ventajas**:
- Fácil de editar manualmente
- Versionable con git
- Legible por humanos
- No requiere migración de schema

**Desventajas**:
- Carga completa en memoria
- Sin búsqueda eficiente
- Sin relaciones complejas

#### 3. GGUF Files (Modelos de IA)

**Formato binario** optimizado para inferencia:
- Metadatos del modelo
- Pesos cuantizados
- Vocabulario de tokens
- Configuración de arquitectura

**Tamaños típicos**:
- Q4: 2-5 GB (4-bit quantization)
- Q5: 3-6 GB (5-bit quantization)
- Q8: 5-10 GB (8-bit quantization)

---

## Componentes y Sus Interacciones

### Diagrama de Componentes Completo

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   ELECTRON APP                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              MAIN PROCESS (Node.js)                    │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Window Manager                                  │  │ │
│  │  │  - createSplashWindow()                          │  │ │
│  │  │  - createMainWindow()                            │  │ │
│  │  │  - Gestión de eventos                            │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Server Manager                                  │  │ │
│  │  │  - startLlamaServer()                            │  │ │
│  │  │  - checkServerReady()                            │  │ │
│  │  │  - Monitoreo de proceso                          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  File System Manager                             │  │ │
│  │  │  - findModelPath()                               │  │ │
│  │  │  - findLlamaServer()                             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  IPC Handlers                                    │  │ │
│  │  │  - check-server-status                           │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                         ↕ IPC ↕                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            PRELOAD (Security Bridge)                   │ │
│  │  - contextBridge.exposeInMainWorld()                   │ │
│  │  - API limitada y controlada                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                         ↕ Bridge ↕                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          RENDERER PROCESS (Chromium)                   │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  UI Controller (renderer.js)                     │  │ │
│  │  │  - Navegación entre vistas                       │  │ │
│  │  │  - Gestión de chat                               │  │ │
│  │  │  - Verificación de estado                        │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Business Logic                                  │  │ │
│  │  │  ┌────────────────┐  ┌────────────────┐         │  │ │
│  │  │  │CoursesManager  │  │ CourseViewer   │         │  │ │
│  │  │  │- Progreso      │  │- Renderizado   │         │  │ │
│  │  │  │- Validación    │  │- Tests         │         │  │ │
│  │  │  │- Persistencia  │  │- IA Modal      │         │  │ │
│  │  │  └────────────────┘  └────────────────┘         │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  View Layer (HTML/CSS)                           │  │ │
│  │  │  - Chat UI                                       │  │ │
│  │  │  - Courses UI                                    │  │ │
│  │  │  - About/Settings                                │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                         ↕ HTTP ↕
┌─────────────────────────────────────────────────────────────┐
│              llama.cpp Server (localhost:8080)               │
│  - Inference Engine                                          │
│  - Model Loading                                             │
│  - Token Generation                                          │
└─────────────────────────────────────────────────────────────┘
                         ↕ File I/O ↕
┌─────────────────────────────────────────────────────────────┐
│                   STORAGE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ localStorage │  │  JSON Files  │  │  GGUF Model  │      │
│  │  (Progress)  │  │  (Courses)   │  │  (AI Model)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Patrones de Diseño Implementados

### 1. Singleton Pattern

**Ubicación**: `coursesManager`, `courseViewer`

**Implementación**:
```javascript
// courses-manager.js
class CoursesManager {
  constructor() {
    this.currentCourse = null;
    this.progress = this.loadProgress();
  }
}

// Instancia global única
const coursesManager = new CoursesManager();
```

**Justificación**:
- Solo se necesita una instancia del gestor de cursos
- Estado compartido entre todos los componentes
- Evita inconsistencias de datos

**Ventajas**:
- ✅ Punto único de acceso al estado
- ✅ Fácil de usar desde cualquier módulo
- ✅ Gestión centralizada de progreso

**Desventajas**:
- ⚠️ Estado global (puede dificultar testing)
- ⚠️ Acoplamiento entre módulos

### 2. Observer Pattern (Event-Driven)

**Ubicación**: Event listeners en UI

**Implementación**:
```javascript
// Observador de navegación
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const viewName = item.getAttribute('data-view');
    // Notificar cambio de vista
    switchView(viewName);
  });
});

// Observador de estado del servidor
setInterval(checkServerStatus, 5000);
```

**Justificación**:
- Desacoplamiento entre UI y lógica
- Reactividad a eventos del usuario
- Actualización automática de estado

### 3. Strategy Pattern

**Ubicación**: Renderizado de contenido

**Implementación**:
```javascript
renderContent(sheet) {
  const strategies = {
    'text': (section) => `<div class="content-text">${this.parseMarkdown(section.content)}</div>`,
    'image': (section) => `<img src="${section.src}" alt="${section.alt}">`,
    'warning': (section) => `<div class="content-box warning">⚠️ ${section.content}</div>`,
    'info': (section) => `<div class="content-box info">💡 ${section.content}</div>`,
    'success': (section) => `<div class="content-box success">✅ ${section.content}</div>`
  };
  
  return sheet.content.sections.map(section => {
    const strategy = strategies[section.type];
    return strategy ? strategy(section) : '';
  }).join('');
}
```

**Justificación**:
- Fácil agregar nuevos tipos de contenido
- Código limpio y mantenible
- Separación de responsabilidades

### 4. State Pattern

**Ubicación**: Progreso de tests

**Implementación**:
```javascript
// Estados posibles de un test
const TestStates = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// Gestión de estado
class TestState {
  constructor(chapterId, sheetId) {
    this.state = TestStates.NOT_STARTED;
    this.currentExercise = 0;
    this.answers = [];
  }
  
  start() {
    this.state = TestStates.IN_PROGRESS;
  }
  
  saveAnswer(answer) {
    this.answers.push(answer);
    this.currentExercise++;
  }
  
  complete() {
    this.state = TestStates.COMPLETED;
  }
}
```

**Justificación**:
- Gestión clara de estados del test
- Transiciones controladas
- Persistencia de estado intermedio

### 5. Bridge Pattern

**Ubicación**: preload.js

**Implementación**:
```javascript
// Puente entre Main y Renderer
contextBridge.exposeInMainWorld('electronAPI', {
  checkServerStatus: () => ipcRenderer.invoke('check-server-status')
});
```

**Justificación**:
- Abstracción de comunicación IPC
- Seguridad mediante API limitada
- Desacoplamiento de procesos

---

**Continuaré con las secciones restantes de arquitectura en archivos adicionales debido a la extensión...**
