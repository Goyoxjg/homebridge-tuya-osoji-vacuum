# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2026-07-06

### ✨ Agregado

- **Sistema de reintentos automáticos** con backoff exponencial para mayor confiabilidad
- **Timeouts configurables** en llamadas a API (15s para comandos, 10s para consultas)
- **TuyaAPIError** - Clase personalizada para manejo estructurado de errores
- **validateTuyaResponse()** - Validación consistente de todas las respuestas de Tuya API
- **Validación mejorada de configuración** con mensajes de error descriptivos
- **Debug mode mejorado** con logs detallados de requests/responses
- **Guía completa de troubleshooting** en README
- **Documentación de testing** con 12 casos de prueba (TESTING.md)

### 🔧 Mejorado

- Manejo de errores robusto con diferenciación entre errores retryables y no retryables
- Logs más claros con emojis y colores para mejor legibilidad
- Mejor recuperación automática de fallos de conexión transitoria
- Stack traces completos disponibles en debug mode
- Sugerencias de solución automáticas en caso de errores

### 🐛 Corregido

- Posibles bloqueos indefinidos en llamadas a API (ahora con timeout)
- Errores de conexión transitoria que no se reintentaban
- Mensajes de error genéricos sin información útil de debugging
- Falta de manejo para respuestas incompletas de Tuya API

### 📝 Documentación

- Sección de troubleshooting expandida con soluciones específicas
- Guía de testing completa (TESTING.md)
- Ejemplos de cómo activar debug mode
- Instrucciones para reportar problemas

### 🔄 Cambios Internos

- Nuevo archivo `src/utils.ts` con funciones de utilidad (retry, validation, error handling)
- Refactorización de `platformAccessory.ts` para usar `withRetry()`
- Mejora de `platform.ts` con validación centralizada de configuración

---

## [1.0.5] - 2026-07-06

### ✨ Agregado

- ✅ Actualización a **Node.js >=18.0.0** (desde >=10.17.0)
- ✅ Actualización a **Homebridge >=1.8.0** (desde >=1.0.0)
- ✅ **Categoría de accesorio AIR_PURIFIER** para reconocimiento correcto en HomeKit
- ✅ Actualización de todas las dependencias de desarrollo

### 🔧 Mejorado

- Mejor compatibilidad con iOS Home app actual
- TypeScript actualizado a 5.0 para mejor type safety
- rimraf actualizado a 5.0 para mejor rendimiento

### 🐛 Corregido

- ❌ **Error de incompatibilidad en iOS Home** - Dispositivo ahora se reconoce correctamente
- ❌ Falta de categoría de accesorio que causaba que HomeKit rechazara el dispositivo

### 📝 Documentación

- Actualización de requisitos mínimos en README
- Notas de actualización para v1.0.5

---

## [1.0.4] - 2026-06-XX

### ✨ Agregado

- Control mejorado con comandos adicionales (power, power_go, mode, suction)
- Estado mejorado de 'mode' para detectar limpieza vs. carga

### 🔧 Mejorado

- Debug logging más detallado
- Mejor interpretación del estado de la aspiradora

---

## [1.0.3] - 2026-XX-XX

### 🔧 Mejorado

- Integración inicial con Tuya Cloud API
- Control básico encender/apagar

---

## [1.0.0] - 2026-XX-XX

### ✨ Agregado

- Release inicial del plugin Homebridge Osoji Vacuum
- Soporte para Osoji X420
- Control básico desde HomeKit
- Integración con Tuya Cloud API

---

## 🚀 Roadmap Futuro

### Versión 1.1.0 (Planeado)

- [ ] Soporte para más modos de limpieza (eco, normal, turbo)
- [ ] Barra de progreso de batería
- [ ] Historial de limpiezas
- [ ] Automaciones basadas en ubicación
- [ ] Notificaciones de mantenimiento

### Versión 1.2.0 (Planeado)

- [ ] Soporte para múltiples dispositivos simultáneamente
- [ ] Estadísticas de limpieza
- [ ] Integración con Google Home (si es posible)
- [ ] API REST para integración con otros sistemas

---

## 📋 Notas de Actualización

### Actualizar de 1.0.5 a 1.0.6

**Cambios automáticos:**
- Se instalarán nuevas dependencias automáticamente
- No requiere cambios en configuración existente

**Beneficios:**
- ✅ Mayor confiabilidad en conexiones inestables
- ✅ Mejor debugging con logs detallados
- ✅ Recuperación automática de fallos temporales
- ✅ Mensajes de error más claros

**No requiere acción del usuario.**

---

## 📞 Soporte

Para reportar bugs o solicitar features:
- 🐛 [GitHub Issues](https://github.com/Goyoxjg/homebridge-tuya-osoji-vacuum/issues)
- 💬 [GitHub Discussions](https://github.com/Goyoxjg/homebridge-tuya-osoji-vacuum/discussions)

---

**Última actualización:** 2026-07-06
**Mantenedor:** Goyoxjg
**Licencia:** ISC
