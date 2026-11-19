@echo off
setlocal
cd /d "%~dp0"
title Cerreno 3D - Servidor local (puerto 3001)
color 0B

echo.
echo   ============================================================
echo    Cerreno 3D - Cerro Colorado, Arequipa
echo   ============================================================
echo.

REM --- 1. Dependencias -------------------------------------------------------
if not exist "node_modules" (
  echo   [1/4] Instalando dependencias ^(solo la primera vez^)...
  call npm install
  if errorlevel 1 goto :error
) else (
  echo   [1/4] Dependencias OK
)

REM --- 2. Liberar el puerto 3001 si quedo algo colgado ----------------------
echo   [2/4] Liberando el puerto 3001...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001" ^| findstr LISTENING') do (
  taskkill /F /PID %%p >nul 2>&1
)

REM --- 3. Compilar si no hay build de produccion ----------------------------
if exist ".build\BUILD_ID" (
  echo   [3/4] Compilacion existente
) else (
  echo   [3/4] Compilando ^(puede tardar un minuto^)...
  call npm run build
  if errorlevel 1 goto :error
)

REM --- 4. Abrir el navegador y arrancar -------------------------------------
echo   [4/4] Iniciando servidor...
echo.
echo   Mando electoral .... http://localhost:3001/electoral
echo.
echo   Para detener el servidor: cierra esta ventana o pulsa Ctrl+C
echo.

start "" cmd /c "timeout /t 5 >nul & start http://localhost:3001/electoral"

call npm run start

echo.
echo   El servidor se detuvo.
pause
exit /b 0

:error
echo.
echo   *** Hubo un error. Revisa el mensaje de arriba. ***
pause
exit /b 1
