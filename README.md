# Homebridge Osoji Vacuum (Tuya Cloud)

Plugin de Homebridge para controlar la aspiradora robot **Osoji X420** en Apple HomeKit mediante la API oficial de Tuya Cloud.

## ✨ Características

- ✅ **Control On/Off**: Inicia y detiene la limpieza desde HomeKit
- ✅ **Sincronización de Estado**: Consulta el estado real del dispositivo
- ✅ **Integración con Siri**: Control por voz
- ✅ **Automatizaciones**: Programa limpiezas automáticas
- ✅ **Configuración Visual**: Interfaz gráfica en Homebridge Config UI X

## 🔄 Actualizaciones Recientes

**v1.0.6 - Mejoras de Estabilidad y Manejo de Errores**
- ✅ Sistema de reintentos automáticos con backoff exponencial
- ✅ Timeouts configurables en llamadas a API
- ✅ Validación robusta de respuestas de Tuya API
- ✅ Mejora de logs y debugging
- ✅ Validación mejorada de configuración
- ✅ Guía de troubleshooting completa

**v1.0.5 - Correcciones de Compatibilidad con iOS Home**
- ✅ Actualizado a Node.js 18+ y Homebridge 1.8+ para mejor compatibilidad
- ✅ Agregada categoría correcta del accesorio (AIR_PURIFIER) para reconocimiento en HomeKit
- ✅ Mejora de estabilidad y compatibilidad con últimas versiones de Apple Home

## 📋 Requisitos Previos

Antes de instalar este plugin, necesitas:

### 1. Cuenta en Tuya IoT Platform
- Registrarte en [Tuya IoT Platform](https://iot.tuya.com/)
- Crear un proyecto Cloud (gratuito)

### 2. Credenciales de Tuya
Necesitarás obtener tres valores:
- **Access Key (Access ID)**: Identificador de tu proyecto
- **Secret Key (Access Secret)**: Clave secreta de tu proyecto  
- **Device ID**: ID único de tu aspiradora Osoji X420

### 3. Homebridge
- Homebridge v1.8.0 o superior
- Node.js v18.0.0 o superior

## 🔑 Cómo Obtener las Credenciales de Tuya

### Paso 1: Crear un Proyecto en Tuya IoT Platform

1. Ve a [https://iot.tuya.com](https://iot.tuya.com) e inicia sesión
2. Haz clic en **"Cloud"** en el menú lateral
3. Haz clic en **"Create Cloud Project"**
4. Completa los datos:
   - **Project Name**: "Homebridge Osoji" (o el nombre que prefieras)
   - **Industry**: "Smart Home"
   - **Development Method**: "Smart Home"
   - **Data Center**: Selecciona tu región (ej: "United States")
5. Haz clic en **"Create"**

### Paso 2: Obtener Access Key y Secret Key

1. En tu proyecto recién creado, ve a la pestaña **"Overview"**
2. Encontrarás dos valores importantes:
   - **Access ID/Client ID** → Copia este valor como tu **accessKey**
   - **Access Secret/Client Secret** → Copia este valor como tu **secretKey**
3. **¡GUÁRDALOS!** Los necesitarás para configurar el plugin

> **Nota**: En la configuración del plugin, estos campos se llaman `accessKey` y `secretKey` (nombres usados por la API v2.x de Tuya)

### Paso 3: Vincular tu Aspiradora al Proyecto

1. Ve a la pestaña **"Devices"** en tu proyecto
2. Haz clic en **"Link Tuya App Account"**
3. Escanea el código QR con la app **Tuya Smart** o **Smart Life**
4. Autoriza la vinculación de dispositivos
5. Tus dispositivos (incluyendo la Osoji X420) aparecerán listados

### Paso 4: Obtener el Device ID

1. En la lista de **"Devices"**, busca tu aspiradora Osoji X420
2. Haz clic en ella para ver los detalles
3. Copia el **"Device ID"** (algo como `bf4a77e8f9b2c6d3e5mnop`)

### Paso 5: Activar las APIs Necesarias

1. Ve a la pestaña **"API"** de tu proyecto
2. Busca y activa estas APIs:
   - **IoT Core** (Device Status Query, Device Control)
   - **Authorization** 
3. Haz clic en **"Go to Authorize"** si es necesario

## 🚀 Instalación del Plugin

### Opción 1: Desde Homebridge Config UI X (Recomendado)

1. Abre **Homebridge Config UI X** en tu navegador
2. Ve a la pestaña **"Plugins"**
3. Busca **"homebridge-osoji-vacuum"**
4. Haz clic en **"Install"**
5. Una vez instalado, haz clic en **"Settings"**
6. Completa los campos con tus credenciales de Tuya (ver arriba)
7. Guarda y reinicia Homebridge

### Opción 2: Instalación Manual

```

## 🔧 Troubleshooting

### El dispositivo aparece como incompatible en HomeKit

**Soluciones:**
1. Asegúrate de tener Homebridge **v1.8.0 o superior** y **Node.js v18.0.0 o superior**
2. Elimina el accesorio del HomeKit y reinicia Homebridge para que se detecte correctamente
3. Verifica los logs: `[DEBUG]` debe estar activado en configuración para ver detalles

```bash
# Limpiar cache de Homebridge y reiniciar
sudo systemctl restart homebridge
```

### El comando de encendido/apagado no funciona

**Posibles causas y soluciones:**
- **Timeout de conexión**: El plugin reintentar automáticamente 3 veces. Verifica:
  - Conexión a internet estable
  - Endpoint correcto en configuración (US/EU/CN/IN)
  
- **Error de autenticación**: Verifica:
  - Access Key es correcto
  - Secret Key es correcto
  - Device ID es válido

- **Activar Debug mode**: En los settings del plugin, activa "Modo Debug" para ver logs detallados

### El dispositivo no responde a las consultas de estado

- El plugin reintentar automáticamente con backoff exponencial
- Espera a que Homebridge se estabilice (puede tardar ~30 segundos en la primera consulta)
- Verifica que `IoT Core` API está activada en Tuya IoT Platform

### Cómo ver logs detallados

```bash
# Con Homebridge CLI
hb-service logs

# O si usas systemd
sudo journalctl -u homebridge -f

# Buscar solo errores de Tuya
hb-service logs | grep -i tuya
```

**Modo Debug:** Activa "Modo Debug" en la configuración del plugin para ver requests/responses completos de la API Tuya.

## 📞 Soporte

- 🐛 [Reportar problemas en GitHub](https://github.com/Goyoxjg/homebridge-tuya-osoji-vacuum/issues)
- 📖 [Documentación oficial de Homebridge](https://github.com/homebridge/homebridge)
- 🔑 [Documentación Tuya IoT Platform](https://developer.tuya.com/)

## 📄 Licencia

ISCbash
# Instalar el plugin globalmente
npm install -g homebridge-osoji-vacuum

# O para desarrollo local
cd /ruta/al/proyecto
npm install
npm run build
npm link
