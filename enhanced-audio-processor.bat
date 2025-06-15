@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

:: Auto Montage Builder Pro - Enhanced Audio Processor
:: Обработка аудио файлов в выбранной папке проекта

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║       AUTO MONTAGE BUILDER PRO - AUDIO PROCESSOR v2.0         ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║  Обработка аудио файлов с изменением pitch и эффектами       ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Получаем путь к папке проекта (передается как параметр или текущая папка)
if "%~1"=="" (
    set "PROJECT_FOLDER=%CD%"
) else (
    set "PROJECT_FOLDER=%~1"
)

echo Папка проекта: %PROJECT_FOLDER%

:: Проверка наличия FFmpeg
set "FFMPEG_PATH="
if exist "%PROJECT_FOLDER%\ffmpeg.exe" (
    set "FFMPEG_PATH=%PROJECT_FOLDER%\ffmpeg.exe"
) else if exist "%~dp0ffmpeg.exe" (
    set "FFMPEG_PATH=%~dp0ffmpeg.exe"
) else if exist "C:\ffmpeg\bin\ffmpeg.exe" (
    set "FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe"
) else (
    where ffmpeg.exe >nul 2>&1
    if !errorlevel! equ 0 (
        set "FFMPEG_PATH=ffmpeg.exe"
    ) else (
        echo.
        echo [ОШИБКА] FFmpeg.exe не найден!
        echo.
        echo Пожалуйста, выполните одно из следующих действий:
        echo 1. Поместите ffmpeg.exe в папку проекта: %PROJECT_FOLDER%
        echo 2. Поместите ffmpeg.exe в папку со скриптом: %~dp0
        echo 3. Скачайте FFmpeg с https://www.gyan.dev/ffmpeg/builds/
        echo.
        pause
        exit /b 1
    )
)

echo Используется FFmpeg: %FFMPEG_PATH%

:: Настройки
set "OUTPUT_FOLDER=%PROJECT_FOLDER%\audio_variants"
set "TEMP_FOLDER=%PROJECT_FOLDER%\audio_temp"
set "LOG_FILE=%PROJECT_FOLDER%\audio_processing.log"

:: Создание необходимых папок
if not exist "%OUTPUT_FOLDER%" mkdir "%OUTPUT_FOLDER%"
if not exist "%TEMP_FOLDER%" mkdir "%TEMP_FOLDER%"

:: Начало логирования
echo ===== Audio Processing Started: %date% %time% ===== > "%LOG_FILE%"
echo Project folder: %PROJECT_FOLDER% >> "%LOG_FILE%"
echo FFmpeg path: %FFMPEG_PATH% >> "%LOG_FILE%"

:: Подсчет аудио файлов в корне папки проекта
set /a FILE_COUNT=0
for %%F in ("%PROJECT_FOLDER%\*.mp3" "%PROJECT_FOLDER%\*.wav" "%PROJECT_FOLDER%\*.m4a" "%PROJECT_FOLDER%\*.aac" "%PROJECT_FOLDER%\*.flac") do (
    :: Проверяем, что это файл в корне, а не в подпапке
    if exist "%%F" (
        if "%%~dpF"=="%PROJECT_FOLDER%\" (
            set /a FILE_COUNT+=1
        )
    )
)

if %FILE_COUNT%==0 (
    echo.
    echo [ОШИБКА] Не найдено аудио файлов в папке проекта!
    echo.
    echo Убедитесь, что аудио файлы находятся в корне папки:
    echo %PROJECT_FOLDER%
    echo.
    echo Поддерживаемые форматы: MP3, WAV, M4A, AAC, FLAC
    echo.
    pause
    exit /b 1
)

echo Найдено аудио файлов для обработки: %FILE_COUNT%
echo.

:: Массив pitch значений и соответствующих коэффициентов
set "PITCH_-2=0.8909"
set "PITCH_-1_5=0.917"
set "PITCH_-1=0.9441"
set "PITCH_-0_5=0.9715"
set "PITCH_0=1.0"
set "PITCH_+0_5=1.0293"
set "PITCH_+1=1.0595"

:: Обработка каждого файла
set /a PROCESSED=0
set /a ERRORS=0

