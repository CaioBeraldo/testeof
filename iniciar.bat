@echo off
title QuadroAI Pro
cd /d %~dp0

echo.
echo  Iniciando QuadroAI Pro...
echo.

if not exist venv (
    echo  Criando ambiente virtual pela primeira vez...
    python -m venv venv
    if errorlevel 1 (
        echo  ERRO: Python nao encontrado. Instale em python.org
        pause
        exit /b 1
    )
)

call venv\Scripts\activate

echo  Verific