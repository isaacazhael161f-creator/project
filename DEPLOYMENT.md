# Deployment Guide - Escáner de Manifiestos

Esta guía describe el proceso de deployment para la aplicación web Escáner de Manifiestos.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Configuración del Entorno](#configuración-del-entorno)
- [Scripts de Deployment](#scripts-de-deployment)
- [Deployment Manual](#deployment-manual)
- [Deployment Automatizado](#deployment-automatizado)
- [Monitoreo y Verificación](#monitoreo-y-verificación)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

## Requisitos Previos

### Software Requerido

- Node.js 18+ 
- npm 8+
- Git
- Expo CLI (`npm install -g @expo/cli`)

### Herramientas Opcionales

- AWS CLI (para deployment a S3)
- Netlify CLI (para deployment a Netlify)
- rsync (para deployment via SSH)

## Configuración del Entorno

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las variables necesarias:

```bash
cp .env.example .env
```

### 2. Configuración por Ambiente

#### Staging
```bash
NODE_ENV=production
DEPLOY_TARGET=staging
DEPLOY_METHOD=netlify
STAGING_URL=https://staging.manifiesto-scanner.com
```

#### Production
```bash
NODE_ENV=production
DEPLOY_TARGET=production
DEPLOY_METHOD=netlify
PRODUCTION_URL=https://manifiesto-scanner.com
```

## Scripts de Deployment

### Scripts Disponibles

```bash
# Build de producción
npm run build:web:prod

# Análisis de bundle
npm run build:analyze

# Preview local
npm run preview:web

# Verificaciones pre-deployment
npm run deploy:check

# Deployment a staging
npm run deploy:staging

# Deployment a producción
npm run deploy:production
```

### Verificaciones Pre-Deployment

Antes de cualquier deployment, ejecuta:

```bash
npm run deploy:check
```

Este script verifica:
- Estado de Git (cambios sin commit)
- Dependencias y vulnerabilidades
- Configuración de build
- Variables de entorno
- Assets y recursos
- Cobertura de tests

## Deployment Manual

### 1. Preparación

```bash
# Verificar estado del repositorio
git status

# Actualizar dependencias
npm install

# Ejecutar tests
npm run test:all

# Verificaciones pre-deployment
npm run deploy:check
```

### 2. Build de Producción

```bash
# Build optimizado
npm run build:web:prod

# Verificar build
ls -la dist-web/
```

### 3. Deployment

#### Netlify
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir dist-web
```

#### AWS S3
```bash
# Configurar AWS CLI
aws configure

# Sync a S3
aws s3 sync dist-web/ s3://your-bucket-name --delete
```

#### SSH/RSYNC
```bash
# Deploy via rsync
rsync -avz --delete dist-web/ user@server:/var/www/manifiesto-scanner/
```

## Deployment Automatizado

### GitHub Actions

El proyecto incluye workflows de GitHub Actions para deployment automatizado:

- **Push a `develop`**: Deploy automático a staging
- **Push a `main`**: Deploy automático a producción
- **Pull Request**: Ejecuta tests y build

### Configuración de Secrets

En GitHub, configura los siguientes secrets:

```
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_STAGING_SITE_ID=staging-site-id
NETLIFY_PRODUCTION_SITE_ID=production-site-id
```

### Variables de Entorno

Configura las siguientes variables en GitHub:

```
STAGING_URL=https://staging.manifiesto-scanner.com
PRODUCTION_URL=https://manifiesto-scanner.com
```

## Monitoreo y Verificación

### 1. Verificación Post-Deployment

```bash
# Verificar conectividad
curl -f https://your-domain.com

# Verificar manifest PWA
curl -f https://your-domain.com/manifest.json

# Verificar service worker
curl -f https://your-domain.com/sw.js
```

### 2. Lighthouse CI

El proyecto incluye verificaciones automáticas de rendimiento:

- Performance: mínimo 80%
- Accessibility: mínimo 90%
- Best Practices: mínimo 80%
- SEO: mínimo 80%
- PWA: mínimo 80%

### 3. Monitoreo de Errores

Configura herramientas de monitoreo como:
- Sentry para tracking de errores
- Google Analytics para métricas de uso
- Uptime monitoring para disponibilidad

## Rollback

### Rollback Automático

Los scripts de deployment crean backups automáticos:

```bash
# Listar backups disponibles
ls -la backup/

# Restaurar desde backup
# (implementar según método de deployment)
```

### Rollback Manual

#### Git
```bash
# Revertir último commit
git revert HEAD

# Push del revert
git push origin main

# Re-deploy
npm run deploy:production
```

#### Netlify
```bash
# Listar deployments
netlify sites:list

# Rollback a deployment anterior
netlify rollback --site-id=your-site-id
```

## Optimizaciones de Rendimiento

### Bundle Splitting

El webpack está configurado para:
- Separar vendors de código de aplicación
- Crear chunk separado para Tesseract.js
- Optimizar tree shaking

### Caching Strategy

- **Static assets**: Cache-first (30 días)
- **Images**: Cache-first (7 días)
- **OCR models**: Cache-first (90 días)
- **API data**: Network-first (1 hora)

### PWA Features

- Service Worker para caching offline
- Web App Manifest para instalación
- Background sync para datos pendientes
- Push notifications (preparado para futuro)

## Troubleshooting

### Problemas Comunes

#### Build Failures
```bash
# Limpiar cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Verificar versiones
node --version
npm --version
```

#### Deployment Failures
```bash
# Verificar conectividad
ping your-server.com

# Verificar credenciales
netlify status
aws sts get-caller-identity
```

#### Performance Issues
```bash
# Analizar bundle
npm run build:analyze

# Verificar assets
du -sh assets/
```

### Logs y Debugging

```bash
# Ver logs de deployment
cat deployment-*.log

# Verificar service worker
# En DevTools > Application > Service Workers

# Verificar cache
# En DevTools > Application > Storage
```

## Checklist de Deployment

### Pre-Deployment
- [ ] Tests pasando
- [ ] Código revisado
- [ ] Variables de entorno configuradas
- [ ] Assets optimizados
- [ ] Documentación actualizada

### Durante Deployment
- [ ] Backup creado
- [ ] Build exitoso
- [ ] Deployment completado
- [ ] Verificación de conectividad

### Post-Deployment
- [ ] Funcionalidad verificada
- [ ] Performance monitoreada
- [ ] Errores revisados
- [ ] Usuarios notificados (si aplica)

## Contacto y Soporte

Para problemas con deployment:
1. Revisar logs de deployment
2. Consultar esta documentación
3. Verificar status de servicios externos
4. Contactar al equipo de DevOps

---

**Nota**: Esta documentación debe mantenerse actualizada con cualquier cambio en el proceso de deployment.