for %%F in ("%PROJECT_FOLDER%\*.mp3" "%PROJECT_FOLDER%\*.wav" "%PROJECT_FOLDER%\*.m4a" "%PROJECT_FOLDER%\*.aac" "%PROJECT_FOLDER%\*.flac") do (
    :: Обрабатываем только файлы из корня папки
    if exist "%%F" (
        if "%%~dpF"=="%PROJECT_FOLDER%\" (
            set /a PROCESSED+=1
            set "FILE=%%~nF"
            set "EXT=%%~xF"
            
            echo ┌─────────────────────────────────────────────────────────────┐
            echo │ Обработка [!PROCESSED!/%FILE_COUNT%]: !FILE!!EXT!
            echo └─────────────────────────────────────────────────────────────┘
            
            :: Анализ исходного файла
            echo   📊 Анализ исходного файла...
            "%FFMPEG_PATH%" -i "%%F" -af "volumedetect" -f null - 2>&1 | findstr /C:"mean_volume" /C:"max_volume" >> "%LOG_FILE%"
            
            :: Генерация всех вариантов pitch
            echo   🎵 Создание вариантов pitch:
            
            :: Pitch 0 (оригинал, только нормализация)
            echo     → Pitch 0 (оригинал)...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=20,lowpass=f=20000" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_0!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Pitch -0.5
            echo     → Pitch -0.5...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*0.9715,aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=20,lowpass=f=20000" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_-0_5!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Pitch -1
            echo     → Pitch -1...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*0.9441,aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=20,lowpass=f=20000" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_-1!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Pitch -1.5
            echo     → Pitch -1.5...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*0.917,aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=20,lowpass=f=20000" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_-1_5!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Pitch -2
            echo     → Pitch -2...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*0.8909,aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=20,lowpass=f=20000" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_-2!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Pitch +0.5
            echo     → Pitch +0.5...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*1.0293,aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=20,lowpass=f=20000" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_+0_5!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Pitch +1
            echo     → Pitch +1...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*1.0595,aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=20,lowpass=f=20000" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_+1!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Создание специальных версий
            echo   🎭 Создание специальных эффектов:
            
            :: Версия с усиленными басами (для драматичных сцен)
            echo     → Версия с басами (pitch -1)...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*0.9441,aresample=44100,bass=g=10:f=100,loudnorm=I=-16:TP=-1.5:LRA=11" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_-1_bass!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Версия с эхо (для мистических сцен)
            echo     → Версия с эхо (pitch -1.5)...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*0.917,aresample=44100,aecho=0.8:0.9:1000:0.3,loudnorm=I=-16:TP=-1.5:LRA=11" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_-1_5_echo!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            :: Версия с реверберацией (для эпических сцен)
            echo     → Версия с реверберацией (pitch -2)...
            "%FFMPEG_PATH%" -y -i "%%F" ^
                -af "asetrate=44100*0.8909,aresample=44100,reverb=50:50:50:50:20:5,loudnorm=I=-16:TP=-1.5:LRA=11" ^
                -ac 2 -ar 44100 -b:a 128k ^
                "%OUTPUT_FOLDER%\!FILE!_pitch_-2_reverb!EXT!" 2>>"%LOG_FILE%"
            if !errorlevel! equ 0 (echo       ✓ Успешно) else (echo       ✗ Ошибка & set /a ERRORS+=1)
            
            echo   ✅ Обработка завершена
            echo.
        )
    )
)

:: Создание метаданных для импорта
echo 📄 Создание файла метаданных...
(
    echo {
    echo   "generated": "%date% %time%",
    echo   "project_folder": "%PROJECT_FOLDER:\=\\%",
    echo   "output_folder": "%OUTPUT_FOLDER:\=\\%",
    echo   "total_files": %FILE_COUNT%,
    echo   "processed_files": %PROCESSED%,
    echo   "errors": %ERRORS%,
    echo   "variants_per_file": 10,
    echo   "audio_settings": {
    echo     "bitrate": "128k",
    echo     "sample_rate": "44100",
    echo     "channels": "stereo",
    echo     "normalization": "EBU R128 ^(-16 LUFS^)"
    echo   },
    echo   "pitch_variants": [
    echo     {"value": "-2", "coefficient": "0.8909", "semitones": -4},
    echo     {"value": "-1.5", "coefficient": "0.917", "semitones": -3},
    echo     {"value": "-1", "coefficient": "0.9441", "semitones": -2},
    echo     {"value": "-0.5", "coefficient": "0.9715", "semitones": -1},
    echo     {"value": "0", "coefficient": "1.0", "semitones": 0},
    echo     {"value": "+0.5", "coefficient": "1.0293", "semitones": 1},
    echo     {"value": "+1", "coefficient": "1.0595", "semitones": 2}
    echo   ],
    echo   "special_effects": ["bass", "echo", "reverb"]
    echo }
) > "%OUTPUT_FOLDER%\metadata.json"

:: Генерация отчета
echo.
if %ERRORS% equ 0 (
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║                  🎉 ОБРАБОТКА УСПЕШНО ЗАВЕРШЕНА 🎉            ║
    echo ╠═══════════════════════════════════════════════════════════════╣
    echo ║  Обработано файлов: %PROCESSED%                              ║
    echo ║  Создано вариантов: %PROCESSED% x 10                         ║
    echo ║  Папка с вариантами: audio_variants                          ║
    echo ║  Лог файл: audio_processing.log                              ║
    echo ╚═══════════════════════════════════════════════════════════════╝
) else (
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║              ⚠️  ОБРАБОТКА ЗАВЕРШЕНА С ОШИБКАМИ ⚠️            ║
    echo ╠═══════════════════════════════════════════════════════════════╣
    echo ║  Обработано файлов: %PROCESSED%                              ║
    echo ║  Ошибок: %ERRORS%                                            ║
    echo ║  Проверьте лог файл: audio_processing.log                    ║
    echo ╚═══════════════════════════════════════════════════════════════╝
)
echo.

:: Очистка временных файлов
if exist "%TEMP_FOLDER%" (
    echo Очистка временных файлов...
    rmdir /s /q "%TEMP_FOLDER%" 2>nul
)

echo ===== Audio Processing Completed: %date% %time% ===== >> "%LOG_FILE%"
echo Total processed: %PROCESSED%, Errors: %ERRORS% >> "%LOG_FILE%"

:: Если запущено из GUI, не показываем диалог
if not "%~1"=="" (
    echo.
    echo Обработка завершена. Окно закроется через 3 секунды...
    timeout /t 3 /nobreak > nul
    exit /b %ERRORS%
)

:: Опциональное открытие папки с результатами
echo.
choice /C YN /T 10 /D N /M "Открыть папку с результатами"
if !errorlevel! equ 1 (
    start "" "%OUTPUT_FOLDER%"
)

pause
exit /b %ERRORS%