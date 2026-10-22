# Vías Seguras: Frontend

PWA del **reporte y seguimiento ciudadano de baches y daños viales** (Caso de Estudio 2, Programación Orientada a la Web).

**Autor:** Julian Moreno

> Backend (API REST, SSR/ISR/SSG): carpeta `CASO-DE-ESTUDIO-REPORTE-SEGUIMIENTO-BACKEND`.

El código (componentes, funciones, variables, archivos y clases CSS) está en inglés; los textos que ve el usuario están en español.

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 18 + React Router 6 (CSR, *code splitting* por página) |
| Build | Vite 5 |
| Mapas | Leaflet 1.9 + `leaflet.markercluster` (agrupación de marcadores) + `leaflet.heat` (mapa de calor) |
| Íconos | lucide-react |
| Métricas | `web-vitals` → `POST /api/metrics/web-vitals` con `sendBeacon` |
| PWA | Service Worker propio (`public/sw.js`) + `manifest.webmanifest` + IndexedDB |

## Ejecución

```bash
# 1. Backend:  cd ../CASO-DE-ESTUDIO-REPORTE-SEGUIMIENTO-BACKEND && npm install && npm start   (http://localhost:3000)
# 2. Frontend:
npm install
npm run dev        # http://localhost:5173
npm run build      # versión de producción en dist/ (activa el Service Worker)
npm run preview    # sirve dist/ en http://localhost:5173
```

La URL del backend se configura con `VITE_API_URL` (ver `.env.example`; por defecto `http://localhost:3000`). El backend ya permite por CORS el origen `http://localhost:5173`.

No hay cuentas de demostración: al abrir la app aparece la **portada** con el acceso. Primero se elige el perfil (**Ciudadano** o **Funcionario**) y después se ingresa o se crea la cuenta. Registrar un funcionario pide el código de invitación del backend (`OFFICIAL_INVITE_CODE`). Si alguien intenta entrar con el perfil equivocado, el backend lo rechaza.

Despliegue en Vercel: ver `docs/DESPLIEGUE.md` en el backend. `vercel.json` ya redirige todas las rutas a `index.html` (SPA).

## Pantallas

| Ruta | Quién | Qué hace |
|---|---|---|
| `/` | Sin sesión | Portada: presentación y acceso (elegir perfil → ingresar o registrarse). Con sesión lleva al mapa |
| `/mapa` | Con sesión | Mapa con incidentes agrupados (cluster) y **mapa de calor de prioridad**. Filtros por estado y tipo de daño, orden de atención sugerido, solo se pide lo visible (`bbox`) |
| `/reportar` | Ciudadano | Formulario en 3 pasos: ubicación (GPS del navegador, **selección manual en el mapa si se niega el permiso**, o GPS de la foto), tipo de daño y de vía, foto comprimida y descripción. Avisa si ya hay un incidente a ≤ 30 m al que se sumará el reporte |
| `/incidentes/:id` | Con sesión | Estado (stepper), prioridad con el aporte de cada factor, historial con notas de la alcaldía, mini mapa con el radio de agrupación y fotos de cada reporte |
| `/mis-reportes` | Ciudadano | Seguimiento de cada reporte y de los guardados sin conexión |
| `/notificaciones` | Ciudadano | Avisos de cambio de estado **en tiempo real (SSE)** y notificaciones del sistema si se dan permisos |
| `/panel` | Funcionario | Indicadores, distribución por estado y tipo, consolidación DBSCAN, y tabla de gestión con filtros por **zona (área visible del mapa)**, tipo de daño, tipo de vía, prioridad y orden. Cambio de estado con nota desde un panel lateral |

## Retos técnicos y cómo se resolvieron

- **Muchos marcadores sin que el mapa se vuelva lento:** `markerClusterGroup` con `chunkedLoading`, `preferCanvas`, un punto por incidente (no por reporte) y peticiones limitadas al área visible con *debounce* y cancelación (`AbortController`).
- **Mapa de calor:** capa `leaflet.heat` con los puntos `[lat, lng, prioridad]` y el gradiente que entrega `GET /api/heatmap`.
- **Geolocalización:** `useGeolocation` distingue permiso negado, error, tiempo agotado y navegador sin soporte; en todos los casos se puede marcar el punto en el mapa o arrastrar el pin.
- **Fotos con plan de datos limitado:** la foto se redimensiona (máx. 1600 px) y comprime a JPEG (~600 KB) en un **Web Worker** con `OffscreenCanvas` (con respaldo en el hilo principal). Como el canvas borra los metadatos, se copia el segmento **EXIF** original (con la orientación corregida) al JPEG nuevo: así el backend puede verificar el GPS de la foto contra el punto reportado.
- **Sin conexión:** los reportes se guardan en **IndexedDB** (con la foto) y se envían a `POST /api/reports/batch` al volver la red (evento `online` y Background Sync del Service Worker). Cada reporte lleva un `clientRequestId`, así que un reintento no crea duplicados.
- **Confiabilidad:** se muestran los errores del backend tal cual (reporte duplicado 409, límite por hora 429) y el funcionario ve si el GPS de cada foto coincide (`VERIFIED` / `MISMATCH` / `NO_GPS`).

## Estructura

```
public/
├── sw.js                    Service Worker: app shell, assets, teselas y GET de la API en caché
├── manifest.webmanifest     App instalable
└── icons/icon.svg
src/
├── main.jsx                 Proveedores (router, toasts, sesión, catálogo, notificaciones) + SW + Web Vitals
├── App.jsx                  Rutas con carga diferida y guardias
├── config.js                URL de la API y constantes
├── api/                     client.js (ApiClient: token Bearer, errores, abort) · endpoints.js (un módulo por recurso)
├── context/                 AuthContext · CatalogContext · NotificationsContext (SSE) · ToastContext
├── hooks/                   useApi · useGeolocation · useOnlineStatus · useOfflineSync · usePendingReports · useDocumentTitle
├── components/
│   ├── layout/              AppLayout (encabezado + barra inferior móvil), ConnectionBanner, RouteGuards, Logo
│   ├── map/                 IncidentMap (cluster + calor), LocationPicker, MiniMap
│   ├── incident/            StatusStepper, StatusHistory, PriorityMeter, StatusChangePanel, IncidentListItem
│   ├── report/              CategoryPicker, PhotoInput, ReportResult
│   ├── admin/               BarList, ConsolidationCard, IncidentTable, IncidentDrawer
│   ├── auth/                WelcomeHero, RoadIllustration, RolePicker, LoginForm, RegisterForm, PasswordField, FormError, roles
│   └── ui/                  Badges, Feedback (loader, vacío, error, skeleton), PageHeader
├── pages/                   MapPage, ReportPage, IncidentDetailPage, MyReportsPage, NotificationsPage, AdminPage, WelcomePage, NotFoundPage
├── services/                compressImage + imageService (Web Worker), offlineQueue (IndexedDB), webVitals, serviceWorker
├── workers/                 compress.worker.js
├── lib/                     Configuración de Leaflet y sus plugins
├── utils/                   domain (colores/íconos por estado, prioridad y categoría), exif, geo (haversine), format, id
└── styles/                  global.css (tokens y estilos, mobile-first) · welcome.css (portada, se carga solo en /)
```
