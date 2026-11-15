# OSOJI X420 — V2: controles avanzados en Apple Casa

Estado: V1 Switch y V2 Fanv2 (encendido + dos niveles de succión) desplegados y validados físicamente en Apple Casa — 2026-11-15

## Objetivo y referencia visual

Ampliar la interfaz de Apple Casa, inspirada en la ficha del aire acondicionado TCL de la vivienda, para ofrecer:
1. Inicio/detención de limpieza mediante un interruptor principal.
2. Selección de los **modos reales soportados por OSOJI**.
3. Ajuste de la **potencia de succión** mediante un deslizador si el transporte LAN y la interfaz seleccionada lo permiten.
4. Estado de limpieza y batería, sin dependencia de Tuya Cloud.

**Importante:** Apple Casa controla el diseño de la ficha según el tipo de accesorio. El plugin no puede reproducir exactamente el panel de un climatizador ni añadir libremente un menú de enumeraciones HomeKit. Los modos y el deslizador dependen del servicio de HAP/Matter elegido. No anunciar soporte de un modo o intensidad no verificado físicamente.

## Línea base real V1

- Homebridge 2.5.0, Node 24, Raspberry Pi.
- Tuya LAN 3.4 y Python TinyTuya mediante `scripts/local_bridge.py`.
- Lectura observada: DP1 `power`, DP3 `mode`, DP5 `status`, DP6 batería; DP2 `power_go` no figura en el resultado de `status()`.
- Inicio comprobado: escritura **atómica** `{1: True, 2: True, 3: "smart"}` -> `smart_clean` y limpieza física.
- Detener y regresar a base comprobado: escritura **atómica** `{1: True, 2: False, 3: "chargego"}` -> vuelta física a la base.
- La succión es `DP14` y admite `normal` o `strong`: **lecturas LAN confirmadas con ambos valores mientras limpia**; la escritura LAN `set_value(14, 'strong')` está confirmada por respuesta y lectura posterior; potencia fuerte confirmada físicamente al mover la barra sobre 50 % desde Apple Casa.
- El accesorio actual es `Service.Switch`, asociado a un UUID estable. Debe existir ruta de migración sin romper emparejamiento ni automaciones.

## Selección de presentación en configuración

La opción `homekitPresentation` acepta `switch` (predeterminado, V1) o `fan` (prototipo V2 Fanv2). Ambas usan el mismo accesorio y transporte LAN verificado. `fan` habilita `Active` (inicio/dock) y `RotationSpeed` (dos niveles reales vía DP14), solo en transporte LAN. El selector de modos sigue pendiente. Cambiar de tipo puede requerir recrear automatizaciones antiguas. Se conserva el UUID y se elimina el servicio anterior del accesorio cacheado; rollback: volver a `switch` y reiniciar Homebridge.

## Estrategia de interfaz: opciones a evaluar

| Opción | Controles disponibles | Limitación / decisión |
|---|---|---|
| **A. HomeKit Fanv2 (MVP V2)** | `Active` y `RotationSpeed` muestran encendido e intensidad; `TargetFanState` solo distingue auto/manual. | La barra de velocidad **no es succión real** hasta mapear los niveles. Los modos OSOJI no caben en el selector auto/manual: ofrecer switches de escenas adicionales o exponer modos en una interfaz complementaria. Mostrar un ventilador para una aspiradora es una representación indirecta. |
| **B. HomeKit AirPurifier** | `Active`, `RotationSpeed` y `TargetAirPurifierState` auto/manual; puede parecerse visualmente a una ficha con varias opciones. | Representa falsamente un purificador; tampoco ofrece menú arbitrario de modos. No elegir por similitud visual solamente. |
| **C. Matter RoboticVacuumCleaner (objetivo preferido a evaluar)** | Tipo nativo de aspiradora, run/clean modes, estados y operaciones de base según compatibilidad del controlador. | Requiere desarrollo adicional con API Matter de Homebridge 2, emparejamiento Matter separado y pruebas con la versión real de Apple Casa; control deslizante de succión no está garantizado. Mantener V1 HomeKit funcional hasta validarlo. |

