# Hoja de ruta — Domótica local / Homebridge

Actualizada: 2026-11-15

## Objetivo
Reducir dependencia de suscripciones Tuya IoT Cloud y mantener integración Apple Casa/HomeKit mediante Homebridge en Raspberry Pi. Priorizar red local, compatibilidad con Homebridge 2.x, seguridad y reversibilidad.

## Hito 0 — Integraciones comprobadas
- [x] TinyTuya descubre 4 dispositivos Tuya Wi-Fi locales con protocolo 3.4.
- [x] Lámpara (enchufe): control local real desde HomeKit mediante `@nubisco/homebridge-tuya-local-platform`.
- [x] Regleta: 3 canales independientes controlados desde HomeKit mediante el mismo plugin.
- [ ] Prueba formal sin WAN, conservando Wi-Fi/LAN, y asignación de IP reservadas.

## Hito 1 — OSOJI X420 (PR #1) — prioridad actual
- [x] Crear rama independiente `feat/osoji-local-first`.
- [x] Incorporar transporte local TinyTuya sin claves en repositorio.
- [x] Conservar modo Cloud heredado; agregar modo local/auto.
- [x] Preparar pruebas simuladas y CI.
- [ ] Validar lectura real DP5/DP6 desde nueva versión del plugin.
- [ ] Probar **supervisadamente** el inicio de limpieza (DP3=smart), verificando que sea el comando correcto.
- [ ] Probar **supervisadamente** regreso a base (DP3=chargego).
- [ ] Comprobar funcionamiento sin Internet y recuperación tras pérdida de Wi-Fi.
- [ ] Completar revisión de seguridad, merge y publicación estable. **No implementar despliegue automático en Homebridge doméstico.**

## Hito 2 — Estudio de integraciones posteriores a OSOJI
La elección por dispositivo debe comparar, en este orden:
1. Compatibilidad real del plugin local actual `@nubisco/homebridge-tuya-local-platform` (sin asumir soporte de un tipo genérico).
2. Integración local existente y mantenida, con capacidades de HomeKit y pruebas reales.
3. Plugin individual solo si las anteriores no cubren controles y telemetría necesarios.

| Dispositivo | Evidencia actual | Investigación y criterio de decisión |
|---|---|---|
| Cerradura Xoomi C20 con cámara | Tuya registra categoría `videolock`; TinyTuya no descubre IP | Determinar Wi-Fi/bridge/BLE, estados y seguridad. **No enviar desbloqueo ni claves/contraseñas de prueba** sin validar soporte, autorización local y controles seguros; priorizar estado de puerta/cerradura. Plugin propio separado si se demuestra protocolo local compatible. |
| Xiaomi C200 PTZ | Integrada en ecosistema Xiaomi, no identificada como dispositivo Tuya | Verificar modelo/firmware, RTSP/ONVIF/API local soportada, flujo vídeo y movimiento PTZ. Evaluar `camera-ui` u otro plugin mantenido compatible con Homebridge 2.x; **no suponer** que Tuya Local sirve para una cámara Xiaomi. No exponer stream a Internet. |
| Dispensador de alimento con cámara | Tuya: `Security Camera`, categoría `cdsxj`; conexión LAN v3.4 y DPS leídos, pero función alimentar no mapeada | Identificar DP de alimentación y confirmar control local seguro; investigar vídeo aparte. Empezar solo con lectura. Considerar plugin individual para alimentación con controles anti-doble-ración, límites y confirmación; vídeo separado si hace falta. |
| Sensor magnético TH08 «Puerta principal» | Tuya: categoría `mcs`, DP1 contacto, DP2 batería; TinyTuya sin IP | Confirmar tecnología de enlace (Wi-Fi de batería, Zigbee/bridge u otra), camino local hasta el hub y disponibilidad de cambios de estado. Preferir Contact Sensor nativo; no inventar IP ni afirmar que sea LAN accesible. |

### Entregables de este hito
- [ ] Matriz de protocolos/firmware/soporte, por dispositivo.
- [ ] Prueba de solo lectura y control seguro; documentar LAN vs nube y limitaciones.
- [ ] Decisión registrada: plugin existente / plugin individual / no viable localmente.
- [ ] Issues o repositorios independientes para desarrollos específicos; **no mezclar cerradura, cámaras y sensor en el código de OSOJI**.
- [ ] Revisión de privacidad (cámaras), seguridad (cerradura) y modo desconectado antes de activación.

## Reglas de trabajo
- Respaldar Homebridge antes de instalar o cambiar plugins; evitar reset/reemparejamiento que pueda cambiar local keys.
- Nunca publicar `local_key`, credenciales Cloud, cookies, vídeo privado ni datos de acceso.
- Aislar plugins experimentales mediante entorno de pruebas o Child Bridge cuando sea compatible, sabiendo que el aislamiento no corrige incompatibilidades de API.
- Pruebas de comandos físicos **presenciales**. Nunca activar apertura de cerradura ni dispensación de alimento en pruebas automáticas.
- Preferir conectividad LAN estable y acceso remoto mediante hub HomeKit; no abrir puertos de los dispositivos a Internet.
