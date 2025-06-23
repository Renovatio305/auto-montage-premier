// Auto Montage Builder Pro - CEP Version
// Версия без проблемных модулей для работы в CEP панели

// Создаем заглушки модулей
var AdvancedEffects = {
    applyAdvancedAudioEffects: function() {},
    applyAdvancedKenBurns: function() {},
    applyAdvancedColorGrading: function() {},
    applyAdvancedTransition: function() {}
};

var MediaEncoderIntegration = {
    checkMediaEncoder: function() { return false; },
    optimizeForSocialMedia: function(p) { 
        return {
            codec: "H.264",
            profile: "High", 
            level: "4.2",
            keyframeInterval: 30,
            twoPass: true
        };
    },
    createCustomPreset: function(name, settings) {
        return '<?xml version="1.0"?><preset/>';
    },
    addToQueue: function() { return null; }
};

// Теперь загружаем основной скрипт
try {
    var scriptPath = new File($.fileName).parent.fsName + "/auto_montage_gui_FINAL.jsx";
    var mainFile = new File(scriptPath);
    
    if (mainFile.exists) {
        mainFile.open("r");
        var content = mainFile.read();
        mainFile.close();
        
        // Убираем проблемные include
        content = content.replace(/#include\s+"effects-module\.js"/g, '// removed include');
        content = content.replace(/#include\s+"media-encoder-integration\.js"/g, '// removed include');
        
        // Выполняем
        eval(content);
    } else {
        alert("Не найден основной файл скрипта:\n" + scriptPath);
    }
} catch(e) {
    alert("Ошибка загрузки скрипта:\n" + e.toString() + "\n\nСтрока: " + e.line);
}