**Decisión de arquitectura inicial:** implementar primero un dominio común `VacuumState` + `VacuumController`, independiente de la presentación HomeKit/Matter. Crear un prototipo aislado Fanv2 y otro Matter RoboticVacuumCleaner; seleccionar la UI tras verificar qué aparece realmente en Apple Casa en iPhone/iPad. No forzar ni afirmar una apariencia idéntica a la captura TCL.

## Fase 1 — Descubrimiento de modos y succión (bloqueante)

- [x] Obtener desde Tuya lista de modos de OSOJI (`standby`, `random`, `spiral`, `smart`, `chargego`, `wall_follow`) y succión (`normal`, `strong`). Tabla proporcionada por el propietario; mapeo completo documentado en `docs/osoji-dps-map.md`.
- [x] Ejecutar **solo lecturas** del mapa DPS durante cambios manuales de succión `normal` ↔ `strong` desde Tuya. Disponible `scripts/compare_local_dps.py`, sin escrituras.
- [x] Confirmar que la succión se lee por LAN: **DP14**, con transición observada `strong → normal` durante `smart_clean`.
- [ ] Validar físicamente cada escritura local individual / atómica autorizada, con operación supervisada, sin pruebas automáticas de movimiento.
- [x] Generar `docs/osoji-dps-map.md` con todas las funciones oficiales suministradas, distinguiendo DPs conocidos de desconocidos; sin claves ni IDs privados.

## Fase 2 — Dominio y transporte

- [ ] Extender `scripts/local_bridge.py` con acciones validadas `get_status`, `start`, `dock`, `set_mode`, `set_suction` (sin permitir escrituras arbitrarias desde HomeKit).
- [ ] Definir `VacuumState`: `phase` (docked, cleaning, returning, idle, error, unknown), `mode`, `suction`, `battery`, `reachable`, `updatedAt`; distinguir valores reportados vs deseados.
- [ ] Crear mapa parametrizado de modos/niveles obtenidos del dispositivo, con normalización entre valores Tuya y controles HomeKit/Matter.
- [ ] Serializar y deduplicar escrituras; validar entrada, comprobar estados posteriores, timeouts, errores y bloqueo `allowLocalCommands`. No reintentar ciegamente acciones de movimiento ni activar simultáneamente comandos incompatibles.
- [ ] Mantener `local` sin fallback Cloud para acciones; preservar `cloud` heredado.

## Prototipo de modos LAN para pruebas presenciales

El PR de modos introduce `allowExperimentalModes` (**false** de forma predeterminada). Solo con `homekitPresentation=fan`, `connectionMode=local`, `allowLocalCommands=true` y `allowExperimentalModes=true` se crean cuatro switches auxiliares de modo: Inteligente (`smart`), Aleatorio (`random`), Espiral (`spiral`) y Bordes (`wall_follow`). No hay un selector de modos arbitrario dentro de `Fanv2` en Apple Casa. Se consulta DP3 para reflejar el modo activo; tocar OFF sobre un switch de modo **no** detiene el robot ni manda comando. Seleccionar ON exige limpieza en curso, escribe la combinación `{1: true, 2: true, 3: modo}` y comprueba DP3 posteriormente. Solo está confirmada físicamente la combinación para `smart`: los otros tres modos son hipótesis de protocolo que necesitan pruebas presenciales, no deben activarse en instalaciones de uso cotidiano hasta verificarlos. El cambio de modo podría alterar el recorrido inesperadamente: mantener el área despejada y la escena de regreso a base disponible.

El código se prepara y prueba en CI sin enviar comandos a la aspiradora doméstica. **No habilitar el flag ni desplegar a Raspberry sin prueba supervisada**. El modo switch V1 y la potencia de Fanv2 mantienen el comportamiento actual cuando el flag está desactivado.

## Fase 3 — Interfaz Apple Casa

- [x] **Fanv2 con succión DP14:** `Active` para inicio/dock y `RotationSpeed` para `normal`/`strong` discretos. Escritura `strong` confirmada por respuesta y lectura posterior; Apple Casa y aumento físico de succión por encima de 50 % confirmados por el propietario.
- [x] **Prototipo inicial — selector de modos:** switches auxiliares de solo selección ON en `Fanv2`, con DP3 y bandera de activación separada, desactivada por defecto. Los comandos LAN de modos nuevos **aún no están físicamente validados**; revisar si Apple Casa los agrupa de forma usable, y tras la validación evaluar modos nativos Matter.
- [ ] Probar propuesta alternativa **Matter RoboticVacuumCleaner** con `RvcRunMode`, `RvcCleanMode` y estado de docking; comprobar en Apple Casa y las posibilidades reales de control de succión.
- [ ] Seleccionar presentación definitiva en base a usabilidad real: menú nativo solo si existe, barra solo si control respaldado por DP confirmado.
- [ ] Migración controlada: conservar UUID del accesorio principal o exponer implementación V2 como accesorio opcional de pruebas. No eliminar el switch V1 ni limpiar `cachedAccessories` automáticamente.

