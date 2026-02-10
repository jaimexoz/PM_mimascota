# Script para ejecutar todo el entrenamiento del sistema ML
# Asegúrate de activar el entorno virtual primero: .\venv\Scripts\Activate.ps1

Write-Host "🚀 INICIANDO ENTRENAMIENTO DEL SISTEMA ML" -ForegroundColor Green
Write-Host "=" -NoNewline; Write-Host ("=" * 69)

# Verificar que estamos en el entorno virtual
if (-not $env:VIRTUAL_ENV) {
    Write-Host "`n⚠️  ADVERTENCIA: Entorno virtual no activado" -ForegroundColor Yellow
    Write-Host "Por favor ejecuta primero: .\venv\Scripts\Activate.ps1`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Entorno virtual activado: $env:VIRTUAL_ENV" -ForegroundColor Green

# Paso 1: Probar preprocesamiento
Write-Host "`n📦 Paso 1: Probando módulo de preprocesamiento..." -ForegroundColor Cyan
python src\preprocessing.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error en preprocesamiento" -ForegroundColor Red
    exit 1
}

# Paso 2: Entrenar modelo Content-Based
Write-Host "`n🎯 Paso 2: Entrenando modelo Content-Based..." -ForegroundColor Cyan
python src\models\content_based.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error en Content-Based" -ForegroundColor Red
    exit 1
}

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline; Write-Host ("=" * 69)
Write-Host "✅ ENTRENAMIENTO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=" -NoNewline; Write-Host ("=" * 69)

Write-Host "`n📁 Archivos generados:" -ForegroundColor Cyan
Write-Host "   - models/feature_engineer.pkl"
Write-Host "   - models/content_based_model.pkl"

Write-Host "`n🎯 Próximo paso: Entrenar modelo Collaborative Filtering`n"
