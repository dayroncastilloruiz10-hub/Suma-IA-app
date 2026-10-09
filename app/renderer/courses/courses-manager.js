// Gestor de cursos y progreso del estudiante
class CoursesManager {
  constructor() {
    this.currentCourse = null;
    this.currentChapter = null;
    this.currentSheet = null;
    this.progress = this.loadProgress();
  }

  // Cargar progreso desde localStorage
  loadProgress() {
    const saved = localStorage.getItem('course_progress');
    return saved ? JSON.parse(saved) : {};
  }

  // Guardar progreso
  saveProgress() {
    localStorage.setItem('course_progress', JSON.stringify(this.progress));
  }

  // Cargar curso desde JSON
  async loadCourse(courseId) {
    try {
      const response = await fetch(`data/courses/${courseId}.json`);
      this.currentCourse = await response.json();
      
      // Inicializar progreso si no existe
      if (!this.progress[courseId]) {
        this.progress[courseId] = {
          startedAt: new Date().toISOString(),
          completedSheets: [],
          scores: {},
          testProgress: {} // Guardar progreso de tests
        };
        this.saveProgress();
      }
      
      return this.currentCourse;
    } catch (error) {
      console.error('Error cargando curso:', error);
      return null;
    }
  }

  // Obtener hoja específica
  getSheet(chapterId, sheetId) {
    const chapter = this.currentCourse.chapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    
    this.currentChapter = chapter;
    this.currentSheet = chapter.sheets.find(s => s.id === sheetId);
    
    return this.currentSheet;
  }

  // Verificar si una hoja está desbloqueada
  isSheetUnlocked(chapterId, sheetId) {
    const sheet = this.getSheet(chapterId, sheetId);
    if (!sheet) return false;
    
    // La primera hoja siempre está desbloqueada
    if (sheet.unlocked) return true;
    
    // Si es un TEST, verificar que se completó la hoja requerida
    if (sheet.type === 'test' && sheet.requiresCompletion) {
      const requiredSheetId = sheet.requiresCompletion;
      const progressKey = `${this.currentCourse.id}-${chapterId}-${requiredSheetId}`;
      return this.progress[this.currentCourse.id]?.completedSheets.includes(progressKey);
    }
    
    // Para hojas normales, verificar que la anterior esté completada
    const prevSheetId = sheetId - 1;
    const progressKey = `${this.currentCourse.id}-${chapterId}-${prevSheetId}`;
    
    return this.progress[this.currentCourse.id]?.completedSheets.includes(progressKey);
  }

  // Marcar hoja como completada
  completeSheet(chapterId, sheetId, score) {
    const progressKey = `${this.currentCourse.id}-${chapterId}-${sheetId}`;
    
    if (!this.progress[this.currentCourse.id].completedSheets.includes(progressKey)) {
      this.progress[this.currentCourse.id].completedSheets.push(progressKey);
    }
    
    this.progress[this.currentCourse.id].scores[progressKey] = score;
    
    // Limpiar progreso del test si existe
    delete this.progress[this.currentCourse.id].testProgress[progressKey];
    
    this.saveProgress();
    
    console.log(`✅ Hoja ${sheetId} completada con score: ${score}%`);
  }

  // Guardar progreso de test (qué pregunta va)
  saveTestProgress(chapterId, sheetId, exerciseIndex, answers = []) {
    const progressKey = `${this.currentCourse.id}-${chapterId}-${sheetId}`;
    
    if (!this.progress[this.currentCourse.id].testProgress) {
      this.progress[this.currentCourse.id].testProgress = {};
    }
    
    this.progress[this.currentCourse.id].testProgress[progressKey] = {
      currentExercise: exerciseIndex,
      answers: answers,
      lastUpdate: new Date().toISOString()
    };
    
    this.saveProgress();
  }

  // Obtener progreso de test
  getTestProgress(chapterId, sheetId) {
    const progressKey = `${this.currentCourse.id}-${chapterId}-${sheetId}`;
    return this.progress[this.currentCourse.id]?.testProgress?.[progressKey] || null;
  }

  // Obtener progreso total del curso
  getCourseProgress() {
    if (!this.currentCourse) return 0;
    
    const totalSheets = this.currentCourse.chapters.reduce(
      (sum, chapter) => sum + chapter.sheets.length, 
      0
    );
    
    const completed = this.progress[this.currentCourse.id]?.completedSheets.length || 0;
    
    return Math.round((completed / totalSheets) * 100);
  }

  // Obtener contexto para IA
  getAIContext() {
    if (!this.currentSheet || !this.currentCourse) {
      return "Contexto general de cursos de programación.";
    }
    
    const context = `
      Curso: ${this.currentCourse.title}
      Capítulo: ${this.currentChapter.title}
      Hoja Actual: ${this.currentSheet.title}
      
      ${this.currentCourse.aiContext}
      
      Contenido de la hoja actual:
      ${this.getSheetTextContent()}
    `;
    
    return context;
  }

  // Extraer texto del contenido
  getSheetTextContent() {
    if (!this.currentSheet) return "";
    
    if (this.currentSheet.type === 'test') {
      return this.currentSheet.exercises
        .map(ex => `Pregunta: ${ex.question}`)
        .join('\n');
    }
    
    return this.currentSheet.content.sections
      .filter(section => section.type === 'text')
      .map(section => section.content)
      .join('\n\n');
  }

  // Limpiar progreso (útil para testing)
  resetProgress(courseId) {
    if (courseId) {
      delete this.progress[courseId];
    } else {
      this.progress = {};
    }
    this.saveProgress();
    console.log('🔄 Progreso reiniciado');
    
    // Recargar la página para reflejar cambios
    if (this.currentCourse) {
      window.location.reload();
    }
  }
}

// Instancia global
const coursesManager = new CoursesManager();
console.log('✅ CoursesManager inicializado');

// FUNCIÓN GLOBAL PARA REINICIAR PROGRESO DESDE CONSOLA
window.resetCourseProgress = function(courseId = 'fundamentos-ia') {
  if (confirm('⚠️ ¿Estás seguro de reiniciar todo el progreso?')) {
    coursesManager.resetProgress(courseId);
    alert('✅ Progreso reiniciado. Recargando página...');
  }
};

console.log('💡 Tip: Escribe resetCourseProgress() en la consola para reiniciar el progreso');