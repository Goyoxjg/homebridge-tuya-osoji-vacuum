# 🧪 Guía de Testing - Homebridge Osoji Vacuum

## 📋 Casos de Prueba

### Test Suite 1: Configuración e Inicialización

#### T1.1 - Validación de Configuración Incompleta
**Objetivo:** Verificar que el plugin rechaza configuración inválida
```
Pasos:
1. En Homebridge UI, intenta guardar config sin llenar "Access Key"
2. Observar error en logs

Resultado Esperado:
✓ Plugin debe mostrar error: "Faltan campos requeridos: accessKey"
✓ Logs deben indicar campos faltantes específicos
```

#### T1.2 - Validación de Credentials Inválidas
**Objetivo:** Verificar que el plugin detecta credenciales falsas
```
Pasos:
1. Configura con Access Key/Secret Key inválidas (pero con longitud correcta)
2. Activa "Modo Debug"
3. Reinicia Homebridge
4. Observa los logs

Resultado Esperado:
✓ Debe intentar conectar (ver reintentos en logs)
✓ Debe mostrar error de Tuya API (código 1001 o 1002)
✓ Debug logs deben mostrar el error completo
```

#### T1.3 - Verificación de Conexión Exitosa
**Objetivo:** Verificar que el plugin se conecta correctamente a Tuya
```
Pasos:
1. Configura con credenciales correctas
2. Activa "Modo Debug"
3. Reinicia Homebridge
4. Observa los logs en los primeros 30 segundos

Resultado Esperado:
✓ Logs deben mostrar "✓ Conexión exitosa con Tuya API"
✓ Debe encontrar el dispositivo Osoji
✓ Logs deben mostrar detalles del dispositivo (status, properties, etc)
```

---

### Test Suite 2: Funcionalidad en iOS Home

#### T2.1 - Aparición del Dispositivo
**Objetivo:** Verificar que el dispositivo aparece en la app Home
```
Pasos:
1. Instala y configura el plugin correctamente
2. Abre la app Home en iPhone
3. Busca el dispositivo "OSOJI"

Resultado Esperado:
✓ El dispositivo debe aparecer en la app Home
✓ Debe estar categorizado como "Humidificador de aire" (AIR_PURIFIER)
✓ NO debe mostrar "Incompatible"
✓ Debe tener un switch encendido/apagado
```

#### T2.2 - Control Básico: Encender
**Objetivo:** Verificar que puedes encender la aspiradora desde iPhone
```
Pasos:
1. En la app Home, abre el dispositivo OSOJI
2. Activa el switch (On)
3. Observa en logs y en la aspiradora física

Resultado Esperado:
✓ Switch debe cambiar a "On"
✓ Logs deben mostrar "[...] Setting vacuum to: ON (cleaning)"
✓ La aspiradora física debe comenzar a limpiar
✓ Logs deben mostrar "✓ Command sent successfully!"
```

#### T2.3 - Control Básico: Apagar
**Objetivo:** Verificar que puedes apagar la aspiradora desde iPhone
```
Pasos:
1. Con la aspiradora limpiando, desactiva el switch (Off)
2. Observa en logs y en la aspiradora física

Resultado Esperado:
✓ Switch debe cambiar a "Off"
✓ Logs deben mostrar "[...] Setting vacuum to: OFF (stop)"
✓ La aspiradora física debe detenerse e ir a cargar
✓ Logs deben mostrar "✓ Command sent successfully!"
```

#### T2.4 - Consulta de Estado
**Objetivo:** Verificar que el estado se sincroniza correctamente
```
Pasos:
1. Abre el dispositivo OSOJI en Home app
2. Enciéndelo desde HomeKit (switch On)
3. Espera 2 segundos
4. Abre el dispositivo nuevamente

Resultado Esperado:
✓ El estado debe reflejar que está limpiando (ON)
✓ Si la enciendas desde la app Tuya Smart simultáneamente,
  Home app debe actualizar en menos de 5 segundos
```

---

### Test Suite 3: Resiliencia y Reintentos

#### T3.1 - Reconexión Automática
**Objetivo:** Verificar que el plugin se recupera de desconexiones
```
Pasos:
1. Con la aspiradora funcionando, desconecta el WiFi del Homebridge (5 segundos)
2. Vuelve a conectar el WiFi
3. Intenta encender/apagar desde Home app

Resultado Esperado:
✓ Logs deben mostrar intentos de reconexión
✓ Después de reconectar, los comandos deben funcionar
✓ Debe ver reintentos con backoff en logs
```

#### T3.2 - Comando con Timeout
**Objetivo:** Verificar manejo de timeouts en comandos
```
Pasos:
1. Desactiva Internet completamente
2. Intenta encender desde Home app
3. Observa los logs durante 20 segundos
4. Vuelve a conectar Internet

Resultado Esperado:
✓ Logs deben mostrar "Attempt 1/4 failed: timeout"
✓ Debe reintentar automáticamente 3 veces
✓ Después de 3 fallos, debe mostrar error
✓ No debe bloquear indefinidamente
```

