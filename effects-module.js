// Advanced Effects Module для Auto Montage Builder Pro
// Расширенные визуальные и аудио эффекты

var AdvancedEffects = (function() {
    
    // ===== ВИЗУАЛЬНЫЕ ЭФФЕКТЫ =====
    
    // Применение сложного Ken Burns с кривыми Безье
    function applyAdvancedKenBurns(clip, settings) {
        var motion = clip.components.getItemByName("Motion");
        if (!motion) return;
        
        var scale = motion.properties.getItemByName("Scale");
        var position = motion.properties.getItemByName("Position");
        var rotation = motion.properties.getItemByName("Rotation");
        
        var startTime = clip.inPoint.seconds;
        var endTime = clip.outPoint.seconds;
        var duration = endTime - startTime;
        
        // Настройка интерполяции
        var interpolationType = getInterpolationType(settings.curve);
        
        switch (settings.type) {
            case "Complex Zoom":
                // Сложное масштабирование с поворотом
                scale.setValueAtTime(startTime, 100);
                scale.setValueAtTime(startTime + duration * 0.3, 110);
                scale.setValueAtTime(startTime + duration * 0.7, 115);
                scale.setValueAtTime(endTime, 120);
                
                rotation.setValueAtTime(startTime, 0);
                rotation.setValueAtTime(endTime, settings.intensity * 0.1);
                break;
                
            case "Parallax":
                // Эффект параллакса
                var bgScale = 100 + (settings.intensity * 0.3);
                scale.setValueAtTime(startTime, bgScale);
                scale.setValueAtTime(endTime, bgScale + 5);
                
                position.setValueAtTime(startTime, [0.5, 0.5]);
                position.setValueAtTime(endTime, [0.5 + (settings.intensity * 0.002), 0.5]);
                break;
                
            case "Spiral":
                // Спиральное движение
                var steps = 10;
                for (var i = 0; i <= steps; i++) {
                    var t = i / steps;
                    var time = startTime + (duration * t);
                    var angle = t * Math.PI * 2 * (settings.intensity / 50);
                    var radius = t * 0.05;
                    
                    position.setValueAtTime(time, [
                        0.5 + Math.cos(angle) * radius,
                        0.5 + Math.sin(angle) * radius
                    ]);
                    
                    scale.setValueAtTime(time, 100 + (t * settings.intensity * 0.2));
                }
                break;
        }
        
        // Установка типа интерполяции для всех ключевых кадров
        setKeyframeInterpolation(scale, interpolationType);
        setKeyframeInterpolation(position, interpolationType);
        setKeyframeInterpolation(rotation, interpolationType);
    }
    
    // Продвинутая цветокоррекция
    function applyAdvancedColorGrading(clip, preset) {
        var lumetri = clip.components.getItemByName("Lumetri Color");
        if (!lumetri) {
            lumetri = clip.components.addProperty("Lumetri Color");
        }
        
        // Основные настройки
        var settings = preset.lumetri;
        for (var prop in settings) {
            var property = lumetri.properties.getItemByName(prop);
            if (property) {
                property.setValue(settings[prop]);
            }
        }
        
        // Дополнительные эффекты
        if (preset.type === "Cyberpunk") {
            applyCyberpunkLook(lumetri);
        } else if (preset.type === "Film Emulation") {
            applyFilmEmulation(lumetri, preset.filmStock);
        }
        
        // Вторичная цветокоррекция
        if (preset.secondaryCorrection) {
            applySecondaryColorCorrection(clip, preset.secondaryCorrection);
        }
    }
    
    // Эффект Cyberpunk
    function applyCyberpunkLook(lumetri) {
        // HSL Secondary для неоновых цветов
        var hslSecondary = lumetri.properties.getItemByName("HSL Secondary");
        if (hslSecondary) {
            // Выделяем синие тона
            hslSecondary.properties.getItemByName("H").setValue([180, 240]);
            hslSecondary.properties.getItemByName("S").setValue([50, 100]);
            hslSecondary.properties.getItemByName("L").setValue([20, 80]);
            
            // Усиливаем насыщенность
            hslSecondary.properties.getItemByName("Saturation").setValue(150);
            
            // Добавляем свечение
            var glow = hslSecondary.properties.getItemByName("Glow");
            if (glow) glow.setValue(20);
        }
    }
    
    // Эмуляция пленки
    function applyFilmEmulation(lumetri, filmStock) {
        var filmProfiles = {
            "Kodak Portra": {
                shadows: { r: 0, g: -2, b: -5 },
                midtones: { r: 5, g: 3, b: 0 },
                highlights: { r: 3, g: 5, b: 8 }
            },
            "Fuji Velvia": {
                shadows: { r: -3, g: -5, b: -8 },
                midtones: { r: 8, g: 5, b: 3 },
                highlights: { r: 5, g: 3, b: 0 }
            },
            "Ilford HP5": {
                shadows: { r: -10, g: -10, b: -10 },
                midtones: { r: 0, g: 0, b: 0 },
                highlights: { r: 10, g: 10, b: 10 }
            }
        };
        
        var profile = filmProfiles[filmStock];
        if (profile) {
            applyColorWheels(lumetri, profile);
        }
    }
    
    // Применение цветовых кругов
    function applyColorWheels(lumetri, wheels) {
        var shadows = lumetri.properties.getItemByName("Shadow");
        var midtones = lumetri.properties.getItemByName("Midtone");
        var highlights = lumetri.properties.getItemByName("Highlight");
        
        if (shadows) shadows.setValue([wheels.shadows.r, wheels.shadows.g, wheels.shadows.b]);
        if (midtones) midtones.setValue([wheels.midtones.r, wheels.midtones.g, wheels.midtones.b]);
        if (highlights) highlights.setValue([wheels.highlights.r, wheels.highlights.g, wheels.highlights.b]);
    }
    
    // Продвинутые переходы
    function applyAdvancedTransition(clip, nextClip, transition) {
        if (!nextClip) return;
        
        var track = clip.parentTrack;
        var transitionDuration = transition.duration;
        
        switch (transition.type) {
            case "Morph Cut":
                // Морфинг между кадрами
                applyMorphCut(clip, nextClip, transitionDuration);
                break;
                
            case "Glitch":
                // Глитч переход
                applyGlitchTransition(clip, nextClip, transitionDuration);
                break;
                
            case "Light Leak":
                // Переход со световой утечкой
                applyLightLeakTransition(clip, nextClip, transitionDuration);
                break;
                
            case "Film Burn":
                // Эффект прожига пленки
                applyFilmBurnTransition(clip, nextClip, transitionDuration);
                break;
                
            default:
                // Стандартный переход
                var effect = track.addTransition(transition.type, 
                    clip.outPoint - transitionDuration, transitionDuration);
                
                // Настройка параметров перехода
                if (effect && transition.customParameters) {
                    for (var param in transition.customParameters) {
                        var prop = effect.properties.getItemByName(param);
                        if (prop) prop.setValue(transition.customParameters[param]);
                    }
                }
        }
    }
    
    // Глитч переход
    function applyGlitchTransition(clip1, clip2, duration) {
        var glitchEffect = clip1.components.addProperty("VR Digital Glitch");
        if (!glitchEffect) {
            // Альтернативный глитч через Transform
            var transform = clip1.components.getItemByName("Transform");
            if (transform) {
                var position = transform.properties.getItemByName("Position");
                var scale = transform.properties.getItemByName("Scale");
                
                // Создаем глитч анимацию
                var startTime = clip1.outPoint.seconds - duration;
                var steps = 10;
                
                for (var i = 0; i < steps; i++) {
                    var t = i / steps;
                    var time = startTime + (duration * t);
                    
                    // Случайные сдвиги
                    position.setValueAtTime(time, [
                        0.5 + (Math.random() - 0.5) * 0.1,
                        0.5 + (Math.random() - 0.5) * 0.1
                    ]);
                    
                    // Случайное масштабирование
                    scale.setValueAtTime(time, 100 + (Math.random() - 0.5) * 20);
                }
            }
        }
    }
    
    // ===== АУДИО ЭФФЕКТЫ =====
    
    function applyAdvancedAudioEffects(audioClip, effects) {
        if (!audioClip || !effects) return;
        
        // Основные эффекты
        if (effects.fadeIn > 0) {
            applyAudioFade(audioClip, "in", effects.fadeIn);
        }
        
        if (effects.fadeOut > 0) {
            applyAudioFade(audioClip, "out", effects.fadeOut);
        }
        
        if (effects.normalize) {
            normalizeAudio(audioClip);
        }
        
        // Компрессор
        if (effects.compressor && effects.compressor.enabled) {
            applyCompressor(audioClip, effects.compressor);
        }
        
        // Эквалайзер
        if (effects.eq && effects.eq.enabled) {
            applyEqualizer(audioClip, effects.eq);
        }
        
        // Специальные эффекты
        if (effects.reverb && effects.reverb.enabled) {
            applyReverb(audioClip, effects.reverb);
        }
        
        if (effects.vinylEffect && effects.vinylEffect.enabled) {
            applyVinylEffect(audioClip, effects.vinylEffect);
        }
        
        if (effects.distortion && effects.distortion.enabled) {
            applyDistortion(audioClip, effects.distortion);
        }
    }
    
    // Применение фейдов
    function applyAudioFade(clip, type, duration) {
        var volume = clip.components.getItemByName("Volume");
        if (!volume) return;
        
        var level = volume.properties.getItemByName("Level");
        if (!level) return;
        
        if (type === "in") {
            level.setValueAtTime(clip.inPoint.seconds, -96);
            level.setValueAtTime(clip.inPoint.seconds + duration, 0);
        } else {
            level.setValueAtTime(clip.outPoint.seconds - duration, 0);
            level.setValueAtTime(clip.outPoint.seconds, -96);
        }
    }
    
    // Нормализация аудио
    function normalizeAudio(clip) {
        var audioEffect = clip.components.addProperty("Normalize");
        if (audioEffect) {
            audioEffect.properties.getItemByName("Individual Channels").setValue(false);
            audioEffect.properties.getItemByName("Target Level").setValue(-3);
        }
    }
    
    // Компрессор
    function applyCompressor(clip, settings) {
        var compressor = clip.components.addProperty("Dynamics");
        if (compressor) {
            compressor.properties.getItemByName("Threshold").setValue(settings.threshold);
            compressor.properties.getItemByName("Ratio").setValue(settings.ratio);
            compressor.properties.getItemByName("Attack").setValue(10);
            compressor.properties.getItemByName("Release").setValue(100);
            compressor.properties.getItemByName("MakeUp Gain").setValue(3);
        }
    }
    
    // Эквалайзер
    function applyEqualizer(clip, settings) {
        var eq = clip.components.addProperty("Parametric Equalizer");
        if (eq) {
            // Низкие частоты
            if (settings.bass !== 0) {
                eq.properties.getItemByName("LF Gain").setValue(settings.bass);
                eq.properties.getItemByName("LF Frequency").setValue(100);
            }
            
            // Средние частоты
            if (settings.mid !== 0) {
                eq.properties.getItemByName("MF Gain").setValue(settings.mid);
                eq.properties.getItemByName("MF Frequency").setValue(1000);
            }
            
            // Высокие частоты
            if (settings.treble !== 0) {
                eq.properties.getItemByName("HF Gain").setValue(settings.treble);
                eq.properties.getItemByName("HF Frequency").setValue(10000);
            }
        }
    }
    
    // Реверберация
    function applyReverb(clip, settings) {
        var reverb = clip.components.addProperty("Studio Reverb");
        if (reverb) {
            reverb.properties.getItemByName("Room Size").setValue(settings.roomSize * 100);
            reverb.properties.getItemByName("Mix").setValue(settings.wetLevel);
            reverb.properties.getItemByName("Decay").setValue(2);
            reverb.properties.getItemByName("Diffusion").setValue(80);
        }
    }
    
    // Эффект винила
    function applyVinylEffect(clip, settings) {
        // Добавляем треск
        var noise = clip.components.addProperty("Noise");
        if (noise) {
            noise.properties.getItemByName("Amount").setValue(settings.noise);
            noise.properties.getItemByName("Type").setValue("Pink");
        }
        
        // Добавляем щелчки
        var crackle = clip.components.addProperty("DeClicker");
        if (crackle) {
            crackle.properties.getItemByName("Sensitivity").setValue(100 - settings.crackle);
        }
        
        // Высокочастотный фильтр для имитации старой записи
        var highpass = clip.components.addProperty("Highpass");
        if (highpass) {
            highpass.properties.getItemByName("Cutoff").setValue(100);
        }
    }
    
    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    
    function getInterpolationType(curve) {
        var types = {
            "linear": "Linear",
            "ease-in": "Ease In",
            "ease-out": "Ease Out",
            "ease-in-out": "Easy Ease",
            "cubic-bezier": "Bezier",
            "steps": "Hold"
        };
        return types[curve] || "Linear";
    }
    
    function setKeyframeInterpolation(property, type) {
        if (!property) return;
        
        for (var i = 0; i < property.numKeys; i++) {
            property.setInterpolationTypeAtKey(i, type);
        }
    }
    
    // ===== КОМПОЗИТНЫЕ ЭФФЕКТЫ =====
    
    // Создание сложной виньетки с градиентом
    function createAdvancedVignette(clip, settings) {
        // Основная виньетка
        var vignette = clip.components.addProperty("Vignette");
        if (vignette) {
            vignette.properties.getItemByName("Amount").setValue(-(settings.intensity / 100));
            vignette.properties.getItemByName("Midpoint").setValue(settings.feather / 100);
            vignette.properties.getItemByName("Roundness").setValue(settings.roundness);
        }
        
        // Дополнительный градиент для большей глубины
        if (settings.intensity > 50) {
            var gradient = clip.components.addProperty("Gradient Wipe");
            if (gradient) {
                gradient.properties.getItemByName("Transition Completion").setValue(settings.intensity);
                gradient.properties.getItemByName("Gradient Layer").setValue("Radial");
                gradient.properties.getItemByName("Transition Softness").setValue(settings.feather);
            }
        }
    }
    
    // Создание светового эффекта (Light Leak)
    function createLightLeak(clip, intensity) {
        var lightLeak = clip.components.addProperty("Lens Flare");
        if (lightLeak) {
            lightLeak.properties.getItemByName("Flare Center").setValue([0.8, 0.2]);
            lightLeak.properties.getItemByName("Flare Brightness").setValue(intensity);
            lightLeak.properties.getItemByName("Lens Type").setValue("105mm Prime");
            
            // Анимация движения блика
            var center = lightLeak.properties.getItemByName("Flare Center");
            var startTime = clip.inPoint.seconds;
            var endTime = clip.outPoint.seconds;
            
            center.setValueAtTime(startTime, [0.8, 0.2]);
            center.setValueAtTime(endTime, [0.2, 0.8]);
        }
    }
    
    // Эффект свечения (Glow)
    function applyGlowEffect(clip, settings) {
        var glow = clip.components.addProperty("Glow");
        if (glow) {
            glow.properties.getItemByName("Glow Threshold").setValue(settings.threshold);
            glow.properties.getItemByName("Glow Radius").setValue(settings.intensity);
            glow.properties.getItemByName("Glow Intensity").setValue(settings.intensity / 100);
            
            // Цветное свечение для неонового эффекта
            if (settings.color) {
                glow.properties.getItemByName("Color A").setValue(settings.color);
                glow.properties.getItemByName("Color B").setValue([
                    settings.color[0] * 0.5,
                    settings.color[1] * 0.5,
                    settings.color[2] * 0.5
                ]);
            }
        }
    }
    
    // Эффект двойной экспозиции
    function createDoubleExposure(clip1, clip2, blendMode, opacity) {
        if (!clip1 || !clip2) return;
        
        // Настройка прозрачности второго клипа
        var opacityEffect = clip2.components.getItemByName("Opacity");
        if (opacityEffect) {
            opacityEffect.properties.getItemByName("Opacity").setValue(opacity);
        }
        
        // Применение режима наложения
        var blend = clip2.components.addProperty("Blend Mode");
        if (blend) {
            blend.properties.getItemByName("Mode").setValue(blendMode);
        }
        
        // Дополнительная цветокоррекция для лучшего смешивания
        var lumetri = clip2.components.addProperty("Lumetri Color");
        if (lumetri) {
            lumetri.properties.getItemByName("Contrast").setValue(20);
            lumetri.properties.getItemByName("Highlights").setValue(-30);
            lumetri.properties.getItemByName("Shadows").setValue(30);
        }
    }
    
    // Эффект разделения RGB каналов (Chromatic Aberration)
    function applyChromaticAberration(clip, amount) {
        // Создаем копии клипа для каждого канала
        var track = clip.parentTrack;
        var redChannel = clip.components.addProperty("Channel Blur");
        
        if (redChannel) {
            redChannel.properties.getItemByName("Red Blurriness").setValue(amount);
            redChannel.properties.getItemByName("Green Blurriness").setValue(0);
            redChannel.properties.getItemByName("Blue Blurriness").setValue(-amount);
            redChannel.properties.getItemByName("Blur Dimensions").setValue("Horizontal");
        }
    }
    
    // Эффект старой пленки
    function createFilmEffect(clip, settings) {
        // Зерно пленки
        var grain = clip.components.addProperty("Noise");
        if (grain) {
            grain.properties.getItemByName("Amount of Noise").setValue(settings.grainAmount);
            grain.properties.getItemByName("Noise Type").setValue("Film Grain");
        }
        
        // Царапины и пыль
        if (settings.dustAndScratches.enabled) {
            var dust = clip.components.addProperty("Dust & Scratches");
            if (dust) {
                dust.properties.getItemByName("Radius").setValue(2);
                dust.properties.getItemByName("Threshold").setValue(settings.dustAndScratches.amount);
            }
        }
        
        // Мерцание пленки
        if (settings.filmFlicker.enabled) {
            var exposure = clip.components.getItemByName("Lumetri Color");
            if (!exposure) {
                exposure = clip.components.addProperty("Lumetri Color");
            }
            
            var exposureProp = exposure.properties.getItemByName("Exposure");
            var startTime = clip.inPoint.seconds;
            var endTime = clip.outPoint.seconds;
            var flickerFreq = settings.filmFlicker.frequency;
            
            // Создаем мерцание
            for (var t = startTime; t < endTime; t += 1/flickerFreq) {
                var flicker = (Math.random() - 0.5) * settings.filmFlicker.intensity * 0.01;
                exposureProp.setValueAtTime(t, flicker);
            }
        }
    }
    
    // ===== ИНТЕГРАЦИЯ С ВНЕШНИМИ ПЛАГИНАМИ =====
    
    // Проверка наличия сторонних плагинов
    function checkThirdPartyPlugins() {
        var plugins = {
            redGiant: checkPlugin("Red Giant Universe"),
            borisfx: checkPlugin("Boris FX"),
            filmConvert: checkPlugin("FilmConvert"),
            magicBullet: checkPlugin("Magic Bullet Looks")
        };
        
        return plugins;
    }
    
    function checkPlugin(pluginName) {
        try {
            var testClip = app.project.activeSequence.videoTracks[0].clips[0];
            if (testClip) {
                var effect = testClip.components.addProperty(pluginName);
                if (effect) {
                    testClip.components.remove(effect);
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    }
    
    // Применение эффектов Red Giant Universe
    function applyRedGiantEffects(clip, effectName) {
        var rgEffects = {
            "Glitch": "RG Glitch",
            "ChromaticAberration": "RG Chromatic Aberration",
            "Hologram": "RG Holomatrix",
            "VHS": "RG VHS"
        };
        
        if (rgEffects[effectName]) {
            var effect = clip.components.addProperty(rgEffects[effectName]);
            if (effect) {
                // Настройка параметров в зависимости от эффекта
                configureRedGiantEffect(effect, effectName);
            }
        }
    }
    
    // ===== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ =====
    
    // Создание прокси для тяжелых эффектов
    function createEffectProxy(clip, quality) {
        var proxy = {
            enabled: false,
            scale: 1.0,
            effects: []
        };
        
        // Определяем тяжелые эффекты
        var heavyEffects = ["Glow", "Gaussian Blur", "Lens Blur", "Warp Stabilizer"];
        
        for (var i = 0; i < clip.components.numItems; i++) {
            var component = clip.components[i];
            if (heavyEffects.indexOf(component.displayName) > -1) {
                proxy.effects.push(component.displayName);
                proxy.enabled = true;
            }
        }
        
        if (proxy.enabled) {
            // Устанавливаем качество прокси
            switch (quality) {
                case "low":
                    proxy.scale = 0.25;
                    break;
                case "medium":
                    proxy.scale = 0.5;
                    break;
                case "high":
                    proxy.scale = 0.75;
                    break;
            }
        }
        
        return proxy;
    }
    
    // ===== ПРЕСЕТЫ ЭФФЕКТОВ =====
    
    function getEffectPresets() {
        return {
            "Cinematic": {
                vignette: { intensity: 60, feather: 50, roundness: 1.0 },
                colorGrading: {
                    temperature: -10,
                    tint: 5,
                    contrast: 15,
                    saturation: 85
                },
                blur: { type: "gaussian", amount: 2 },
                grain: { amount: 5, size: 1.5 }
            },
            "Instagram": {
                vignette: { intensity: 30, feather: 80, roundness: 1.0 },
                colorGrading: {
                    temperature: 10,
                    tint: 3,
                    contrast: 10,
                    saturation: 115,
                    vibrance: 25
                },
                glow: { threshold: 80, intensity: 15 }
            },
            "Retro": {
                vignette: { intensity: 80, feather: 60, roundness: 0.8 },
                colorGrading: {
                    temperature: 20,
                    tint: 15,
                    contrast: -10,
                    saturation: 60
                },
                grain: { amount: 15, size: 2.0 },
                chromatic: { amount: 3 }
            },
            "Horror": {
                vignette: { intensity: 90, feather: 30, roundness: 0.5 },
                colorGrading: {
                    temperature: -30,
                    tint: -10,
                    contrast: 40,
                    saturation: 30,
                    shadows: -50
                },
                blur: { type: "motion", amount: 5, angle: 45 }
            }
        };
    }
    
    // ===== ЭКСПОРТ API =====
    
    return {
        // Визуальные эффекты
        applyAdvancedKenBurns: applyAdvancedKenBurns,
        applyAdvancedColorGrading: applyAdvancedColorGrading,
        applyAdvancedTransition: applyAdvancedTransition,
        createAdvancedVignette: createAdvancedVignette,
        createLightLeak: createLightLeak,
        applyGlowEffect: applyGlowEffect,
        createDoubleExposure: createDoubleExposure,
        applyChromaticAberration: applyChromaticAberration,
        createFilmEffect: createFilmEffect,
        
        // Аудио эффекты
        applyAdvancedAudioEffects: applyAdvancedAudioEffects,
        
        // Интеграция с плагинами
        checkThirdPartyPlugins: checkThirdPartyPlugins,
        applyRedGiantEffects: applyRedGiantEffects,
        
        // Оптимизация
        createEffectProxy: createEffectProxy,
        
        // Пресеты
        getEffectPresets: getEffectPresets
    };
    
})();

// Экспорт модуля
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedEffects;
}