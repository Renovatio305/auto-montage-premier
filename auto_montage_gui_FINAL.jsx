// Auto Montage Builder Pro - Enhanced Edition for Adobe Premiere Pro
// Полная реализация с интеграцией Premiere API

// ВАЖНО: Подключение модулей
//#include "effects-module.js"
//#include "media-encoder-integration.js"

(function main() {
    // ===== КОНСТАНТЫ И НАСТРОЙКИ =====
    var SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp'];
    var SUPPORTED_AUDIO_FORMATS = ['.mp3', '.wav', '.aiff'];
    var EXPORT_PRESETS = {
        'YouTube': { width: 1920, height: 1080, bitrate: 8000, fps: 30 },
        'YouTube Shorts': { width: 1080, height: 1920, bitrate: 10000, fps: 30 },
        'TikTok': { width: 1080, height: 1920, bitrate: 6000, fps: 30 },
        'Instagram Reels': { width: 1080, height: 1920, bitrate: 8000, fps: 30 },
        'Instagram Feed': { width: 1080, height: 1080, bitrate: 6000, fps: 30 },
        'Twitter': { width: 1280, height: 720, bitrate: 5000, fps: 30 },
        'Custom': { width: 1920, height: 1080, bitrate: 8000, fps: 30 }
    };

    // ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
    var PROJECT_FOLDER = null;
    var AUDIO_VARIANTS_FOLDER = null;
    var RENDERS_FOLDER = null;

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    if (!initializeScript()) {
        alert("Ошибка инициализации скрипта. Проверьте установку.");
        return;
    }

    // ===== ГЛАВНОЕ ОКНО =====
    var win = new Window("dialog", "Auto Montage Builder Pro v2.0", undefined);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 15;

    // Заголовок
    var headerGroup = win.add("group");
    headerGroup.alignment = "center";
    var headerText = headerGroup.add("statictext", undefined, "🎬 AUTO MONTAGE BUILDER PRO");
    headerText.graphics.font = ScriptUI.newFont("Arial", "Bold", 18);

    // Панель вкладок
    var tabPanel = win.add("tabbedpanel");
    tabPanel.alignChildren = "fill";
    tabPanel.preferredSize = [700, 600];

    var tabMain = tabPanel.add("tab", undefined, "🎬 Генерация");
    var tabPresets = tabPanel.add("tab", undefined, "🎨 Пресеты");
    var tabTemplates = tabPanel.add("tab", undefined, "📱 Шаблоны экспорта");
    var tabSettings = tabPanel.add("tab", undefined, "⚙️ Настройки");

    // ===== ВКЛАДКА ГЕНЕРАЦИЯ =====
    setupMainTab(tabMain);

    // ===== ВКЛАДКА ПРЕСЕТЫ =====
    setupPresetsTab(tabPresets);

    // ===== ВКЛАДКА ШАБЛОНЫ ЭКСПОРТА =====
    setupTemplatesTab(tabTemplates);

    // ===== ВКЛАДКА НАСТРОЙКИ =====
    setupSettingsTab(tabSettings);

    // Кнопки управления окном
    var bottomGroup = win.add("group");
    bottomGroup.alignment = "center";
    var closeBtn = bottomGroup.add("button", undefined, "Закрыть");
    closeBtn.onClick = function() { win.close(); };

    // ===== ФУНКЦИИ НАСТРОЙКИ ВКЛАДОК =====
    function setupMainTab(tab) {
        tab.orientation = "column";
        tab.alignChildren = ["fill", "top"];
        tab.spacing = 10;

        // Выбор папки проекта
        var folderPanel = tab.add("panel", undefined, "📁 Папка проекта");
        folderPanel.orientation = "row";
        var folderPathField = folderPanel.add("edittext", undefined, "");
        folderPathField.characters = 45;
        var browseBtn = folderPanel.add("button", undefined, "Обзор...");
        
        browseBtn.onClick = function() {
            var folder = Folder.selectDialog("Выберите папку проекта с изображениями и аудио");
            if (folder) {
                folderPathField.text = folder.fsName;
                PROJECT_FOLDER = folder.fsName;
                
                // Создаем подпапки если их нет
                AUDIO_VARIANTS_FOLDER = PROJECT_FOLDER + "/audio_variants";
                RENDERS_FOLDER = PROJECT_FOLDER + "/renders";
                
                var audioVariantsDir = new Folder(AUDIO_VARIANTS_FOLDER);
                if (!audioVariantsDir.exists) audioVariantsDir.create();
                
                var rendersDir = new Folder(RENDERS_FOLDER);
                if (!rendersDir.exists) rendersDir.create();
                
                // Сканируем папку
                var scanResult = scanProjectFolder(folder);
                updateInfoPanel(scanResult);
            }
        };

        // Информация о найденных файлах
        var infoPanel = tab.add("panel", undefined, "📊 Информация о проекте");
        infoPanel.preferredSize.height = 120;
        var infoText = infoPanel.add("statictext", undefined, "Выберите папку проекта для начала работы", {multiline: true});
        
        function updateInfoPanel(scanResult) {
            var info = "Найдено файлов:\n";
            info += "• Изображений: " + scanResult.images.length + "\n";
            info += "• Аудио файлов: " + scanResult.audio.length + "\n";
            info += "• Готовых пар: " + scanResult.pairs.length;
            
            if (scanResult.pairs.length > 0) {
                info += "\n\nГотовые пары:";
                for (var i = 0; i < Math.min(3, scanResult.pairs.length); i++) {
                    info += "\n" + (i + 1) + ". " + scanResult.pairs[i].baseName;
                }
                if (scanResult.pairs.length > 3) {
                    info += "\n... и еще " + (scanResult.pairs.length - 3);
                }
            }
            
            infoText.text = info;
        }

        // Настройки генерации
        var genPanel = tab.add("panel", undefined, "🎛️ Настройки генерации");
        genPanel.orientation = "column";
        genPanel.alignChildren = ["fill", "top"];

        // Количество видео
        var countGroup = genPanel.add("group");
        countGroup.add("statictext", undefined, "Количество вариантов:");
        var countDropdown = countGroup.add("dropdownlist", undefined, ["1", "2", "3", "4", "5"]);
        countDropdown.selection = 0;

        // Шаблон экспорта
        var templateGroup = genPanel.add("group");
        templateGroup.add("statictext", undefined, "Шаблон экспорта:");
        var templateDropdown = templateGroup.add("dropdownlist", undefined, Object.keys(EXPORT_PRESETS));
        templateDropdown.selection = 0;

        // Пользовательские настройки
        var customPanel = genPanel.add("panel", undefined, "Пользовательские настройки");
        customPanel.orientation = "column";
        
        var resGroup = customPanel.add("group");
        resGroup.add("statictext", undefined, "Разрешение:");
        var widthInput = resGroup.add("edittext", undefined, "1920");
        widthInput.characters = 6;
        resGroup.add("statictext", undefined, "x");
        var heightInput = resGroup.add("edittext", undefined, "1080");
        heightInput.characters = 6;

        var bitrateGroup = customPanel.add("group");
        bitrateGroup.add("statictext", undefined, "Битрейт (kbps):");
        var bitrateInput = bitrateGroup.add("edittext", undefined, "8000");
        bitrateInput.characters = 8;

        var fpsGroup = customPanel.add("group");
        fpsGroup.add("statictext", undefined, "FPS:");
        var fpsDropdown = fpsGroup.add("dropdownlist", undefined, ["24", "25", "30", "50", "60"]);
        fpsDropdown.selection = 2;

        // Обновление полей при выборе шаблона
        templateDropdown.onChange = function() {
            var preset = EXPORT_PRESETS[templateDropdown.selection.text];
            if (preset) {
                widthInput.text = preset.width;
                heightInput.text = preset.height;
                bitrateInput.text = preset.bitrate;
                for (var i = 0; i < fpsDropdown.items.length; i++) {
                    if (fpsDropdown.items[i].text == preset.fps) {
                        fpsDropdown.selection = i;
                        break;
                    }
                }
            }
            customPanel.enabled = (templateDropdown.selection.text === "Custom");
        };

        // Выбор пресетов для каждого видео
        var presetsPanel = tab.add("panel", undefined, "🎨 Выбор пресетов");
        presetsPanel.orientation = "column";
        var presetDropdowns = [];
        
        for (var i = 0; i < 5; i++) {
            var row = presetsPanel.add("group");
            row.add("statictext", undefined, "Видео " + (i + 1) + ":");
            var dropdown = row.add("dropdownlist", undefined, []);
            dropdown.preferredSize.width = 200;
            presetDropdowns.push(dropdown);
            
            // Кнопка предпросмотра
            var previewBtn = row.add("button", undefined, "👁️");
            previewBtn.helpTip = "Предпросмотр пресета";
            previewBtn.onClick = createPreviewHandler(dropdown);
        }

        // Загрузка пресетов
        loadPresetsIntoDropdowns(presetDropdowns);

        // Опции экспорта
        var exportPanel = tab.add("panel", undefined, "📤 Опции экспорта");
        var exportGroup = exportPanel.add("group");
        var exportAuto = exportGroup.add("radiobutton", undefined, "Автоматический экспорт");
        var exportManual = exportGroup.add("radiobutton", undefined, "Оставить на таймлайне");
        exportManual.value = true;

        // Прогресс-бар
        var progressPanel = tab.add("panel", undefined, "📊 Прогресс");
        var progressBar = progressPanel.add("progressbar", undefined, 0, 100);
        progressBar.preferredSize = [650, 20];
        var progressText = progressPanel.add("statictext", undefined, "Готов к работе");

        // Кнопки управления
        var btnGroup = tab.add("group");
        btnGroup.alignment = "center";
        
        var prepareAudioBtn = btnGroup.add("button", undefined, "🎵 Подготовить аудио");
        prepareAudioBtn.onClick = function() {
            if (!PROJECT_FOLDER) {
                alert("Сначала выберите папку проекта!");
                return;
            }
            prepareAudioFiles(PROJECT_FOLDER, progressBar, progressText);
        };

        var generateBtn = btnGroup.add("button", undefined, "🎬 СОЗДАТЬ МОНТАЖ");
        generateBtn.preferredSize.width = 200;
        generateBtn.onClick = function() {
            if (!PROJECT_FOLDER) {
                alert("Сначала выберите папку проекта!");
                return;
            }
            
            generateMontage({
                folder: PROJECT_FOLDER,
                audioVariantsFolder: AUDIO_VARIANTS_FOLDER,
                rendersFolder: RENDERS_FOLDER,
                count: parseInt(countDropdown.selection.text),
                presets: getSelectedPresets(presetDropdowns),
                template: templateDropdown.selection.text,
                customSettings: {
                    width: parseInt(widthInput.text),
                    height: parseInt(heightInput.text),
                    bitrate: parseInt(bitrateInput.text),
                    fps: parseInt(fpsDropdown.selection.text)
                },
                autoExport: exportAuto.value,
                progressBar: progressBar,
                progressText: progressText
            });
        };

        // Обновление количества доступных пресетов
        countDropdown.onChange = function() {
            var count = parseInt(countDropdown.selection.text);
            for (var i = 0; i < 5; i++) {
                presetDropdowns[i].parent.visible = (i < count);
            }
        };
        countDropdown.onChange();
    }

    function setupPresetsTab(tab) {
        tab.orientation = "column";
        tab.alignChildren = ["fill", "top"];

        // Список существующих пресетов
        var listPanel = tab.add("panel", undefined, "📋 Существующие пресеты");
        listPanel.preferredSize.height = 200;
        var presetList = listPanel.add("listbox", undefined, []);
        presetList.preferredSize = [650, 180];
        
        // Кнопки управления списком
        var listBtnGroup = listPanel.add("group");
        var loadBtn = listBtnGroup.add("button", undefined, "Загрузить");
        var deleteBtn = listBtnGroup.add("button", undefined, "Удалить");
        var duplicateBtn = listBtnGroup.add("button", undefined, "Дублировать");

        // Редактор пресета
        var editPanel = tab.add("panel", undefined, "✏️ Редактор пресета");
        editPanel.orientation = "column";
        editPanel.alignChildren = ["left", "top"];

        // Название
        var nameGroup = editPanel.add("group");
        nameGroup.add("statictext", undefined, "Название:");
        var nameField = nameGroup.add("edittext", undefined, "Новый пресет");
        nameField.characters = 30;

        // Аудио настройки
        var audioPanel = editPanel.add("panel", undefined, "🎵 Аудио");
        var pitchGroup = audioPanel.add("group");
        pitchGroup.add("statictext", undefined, "Pitch:");
        var pitchDropdown = pitchGroup.add("dropdownlist", undefined, ["0", "-0.5", "-1", "-1.5", "-2", "+0.5", "+1"]);
        pitchDropdown.selection = 0;

        // Визуальные эффекты
        var effectsPanel = editPanel.add("panel", undefined, "🎨 Визуальные эффекты");
        
        // Ken Burns
        var kbGroup = effectsPanel.add("group");
        kbGroup.add("statictext", undefined, "Ken Burns:");
        var kbDropdown = kbGroup.add("dropdownlist", undefined, ["Выключен", "Zoom In", "Zoom Out", "Pan Left", "Pan Right", "Random"]);
        kbDropdown.selection = 0;
        kbGroup.add("statictext", undefined, "Интенсивность:");
        var kbIntensity = kbGroup.add("slider", undefined, 20, 0, 100);
        kbIntensity.preferredSize.width = 100;

        // Переходы
        var transGroup = effectsPanel.add("group");
        transGroup.add("statictext", undefined, "Переход:");
        var transDropdown = transGroup.add("dropdownlist", undefined, ["Fade", "Cross Dissolve", "Dip to Black", "Dip to White", "Wipe", "Slide", "Push", "Zoom", "Random"]);
        transDropdown.selection = 0;
        transGroup.add("statictext", undefined, "Длительность:");
        var transDuration = transGroup.add("edittext", undefined, "1.0");
        transDuration.characters = 5;

        // Цветокоррекция
        var colorPanel = editPanel.add("panel", undefined, "🎨 Цветокоррекция");
        
        // Виньетка
        var vignetteGroup = colorPanel.add("group");
        var vignetteCheck = vignetteGroup.add("checkbox", undefined, "Виньетка");
        vignetteGroup.add("statictext", undefined, "Интенсивность:");
        var vignetteSlider = vignetteGroup.add("slider", undefined, 40, 0, 100);
        vignetteSlider.preferredSize.width = 150;

        // Цветовой фильтр
        var filterGroup = colorPanel.add("group");
        var filterCheck = filterGroup.add("checkbox", undefined, "Цветовой фильтр");
        filterGroup.add("statictext", undefined, "Тип:");
        var filterDropdown = filterGroup.add("dropdownlist", undefined, ["Теплый", "Холодный", "Винтаж", "Черно-белый", "Сепия"]);
        filterDropdown.selection = 0;

        // Overlay
        var overlayGroup = colorPanel.add("group");
        var overlayCheck = overlayGroup.add("checkbox", undefined, "Overlay");
        overlayGroup.add("statictext", undefined, "Файл:");
        var overlayPath = overlayGroup.add("edittext", undefined, "");
        overlayPath.characters = 20;
        var overlayBrowse = overlayGroup.add("button", undefined, "...");

        // Кнопки сохранения
        var saveBtnGroup = editPanel.add("group");
        saveBtnGroup.alignment = "center";
        var saveBtn = saveBtnGroup.add("button", undefined, "💾 Сохранить пресет");
        var saveAsBtn = saveBtnGroup.add("button", undefined, "💾 Сохранить как...");

        // Обработчики
        loadBtn.onClick = function() {
            if (presetList.selection) {
                loadPresetIntoEditor(presetList.selection.text);
            }
        };

        saveBtn.onClick = function() {
            savePreset(collectPresetData());
            refreshPresetList();
        };

        // Загрузка списка пресетов
        refreshPresetList();

        function refreshPresetList() {
            presetList.removeAll();
            var presets = readPresets();
            for (var i = 0; i < presets.length; i++) {
                presetList.add("item", presets[i].name);
            }
        }

        function collectPresetData() {
            return {
                name: nameField.text,
                pitch: pitchDropdown.selection.text,
                kenBurns: {
                    type: kbDropdown.selection.text,
                    intensity: kbIntensity.value
                },
                transition: {
                    type: transDropdown.selection.text,
                    duration: parseFloat(transDuration.text)
                },
                vignette: {
                    enabled: vignetteCheck.value,
                    intensity: vignetteSlider.value
                },
                colorFilter: {
                    enabled: filterCheck.value,
                    type: filterDropdown.selection.text
                },
                overlay: {
                    enabled: overlayCheck.value,
                    path: overlayPath.text
                }
            };
        }
    }

    function setupTemplatesTab(tab) {
        tab.orientation = "column";
        tab.alignChildren = ["fill", "top"];

        // Список шаблонов
        var templatesPanel = tab.add("panel", undefined, "📱 Шаблоны для социальных сетей");
        
        for (var platform in EXPORT_PRESETS) {
            var preset = EXPORT_PRESETS[platform];
            var row = templatesPanel.add("group");
            row.alignment = "left";
            
            var icon = row.add("statictext", undefined, getplatformIcon(platform));
            var name = row.add("statictext", undefined, platform);
            name.characters = 15;
            
            var specs = row.add("statictext", undefined, 
                preset.width + "x" + preset.height + " @ " + preset.bitrate + "kbps, " + preset.fps + "fps");
            specs.graphics.foregroundColor = specs.graphics.newPen(specs.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5], 1);
        }

        // Рекомендации
        var tipsPanel = tab.add("panel", undefined, "💡 Рекомендации");
        var tipsText = tipsPanel.add("statictext", undefined, 
            "• YouTube: Используйте высокий битрейт для лучшего качества\n" +
            "• TikTok/Reels: Вертикальный формат обязателен\n" +
            "• Instagram Feed: Квадратный формат для ленты\n" +
            "• Twitter: Компактный размер для быстрой загрузки", 
            {multiline: true});
        tipsText.preferredSize = [650, 100];
    }

    function setupSettingsTab(tab) {
        tab.orientation = "column";
        tab.alignChildren = ["fill", "top"];

        // Пути к программам
        var pathsPanel = tab.add("panel", undefined, "📁 Пути к программам");
        
        var ffmpegGroup = pathsPanel.add("group");
        ffmpegGroup.add("statictext", undefined, "FFmpeg:");
        var ffmpegPath = ffmpegGroup.add("edittext", undefined, "ffmpeg.exe");
        ffmpegPath.characters = 40;
        var ffmpegBrowse = ffmpegGroup.add("button", undefined, "...");

        var ameGroup = pathsPanel.add("group");
        ameGroup.add("statictext", undefined, "Media Encoder:");
        var amePath = ameGroup.add("edittext", undefined, findMediaEncoder());
        amePath.characters = 40;
        var ameBrowse = ameGroup.add("button", undefined, "...");

        // Настройки производительности
        var perfPanel = tab.add("panel", undefined, "⚡ Производительность");
        
        var threadsGroup = perfPanel.add("group");
        threadsGroup.add("statictext", undefined, "Потоки рендеринга:");
        var threadsSlider = threadsGroup.add("slider", undefined, 4, 1, 16);
        var threadsValue = threadsGroup.add("statictext", undefined, "4");
        threadsSlider.onChanging = function() {
            threadsValue.text = Math.round(threadsSlider.value);
        };

        var cacheGroup = perfPanel.add("group");
        var cacheCheck = cacheGroup.add("checkbox", undefined, "Использовать кэш превью");
        cacheCheck.value = true;

        // Настройки по умолчанию
        var defaultsPanel = tab.add("panel", undefined, "🎯 Настройки по умолчанию");
        
        var autoSaveGroup = defaultsPanel.add("group");
        var autoSaveCheck = autoSaveGroup.add("checkbox", undefined, "Автосохранение проекта");
        autoSaveCheck.value = true;

        var proxyGroup = defaultsPanel.add("group");
        var proxyCheck = proxyGroup.add("checkbox", undefined, "Создавать прокси для 4K");
        proxyCheck.value = false;

        // Кнопка сохранения
        var saveBtn = tab.add("button", undefined, "💾 Сохранить настройки");
        saveBtn.alignment = "center";
        saveBtn.onClick = function() {
            saveSettings({
                ffmpegPath: ffmpegPath.text,
                amePath: amePath.text,
                threads: Math.round(threadsSlider.value),
                useCache: cacheCheck.value,
                autoSave: autoSaveCheck.value,
                createProxy: proxyCheck.value
            });
        };
    }

    // ===== ОСНОВНЫЕ ФУНКЦИИ =====
    
    function scanProjectFolder(folder) {
        var images = [];
        var audio = [];
        var pairs = [];
        var files = folder.getFiles();
        
        // Сканируем только корень папки, игнорируя подпапки
        for (var i = 0; i < files.length; i++) {
            if (files[i] instanceof File) {
                var fileName = files[i].name;
                var ext = fileName.substr(fileName.lastIndexOf('.')).toLowerCase();
                
                if (SUPPORTED_IMAGE_FORMATS.indexOf(ext) > -1) {
                    images.push(files[i]);
                } else if (SUPPORTED_AUDIO_FORMATS.indexOf(ext) > -1) {
                    audio.push(files[i]);
                }
            }
        }
        
        // Находим пары по номерам
        for (var j = 0; j < images.length; j++) {
            var imgName = images[j].name;
            var imgNumber = imgName.match(/^\d+/);
            
            if (imgNumber) {
                for (var k = 0; k < audio.length; k++) {
                    var audioName = audio[k].name;
                    var audioNumber = audioName.match(/^\d+/);
                    
                    if (audioNumber && imgNumber[0] === audioNumber[0]) {
                        pairs.push({
                            number: imgNumber[0],
                            baseName: imgNumber[0],
                            image: images[j],
                            audio: audio[k]
                        });
                        break;
                    }
                }
            }
        }
        
        // Сортируем пары по номеру
        pairs.sort(function(a, b) {
            return parseInt(a.number) - parseInt(b.number);
        });
        
        return {
            images: images,
            audio: audio,
            pairs: pairs
        };
    }

    function generateMontage(config) {
        var project = app.project;
        if (!project) {
            alert("Нет активного проекта!");
            return;
        }

        config.progressText.text = "Начинаем генерацию...";
        config.progressBar.value = 0;

        try {
            // Создаем папку в проекте
            var rootItem = project.rootItem;
            var projectFolder = rootItem.createBin("Auto Montage " + new Date().toLocaleString());

            // Импортируем файлы
            config.progressText.text = "Импорт файлов...";
            var scanResult = scanProjectFolder(new Folder(config.folder));
            var importedItems = importProjectFiles(scanResult, projectFolder, config.progressBar);

            // Создаем секвенции для каждого варианта
            for (var i = 0; i < config.count; i++) {
                config.progressText.text = "Создание видео " + (i + 1) + " из " + config.count;
                config.progressBar.value = (i / config.count) * 100;

                var preset = config.presets[i];
                var settings = config.template === "Custom" ? config.customSettings : EXPORT_PRESETS[config.template];

                // Создаем секвенцию
                var sequence = createSequence(
                    "Montage_" + (i + 1) + "_" + preset.name,
                    settings.width,
                    settings.height,
                    settings.fps
                );

                // Добавляем клипы и эффекты
                buildSequence(sequence, importedItems, preset, settings, config.audioVariantsFolder);

                // Экспорт или оставляем на таймлайне
                if (config.autoExport) {
                    exportSequence(sequence, config.rendersFolder, settings);
                }
            }

            config.progressText.text = "Генерация завершена!";
            config.progressBar.value = 100;

        } catch (e) {
            alert("Ошибка: " + e.toString());
            config.progressText.text = "Ошибка генерации";
        }
    }

    // ИСПРАВЛЕННАЯ функция создания секвенции
    function createSequence(name, width, height, fps) {
        var project = app.project;
        
        // Правильный способ создания секвенции в Premiere
        var sequence = project.activeSequence;
        if (!sequence) {
            // Создаем пустую секвенцию через проект
            var projectItem = project.rootItem.createBin("Sequences");
            
            // Используем стандартный пресет
            var presetPath = findSequencePreset(width, height, fps);
            sequence = project.createNewSequence(name, presetPath);
        }
        
        // Настройка параметров через настройки секвенции
        if (sequence) {
            // Переименовываем
            sequence.name = name;
            
            // Настройка размеров происходит через интерпретацию
            var settings = sequence.getSettings();
            if (settings) {
                // Эти настройки доступны только для чтения в некоторых версиях
                try {
                    sequence.setSettings({
                        videoFrameWidth: width,
                        videoFrameHeight: height,
                        videoFrameRate: fps
                    });
                } catch(e) {
                    // Используем альтернативный метод
                    $.writeln("Используются настройки пресета для секвенции");
                }
            }
        }
        
        return sequence;
    }

    // Функция поиска подходящего пресета секвенции
    function findSequencePreset(width, height, fps) {
        // Путь к пресетам Premiere Pro
        var presetFolder = new Folder(Folder.userData.fsName + "/Documents/Adobe/Premiere Pro/*/Profile-CreativeCloud-/Settings/Custom");
        
        // Стандартные пресеты
        var standardPresets = {
            "1920x1080_30": "AVCHD 1080p30",
            "1920x1080_25": "AVCHD 1080p25", 
            "1280x720_30": "AVCHD 720p30",
            "3840x2160_30": "Digital SLR 4K 30p"
        };
        
        var key = width + "x" + height + "_" + Math.round(fps);
        return standardPresets[key] || "";
    }

    // ИСПРАВЛЕННАЯ функция построения секвенции
    function buildSequence(sequence, items, preset, settings, audioVariantsFolder) {
        if (!sequence) return;
        
        // Получаем треки правильным способом
        var videoTrack1 = sequence.videoTracks.numTracks > 0 ? sequence.videoTracks[0] : null;
        var audioTrack1 = sequence.audioTracks.numTracks > 0 ? sequence.audioTracks[0] : null;
        
        if (!videoTrack1 || !audioTrack1) {
            alert("Не удалось получить доступ к трекам секвенции");
            return;
        }
        
        var currentTime = 0;
        
        for (var i = 0; i < items.pairs.length; i++) {
            var pair = items.pairs[i];
            
            // Находим обработанное аудио
            var audioFile = findAudioVariantFile(audioVariantsFolder, pair.baseName, preset.pitch);
            
            if (pair.imageItem && audioFile) {
                try {
                    // Импортируем аудио файл
                    var audioItems = app.project.importFiles([audioFile.fsName], false, app.project.rootItem, false);
                    
                    if (audioItems && audioItems.length > 0) {
                        var audioItem = audioItems[0];
                        
                        // Добавляем на таймлайн
                        videoTrack1.insertClip(pair.imageItem, currentTime);
                        audioTrack1.insertClip(audioItem, currentTime);
                        
                        // Получаем добавленные клипы
                        var videoClip = videoTrack1.clips[videoTrack1.clips.numItems - 1];
                        var audioClip = audioTrack1.clips[audioTrack1.clips.numItems - 1];
                        
                        if (videoClip && audioClip) {
                            // Синхронизируем длительность
                            var audioDuration = audioClip.duration.seconds;
                            videoClip.end = videoClip.start + audioDuration;
                            
                            // Применяем эффекты
                            applyEffectsToClip(videoClip, preset);
                            
                            // Обновляем текущее время
                            currentTime += audioDuration;
                        }
                    }
                } catch(e) {
                    $.writeln("Ошибка добавления клипов: " + e.toString());
                }
            }
        }
    }
    
    // Функция поиска файла аудио варианта
    function findAudioVariantFile(audioVariantsFolder, baseName, pitch) {
        var folder = new Folder(audioVariantsFolder);
        if (!folder.exists) return null;
        
        var pitchSuffix = "_pitch_" + pitch.replace(".", "_").replace("+", "");
        if (pitch === "0") pitchSuffix = "_pitch_0";
        
        var files = folder.getFiles();
        for (var i = 0; i < files.length; i++) {
            var fileName = files[i].name;
            if (fileName.indexOf(baseName) === 0 && fileName.indexOf(pitchSuffix) > -1) {
                return files[i];
            }
        }
        
        return null;
    }

    // ИСПРАВЛЕННАЯ функция применения эффектов
    function applyEffectsToClip(clip, preset) {
        if (!clip) return;
        
        var videoComponents = clip.components;
        if (!videoComponents) return;

        // Motion эффект (встроенный)
        var motion = videoComponents[0]; // Motion обычно первый компонент
        if (motion && motion.displayName === "Motion") {
            // Ken Burns эффект
            if (preset.kenBurns && preset.kenBurns.type !== "Выключен") {
                applyKenBurnsFixed(motion, clip, preset.kenBurns);
            }
        }

        // Добавляем Lumetri Color правильным способом
        if (preset.vignette && preset.vignette.enabled || 
            preset.colorFilter && preset.colorFilter.enabled) {
            
            // Ищем эффект в списке доступных
            var lumetriEffect = findEffectByName("Lumetri Color");
            if (lumetriEffect) {
                clip.addVideoEffect(lumetriEffect);
                
                // Получаем добавленный эффект
                var addedLumetri = null;
                for (var i = 0; i < videoComponents.numItems; i++) {
                    if (videoComponents[i].displayName === "Lumetri Color") {
                        addedLumetri = videoComponents[i];
                        break;
                    }
                }
                
                if (addedLumetri) {
                    applyLumetriSettings(addedLumetri, preset);
                }
            }
        }

        // Переходы обрабатываются отдельно между клипами
        if (preset.transition) {
            applyTransition(clip, preset.transition);
        }
    }

    // ИСПРАВЛЕННАЯ функция Ken Burns
    function applyKenBurnsFixed(motionComponent, clip, kenBurns) {
        if (!motionComponent || !motionComponent.properties) return;
        
        var props = motionComponent.properties;
        var scale = null;
        var position = null;
        
        // Поиск свойств по индексу (более надежно)
        for (var i = 0; i < props.numItems; i++) {
            var prop = props[i];
            if (prop.displayName === "Scale") scale = prop;
            if (prop.displayName === "Position") position = prop;
        }
        
        if (!scale || !position) return;
        
        var startTime = clip.inPoint.seconds;
        var endTime = clip.outPoint.seconds;
        var intensity = kenBurns.intensity / 100;

        // Удаляем существующие ключевые кадры
        while (scale.getKeys().length > 0) {
            scale.removeKey(0);
        }
        while (position.getKeys().length > 0) {
            position.removeKey(0);
        }

        switch (kenBurns.type) {
            case "Zoom In":
                scale.addKey(startTime);
                scale.setValueAtKey(startTime, 100);
                scale.addKey(endTime);
                scale.setValueAtKey(endTime, 100 + (20 * intensity));
                break;
                
            case "Zoom Out":
                scale.addKey(startTime);
                scale.setValueAtKey(startTime, 100 + (20 * intensity));
                scale.addKey(endTime);
                scale.setValueAtKey(endTime, 100);
                break;
                
            case "Pan Left":
                position.addKey(startTime);
                position.setValueAtKey(startTime, [0.5, 0.5]);
                position.addKey(endTime);
                position.setValueAtKey(endTime, [0.5 - (0.1 * intensity), 0.5]);
                break;
                
            case "Pan Right":
                position.addKey(startTime);
                position.setValueAtKey(startTime, [0.5, 0.5]);
                position.addKey(endTime);
                position.setValueAtKey(endTime, [0.5 + (0.1 * intensity), 0.5]);
                break;
                
            case "Random":
                // Случайная комбинация эффектов
                var random = Math.random();
                if (random < 0.5) {
                    scale.addKey(startTime);
                    scale.setValueAtKey(startTime, 100);
                    scale.addKey(endTime);
                    scale.setValueAtKey(endTime, 100 + (20 * intensity));
                } else {
                    position.addKey(startTime);
                    position.setValueAtKey(startTime, [0.5, 0.5]);
                    position.addKey(endTime);
                    position.setValueAtKey(endTime, [0.5 + (0.1 * intensity * (Math.random() - 0.5)), 0.5]);
                }
                break;
        }
    }

    // Функция поиска эффекта по имени
    function findEffectByName(effectName) {
        // В Premiere эффекты нужно искать через QE DOM
        var qeProject = qe.project;
        if (!qeProject) return null;
        
        var videoEffects = qeProject.getVideoEffectList();
        for (var i = 0; i < videoEffects.length; i++) {
            if (videoEffects[i].displayName === effectName) {
                return videoEffects[i];
            }
        }
        
        return null;
    }

    // Применение настроек Lumetri
    function applyLumetriSettings(lumetriComponent, preset) {
        if (!lumetriComponent || !lumetriComponent.properties) return;
        
        var props = lumetriComponent.properties;
        
        // Виньетка
        if (preset.vignette && preset.vignette.enabled) {
            setComponentProperty(props, "Vignette Amount", -(preset.vignette.intensity / 100));
        }
        
        // Цветокоррекция
        if (preset.colorFilter && preset.colorFilter.enabled && preset.colorFilter.lumetri) {
            var lumetriSettings = preset.colorFilter.lumetri;
            
            for (var setting in lumetriSettings) {
                var propName = setting.charAt(0).toUpperCase() + setting.slice(1);
                setComponentProperty(props, propName, lumetriSettings[setting]);
            }
        }
    }

    // Вспомогательная функция установки свойства компонента
    function setComponentProperty(properties, propName, value) {
        for (var i = 0; i < properties.numItems; i++) {
            if (properties[i].displayName === propName) {
                try {
                    properties[i].setValue(value);
                } catch(e) {
                    $.writeln("Не удалось установить " + propName + ": " + e.toString());
                }
                break;
            }
        }
    }

    // ИСПРАВЛЕННАЯ функция обработки переходов
    function applyTransition(clip, transition) {
        if (!clip || !transition) return;
        
        var track = clip.parentTrack;
        if (!track) return;
        
        // Находим индекс текущего клипа
        var clipIndex = -1;
        for (var i = 0; i < track.clips.numItems; i++) {
            if (track.clips[i] === clip) {
                clipIndex = i;
                break;
            }
        }
        
        // Проверяем наличие следующего клипа
        if (clipIndex >= 0 && clipIndex < track.clips.numItems - 1) {
            var nextClip = track.clips[clipIndex + 1];
            
            try {
                // Создаем перекрытие для перехода
                var overlapTime = transition.duration;
                var clipEnd = clip.end.seconds;
                var nextStart = nextClip.start.seconds;
                
                // Сдвигаем следующий клип для создания перекрытия
                if (nextStart > clipEnd - overlapTime) {
                    nextClip.start = clipEnd - overlapTime;
                }
                
                // Применяем переход
                var transitionItem = getTransitionItem(transition.type);
                if (transitionItem) {
                    track.insertTransition(transitionItem, clipEnd - overlapTime);
                }
                
            } catch(e) {
                $.writeln("Ошибка применения перехода: " + e.toString());
            }
        }
    }

    // Получение объекта перехода
    function getTransitionItem(transitionName) {
        // Маппинг имен переходов
        var transitionMap = {
            "Fade": "Dip to Black",
            "Cross Dissolve": "Cross Dissolve",
            "Dip to Black": "Dip to Black",
            "Dip to White": "Dip to White",
            "Wipe": "Wipe",
            "Slide": "Slide",
            "Push": "Push",
            "Zoom": "Cross Zoom"
        };
        
        var actualName = transitionMap[transitionName] || "Cross Dissolve";
        
        // Поиск перехода в проекте
        var qeProject = qe.project;
        if (qeProject) {
            var transitions = qeProject.getVideoTransitionList();
            for (var i = 0; i < transitions.length; i++) {
                if (transitions[i].displayName === actualName) {
                    return transitions[i];
                }
            }
        }
        
        return null;
    }

    // ИСПРАВЛЕННАЯ функция импорта файлов
    function importProjectFiles(scanResult, projectBin, progressBar) {
        var imported = {
            pairs: []
        };
        
        var totalFiles = scanResult.pairs.length;
        
        for (var i = 0; i < scanResult.pairs.length; i++) {
            progressBar.value = (i / totalFiles) * 50;
            
            var pair = scanResult.pairs[i];
            
            try {
                // Импортируем изображение
                var imageItems = app.project.importFiles(
                    [pair.image.fsName], 
                    false,  // suppressUI
                    projectBin,  // targetBin
                    false   // importAsNumberedStills
                );
                
                imported.pairs.push({
                    baseName: pair.baseName,
                    number: pair.number,
                    imageItem: imageItems && imageItems.length > 0 ? imageItems[0] : null,
                    originalAudio: pair.audio
                });
                
            } catch(e) {
                $.writeln("Ошибка импорта " + pair.image.name + ": " + e.toString());
            }
        }
        
        return imported;
    }

    // ИСПРАВЛЕННАЯ функция экспорта через AME
    function exportSequence(sequence, outputFolder, settings) {
        if (!sequence) return;
        
        var outputFileName = sequence.name + "_" + settings.width + "x" + settings.height + ".mp4";
        var outputPath = outputFolder + "/" + outputFileName;
        
        try {
            // Проверяем доступность Media Encoder
            if (!MediaEncoderIntegration.checkMediaEncoder()) {
                alert("Adobe Media Encoder недоступен. Экспортируйте вручную.");
                return;
            }
            
            // Получаем оптимизированные настройки
            var platform = detectPlatformFromSettings(settings);
            var optimizedSettings = MediaEncoderIntegration.optimizeForSocialMedia(platform);
            
            // Объединяем настройки
            var exportSettings = {
                width: settings.width,
                height: settings.height,
                fps: settings.fps,
                bitrate: settings.bitrate,
                codec: optimizedSettings.codec,
                profile: optimizedSettings.profile,
                level: optimizedSettings.level,
                keyframeInterval: optimizedSettings.keyframeInterval,
                twoPass: optimizedSettings.twoPass
            };
            
            // Создаем временный пресет
            var presetPath = createTempExportPreset(exportSettings);
            
            // Добавляем в очередь AME
            MediaEncoderIntegration.addToQueue(sequence, outputPath, presetPath, {
                onProgress: function(percent) {
                    $.writeln("Экспорт: " + percent + "%");
                },
                onComplete: function() {
                    $.writeln("Экспорт завершен: " + outputFileName);
                    // Удаляем временный пресет
                    var tempFile = new File(presetPath);
                    if (tempFile.exists) tempFile.remove();
                },
                onError: function(error) {
                    alert("Ошибка экспорта: " + error);
                }
            });
            
            // Запускаем экспорт
            app.encoder.startBatch();
            
        } catch (e) {
            alert("Ошибка экспорта: " + e.toString() + "\n\nИспользуйте File > Export > Media для ручного экспорта.");
        }
    }

    // Создание временного пресета экспорта
    function createTempExportPreset(settings) {
        var tempFolder = Folder.temp.fsName;
        var presetName = "auto_montage_preset_" + Date.now() + ".epr";
        var presetPath = tempFolder + "/" + presetName;
        
        var presetXML = MediaEncoderIntegration.createCustomPreset(presetName, settings);
        
        var file = new File(presetPath);
        file.open("w");
        file.write(presetXML);
        file.close();
        
        return presetPath;
    }

    // Определение платформы по настройкам
    function detectPlatformFromSettings(settings) {
        var ratio = settings.width / settings.height;
        
        if (ratio === 1) return "Instagram";
        if (ratio < 1) return "TikTok";
        if (settings.width === 1920 && settings.height === 1080) return "YouTube";
        
        return "YouTube"; // по умолчанию
    }

    // ===== ФУНКЦИИ РАБОТЫ С АУДИО =====
    
    function prepareAudioFiles(folderPath, progressBar, progressText) {
        progressText.text = "Подготовка аудио файлов...";
        progressBar.value = 0;
        
        // Путь к bat файлу в папке скрипта
        var scriptFolder = new File($.fileName).parent;
        var batFile = new File(scriptFolder.fsName + "/enhanced-audio-processor.bat");
        
        if (!batFile.exists) {
            alert("Не найден файл enhanced-audio-processor.bat в папке скрипта!");
            return;
        }
        
        // Создаем временный bat файл который запустится в нужной папке
        var tempBat = new File(folderPath + "/temp_audio_process.bat");
        tempBat.open("w");
        tempBat.writeln("@echo off");
        tempBat.writeln("cd /d \"" + folderPath + "\"");
        tempBat.writeln("call \"" + batFile.fsName + "\" \"" + folderPath + "\"");
        tempBat.close();
        
        // Запускаем обработку
        tempBat.execute();
        
        // Удаляем временный файл
        $.sleep(1000);
        tempBat.remove();
        
        progressText.text = "Аудио файлы обработаны. Проверьте папку audio_variants";
        progressBar.value = 100;
    }

    // ===== ФУНКЦИИ РАБОТЫ С ПРЕСЕТАМИ =====
    
    function readPresets() {
        var file = new File(File($.fileName).parent.fsName + "/presets.json");
        if (!file.exists) {
            return getDefaultPresets();
        }
        
        file.open("r");
        try {
            var content = file.read();
            var presets = JSON.parse(content);
            return Array.isArray(presets) ? presets : getDefaultPresets();
        } catch (e) {
            return getDefaultPresets();
        } finally {
            file.close();
        }
    }

    function savePreset(preset) {
        var presets = readPresets();
        
        // Проверяем, существует ли пресет с таким именем
        var existingIndex = -1;
        for (var i = 0; i < presets.length; i++) {
            if (presets[i].name === preset.name) {
                existingIndex = i;
                break;
            }
        }
        
        if (existingIndex >= 0) {
            presets[existingIndex] = preset;
        } else {
            presets.push(preset);
        }
        
        var file = new File(File($.fileName).parent.fsName + "/presets.json");
        file.open("w");
        file.write(JSON.stringify(presets, null, 2));
        file.close();
    }

    function getDefaultPresets() {
        return [
            {
                name: "Стандартный",
                pitch: "0",
                kenBurns: { type: "Выключен", intensity: 0 },
                transition: { type: "Fade", duration: 1.0 },
                vignette: { enabled: false, intensity: 0 },
                colorFilter: { enabled: false, type: "Теплый" },
                overlay: { enabled: false, path: "" }
            },
            {
                name: "Кинематографичный",
                pitch: "-1",
                kenBurns: { type: "Zoom In", intensity: 30 },
                transition: { type: "Cross Dissolve", duration: 1.5 },
                vignette: { enabled: true, intensity: 60 },
                colorFilter: { enabled: true, type: "Холодный" },
                overlay: { enabled: false, path: "" }
            },
            {
                name: "Динамичный",
                pitch: "-0.5",
                kenBurns: { type: "Random", intensity: 50 },
                transition: { type: "Zoom", duration: 0.5 },
                vignette: { enabled: false, intensity: 0 },
                colorFilter: { enabled: false, type: "Теплый" },
                overlay: { enabled: false, path: "" }
            },
            {
                name: "Винтаж",
                pitch: "-1.5",
                kenBurns: { type: "Pan Right", intensity: 20 },
                transition: { type: "Dip to Black", duration: 2.0 },
                vignette: { enabled: true, intensity: 80 },
                colorFilter: { enabled: true, type: "Сепия" },
                overlay: { enabled: true, path: "overlays/film_grain.png" }
            },
            {
                name: "Минималистичный",
                pitch: "0",
                kenBurns: { type: "Выключен", intensity: 0 },
                transition: { type: "Fade", duration: 0.5 },
                vignette: { enabled: false, intensity: 0 },
                colorFilter: { enabled: true, type: "Черно-белый" },
                overlay: { enabled: false, path: "" }
            }
        ];
    }

    function loadPresetsIntoDropdowns(dropdowns) {
        var presets = readPresets();
        var presetNames = ["Random"];
        
        for (var i = 0; i < presets.length; i++) {
            presetNames.push(presets[i].name);
        }
        
        for (var j = 0; j < dropdowns.length; j++) {
            dropdowns[j].removeAll();
            for (var k = 0; k < presetNames.length; k++) {
                dropdowns[j].add("item", presetNames[k]);
            }
            dropdowns[j].selection = 0;
        }
    }

    function getSelectedPresets(dropdowns) {
        var selected = [];
        var allPresets = readPresets();
        
        for (var i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].parent.visible && dropdowns[i].selection) {
                var selectedName = dropdowns[i].selection.text;
                
                if (selectedName === "Random") {
                    // Выбираем случайный пресет
                    var randomIndex = Math.floor(Math.random() * allPresets.length);
                    selected.push(allPresets[randomIndex]);
                } else {
                    // Ищем пресет по имени
                    for (var j = 0; j < allPresets.length; j++) {
                        if (allPresets[j].name === selectedName) {
                            selected.push(allPresets[j]);
                            break;
                        }
                    }
                }
            }
        }
        
        return selected;
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    
    function createPreviewHandler(dropdown) {
        return function() {
            if (!dropdown.selection) return;
            
            var presetName = dropdown.selection.text;
            if (presetName === "Random") {
                alert("Случайный пресет будет выбран при генерации");
                return;
            }
            
            var presets = readPresets();
            var preset = null;
            
            for (var i = 0; i < presets.length; i++) {
                if (presets[i].name === presetName) {
                    preset = presets[i];
                    break;
                }
            }
            
            if (preset) {
                showPresetPreview(preset);
            }
        };
    }

    function showPresetPreview(preset) {
        var preview = new Window("dialog", "Предпросмотр: " + preset.name);
        preview.orientation = "column";
        preview.alignChildren = ["fill", "top"];
        
        var info = preview.add("panel", undefined, "Параметры пресета");
        info.preferredSize.width = 400;
        
        var text = info.add("statictext", undefined, 
            "🎵 Pitch: " + preset.pitch + "\n" +
            "🎬 Ken Burns: " + preset.kenBurns.type + " (" + preset.kenBurns.intensity + "%)\n" +
            "🔄 Переход: " + preset.transition.type + " (" + preset.transition.duration + "s)\n" +
            "🎨 Виньетка: " + (preset.vignette.enabled ? "Да (" + preset.vignette.intensity + "%)" : "Нет") + "\n" +
            "🎨 Фильтр: " + (preset.colorFilter.enabled ? preset.colorFilter.type : "Нет") + "\n" +
            "📎 Overlay: " + (preset.overlay.enabled ? preset.overlay.path : "Нет"),
            {multiline: true}
        );
        text.preferredSize.height = 150;
        
        var closeBtn = preview.add("button", undefined, "Закрыть");
        closeBtn.onClick = function() { preview.close(); };
        
        preview.center();
        preview.show();
    }

    function getplatformIcon(platform) {
        var icons = {
            "YouTube": "📺",
            "YouTube Shorts": "📱",
            "TikTok": "🎵",
            "Instagram Reels": "📸",
            "Instagram Feed": "📷",
            "Twitter": "🐦",
            "Custom": "⚙️"
        };
        return icons[platform] || "📹";
    }

    function findMediaEncoder() {
        // Пытаемся найти Media Encoder в стандартных путях
        var paths = [
            "C:/Program Files/Adobe/Adobe Media Encoder 2023/Adobe Media Encoder.exe",
            "C:/Program Files/Adobe/Adobe Media Encoder 2022/Adobe Media Encoder.exe",
            "C:/Program Files/Adobe/Adobe Media Encoder CC/Adobe Media Encoder.exe"
        ];
        
        for (var i = 0; i < paths.length; i++) {
            var file = new File(paths[i]);
            if (file.exists) {
                return paths[i];
            }
        }
        
        return "";
    }

    // Функция сохранения настроек
    function saveSettings(settings) {
        var file = new File(File($.fileName).parent.fsName + "/settings.json");
        
        try {
            file.open("w");
            file.write(JSON.stringify(settings, null, 2));
            file.close();
            
            alert("Настройки сохранены успешно!");
            return true;
        } catch(e) {
            alert("Ошибка сохранения настроек: " + e.toString());
            return false;
        }
    }

    // Функция загрузки настроек
    function loadSettings() {
        var file = new File(File($.fileName).parent.fsName + "/settings.json");
        
        if (!file.exists) {
            // Возвращаем настройки по умолчанию
            return {
                ffmpegPath: "ffmpeg.exe",
                amePath: findMediaEncoder(),
                threads: 4,
                useCache: true,
                autoSave: true,
                createProxy: false
            };
        }
        
        try {
            file.open("r");
            var content = file.read();
            file.close();
            
            return JSON.parse(content);
        } catch(e) {
            $.writeln("Ошибка загрузки настроек: " + e.toString());
            return null;
        }
    }

    // Функция валидации проекта
    function validateProject() {
        var errors = [];
        
        // Проверка активного проекта
        if (!app.project) {
            errors.push("Нет активного проекта Premiere Pro");
        }
        
        // Проверка версии
        var version = app.version;
        if (version) {
            var majorVersion = parseInt(version.split(".")[0]);
            if (majorVersion < 14) {
                errors.push("Требуется Premiere Pro 2020 (14.0) или новее");
            }
        }
        
        // Проверка прав доступа
        try {
            var testFile = new File(Folder.temp.fsName + "/test_write.txt");
            testFile.open("w");
            testFile.write("test");
            testFile.close();
            testFile.remove();
        } catch(e) {
            errors.push("Нет прав на запись во временную папку");
        }
        
        return errors;
    }

    // Функция инициализации
	function initializeScript() {
		// Валидация
		var errors = validateProject();
		if (errors.length > 0) {
			alert("Ошибки инициализации:\n\n" + errors.join("\n"));
			return false;
		}
		
		// Загрузка настроек
		var settings = loadSettings();
		if (!settings) {
			settings = {
				ffmpegPath: "ffmpeg.exe",
				amePath: findMediaEncoder(),
				threads: 4,
				useCache: true,
				autoSave: true,
				createProxy: false
			};
		}
		
		// ВРЕМЕННО ОТКЛЮЧАЕМ ПРОВЕРКУ МОДУЛЕЙ
		/*
		// Инициализация модулей
		if (typeof AdvancedEffects === 'undefined') {
			alert("Модуль AdvancedEffects не загружен. Проверьте наличие effects-module.js");
			return false;
		}
		
		if (typeof MediaEncoderIntegration === 'undefined') {
			alert("Модуль MediaEncoderIntegration не загружен. Проверьте наличие media-encoder-integration.js");
			return false;
		}
		*/
		
		// Заглушки для модулей
		if (typeof AdvancedEffects === 'undefined') {
			AdvancedEffects = {
				applyAdvancedAudioEffects: function() {}
			};
		}
		
		if (typeof MediaEncoderIntegration === 'undefined') {
			MediaEncoderIntegration = {
				checkMediaEncoder: function() { return false; },
				optimizeForSocialMedia: function() { return {}; },
				createCustomPreset: function() { return ""; }
			};
		}
		
		return true;
	}

    // Показываем окно
    win.center();
    win.show();
})();