#### T3.3 - Consulta de Estado con Fallo de Red
**Objetivo:** Verificar que las consultas de estado se recuperan
```
Pasos:
1. Abre dispositivo en Home app (verifica estado)
2. Desactiva temporalmente WiFi (10 segundos)
3. Activa WiFi nuevamente
4. Verifica que el estado se actualiza

Resultado Esperado:
✓ Debe intentar reintentar consultando estado
✓ Una vez reconectado, debe sincronizar estado
✓ No debe mostrar "error" en la app
```

---

### Test Suite 4: Debug Mode

#### T4.1 - Activar Debug Logging
**Objetivo:** Verificar que debug mode proporciona detalles útiles
```
Pasos:
1. Activa "Modo Debug" en la configuración
2. Reinicia Homebridge
3. Ejecuta un comando (encender/apagar)
4. Observa los logs

Resultado Esperado:
✓ Logs deben incluir "[DEBUG]" prefixes
✓ Debe mostrar requests completos (endpoint, path, body)
✓ Debe mostrar respuestas completas de Tuya API
✓ Información de timestamp y detalles de conexión
```

#### T4.2 - Validación de Errors
**Objetivo:** Verificar que los errores se muestran claramente en debug
```
Pasos:
1. Con Debug mode activado, intenta comando con credenciales inválidas
2. Observa los logs

Resultado Esperado:
✓ Debe mostrar "Error code: INVALID_CREDENTIALS" (o similar)
✓ Debe incluir stack trace completo
✓ Debe sugerir acciones correctivas
```

---

## 🔍 Checklist de Testing

### ✅ Pre-Testing
- [ ] Homebridge v1.8.0 o superior instalado
- [ ] Node.js v18.0.0 o superior (`node --version`)
- [ ] Credenciales de Tuya (Access Key, Secret Key, Device ID) a mano
- [ ] iPhone con app Home instalada
- [ ] Aspiradora Osoji X420 disponible y con batería
- [ ] WiFi estable para pruebas

### ✅ Test Suite 1: Configuración (5 min)
- [ ] T1.1 - Validación de config incompleta
- [ ] T1.2 - Validación de credentials inválidas
- [ ] T1.3 - Verificación de conexión exitosa

### ✅ Test Suite 2: iOS Home (10 min)
- [ ] T2.1 - Aparición del dispositivo
- [ ] T2.2 - Control básico: Encender
- [ ] T2.3 - Control básico: Apagar
- [ ] T2.4 - Consulta de estado

### ✅ Test Suite 3: Resiliencia (15 min)
- [ ] T3.1 - Reconexión automática
- [ ] T3.2 - Comando con timeout
- [ ] T3.3 - Consulta de estado con fallo de red

### ✅ Test Suite 4: Debug Mode (5 min)
- [ ] T4.1 - Activar debug logging
- [ ] T4.2 - Validación de errors

### 📊 Resultado Final
- [ ] Todos los tests PASARON
- [ ] No hay errores en logs
- [ ] Dispositivo funciona correctamente en Home app
- [ ] Lista para publicación ✓

---

## 📝 Registro de Resultados

| Test | Resultado | Notas |
|------|-----------|-------|
| T1.1 | PASS/FAIL |       |
| T1.2 | PASS/FAIL |       |
| T1.3 | PASS/FAIL |       |
| T2.1 | PASS/FAIL |       |
| T2.2 | PASS/FAIL |       |
| T2.3 | PASS/FAIL |       |
| T2.4 | PASS/FAIL |       |
| T3.1 | PASS/FAIL |       |
| T3.2 | PASS/FAIL |       |
| T3.3 | PASS/FAIL |       |
| T4.1 | PASS/FAIL |       |
| T4.2 | PASS/FAIL |       |

---

## 🆘 Troubleshooting Durante Tests

**Si el dispositivo no aparece en Home app:**
- Verifica que la categoría es AIR_PURIFIER (revision en logs)
- Elimina el accesorio de Home app y reinicia Homebridge
- Espera 1-2 minutos para que se redescubra

**Si los comandos no funcionan:**
- Activa Debug mode y revisa los logs
- Verifica que Device ID es correcto
- Verifica que credenciales de Tuya son válidas
- Revisa que el endpoint es correcto para tu región

**Si hay timeouts:**
- Verifica conexión a Internet
- Verifica que el WiFi es estable (prueba speedtest)
- Revisa logs para ver reintentos

---

## 🎯 Próximos Pasos Después de Testing

Si todos los tests PASAN:
1. ✓ Actualizar versión a 1.0.6
2. ✓ Crear CHANGELOG
3. ✓ Publicar en NPM (si aplica)
4. ✓ Actualizar GitHub releases

---

**Última actualización:** 2026-07-06
**Versión:** v1.0.6
