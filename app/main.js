const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;
let splashWindow;
let llamaProcess = null;
let jupyterProcess = null;
const LLAMA_PORT = 8080;
const JUPYTER_PORT = 8888;

// Función para encontrar el modelo GGUF
function findModelPath() {
  const modelsDir = path.join(__dirname, '..', 'models');
  
  if (!fs.existsSync(modelsDir)) {
    return null;
  }
  
  const files = fs.readdirSync(modelsDir);
  const ggufFile = files.find(f => f.endsWith('.gguf'));
  
  return ggufFile ? path.join(modelsDir, ggufFile) : null;
}

// Función para encontrar llama-server ejecutable
function findLlamaServer() {
  const engineDir = path.join(__dirname, '..', 'engine');
  const serverPath = path.join(engineDir, 'llama-server.exe');
  
  return fs.existsSync(serverPath) ? serverPath : null;
}

// Verificar si el servidor está listo
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

// Iniciar llama.cpp server
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

// Iniciar servidor Jupyter Notebook (local, sin navegador)
function startJupyterServer() {
  // Ruta de notebooks: carpeta dentro del proyecto donde colocarás los .ipynb
  const notebooksDir = path.join(__dirname, '..', 'app', 'jupyterlite-src', 'contents');

  // Forzar el uso del kernel embebido "python39-local" si existe
  // Esto se logra pasando el argumento --KernelSpecManager.default_kernel_name
  const kernelName = 'python39-local';

  // Usar el ejecutable de python disponible en PATH (o variable PYTHON)
  // Prefer an included portable Python runtime if present inside the project (runtime/python39),
  // otherwise use PYTHON env var or system 'python'
  const embeddedPython = path.join(__dirname, '..', 'runtime', 'python39', 'python.exe');
  const pythonCmd = fs.existsSync(embeddedPython) ? embeddedPython : (process.env.PYTHON || 'python');

  // Configurar JUPYTER_PATH para que encuentre nuestro kernel
  process.env.JUPYTER_PATH = path.join(__dirname, '..', 'runtime', 'jupyter');

  try {
    // Ejecutar el módulo notebook para evitar depender del binario jupyter en PATH
    jupyterProcess = spawn(pythonCmd, [
      '-m', 'notebook',
      '--no-browser',
      '--port', JUPYTER_PORT.toString(),
      '--NotebookApp.token=', // token vacío (solo recomendado en entornos offline y locales)
      '--NotebookApp.allow_origin=*',
      '--notebook-dir', notebooksDir,
      '--KernelSpecManager.default_kernel_name=' + kernelName,
      '--KernelSpecManager.ensure_native_kernel=false',
      '--JupyterApp.kernel_spec_manager_class=jupyter_client.kernelspec.KernelSpecManager'
    ], { cwd: notebooksDir });

    jupyterProcess.stdout.on('data', (data) => {
      console.log(`[Jupyter]: ${data}`);
    });

    jupyterProcess.stderr.on('data', (data) => {
      console.error(`[Jupyter Error]: ${data}`);
    });

    jupyterProcess.on('close', (code) => {
      console.log(`[Jupyter]: Proceso terminado con código ${code}`);
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Verificar si Jupyter está escuchando en el puerto
function checkJupyterReady(callback, attempts = 0) {
  const maxAttempts = 30;
  if (attempts >= maxAttempts) {
    callback(false);
    return;
  }

  const req = http.get(`http://127.0.0.1:${JUPYTER_PORT}/`, (res) => {
    // Si responde (cualquier código), consideramos que está listo
    callback(true);
  });

  req.on('error', () => {
    setTimeout(() => checkJupyterReady(callback, attempts + 1), 1000);
  });

  req.end();
}

// Crear ventana de splash
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

// Crear ventana principal
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

// Inicialización de la app
app.whenReady().then(() => {
  createSplashWindow();
  
  // Iniciar servidor llama.cpp
  const result = startLlamaServer();
  
  if (!result.success) {
    console.error('Error al iniciar servidor:', result.error);
  } else {
    console.log('Servidor llama.cpp iniciando...');
    
    // Iniciar servidor Jupyter Notebook local
    const jupyterResult = startJupyterServer();
    if (!jupyterResult.success) {
      console.error('Error al iniciar Jupyter:', jupyterResult.error);
    } else {
      console.log('Servidor Jupyter iniciando...');
      checkJupyterReady((isReady) => {
        if (isReady) {
          console.log('Servidor Jupyter listo en http://127.0.0.1:' + JUPYTER_PORT);
        } else {
          console.log('Servidor Jupyter tardó demasiado en iniciar');
        }
      });
    }

    // Esperar a que el servidor esté listo
    checkServerReady((isReady) => {
      if (isReady) {
        console.log('Servidor llama.cpp listo!');
      } else {
        console.log('Servidor tardó demasiado en iniciar');
      }
      createMainWindow();
    });
  }
  
  // Si no hay ventanas, crear una (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Cerrar la app cuando todas las ventanas se cierran (excepto macOS)
app.on('window-all-closed', () => {
  if (llamaProcess) {
    llamaProcess.kill();
  }
  if (jupyterProcess) {
    jupyterProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Limpiar al cerrar
app.on('before-quit', () => {
  if (llamaProcess) {
    llamaProcess.kill();
  }
  if (jupyterProcess) {
    jupyterProcess.kill();
  }
});

// IPC Handlers
ipcMain.handle('check-server-status', async () => {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${LLAMA_PORT}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.end();
  });
});

// Abrir enlace externo desde renderer (ej. abrir notebook en navegador)
ipcMain.handle('open-external', async (event, url) => {
  try {
    const { shell } = require('electron');
    await shell.openExternal(url);
    return true;
  } catch (err) {
    console.error('open-external error:', err);
    return false;
  }
});