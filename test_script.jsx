// Test Installation Script для Auto Montage Builder Pro
// Запустите этот скрипт для проверки корректности установки

(function testInstallation() {
    var report = [];
    var errors = [];
    var warnings = [];
    
    // Проверка версии Premiere Pro
    report.push("=== ПРОВЕРКА УСТАНОВКИ AUTO MONTAGE BUILDER PRO ===");
    report.push("");
    
    try {
        var version = app.version;
        var majorVersion = parseInt(version.split(".")[0]);
        report.push("✓ Premiere Pro версия: " + version);
        
        if (majorVersion < 14) {
            errors.push("✗ Требуется Premiere Pro 2020 (14.0) или новее");
        }
    } catch(e) {
        errors.push("✗ Не удалось определить версию Premiere Pro");
    }
    
    // Проверка активного проекта
    if (app.project) {
        report.push("✓ Активный проект найден");
    } else {
        warnings.push("⚠ Нет активного проекта (создайте новый проект)");
    }
    
    // Проверка наличия файлов
    var scriptFolder = File($.fileName).parent;
    var requiredFiles = [
        "auto_montage_gui_FINAL.jsx",
        "effects-module.js",
        "media-encoder-integration.js",
        "enhanced-audio-processor.bat",
        "presets.json",
        "settings.json"
    ];
    
    report.push("");
    report.push("Проверка файлов:");
    
    for (var i = 0; i < requiredFiles.length; i++) {
        var file = new File(scriptFolder.fsName + "/" + requiredFiles[i]);
        if (file.exists) {
            report.push("✓ " + requiredFiles[i] + " - найден");
        } else {
            errors.push("✗ " + requiredFiles[i] + " - НЕ НАЙДЕН!");
        }
    }
    
    // Проверка FFmpeg
    report.push("");
    report.push("Проверка FFmpeg:");
    
    var ffmpegPaths = [
        scriptFolder.fsName + "/ffmpeg.exe",
        "C:/ffmpeg/bin/ffmpeg.exe",
        "ffmpeg.exe" // в PATH
    ];
    
    var ffmpegFound = false;
    for (var j = 0; j < ffmpegPaths.length; j++) {
        var ffmpegFile = new File(ffmpegPaths[j]);
        if (ffmpegFile.exists) {
            report.push("✓ FFmpeg найден: " + ffmpegPaths[j]);
            ffmpegFound = true;
            break;
        }
    }
    
    if (!ffmpegFound) {
        // Попробуем через системную команду
        try {
            var bat = new File(Folder.temp.fsName + "/test_ffmpeg.bat");
            bat.open("w");
            bat.writeln("@echo off");
            bat.writeln("where ffmpeg.exe > nul 2>&1");
            bat.writeln("if %errorlevel% equ 0 (echo found) else (echo notfound)");
            bat.close();
            
            if (bat.execute()) {
                report.push("✓ FFmpeg найден в системном PATH");
                ffmpegFound = true;
            }
            bat.remove();
        } catch(e) {}
    }
    
    if (!ffmpegFound) {
        errors.push("✗ FFmpeg не найден! Скачайте с https://www.gyan.dev/ffmpeg/builds/");
    }
    
    // Проверка Media Encoder
    report.push("");
    report.push("Проверка Adobe Media Encoder:");
    
    try {
        if (app.encoder) {
            report.push("✓ Media Encoder API доступен");
        } else {
            warnings.push("⚠ Media Encoder API недоступен (экспорт будет ручным)");
        }
    } catch(e) {
        warnings.push("⚠ Не удалось проверить Media Encoder");
    }
    
    // Проверка прав записи
    report.push("");
    report.push("Проверка прав доступа:");
    
    try {
        var testFile = new File(scriptFolder.fsName + "/test_write.tmp");
        testFile.open("w");
        testFile.write("test");
        testFile.close();
        testFile.remove();
        report.push("✓ Права на запись в папку скрипта");
    } catch(e) {
        errors.push("✗ Нет прав на запись в папку скрипта");
    }
    
    try {
        var tempFile = new File(Folder.temp.fsName + "/test_write.tmp");
        tempFile.open("w");
        tempFile.write("test");
        tempFile.close();
        tempFile.remove();
        report.push("✓ Права на запись во временную папку");
    } catch(e) {
        errors.push("✗ Нет прав на запись во временную папку");
    }
    
    // Проверка эффектов
    report.push("");
    report.push("Проверка доступных эффектов:");
    
    var requiredEffects = ["Lumetri Color", "Cross Dissolve", "Dip to Black"];
    var qeProject = qe.project;
    
    if (qeProject) {
        try {
            var videoEffects = qeProject.getVideoEffectList();
            var foundEffects = 0;
            
            for (var k = 0; k < requiredEffects.length; k++) {
                for (var l = 0; l < videoEffects.length; l++) {
                    if (videoEffects[l].displayName === requiredEffects[k]) {
                        foundEffects++;
                        break;
                    }
                }
            }
            
            report.push("✓ Найдено эффектов: " + foundEffects + " из " + requiredEffects.length);
        } catch(e) {
            warnings.push("⚠ Не удалось проверить список эффектов");
        }
    }
    
    // Формирование итогового отчета
    var finalReport = report.join("\n");
    
    if (errors.length > 0) {
        finalReport += "\n\n❌ ОШИБКИ:\n" + errors.join("\n");
    }
    
    if (warnings.length > 0) {
        finalReport += "\n\n⚠️ ПРЕДУПРЕЖДЕНИЯ:\n" + warnings.join("\n");
    }
    
    if (errors.length === 0) {
        finalReport += "\n\n✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!";
        finalReport += "\nСкрипт готов к использованию.";
    } else {
        finalReport += "\n\n❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ!";
        finalReport += "\nИсправьте ошибки перед использованием скрипта.";
    }
    
    // Сохранение отчета
    var reportFile = new File(scriptFolder.fsName + "/installation_report.txt");
    reportFile.open("w");
    reportFile.write(finalReport);
    reportFile.close();
    
    // Показ диалога с результатами
    var dialog = new Window("dialog", "Результаты проверки установки");
    dialog.orientation = "column";
    dialog.alignChildren = ["fill", "top"];
    dialog.preferredSize.width = 600;
    
    var textPanel = dialog.add("panel");
    textPanel.preferredSize.height = 400;
    var text = textPanel.add("edittext", undefined, finalReport, {multiline: true, readonly: true});
    text.preferredSize = [550, 380];
    
    var btnGroup = dialog.add("group");
    btnGroup.alignment = "center";
    
    var okBtn = btnGroup.add("button", undefined, "OK");
    okBtn.onClick = function() { dialog.close(); };
    
    var openReportBtn = btnGroup.add("button", undefined, "Открыть отчет");
    openReportBtn.onClick = function() {
        reportFile.execute();
    };
    
    dialog.center();
    dialog.show();
    
})();