# Documentación Técnica Detallada - Módulos Principales

> **Versión:** 2.0 - Documentación Exhaustiva  
> **Última actualización:** 2026-01-12  
> **Nivel de detalle:** Avanzado

## 📑 Índice

1. [Módulo Principal de Electron (main.js)](#módulo-principal-de-electron-mainjs)
2. [Módulo de Renderizado (renderer.js)](#módulo-de-renderizado-rendererjs)
3. [Sistema de Gestión de Cursos (courses-manager.js)](#sistema-de-gestión-de-cursos-courses-managerjs)
4. [Visor de Cursos (course-viewer.js)](#visor-de-cursos-course-viewerjs)
5. [Módulo de Seguridad (preload.js)](#módulo-de-seguridad-preloadjs)
6. [Script de Descarga (download-model.js)](#script-de-descarga-download-modeljs)
7. [Sistema de Estilos (styles.css)](#sistema-de-estilos-stylescss)

---

## Módulo Principal de Electron (main.js)

### 📋 Información General

| Propiedad | Valor |
|-----------|-------|
| **Archivo** | `app/main.js` |
| **Líneas de código** | 208 |
| **Tamaño** | ~5 KB |
| **Responsabilidad** | Proceso principal de Electron |
| **Dependencias** | electron, path, child_process, fs, http |
| **Tipo de proceso** | Main Process (Node.js) |

### 🎯 Propósito y Responsabilidades

El módulo `main.js` es el **corazón de la aplicación**, ejecutándose en el proceso principal de Electron con acceso completo a las APIs de Node.js y del sistema operativo. Sus responsabilidades críticas incluyen:

1. **Gestión del ciclo de vida** de la aplicación Electron
2. **Creación y control** de ventanas (BrowserWindow)
3. **Inicio y monitoreo** del servidor llama.cpp
4. **Comunicación IPC** entre procesos
5. **Acceso al sistema de archivos** para localizar recursos
6. **Gestión de procesos hijo** (llama-server)

### 📦 Imports y Configuración Inicial

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
```

**Análisis de imports:**

- **`app`**: Controla el ciclo de vida de la aplicación
  - Eventos: `ready`, `window-all-closed`, `before-quit`, `activate`
  - Métodos: `quit()`, `whenReady()`
  
- **`BrowserWindow`**: Clase para crear ventanas nativas
  - Propiedades: `width`, `height`, `show`, `frame`, `transparent`
  - Métodos: `loadFile()`, `close()`, `show()`
  
- **`ipcMain`**: Canal de comunicación del proceso principal
  - Métodos: `handle()` para respuestas asíncronas
  - Permite exponer funcionalidades al renderer de forma segura
  
- **`spawn`**: Crea procesos hijo sin shell
  - Más seguro que `exec` (no interpreta comandos)
  - Permite captura de stdout/stderr en tiempo real

### 🔧 Variables Globales

```javascript
let mainWindow;           // Referencia a ventana principal
let splashWindow;         // Referencia a splash screen
let llamaProcess = null;  // Proceso del servidor IA
const LLAMA_PORT = 8080;  // Puerto del servidor
```

**Decisiones de diseño:**

1. **Variables globales necesarias**: Mantener referencias a ventanas y procesos para gestión posterior
2. **Puerto fijo (8080)**: Simplifica configuración, evita conflictos en entorno local
3. **`llamaProcess` nullable**: Permite verificar si el servidor está ejecutándose

### 🔍 Función: `findModelPath()`

```javascript
function findModelPath() {
  const modelsDir = path.join(__dirname, '..', 'models');
  
  if (!fs.existsSync(modelsDir)) {
    return null;
  }
  
  const files = fs.readdirSync(modelsDir);
  const ggufFile = files.find(f => f.endsWith('.gguf'));
  
  return ggufFile ? path.join(modelsDir, ggufFile) : null;
}
```

**Análisis profundo:**

**Propósito**: Localizar automáticamente el archivo de modelo de IA en formato GGUF.

**Flujo de ejecución**:
1. Construye ruta relativa a carpeta `models/` usando `__dirname`
2. Verifica existencia del directorio con `fs.existsSync()`
3. Lee contenido del directorio con `fs.readdirSync()` (síncrono, aceptable en startup)
4. Busca primer archivo con extensión `.gguf`
5. Retorna ruta completa o `null`

**Casos de uso**:
- ✅ **Caso normal**: Encuentra `phi3-mini-q4.gguf` → Retorna ruta completa
- ⚠️ **Sin directorio**: `models/` no existe → Retorna `null`
- ⚠️ **Sin modelo**: Directorio vacío → Retorna `null`
- ⚠️ **Múltiples modelos**: Retorna el primero encontrado

**Mejoras posibles**:
```javascript
// Versión mejorada con priorización y logging
function findModelPath() {
  const modelsDir = path.join(__dirname, '..', 'models');
  
  if (!fs.existsSync(modelsDir)) {
    console.warn('[findModelPath] Directorio models/ no existe');
    return null;
  }
  
  const files = fs.readdirSync(modelsDir);
  const ggufFiles = files.filter(f => f.endsWith('.gguf'));
  
  if (ggufFiles.length === 0) {
    console.warn('[findModelPath] No se encontraron archivos .gguf');
    return null;
  }
  
  if (ggufFiles.length > 1) {
    console.info(`[findModelPath] Múltiples modelos encontrados: ${ggufFiles.join(', ')}`);
    console.info(`[findModelPath] Usando: ${ggufFiles[0]}`);
  }
  
  return path.join(modelsDir, ggufFiles[0]);
}
```

**Consideraciones de rendimiento**:
- `readdirSync()` es síncrono pero aceptable en startup
- Directorio típico tiene 1-3 archivos (< 1ms)
- No requiere recursión (modelos en raíz de `models/`)

### 🔍 Función: `findLlamaServer()`

```javascript
function findLlamaServer() {
  const engineDir = path.join(__dirname, '..', 'engine');
  const serverPath = path.join(engineDir, 'llama-server.exe');
  
  return fs.existsSync(serverPath) ? serverPath : null;
}
```

**Análisis profundo:**

**Propósito**: Localizar el ejecutable del servidor llama.cpp.

**Decisiones de diseño**:
1. **Nombre hardcoded**: `llama-server.exe` es el nombre estándar de llama.cpp
2. **Sin búsqueda recursiva**: Ejecutable debe estar en raíz de `engine/`
3. **Validación simple**: Solo verifica existencia, no permisos de ejecución

**Plataformas soportadas**:
```javascript
// Versión multiplataforma
function findLlamaServer() {
  const engineDir = path.join(__dirname, '..', 'engine');
  const isWindows = process.platform === 'win32';
  const serverName = isWindows ? 'llama-server.exe' : 'llama-server';
  const serverPath = path.join(engineDir, serverName);
  
  if (!fs.existsSync(serverPath)) {
    return null;
  }
  
  // En Unix, verificar permisos de ejecución
  if (!isWindows) {
    try {
      fs.accessSync(serverPath, fs.constants.X_OK);
    } catch (err) {
      console.error('[findLlamaServer] Archivo sin permisos de ejecución');
      return null;
    }
  }
  
  return serverPath;
}
```

### ⏱️ Función: `checkServerReady(callback, attempts)`

```javascript
function checkServerReady(callback, attempts = 0) {
  const maxAttempts = 30;
  
  if (attempts >= maxAttempts) {
    callback(false);
    return;
  }
  
  const req = http.get(`http://127.0.0.1:${LLAMA_PORT}/health`, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      setTimeout(() => checkServerReady(callback, attempts + 1), 1000);
    }
  });
  
  req.on('error', () => {
    setTimeout(() => checkServerReady(callback, attempts + 1), 1000);
  });
  
  req.end();
}
```

**Análisis exhaustivo:**

**Propósito**: Verificar que el servidor llama.cpp esté listo para recibir peticiones mediante polling del endpoint `/health`.

**Parámetros**:
- `callback`: Función a ejecutar con resultado (true/false)
- `attempts`: Número de intentos realizados (default: 0)

**Constantes**:
- `maxAttempts = 30`: Máximo 30 segundos de espera
- Intervalo: 1000ms entre intentos

**Flujo de ejecución detallado**:

```
Inicio
  │
  ├─ attempts >= 30? ──Yes──> callback(false) ──> Fin
  │                                                 
  No
  │
  ├─ HTTP GET /health
  │    │
  │    ├─ Status 200? ──Yes──> callback(true) ──> Fin
  │    │
  │    No
  │    │
  │    └─ setTimeout(1s) ──> checkServerReady(attempts + 1)
  │
  └─ Error de red?
       │
       └─ setTimeout(1s) ──> checkServerReady(attempts + 1)
```

**Casos de uso**:

1. **Servidor listo inmediatamente** (raro):
   ```
   Intento 1: GET /health → 200 OK
   Resultado: callback(true) en ~100ms
   ```

2. **Servidor tarda en cargar modelo** (común):
   ```
   Intento 1-5: Connection refused
   Intento 6: GET /health → 200 OK
   Resultado: callback(true) en ~6 segundos
   ```

3. **Servidor nunca inicia** (error):
   ```
   Intento 1-30: Connection refused
   Resultado: callback(false) en 30 segundos
   ```

**Análisis de rendimiento**:

| Escenario | Tiempo típico | Intentos |
|-----------|---------------|----------|
| Modelo pequeño (2GB) | 3-5s | 3-5 |
| Modelo mediano (5GB) | 5-10s | 5-10 |
| Modelo grande (8GB) | 10-20s | 10-20 |
| Error (sin modelo) | 30s | 30 |

**Mejoras implementables**:

```javascript
// Versión con backoff exponencial y logging detallado
function checkServerReady(callback, attempts = 0, backoff = 500) {
  const maxAttempts = 30;
  const maxBackoff = 2000;
  
  if (attempts >= maxAttempts) {
    console.error('[checkServerReady] Timeout: Servidor no respondió en 30 intentos');
    callback(false);
    return;
  }
  
  const startTime = Date.now();
  
  const req = http.get(`http://127.0.0.1:${LLAMA_PORT}/health`, (res) => {
    const responseTime = Date.now() - startTime;
    
    if (res.statusCode === 200) {
      console.log(`[checkServerReady] ✓ Servidor listo (intento ${attempts + 1}, ${responseTime}ms)`);
      callback(true);
    } else {
      console.warn(`[checkServerReady] Status ${res.statusCode}, reintentando...`);
      const nextBackoff = Math.min(backoff * 1.5, maxBackoff);
      setTimeout(() => checkServerReady(callback, attempts + 1, nextBackoff), nextBackoff);
    }
  });
  
  req.on('error', (err) => {
    console.debug(`[checkServerReady] Intento ${attempts + 1}/30: ${err.code}`);
    const nextBackoff = Math.min(backoff * 1.5, maxBackoff);
    setTimeout(() => checkServerReady(callback, attempts + 1, nextBackoff), nextBackoff);
  });
  
  req.setTimeout(5000, () => {
    req.destroy();
    console.warn('[checkServerReady] Request timeout');
  });
  
  req.end();
}
```

### 🚀 Función: `startLlamaServer()`

```javascript
function startLlamaServer() {
  const modelPath = findModelPath();
  const serverPath = findLlamaServer();
  
  if (!modelPath) {
    return { success: false, error: 'No se encontró ningún modelo .gguf en la carpeta models/' };
  }
  
  if (!serverPath) {
    return { success: false, error: 'No se encontró llama-server.exe en la carpeta engine/' };
  }
  
  try {
    llamaProcess = spawn(serverPath, [
      '-m', modelPath,
      '--port', LLAMA_PORT.toString(),
      '--ctx-size', '2048',
      '--n-gpu-layers', '0',
      '--threads', '4'
    ]);
    
    llamaProcess.stdout.on('data', (data) => {
      console.log(`[LlamaServer]: ${data}`);
    });
    
    llamaProcess.stderr.on('data', (data) => {
      console.error(`[LlamaServer Error]: ${data}`);
    });
    
    llamaProcess.on('close', (code) => {
      console.log(`[LlamaServer]: Proceso terminado con código ${code}`);
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Análisis exhaustivo:**

**Propósito**: Iniciar el servidor llama.cpp como proceso hijo con configuración específica.

**Parámetros del servidor**:

| Parámetro | Valor | Descripción | Impacto |
|-----------|-------|-------------|---------|
| `-m` | `modelPath` | Ruta al modelo GGUF | **Crítico**: Define qué modelo usar |
| `--port` | `8080` | Puerto HTTP | **Crítico**: Debe coincidir con `LLAMA_PORT` |
| `--ctx-size` | `2048` | Tamaño de contexto | **Rendimiento**: Más contexto = más RAM |
| `--n-gpu-layers` | `0` | Capas en GPU | **Compatibilidad**: 0 = solo CPU |
| `--threads` | `4` | Threads de CPU | **Rendimiento**: Ajustar según CPU |

**Configuraciones alternativas**:

```javascript
// Configuración para CPU potente (8+ cores)
const highPerformanceConfig = [
  '-m', modelPath,
  '--port', '8080',
  '--ctx-size', '4096',      // Más contexto
  '--n-gpu-layers', '0',
  '--threads', '8',          // Más threads
  '--batch-size', '512'      // Procesamiento por lotes
];

// Configuración para CPU limitada (2-4 cores)
const lowResourceConfig = [
  '-m', modelPath,
  '--port', '8080',
  '--ctx-size', '1024',      // Menos contexto
  '--n-gpu-layers', '0',
  '--threads', '2',          // Menos threads
  '--batch-size', '128'
];

// Configuración con GPU (NVIDIA)
const gpuConfig = [
  '-m', modelPath,
  '--port', '8080',
  '--ctx-size', '2048',
  '--n-gpu-layers', '35',    // Todas las capas en GPU
  '--threads', '4'
];
```

**Gestión de eventos del proceso**:

1. **stdout (salida estándar)**:
   ```javascript
   llamaProcess.stdout.on('data', (data) => {
     console.log(`[LlamaServer]: ${data}`);
   });
   ```
   - Captura logs informativos del servidor
   - Útil para debugging y monitoreo
   - Ejemplo de salida:
     ```
     [LlamaServer]: llama_model_loader: loaded meta data with 19 key-value pairs
     [LlamaServer]: llama_model_loader: - kv   0: general.architecture str = llama
     [LlamaServer]: llama_model_loader: - kv   1: general.name str = Phi-3-mini-4k-instruct
     ```

2. **stderr (salida de error)**:
   ```javascript
   llamaProcess.stderr.on('data', (data) => {
     console.error(`[LlamaServer Error]: ${data}`);
   });
   ```
   - Captura errores y advertencias
   - Crítico para diagnosticar problemas
   - Ejemplo de error:
     ```
     [LlamaServer Error]: error: failed to load model 'model.gguf'
     ```

3. **close (cierre del proceso)**:
   ```javascript
   llamaProcess.on('close', (code) => {
     console.log(`[LlamaServer]: Proceso terminado con código ${code}`);
   });
   ```
   - `code = 0`: Cierre normal
   - `code != 0`: Error o terminación forzada

**Códigos de salida comunes**:

| Código | Significado | Acción |
|--------|-------------|--------|
| 0 | Cierre normal | OK |
| 1 | Error general | Revisar stderr |
| 2 | Uso incorrecto | Verificar parámetros |
| 137 | SIGKILL (forzado) | Proceso terminado externamente |

**Manejo de errores**:

```javascript
// Versión mejorada con manejo de errores robusto
function startLlamaServer() {
  const modelPath = findModelPath();
  const serverPath = findLlamaServer();
  
  // Validaciones
  if (!modelPath) {
    const error = 'No se encontró ningún modelo .gguf en la carpeta models/';
    console.error(`[startLlamaServer] ${error}`);
    return { success: false, error };
  }
  
  if (!serverPath) {
    const error = 'No se encontró llama-server.exe en la carpeta engine/';
    console.error(`[startLlamaServer] ${error}`);
    return { success: false, error };
  }
  
  // Verificar que el modelo existe y es legible
  try {
    fs.accessSync(modelPath, fs.constants.R_OK);
  } catch (err) {
    const error = `Modelo no legible: ${err.message}`;
    console.error(`[startLlamaServer] ${error}`);
    return { success: false, error };
  }
  
  // Detectar número de CPU cores
  const os = require('os');
  const cpuCount = os.cpus().length;
  const threads = Math.max(2, Math.min(cpuCount - 1, 8));
  
  console.log(`[startLlamaServer] Iniciando servidor:`);
  console.log(`  Modelo: ${path.basename(modelPath)}`);
  console.log(`  Puerto: ${LLAMA_PORT}`);
  console.log(`  Threads: ${threads}/${cpuCount}`);
  console.log(`  Contexto: 2048 tokens`);
  
  try {
    llamaProcess = spawn(serverPath, [
      '-m', modelPath,
      '--port', LLAMA_PORT.toString(),
      '--ctx-size', '2048',
      '--n-gpu-layers', '0',
      '--threads', threads.toString()
    ], {
      // Opciones adicionales de spawn
      stdio: ['ignore', 'pipe', 'pipe'],  // stdin ignorado, stdout/stderr capturados
      windowsHide: true                    // Ocultar ventana de consola en Windows
    });
    
    // Manejar error de spawn
    llamaProcess.on('error', (err) => {
      console.error(`[startLlamaServer] Error al iniciar proceso: ${err.message}`);
    });
    
    llamaProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => console.log(`[LlamaServer] ${line}`));
    });
    
    llamaProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => console.error(`[LlamaServer Error] ${line}`));
    });
    
    llamaProcess.on('close', (code, signal) => {
      if (signal) {
        console.log(`[LlamaServer] Proceso terminado por señal: ${signal}`);
      } else {
        console.log(`[LlamaServer] Proceso terminado con código: ${code}`);
      }
      llamaProcess = null;
    });
    
    return { success: true };
  } catch (error) {
    console.error(`[startLlamaServer] Excepción: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

**Uso de memoria típico**:

| Modelo | Tamaño | RAM (ctx=2048) | RAM (ctx=4096) |
|--------|--------|----------------|----------------|
| Phi-3 Mini Q4 | 2.4 GB | ~3.5 GB | ~4.5 GB |
| Llama 3 8B Q4 | 4.9 GB | ~6.5 GB | ~8 GB |
| Mistral 7B Q4 | 4.4 GB | ~6 GB | ~7.5 GB |

### 🪟 Función: `createSplashWindow()`

```javascript
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, './assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  splashWindow.loadFile(path.join(__dirname, 'renderer', 'splash.html'));
}
```

**Análisis exhaustivo:**

**Propósito**: Crear ventana de splash screen que se muestra durante la carga inicial de la aplicación.

**Configuración de BrowserWindow**:

| Propiedad | Valor | Razón | Impacto UX |
|-----------|-------|-------|------------|
| `width` | 500 | Tamaño compacto | Splash no invasivo |
| `height` | 400 | Proporción 5:4 | Diseño balanceado |
| `frame` | false | Sin barra de título | Look moderno |
| `transparent` | true | Fondo transparente | Bordes suaves |
| `alwaysOnTop` | true | Siempre visible | No se pierde detrás |
| `icon` | icon.png | Icono de app | Branding |
| `nodeIntegration` | false | Sin Node.js | **Seguridad** |
| `contextIsolation` | true | Contextos separados | **Seguridad** |

**Diseño del splash**:

El archivo `splash.html` típicamente contiene:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: 'Segoe UI', sans-serif;
    }
    .splash-container {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      color: white;
      margin: 0 0 10px 0;
    }
    .loading {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto 0;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="splash-container">
    <div class="logo">🦙</div>
    <h1>LlamaSabIA</h1>
    <p class="loading">Iniciando servidor de IA...</p>
    <div class="spinner"></div>
  </div>
</body>
</html>
```

**Ciclo de vida del splash**:

```
1. createSplashWindow() llamado
   ↓
2. Ventana creada (invisible inicialmente)
   ↓
3. loadFile(splash.html)
   ↓
4. Ventana se muestra automáticamente
   ↓
5. Usuario ve splash mientras:
   - llama-server inicia
   - Modelo se carga
   - Health checks se ejecutan
   ↓
6. mainWindow ready-to-show
   ↓
7. setTimeout(2000) para transición suave
   ↓
8. splashWindow.close()
   ↓
9. mainWindow.show()
```

**Mejoras posibles**:

```javascript
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,                    // Centrar en pantalla
    resizable: false,                // No redimensionable
    skipTaskbar: true,               // No mostrar en barra de tareas
    icon: path.join(__dirname, './assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false                // Deshabilitar DevTools en splash
    }
  });
  
  splashWindow.loadFile(path.join(__dirname, 'renderer', 'splash.html'));
  
  // Prevenir cierre accidental
  splashWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
    }
  });
  
  // Fade in animation
  splashWindow.once('ready-to-show', () => {
    splashWindow.setOpacity(0);
    splashWindow.show();
    
    let opacity = 0;
    const fadeIn = setInterval(() => {
      opacity += 0.1;
      if (opacity >= 1) {
        clearInterval(fadeIn);
        splashWindow.setOpacity(1);
      } else {
        splashWindow.setOpacity(opacity);
      }
    }, 30);
  });
}
```

### 🪟 Función: `createMainWindow()`

```javascript
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, './assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
      }
      mainWindow.show();
    }, 2000);
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
```

**Análisis exhaustivo:**

**Propósito**: Crear la ventana principal de la aplicación con todas las funcionalidades.

**Configuración detallada**:

| Propiedad | Valor | Justificación Técnica |
|-----------|-------|----------------------|
| `width: 1200` | 1200px | Resolución mínima recomendada para contenido educativo |
| `height: 800` | 800px | Altura suficiente para chat y cursos sin scroll excesivo |
| `show: false` | false | **Crítico**: Evita flash de contenido sin cargar (FOUC) |
| `icon` | icon.png | Icono en barra de tareas y alt-tab |
| `preload` | preload.js | **Seguridad**: Único punto de comunicación con main |
| `nodeIntegration` | false | **Seguridad**: Renderer no puede usar require() |
| `contextIsolation` | true | **Seguridad**: Separa contextos de Node y browser |

**Patrón "show: false" + "ready-to-show"**:

Este patrón es **crítico** para UX profesional:

```javascript
// ❌ MAL: Flash de contenido sin cargar
mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  show: true  // Ventana visible inmediatamente
});
mainWindow.loadFile('index.html');
// Usuario ve ventana blanca mientras carga HTML/CSS/JS

