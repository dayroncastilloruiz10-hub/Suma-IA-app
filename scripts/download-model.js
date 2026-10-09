const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración de modelos disponibles
const MODELS = {
  'phi3-mini': {
    name: 'Phi-3 Mini 4K Instruct (Q4)',
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    size: '2.4 GB',
    file: 'phi3-mini-q4.gguf'
  },
  'llama3-8b': {
    name: 'Llama 3 8B Instruct (Q4)',
    url: 'https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct.Q4_K_M.gguf',
    size: '4.9 GB',
    file: 'llama3-8b-q4.gguf'
  },
  'mistral-7b': {
    name: 'Mistral 7B Instruct (Q4)',
    url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
    size: '4.4 GB',
    file: 'mistral-7b-q4.gguf'
  }
};

// Función para descargar archivo
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n📥 Descargando desde: ${url}`);
    console.log(`📁 Guardando en: ${outputPath}\n`);
    
    const file = fs.createWriteStream(outputPath);
    let downloadedBytes = 0;
    let totalBytes = 0;
    let lastProgress = 0;
    
    https.get(url, (response) => {
      // Manejar redirecciones
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(outputPath);
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Error HTTP: ${response.statusCode}`));
        return;
      }
      
      totalBytes = parseInt(response.headers['content-length'], 10);
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = Math.floor((downloadedBytes / totalBytes) * 100);
        
        if (progress !== lastProgress && progress % 5 === 0) {
          const mbDownloaded = (downloadedBytes / 1024 / 1024).toFixed(2);
          const mbTotal = (totalBytes / 1024 / 1024).toFixed(2);
          console.log(`⏳ Progreso: ${progress}% (${mbDownloaded} MB / ${mbTotal} MB)`);
          lastProgress = progress;
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Descarga completada!\n');
        resolve();
      });
      
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

// Script principal
async function main() {
  const modelKey = process.argv[2];
  
  console.log('\n🦙 LlamaSabIA - Descargador de Modelos\n');
  console.log('═══════════════════════════════════════\n');
  
  if (!modelKey || !MODELS[modelKey]) {
    console.log('📚 Modelos disponibles:\n');
    
    Object.keys(MODELS).forEach(key => {
      const model = MODELS[key];
      console.log(`  ${key}`);
      console.log(`    Nombre: ${model.name}`);
      console.log(`    Tamaño: ${model.size}`);
      console.log('');
    });
    
    console.log('💡 Uso:');
    console.log('   npm run download:model <modelo>\n');
    console.log('📝 Ejemplo:');
    console.log('   npm run download:model phi3-mini\n');
    
    process.exit(1);
  }
  
  const model = MODELS[modelKey];
  const modelsDir = path.join(__dirname, '..', 'models');
  const outputPath = path.join(modelsDir, model.file);
  
  // Crear carpeta models si no existe
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  
  // Verificar si ya existe
  if (fs.existsSync(outputPath)) {
    console.log(`⚠️  El archivo ${model.file} ya existe.`);
    console.log('   Si quieres reemplazarlo, elimínalo primero.\n');
    process.exit(0);
  }
  
  console.log(`📦 Modelo seleccionado: ${model.name}`);
  console.log(`💾 Tamaño estimado: ${model.size}`);
  console.log(`\n⏰ Esto puede tomar varios minutos dependiendo de tu conexión...\n`);
  
  try {
    await downloadFile(model.url, outputPath);
    
    console.log('═══════════════════════════════════════\n');
    console.log('🎉 ¡Modelo descargado exitosamente!\n');
    console.log(`📁 Ubicación: ${outputPath}`);
    console.log('\n🚀 Ahora puedes ejecutar:');
    console.log('   npm start\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la descarga:', error.message);
    console.log('\n💡 Intenta:');
    console.log('   1. Verificar tu conexión a internet');
    console.log('   2. Descargar manualmente desde HuggingFace');
    console.log('   3. Colocar el archivo .gguf en la carpeta models/\n');
    process.exit(1);
  }
}

main();