## Problema de interfaz observado en Apple Casa (2026-11-15)

En la prueba de los switches auxiliares, Apple Casa mostró los cuatro interruptores como «OSOJI», sin distinguir el modo. Al activar un modo, quedaron inhabilitados durante unos segundos y luego se habilitaron de nuevo. Los logs existentes no identifican el modo enviado. El registro de limpieza pasó de `cleaning=true` a `cleaning=false` entre 16:04:58 y 16:05:19; esto no demuestra por sí solo que un cambio de modo haya detenido el robot.

**Acción segura inmediata:** mantener `homekitPresentation=fan` y volver a `allowExperimentalModes=false` hasta resolver presentación y validar comandos. La opción se desactiva en Homebridge, sin modificar la Local Key ni el emparejamiento. Este PR añade nombres explícitos por servicio y logs de selección/confirmación sin IDs ni secretos, pero **no garantiza que Apple Casa respete esos nombres** ni resuelve el problema de cuatro interruptores.

**Diseño recomendado:** investigar una presentación nativa **Matter Robotic Vacuum Cleaner**, no intentar codificar cuatro modos en `Fanv2.TargetFanState` (solo manual/automático). Un accesorio de aspiradora Matter ofrece tipos de modo de limpieza en las implementaciones actuales de Homebridge 2/Matter, pero requiere un prototipo independiente y verificar soporte de iPhone/Apple TV/HomePod. No migrar automáticamente el dispositivo HomeKit actual; mantenerlo operativo mientras se prueba el nuevo endpoint. Los nombres exactos de modo en Apple Casa podrían estar limitados por su interfaz.

**Bloqueos antes de exponer modos al usuario:** 
- Distinguir el DP3 seleccionado del estado DP5 (algunos modos podrían cambiar el valor de estado a uno no incluido todavía en la lista de fases).
- Confirmar presencialmente los efectos físicos y la secuencia segura de `random`, `spiral`, `wall_follow`; no deducir éxito a partir de CI.
- Construir prototipo Matter con emparejamiento de pruebas separado y mecanismo de apagado/rollback sin interferir con V1.
- Validar que la selección aparece como lista comprensible y que el modo y succión se sincronizan al cambiar desde Tuya.

## Fase 4 — Calidad, despliegue y aceptación

- [ ] Tests unitarios de mapping, rangos de velocidad, modos inválidos, lecturas y escrituras, concurrencia, timeout y comandos seguros.
- [ ] Pruebas de integración sin credenciales en CI; compilación en Node 24, compatibilidad Homebridge 2.x.
- [ ] En Raspberry: backup config/plugin, despliegue manual supervisado, validación de inicio/dock, cambio de modo, ajuste succión, lectura de batería y recuperación al reiniciar.
- [ ] Verificar funcionalidad local con WAN interrumpida, manteniendo LAN y sin tocar emparejamientos.
- [ ] Probar iPhone/iPad, escenarios, Siri y discrepancias de estado tras acciones desde la aplicación Tuya; no prometer actualización instantánea si hay polling.
- [ ] Documentar rollback, versiones y cambio opcional de UI; apagar `debug` cuando se complete.

## Entregables y criterios de aceptación V2

- Código/PRs segmentados por descubrimiento, transporte, UI y pruebas.
- Encendido y regreso a base confirmados desde Apple Casa sin Cloud.
- Modos soportados identificados y seleccionables sin confusión con `chargego` (acción, no necesariamente modo de limpieza).
- Deslizador de succión funcional **solo si** se confirma DP LAN de succión y los valores aceptados; si no, comunicar explícitamente limitación y no fingir funcionamiento.
- Homebridge estable, sin credenciales en GitHub, y V1 recuperable.
