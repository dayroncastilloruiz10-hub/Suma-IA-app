# Documentación Técnica Detallada - Estructura del Proyecto

> **Versión:** 2.0 - Análisis Exhaustivo de Estructura  
> **Última actualización:** 2026-01-12  
> **Nivel de detalle:** Arquitectura de archivos

## 📑 Índice

1. [Árbol de Directorios Completo](#árbol-de-directorios-completo)
2. [Análisis de Cada Directorio](#análisis-de-cada-directorio)
3. [Archivos Principales Detallados](#archivos-principales-detallados)
4. [Estructura de Datos JSON](#estructura-de-datos-json)
5. [Convenciones y Estándares](#convenciones-y-estándares)
6. [Métricas del Proyecto](#métricas-del-proyecto)

---

## Árbol de Directorios Completo

```
LlamaSabIA-main/
│
├── 📁 app/                                    # Aplicación Electron principal
│   ├── 📄 main.js                             # Proceso principal (208 líneas, 5KB)
│   ├── 📄 preload.js                          # Script de seguridad (6 líneas, 216B)
│   │
│   ├── 📁 assets/                             # Recursos estáticos de la app
│   │   └── 🖼️ icon.png                        # Icono de la aplicación
│   │
│   └── 📁 renderer/                           # Proceso renderer (UI)
│       ├── 📄 index.html                      # Página principal (196 líneas, 6.5KB)
│       ├── 📄 splash.html                     # Pantalla de carga (estimado 50 líneas)
│       ├── 📄 renderer.js                     # Controlador de UI (184 líneas, 5KB)
│       ├── 📄 styles.css                      # Estilos globales (2517 líneas, 47KB)
│       │
│       ├── 📁 assets/                         # Recursos de UI
│       │   ├── 📁 bienvenida/                 # Imágenes de bienvenida
│       │   ├── 📁 capitulo1/                  # Imágenes del capítulo 1
│       │   └── ...                            # Otros capítulos
│       │
│       ├── 📁 courses/                        # Sistema de cursos
│       │   ├── 📄 courses-manager.js          # Gestor de progreso (198 líneas, 6KB)
│       │   └── 📄 course-viewer.js            # Renderizador (541 líneas, 20KB)
│       │
│       └── 📁 data/                           # Datos de la aplicación
│           └── 📁 courses/                    # Cursos en JSON
│               ├── 📄 fundamentos-ia.json     # Curso 1 (361 líneas, 19KB)
│               └── 📄 algebra-lineal-ia.json  # Curso 2 (estimado)
│
├── 📁 engine/                                 # Motor de IA (llama.cpp)
│   ├── 🔧 llama-server.exe                    # Servidor de inferencia (~50MB)
│   ├── 📄 LICENSE-curl                        # Licencia de curl
│   ├── 📄 LICENSE-httplib                     # Licencia de httplib
│   ├── 📄 LICENSE-jsonhpp                     # Licencia de json.hpp
│   └── 📄 LICENSE-linenoise                   # Licencia de linenoise
│
├── 📁 models/                                 # Modelos de IA (GGUF)
│   └── 🧠 *.gguf                              # Archivos de modelo (2-8GB)
│       ├── phi3-mini-q4.gguf                  # Phi-3 Mini (2.4GB)
│       ├── llama3-8b-q4.gguf                  # Llama 3 8B (4.9GB)
│       └── mistral-7b-q4.gguf                 # Mistral 7B (4.4GB)
│
├── 📁 scripts/                                # Scripts de utilidad
│   └── 📄 download-model.js                   # Descargador de modelos (147 líneas, 5KB)
│
├── 📁 docs/                                   # Documentación técnica
│   ├── 📄 modulos.md                          # Documentación de módulos
│   ├── 📄 arquitectura.md                     # Arquitectura del sistema
│   ├── 📄 flujo.md                            # Flujo de datos
│   ├── 📄 estructura.md                       # Este archivo
│   └── 📄 desarrollo.md                       # Guía de desarrollo
│
├── 📁 assets/                                 # Assets para distribución
│   └── 🖼️ icon.ico                            # Icono para Windows
│
├── 📄 package.json                            # Configuración de npm (58 líneas, 1.2KB)
├── 📄 package-lock.json                       # Lock de dependencias (145KB)
├── 📄 .gitignore                              # Archivos ignorados por git
├── 🚀 INICIAR.bat                             # Script de inicio rápido (Windows)
└── 📄 INICIO_RAPIDO.md                        # Guía de inicio rápido

```

### Métricas Generales

| Categoría | Cantidad | Tamaño Total |
|-----------|----------|--------------|
| **Directorios** | 15 | - |
| **Archivos JavaScript** | 7 | ~41 KB |
| **Archivos HTML** | 2 | ~7 KB |
| **Archivos CSS** | 1 | 47 KB |
| **Archivos JSON** | 4 | ~165 KB |
| **Archivos de documentación** | 5 | Variable |
| **Ejecutables** | 1 | ~50 MB |
| **Modelos IA** | 1-3 | 2-8 GB |
| **Total (sin modelos)** | ~50 MB | - |
| **Total (con modelo)** | 2.5-8 GB | - |

---

## Análisis de Cada Directorio

### 📁 `/app` - Aplicación Principal

**Propósito**: Contiene toda la lógica de la aplicación Electron.

**Estructura interna**:
```
app/
├── main.js         → Proceso principal (Node.js)
├── preload.js      → Puente de seguridad
├── assets/         → Recursos estáticos
└── renderer/       → Proceso renderer (Browser)
```

**Responsabilidades**:
- `main.js`: Gestión de ventanas, servidor IA, IPC
- `preload.js`: Exposición segura de APIs
- `assets/`: Iconos y recursos de la app
- `renderer/`: Toda la interfaz de usuario

**Tamaño total**: ~100 KB (sin assets)

### 📁 `/app/renderer` - Interfaz de Usuario

**Propósito**: Todo el código que se ejecuta en el navegador (Chromium).

**Archivos principales**:

| Archivo | Líneas | Tamaño | Responsabilidad |
|---------|--------|--------|-----------------|
| `index.html` | 196 | 6.5KB | Estructura HTML principal |
| `splash.html` | ~50 | ~2KB | Pantalla de carga |
| `renderer.js` | 184 | 5KB | Controlador de UI y chat |
| `styles.css` | 2517 | 47KB | Sistema de diseño completo |

**Subdirectorios**:

#### 📁 `/app/renderer/assets`

Contiene todas las imágenes y recursos visuales del contenido educativo.

**Organización**:
```
assets/
├── bienvenida/
│   ├── intro1.png
│   └── intro2.png
├── capitulo1/
│   ├── planocartesiano.png
│   ├── descartes.png
│   ├── ubicacion.png
│   └── ejemplo.png
└── ...
```

**Convenciones**:
- Nombres descriptivos en minúsculas
- Sin espacios (usar guiones o camelCase)
- Formato PNG para imágenes con transparencia
- Formato JPG para fotografías

#### 📁 `/app/renderer/courses`

Sistema de gestión y visualización de cursos.

**Archivos**:

1. **`courses-manager.js`** (198 líneas, 6KB)
   - Clase `CoursesManager`
   - Gestión de progreso del estudiante
   - Persistencia en localStorage
   - Lógica de desbloqueo de hojas
   - Generación de contexto para IA

2. **`course-viewer.js`** (541 líneas, 20KB)
   - Clase `CourseViewer`
   - Renderizado de cursos y capítulos
   - Renderizado de contenido educativo
   - Sistema de tests interactivos
   - Modal de asistente IA

**Relación entre archivos**:
```
CourseViewer (UI)
      ↓ usa
CoursesManager (Lógica)
      ↓ lee/escribe
localStorage (Persistencia)
```

#### 📁 `/app/renderer/data/courses`

Almacena los cursos en formato JSON.

**Estructura de un curso**:
```json
{
  "id": "fundamentos-ia",
  "title": "Fundamentos de Matemática para IA",
  "description": "Sprint enfocado en funciones de activación",
  "duration": "3 semanas",
  "difficulty": "Principiante",
  "icon": "🧮",
  "chapters": [
    {
      "id": 1,
      "title": "Introducción al Sprint",
      "sheets": [
        {
          "id": 1,
          "title": "Bienvenido al Curso",
          "duration": "15 min",
          "type": "content",
          "unlocked": true,
          "content": {
            "sections": [...]
          }
        },
        {
          "id": 2,
          "title": "Test: Bienvenido al Curso",
          "duration": "10 min",
          "type": "test",
          "requiresCompletion": 1,
          "exercises": [...]
        }
      ]
    }
  ],
  "aiContext": "Contexto para el asistente..."
}
```

**Validación de estructura**:
- `id`: String único, kebab-case
- `chapters`: Array no vacío
- `chapters[].id`: Número entero secuencial
- `chapters[].sheets`: Array no vacío
- `sheets[].id`: Número entero secuencial
- `sheets[].type`: "content" o "test"

### 📁 `/engine` - Motor de IA

**Propósito**: Contiene el ejecutable de llama.cpp y sus dependencias.

**Contenido**:
- `llama-server.exe`: Servidor HTTP de inferencia (~50MB)
- Licencias de bibliotecas incluidas (curl, httplib, json.hpp, linenoise)

**Compilación**:
El ejecutable es compilado desde el repositorio oficial de llama.cpp:
```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

**Dependencias incluidas**:
- **curl**: Cliente HTTP para descargas
- **httplib**: Servidor HTTP embebido
- **json.hpp**: Parser JSON (nlohmann/json)
- **linenoise**: Interfaz de línea de comandos

### 📁 `/models` - Modelos de IA

**Propósito**: Almacenar archivos de modelo en formato GGUF.

**Modelos soportados**:

| Modelo | Tamaño | Cuantización | RAM Necesaria | Velocidad |
|--------|--------|--------------|---------------|-----------|
| Phi-3 Mini | 2.4 GB | Q4_K_M | ~3.5 GB | Rápido |
| Llama 3 8B | 4.9 GB | Q4_K_M | ~6.5 GB | Medio |
| Mistral 7B | 4.4 GB | Q4_K_M | ~6 GB | Medio |

**Formato GGUF**:
- **G**GPT-**G**enerated **U**nified **F**ormat
- Formato binario optimizado para inferencia
- Contiene: metadatos, pesos, vocabulario, configuración

**Estructura interna de un GGUF**:
```
┌─────────────────────────────────────┐
│  Header                             │
│  - Magic number (GGUF)              │
│  - Version                          │
│  - Tensor count                     │
│  - Metadata count                   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Metadata                           │
│  - general.architecture             │
│  - general.name                     │
│  - llama.context_length             │
│  - llama.embedding_length           │
│  - llama.block_count                │
│  - ...                              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Tensor Info                        │
│  - Name, dimensions, type           │
│  - Offset in file                   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Tensor Data                        │
│  - Quantized weights                │
│  - Aligned to 32 bytes              │
└─────────────────────────────────────┘
```

### 📁 `/scripts` - Utilidades

**Propósito**: Scripts de Node.js para tareas auxiliares.

**Archivo principal**: `download-model.js`

**Funcionalidad**:
```javascript
// Uso
npm run download:model phi3-mini

// Proceso
1. Validar argumento
2. Verificar si modelo ya existe
3. Crear directorio models/ si no existe
4. Descargar desde HuggingFace
5. Mostrar progreso
6. Verificar descarga completa
```

**Modelos disponibles**:
```javascript
const MODELS = {
  'phi3-mini': {
    name: 'Phi-3 Mini 4K Instruct (Q4)',
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/...',
    size: '2.4 GB',
    file: 'phi3-mini-q4.gguf'
  },
  'llama3-8b': {
    name: 'Llama 3 8B Instruct (Q4)',
    url: 'https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/...',
    size: '4.9 GB',
    file: 'llama3-8b-q4.gguf'
  },
  'mistral-7b': {
    name: 'Mistral 7B Instruct (Q4)',
    url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/...',
    size: '4.4 GB',
    file: 'mistral-7b-q4.gguf'
  }
};
```

### 📁 `/docs` - Documentación

**Propósito**: Documentación técnica completa del proyecto.

**Archivos**:

| Documento | Contenido | Audiencia |
|-----------|-----------|-----------|
| `modulos.md` | Documentación de módulos principales | Desarrolladores |
| `arquitectura.md` | Arquitectura del sistema | Arquitectos |
| `flujo.md` | Flujo de datos y procesos | Desarrolladores |
| `estructura.md` | Estructura de archivos | Todos |
| `desarrollo.md` | Guía de desarrollo | Desarrolladores nuevos |

---

## Archivos Principales Detallados

### 📄 `package.json`

**Propósito**: Configuración del proyecto npm y Electron.

**Secciones principales**:

```json
{
  "name": "llamasabia",
  "version": "1.0.0",
  "description": "IA offline portable para educación sin internet",
  "main": "app/main.js",
  
  "scripts": {
    "start": "electron .",
    "build:portable": "electron-builder --win portable --config",
    "download:model": "node scripts/download-model.js"
  },
  
  "dependencies": {
    "marked": "^16.4.1"
  },
  
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  },
  
  "build": {
    "appId": "com.llamasabia.app",
    "productName": "LlamaSabIA",
    "win": {
      "target": "portable",
      "icon": "assets/icon.ico"
    },
    "extraResources": [
      { "from": "engine/", "to": "engine/" },
      { "from": "models/", "to": "models/", "filter": ["**/*.gguf"] }
    ]
  }
}
```

**Análisis de scripts**:

1. **`start`**: Inicia Electron en modo desarrollo
   ```bash
   npm start
   # Equivale a: electron .
   # Busca main en package.json → app/main.js
   ```

2. **`build:portable`**: Crea ejecutable portable
   ```bash
   npm run build:portable
   # Resultado: dist/LlamaSabIA-1.0.0-portable.exe
   ```

3. **`download:model`**: Descarga modelo de IA
   ```bash
   npm run download:model phi3-mini
   # Descarga a models/phi3-mini-q4.gguf
   ```

**Dependencias**:

- **`marked`**: Parser de Markdown (futuro uso para renderizado avanzado)
- **`electron`**: Framework de aplicación de escritorio
- **`electron-builder`**: Herramienta de empaquetado

### 📄 `app/main.js`

**Análisis de imports**:
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
```

**Funciones exportadas**: Ninguna (archivo ejecutable)

**Variables globales**:
- `mainWindow`: Referencia a ventana principal
- `splashWindow`: Referencia a splash screen
- `llamaProcess`: Proceso del servidor IA
- `LLAMA_PORT`: Puerto del servidor (8080)

**Ciclo de vida**:
```
app.whenReady()
  ↓
createSplashWindow()
  ↓
startLlamaServer()
  ↓
checkServerReady()
  ↓
createMainWindow()
  ↓
mainWindow.ready-to-show
  ↓
splashWindow.close()
  ↓
mainWindow.show()
```

### 📄 `app/renderer/styles.css`

**Tamaño**: 2517 líneas, 47 KB

**Organización**:

```css
/* 1. Reset y variables (líneas 1-20) */
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --primary: #667eea;
  --bg-dark: #1a1a2e;
  /* ... */
}

/* 2. Sidebar (líneas 33-148) */
.sidebar { /* ... */ }
.nav-item { /* ... */ }
.status-indicator { /* ... */ }

/* 3. Main Content (líneas 149-182) */
.main-content { /* ... */ }
.view { /* ... */ }

/* 4. Chat View (líneas 183-325) */
.chat-messages { /* ... */ }
.message { /* ... */ }
.chat-input-container { /* ... */ }

/* 5. Courses View (líneas 326-800) */
.course-card { /* ... */ }
.chapter-card { /* ... */ }
.sheet-item { /* ... */ }

/* 6. Content Rendering (líneas 801-1500) */
.content-text { /* ... */ }
.content-image { /* ... */ }
.content-box { /* ... */ }

/* 7. Tests (líneas 1501-2000) */
.exercise-card { /* ... */ }
.options-container { /* ... */ }
.feedback-success { /* ... */ }

/* 8. Utilities (líneas 2001-2517) */
.hidden { display: none; }
.scrollbar { /* ... */ }
```

**Variables CSS**:
```css
:root {
  /* Colores principales */
  --primary: #667eea;
  --primary-dark: #5568d3;
  --secondary: #764ba2;
  
  /* Fondos */
  --bg-dark: #1a1a2e;
  --bg-darker: #16161e;
  --bg-lighter: #25253a;
  
  /* Textos */
  --text: #e0e0e0;
  --text-dim: #a0a0a0;
  
  /* Estados */
  --success: #10b981;
  --error: #ef4444;
  --border: #333344;
}
```

**Animaciones definidas**:
```css
@keyframes slideIn { /* ... */ }
@keyframes pulse { /* ... */ }
@keyframes shimmer { /* ... */ }
@keyframes bounce { /* ... */ }
@keyframes gradientFlow { /* ... */ }
```

---

**Continuaré con las secciones restantes...**
