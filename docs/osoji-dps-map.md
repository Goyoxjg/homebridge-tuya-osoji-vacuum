# OSOJI X420 — Mapeo de funciones Tuya para V2

Origen: tabla de funciones proporcionada por el propietario, 2026-11-15. No incluye identificadores numéricos LAN excepto los ya comprobados físicamente.

| Código Tuya | Tipo | Valores oficiales aportados | DP LAN | Estado |
|---|---|---|---|---|
| power | Boolean | true / false | 1 | leído y usado en secuencia atómica validada |
| power_go | Boolean | true / false | 2 | escritura conjunta inicio/retorno validada; no aparece en status() |
| mode | Enum | standby, random, spiral, smart, chargego, wall_follow | 3 | modo smart/chargego comprobado; resto pendiente de prueba física |
| direction_control | Enum | forward, backward, turn_left, turn_right, stop | desconocido | no activar desde HomeKit; movimiento manual requiere controles especiales y supervisión |
| reset_edge_brush | Boolean | true / false | desconocido | operación de mantenimiento, no asociar a interruptores de limpieza |
| reset_roll_brush | Boolean | true / false | desconocido | operación de mantenimiento |
| reset_filter | Boolean | true / false | desconocido | operación de mantenimiento |
| seek | Boolean | true / false | desconocido | localizar aspiradora, pendiente |
| suction | Enum | normal, strong | **desconocido** | niveles conocidos, localización del DP y escritura LAN pendientes |
| cistern | Enum | low, middle, high | desconocido | nivel de agua, NO es potencia de succión |

## Semántica de la interfaz

- **Switch V1**: inicio y retorno como se implementó y validó.
- **Fanv2 V2**: `Active` para inicio y retorno, ya comprobado en Apple Casa.
- **Succión**: solo **2 niveles**, `normal` y `strong`. La barra `RotationSpeed` se puede cuantizar a dos tramos, por ejemplo 1–50 % = normal, 51–100 % = strong; la presentación visual de porcentaje **no implica una potencia física continua**. No mostrar ni habilitar el control hasta validar DP y lecturas.
- **Modos de limpieza candidatos**: `random`, `spiral`, `smart`, `wall_follow`. `standby` es reposo y `chargego` es regreso a base, por lo que no se deben presentar como ciclos de limpieza. Los cuatro candidatos aún requieren validación de acciones LAN y estados.
- **HomeKit Fanv2** no admite una lista arbitraria de modos, solo auto/manual. Para seleccionar los cuatro modos, evaluar accesorios de escena separados, mutuamente excluyentes, o una implementación Matter nativa si Apple Casa realmente los expone.
- **Cisterna**: controlar por separado el volumen de agua si se valida. No confundir con `suction` ni mostrarla en `RotationSpeed`.
- Las órdenes `direction_control` y de reset quedan fuera del alcance V2 inicial por seguridad/usabilidad.

## Experimento de descubrimiento de succión (solo lectura)

1. Con OSOJI limpiando desde la app oficial, leer `status()` con TinyTuya y guardar snapshot DPS **localmente**.
2. En la aplicación Tuya, cambiar de `normal` a `strong`.
3. Leer de nuevo DPS y comparar **solo claves modificadas**, no publicar IDs, claves ni DPS completos sin inspección.
4. Volver a `normal`; repetir comparación para confirmar que el mismo DP es reversible.
5. Si no cambia ningún DP, investigar si el control es de solo escritura/está ausente de status() y consultar metadatos de DPS disponibles sin editar el dispositivo.
6. Solo tras identificar el DP, agregar un método restringido `set_suction(normal|strong)` con pruebas y validación física supervisada.

El script `scripts/compare_local_dps.py` ofrece captura y comparación de forma local. No envía comandos. No guardar ni imprimir Local Key.
