@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto missing
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)"
if errorlevel 1 goto missing
if not exist node_modules (
 call npm ci
 if errorlevel 1 goto failed
)
echo Mantenha esta janela aberta. Para encerrar, pressione Ctrl+C.
call npm run dev -- --open --port 5173 --strictPort
if errorlevel 1 goto failed
exit /b 0
:missing
echo Instale Node.js 22.12 ou superior antes de continuar.
pause
exit /b 1
:failed
echo Nao foi possivel iniciar. Confira a mensagem acima e se a porta 5173 esta livre.
pause
exit /b 1
