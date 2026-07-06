# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a Homebridge Osoji Vacuum! Este documento proporciona pautas y direcciones para contribuir.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Reportar Bugs](#cómo-reportar-bugs)
- [Cómo Sugerir Features](#cómo-sugerir-features)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Proceso de Contribución](#proceso-de-contribución)
- [Estilo de Código](#estilo-de-código)
- [Testing](#testing)

## 📖 Código de Conducta

Este proyecto adhiere a un código de conducta inclusivo. Todos los participantes deben ser respetuosos y constructivos.

## 🐛 Cómo Reportar Bugs

### Antes de Reportar

- Verifica que el bug no ha sido reportado ya
- Lee la [guía de troubleshooting](README.md#-troubleshooting)
- Intenta reproducir el bug con debug mode activado

### Cómo Reportar un Bug Efectivamente

**Usa el siguiente template:**

```markdown
**Descripción del Bug**
Descripción clara y concisa de qué está mal.

**Pasos para Reproducir**
1. ...
2. ...
3. ...

**Comportamiento Esperado**
Qué debería suceder

**Comportamiento Actual**
Qué sucede actualmente

**Información del Sistema**
- Node.js: [versión]
- Homebridge: [versión]
- Plugin: [versión]
- iOS/HomeKit: [versión del SO]

**Logs Relevantes**
```
Pega aquí los logs relevantes (usa debug mode)
```

**Screenshots**
Si aplica

**Información Adicional**
Cualquier contexto adicional
```

## ✨ Cómo Sugerir Features

### Antes de Sugerir

- Verifica que la feature no ha sido sugerida
- Asegúrate de que sea relevante para el proyecto
- Considera si es una sugerencia de feature o un bug report

### Cómo Sugerir una Feature Efectivamente

**Usa el siguiente template:**

```markdown
**Descripción de la Feature**
Descripción clara de la feature propuesta

**Problema que Resuelve**
Explica el problema que esta feature resolvería

**Solución Propuesta**
Describe cómo crees que debería funcionar

**Alternativas Consideradas**
Otras formas en que esto podría implementarse

**Contexto Adicional**
Cualquier información adicional
```

## 🛠️ Configuración del Entorno de Desarrollo

### Requisitos

- Node.js >=18.0.0
- npm >=8.0.0
- Git
- Homebridge v1.8.0+

### Setup

```bash
# 1. Fork el repositorio en GitHub

# 2. Clona tu fork
git clone https://github.com/TU_USUARIO/homebridge-tuya-osoji-vacuum.git
cd homebridge-tuya-osoji-vacuum

# 3. Instala dependencias
npm install

# 4. Crea una rama para tu feature
git checkout -b feature/tu-feature
```

## 🔄 Proceso de Contribución

### 1. Crea tu Branch

```bash
# Feature
git checkout -b feature/nombre-descriptivo

# Bug fix
git checkout -b fix/nombre-del-bug

# Documentation
git checkout -b docs/actualización-docs
```

### 2. Realiza Cambios

- Mantén los commits pequeños y lógicos
- Usa commits messages descriptivos
- Sigue el [estilo de código](#estilo-de-código)

### 3. Compila y Testea

```bash
# Compila TypeScript
npm run build

# Verifica que no hay errores
npm run build 2>&1 | grep -i error
```

### 4. Crea un Pull Request

**Template de PR:**

```markdown
## Descripción

Breve descripción de los cambios

## Tipo de Cambio

- [ ] Bug fix
- [ ] Feature nueva
- [ ] Cambio de documentación
- [ ] Otro

## Testing Realizado

Describe los tests que ejecutaste

## Checklist

- [ ] Mi código sigue el estilo del proyecto
- [ ] He actualizado la documentación si aplica
- [ ] Mis cambios no introducen warnings
- [ ] He testeado en un dispositivo real (si es posible)
```

## 💅 Estilo de Código

### Formato

```typescript
// ✅ BIEN
const getUserStatus = async (userId: string): Promise<UserStatus> => {
  try {
    const response = await fetchUser(userId);
    validateResponse(response);
    return response.status;
  } catch (error) {
    handleError(error);
  }
};

// ❌ MALO
const get_user_status = async (userId: string) => {
  const response = await fetchUser(userId);
  return response.status;
};
```

### Convenciones

1. **Nombres descriptivos**: `getDeviceStatus()` no `getDev()`
2. **Const por defecto**: `const` > `let` > `var`
3. **Arrow functions**: Prefiere `() => {}` sobre `function() {}`
4. **Type safety**: Usa tipos TypeScript siempre
5. **Comments**: Solo comenta el "por qué", no el "qué"

### Estructura de Archivos

```
src/
├── index.ts              # Entry point
├── platform.ts           # Plataforma principal
├── platformAccessory.ts  # Lógica del accesorio
├── config.ts             # Tipos de configuración
├── settings.ts           # Constantes
├── types.ts              # Types/Interfaces
└── utils.ts              # Funciones de utilidad
```

## 🧪 Testing

### Antes de Pushear

```bash
# Compila y verifica errores
npm run build

# Verifica tipos TypeScript
npx tsc --noEmit
```

### Testing Manual

1. **Build local**: `npm run build`
2. **Link local**: `npm link`
3. **Instala en Homebridge**: Busca en Homebridge UI X
4. **Testea configuración**: Completa los settings
5. **Verifica logs**: Abre los logs en Homebridge
6. **Realiza tests**: Sigue [TESTING.md](TESTING.md)

### Test Suite Automatizada

Para ejecutar tests (cuando estén disponibles):

```bash
npm test
```

## 📝 Commits

### Formato de Commit Message

```
type: descripción breve (máx 50 caracteres)

[descripción detallada opcional]

[referencias: #123, Closes #456]
```

### Tipos

- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afecta lógica)
- `refactor`: Refactorización de código
- `perf`: Mejoras de performance
- `test`: Cambios en tests
- `ci`: Cambios en CI/CD

### Ejemplos

```bash
# ✅ BIEN
git commit -m "feat: Add retry mechanism with exponential backoff

- Implements automatic retries for API calls
- Configurable timeouts and retry limits
- Better error handling and logging"

# ❌ MALO
git commit -m "Update code"
```

## 📚 Documentación

### README

- Mantén actualizado con nuevas features
- Incluye ejemplos de uso
- Sección de troubleshooting siempre actualizada

### Code Comments

```typescript
// ✅ BIEN - Explica el por qué
// Reintentar solo en errores transitorios (timeout, conexión)
// No reintentar en errores de auth (código 1000-1002)
if (shouldRetry(error)) {
  // retry logic
}

// ❌ MALO - Obvio o innecesario
// Incrementar contador
count++;
```

### CHANGELOG

- Actualiza con cada feature/fix
- Usa formato de [Keep a Changelog](https://keepachangelog.com/)
- Secciones: Added, Changed, Fixed, Deprecated, Removed

## 🚀 Release Process

1. **Versioning**: Sigue [Semantic Versioning](https://semver.org/)
   - MAJOR.MINOR.PATCH (1.0.6)
   - MAJOR: Breaking changes
   - MINOR: Features (compatible)
   - PATCH: Bug fixes (compatible)

2. **Update CHANGELOG.md**

3. **Update package.json version**

4. **Crea tag en git**:
   ```bash
   git tag -a v1.0.6 -m "Release version 1.0.6"
   git push origin v1.0.6
   ```

5. **Publica en NPM** (si aplica):
   ```bash
   npm publish
   ```

## 🤔 Preguntas?

- 💬 Abre una [GitHub Discussion](https://github.com/Goyoxjg/homebridge-tuya-osoji-vacuum/discussions)
- 📧 Contacta al mantenedor

## 📄 Licencia

Al contribuir, aceptas que tus contribuciones se licencian bajo ISC License.

---

**Gracias por contribuir!** 🎉