// ✅ BIEN: Carga invisible, muestra cuando está listo
mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  show: false  // Invisible inicialmente
});
mainWindow.loadFile('index.html');
mainWindow.once('ready-to-show', () => {
  mainWindow.show();  // Muestra solo cuando está completamente renderizado
});
```

**Evento `ready-to-show`**:

Se dispara cuando:
1. HTML parseado completamente
2. CSS aplicado
3. JavaScript inicial ejecutado
4. DOM construido
5. Primer render completado

**Transición suave con setTimeout**:

```javascript
mainWindow.once('ready-to-show', () => {
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  }, 2000);
});
```

**Razones del delay de 2 segundos**:
1. **UX**: Evita transición abrupta splash → main
2. **Percepción**: Usuario siente que la app está "pensando"
3. **Carga completa**: Asegura que scripts asíncronos terminen
4. **Animaciones**: Tiempo para animaciones de entrada

**Versión mejorada con fade transition**:

```javascript
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,                   // Ancho mínimo
    minHeight: 600,                  // Alto mínimo
    show: false,
    backgroundColor: '#1a1a2e',      // Color de fondo mientras carga
    icon: path.join(__dirname, './assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,                 // Sandbox adicional
      webSecurity: true,             // Seguridad web habilitada
      allowRunningInsecureContent: false
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Habilitar DevTools en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      // Fade out splash
      if (splashWindow) {
        let opacity = 1;
        const fadeOut = setInterval(() => {
          opacity -= 0.1;
          if (opacity <= 0) {
            clearInterval(fadeOut);
            splashWindow.close();
            splashWindow = null;
            
            // Fade in main window
            mainWindow.setOpacity(0);
            mainWindow.show();
            
            let mainOpacity = 0;
            const fadeIn = setInterval(() => {
              mainOpacity += 0.1;
              if (mainOpacity >= 1) {
                clearInterval(fadeIn);
                mainWindow.setOpacity(1);
              } else {
                mainWindow.setOpacity(mainOpacity);
              }
            }, 30);
          } else {
            splashWindow.setOpacity(opacity);
          }
        }, 30);
      } else {
        mainWindow.show();
      }
    }, 2000);
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Prevenir navegación no deseada
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Solo permitir navegación dentro de la app
    if (!url.startsWith('file://')) {
      event.preventDefault();
      console.warn(`[Security] Navegación bloqueada a: ${url}`);
    }
  });
  
  // Prevenir apertura de nuevas ventanas
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}
```

**Gestión de memoria**:

```javascript
mainWindow.on('closed', () => {
  mainWindow = null;  // Liberar referencia para GC
});
```

**Importancia**: Sin esto, la referencia a `mainWindow` permanece en memoria incluso después de cerrar la ventana, causando memory leak.

---

**Continuaré con las secciones restantes del módulo main.js en el siguiente bloque...**
