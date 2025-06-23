// Media Encoder Integration Module для Auto Montage Builder Pro
// Этот модуль обеспечивает глубокую интеграцию с Adobe Media Encoder

var MediaEncoderIntegration = (function() {
    
    // Проверка доступности Media Encoder
    function checkMediaEncoder() {
        try {
            var ame = new ExternalObject("lib:ame_host.dll");
            return ame !== null;
        } catch (e) {
            return false;
        }
    }
    
    // Создание пользовательского пресета экспорта
    function createCustomPreset(name, settings) {
        var presetXML = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<PremiereData Version="3">\n' +
            '  <Project ObjectRef="1"/>\n' +
            '  <ExportSettings ObjectID="2" ClassID="58474264-30C4-4F5F-ABA2-8D2876A11ED9" Version="11">\n' +
            '    <VideoSettings ObjectRef="3"/>\n' +
            '    <AudioSettings ObjectRef="4"/>\n' +
            '    <GeneralSettings ObjectRef="5"/>\n' +
            '  </ExportSettings>\n' +
            '  <VideoSettings ObjectID="3" ClassID="58474264-9FE7-4FD9-BE20-9629AD45318B" Version="9">\n' +
            '    <FrameRate>' + settings.fps + '</FrameRate>\n' +
            '    <FrameWidth>' + settings.width + '</FrameWidth>\n' +
            '    <FrameHeight>' + settings.height + '</FrameHeight>\n' +
            '    <CodecType>1380013856</CodecType>\n' + // H.264
            '    <DataRate>' + settings.bitrate + '</DataRate>\n' +
            '    <RenderQuality>1</RenderQuality>\n' + // Высокое качество
            '    <UseMaximumRenderQuality>true</UseMaximumRenderQuality>\n' +
            '    <Profile>2</Profile>\n' + // High Profile
            '    <Level>51</Level>\n' + // Level 5.1
            '  </VideoSettings>\n' +
            '  <AudioSettings ObjectID="4" ClassID="58474264-91F4-4446-A584-2DCA92D4680C" Version="7">\n' +
            '    <CodecType>1633772320</CodecType>\n' + // AAC
            '    <SampleRate>48000</SampleRate>\n' +
            '    <NumChannels>2</NumChannels>\n' +
            '    <AudioBitrate>320</AudioBitrate>\n' +
            '  </AudioSettings>\n' +
            '  <GeneralSettings ObjectID="5" ClassID="89C85B08-B0E4-4EF7-B8AA-43A37DCC4A4B" Version="1">\n' +
            '    <ExportVideo>true</ExportVideo>\n' +
            '    <ExportAudio>true</ExportAudio>\n' +
            '    <UseProxies>false</UseProxies>\n' +
            '  </GeneralSettings>\n' +
            '</PremiereData>';
        
        return presetXML;
    }
    
    // Добавление задачи в очередь Media Encoder
    function addToQueue(sequence, outputPath, presetPath, callbacks) {
        try {
            var encoder = app.encoder;
            if (!encoder) {
                throw new Error("Media Encoder API недоступен");
            }
            
            // Создаем задачу экспорта
            var job = encoder.encodeSequence(
                sequence,
                outputPath,
                presetPath,
                1, // removeOnCompletion
                0  // startQueueImmediately
            );
            
            if (callbacks) {
                // Устанавливаем колбэки для отслеживания прогресса
                if (callbacks.onProgress) {
                    job.onStatusChanged = function(status) {
                        if (status === "ENCODING") {
                            callbacks.onProgress(job.percentComplete);
                        }
                    };
                }
                
                if (callbacks.onComplete) {
                    job.onDone = callbacks.onComplete;
                }
                
                if (callbacks.onError) {
                    job.onError = callbacks.onError;
                }
            }
            
            return job;
            
        } catch (e) {
            throw new Error("Ошибка добавления в очередь: " + e.toString());
        }
    }
    
    // Пакетный экспорт нескольких секвенций
    function batchExport(sequences, outputFolder, settings, progressCallback) {
        var jobs = [];
        var completed = 0;
        var total = sequences.length;
        
        for (var i = 0; i < sequences.length; i++) {
            var sequence = sequences[i];
            var outputPath = outputFolder + "/" + sequence.name + ".mp4";
            var presetPath = createTempPreset(settings);
            
            var job = addToQueue(sequence, outputPath, presetPath, {
                onComplete: function() {
                    completed++;
                    if (progressCallback) {
                        progressCallback(completed, total);
                    }
                    
                    // Удаляем временный пресет
                    var tempFile = new File(presetPath);
                    if (tempFile.exists) {
                        tempFile.remove();
                    }
                },
                onError: function(error) {
                    alert("Ошибка экспорта " + sequence.name + ": " + error);
                }
            });
            
            jobs.push(job);
        }
        
        // Запускаем очередь
        app.encoder.startBatch();
        
        return jobs;
    }
    
    // Создание временного файла пресета
    function createTempPreset(settings) {
        var tempFolder = Folder.temp.fsName;
        var presetName = "temp_preset_" + Date.now() + ".epr";
        var presetPath = tempFolder + "/" + presetName;
        
        var file = new File(presetPath);
        file.open("w");
        file.write(createCustomPreset(presetName, settings));
        file.close();
        
        return presetPath;
    }
    
    // Получение списка доступных пресетов Media Encoder
    function getAvailablePresets() {
        var presets = [];
        
        try {
            // Стандартные пути к пресетам
            var presetPaths = [
                Folder.userData.fsName + "/Documents/Adobe/Adobe Media Encoder/*/Presets",
                Folder.commonFiles.fsName + "/Adobe/MediaCore/*/Presets"
            ];
            
            for (var i = 0; i < presetPaths.length; i++) {
                var folder = new Folder(presetPaths[i]);
                if (folder.exists) {
                    var files = folder.getFiles("*.epr");
                    for (var j = 0; j < files.length; j++) {
                        presets.push({
                            name: files[j].displayName.replace(".epr", ""),
                            path: files[j].fsName
                        });
                    }
                }
            }
            
        } catch (e) {
            // Если не удалось получить пресеты, возвращаем пустой массив
        }
        
        return presets;
    }
    
    // Экспорт с использованием GPU ускорения
    function exportWithGPU(sequence, outputPath, settings) {
        var gpuSettings = {
            UseHardwareAcceleration: true,
            GPURendering: true,
            UseMaximumRenderQuality: true,
            MultiPassEncoding: true
        };
        
        // Объединяем настройки
        for (var key in gpuSettings) {
            settings[key] = gpuSettings[key];
        }
        
        var presetPath = createTempPreset(settings);
        return addToQueue(sequence, outputPath, presetPath);
    }
    
    // Оптимизация настроек для социальных сетей
    function optimizeForSocialMedia(platform) {
        var optimizations = {
            "YouTube": {
                codec: "H.264",
                profile: "High",
                level: "5.1",
                keyframeInterval: 90,
                bFrames: 2,
                adaptiveBitrate: true,
                twoPass: true
            },
            "TikTok": {
                codec: "H.264",
                profile: "High",
                level: "4.2",
                keyframeInterval: 30,
                bFrames: 0,
                adaptiveBitrate: false,
                twoPass: false
            },
            "Instagram": {
                codec: "H.264",
                profile: "High",
                level: "4.0",
                keyframeInterval: 60,
                bFrames: 1,
                adaptiveBitrate: false,
                twoPass: true
            }
        };
        
        return optimizations[platform] || optimizations["YouTube"];
    }
    
    // Проверка и установка кодеков
    function checkCodecs() {
        var codecs = {
            h264: false,
            h265: false,
            prores: false
        };
        
        try {
            // Проверяем доступность кодеков через Media Encoder API
            var encoder = app.encoder;
            if (encoder && encoder.getCodecs) {
                var availableCodecs = encoder.getCodecs();
                codecs.h264 = availableCodecs.indexOf("H.264") > -1;
                codecs.h265 = availableCodecs.indexOf("H.265") > -1;
                codecs.prores = availableCodecs.indexOf("ProRes") > -1;
            }
        } catch (e) {
            // Предполагаем, что H.264 доступен по умолчанию
            codecs.h264 = true;
        }
        
        return codecs;
    }
    
    // Экспорт с прокси для больших проектов
    function exportWithProxy(sequence, outputPath, settings) {
        // Создаем прокси версию для быстрого предпросмотра
        var proxySettings = {
            width: Math.floor(settings.width / 2),
            height: Math.floor(settings.height / 2),
            bitrate: Math.floor(settings.bitrate / 4),
            fps: settings.fps,
            suffix: "_proxy"
        };
        
        var proxyPath = outputPath.replace(".mp4", "_proxy.mp4");
        
        // Экспортируем прокси
        var proxyJob = exportWithGPU(sequence, proxyPath, proxySettings);
        
        // Затем экспортируем полную версию
        var fullJob = exportWithGPU(sequence, outputPath, settings);
        
        return {
            proxy: proxyJob,
            full: fullJob
        };
    }
    
    // Публичный API модуля
    return {
        checkMediaEncoder: checkMediaEncoder,
        addToQueue: addToQueue,
        batchExport: batchExport,
        getAvailablePresets: getAvailablePresets,
        exportWithGPU: exportWithGPU,
        optimizeForSocialMedia: optimizeForSocialMedia,
        checkCodecs: checkCodecs,
        exportWithProxy: exportWithProxy,
        createCustomPreset: createCustomPreset
    };
    
})();

// Экспорт модуля для использования в основном скрипте
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaEncoderIntegration;
}