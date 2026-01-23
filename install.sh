#!/bin/bash

# Script de instalación rápida para Homebridge Osoji Vacuum Plugin
# Autor: homebridge-osoji-vacuum
# Fecha: Enero 2026

echo "🚀 Instalando Homebridge Osoji Vacuum Plugin..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio del proyecto"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

# Compilar el proyecto
echo ""
echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al compilar el proyecto"
    exit 1
fi

# Verificar que dist/ se creó correctamente
if [ ! -d "dist" ]; then
    echo "❌ Error: El directorio dist/ no se creó"
    exit 1
fi

echo ""
echo "✅ ¡Compilación exitosa!"
echo ""
echo "📁 Archivos generados en dist/:"
ls -1 dist/*.js | sed 's/^/   ✓ /'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ¡Plugin instalado correctamente!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Instalar el plugin en Homebridge:"
echo "   npm link"
echo ""
echo "2. Agregar la configuración a ~/.homebridge/config.json:"
echo "   (Ver config.example.json para un ejemplo)"
echo ""
echo "3. Reiniciar Homebridge:"
echo "   sudo systemctl restart homebridge"
echo "   # o desde Homebridge Config UI X"
echo ""
echo "4. Agregar el accesorio OSOJI en la app Casa de iOS"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Para más información, consulta:"
echo "   - README.md"
echo "   - PROYECTO_COMPLETADO.md"
echo ""
