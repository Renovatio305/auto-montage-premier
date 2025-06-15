// ПРОСТОЙ ЗАПУСК БЕЗ ПРОВЕРОК
// Запустите этот файл из ExtendScript Toolkit

// Отключаем проверки
var AdvancedEffects = {
    applyAdvancedAudioEffects: function() {}
};

var MediaEncoderIntegration = {
    checkMediaEncoder: function() { return false; },
    optimizeForSocialMedia: function(p) { return {codec: "H.264", profile: "High", level: "4.2"}; },
    createCustomPreset: function() { return ""; },
    addToQueue: function() { return null; }
};

// Загружаем основной скрипт
try {
    var scriptPath = File($.fileName).parent.fsName + "/auto_montage_gui_FINAL.jsx";
    
    // Читаем файл
    var mainFile = new File(scriptPath);
    if (!mainFile.exists) {
        alert("Файл не найден: " + scriptPath);
    } else {
        mainFile.open("r");
        var content = mainFile.read();
        mainFile.close();
        
        // Убираем проблемные строки
        content = content.replace('#include "effects-module.js"', '// removed include');
        content = content.replace('#include "media-encoder-integration.js"', '// removed include');
        
        // Выполняем
        eval(content);
    }
} catch(e) {
    alert("Ошибка: " + e.toString() + "\nСтрока: " + e.line);
}