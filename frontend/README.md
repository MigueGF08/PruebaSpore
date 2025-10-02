# Frontend (Vue 3 + Vite)

Aplicación frontend para el proyecto. Usa Vue 3 con Vite, TailwindCSS y DaisyUI. Se comunica con el backend Express en el puerto 3000.

## Requisitos
- Node.js 18+ (recomendado 20+). El proyecto fue probado con Node 24.6.0.
- npm 8+ o pnpm/yarn (usa uno a la vez).

## Instalación
```
npm install
```

## Variables de entorno
Crea `.env` en `frontend/` si necesitas personalizar URLs. Ejemplo:
```
VITE_API_BASE=http://localhost:3000
```
- `VITE_API_BASE`: URL base del backend. Por defecto normalmente es `http://localhost:3000`.

## Scripts
- Desarrollo (hot-reload en http://localhost:5173):
```
npm run dev
```
- Build producción:
```
npm run build
```
- Previsualización del build:
```
npm run preview
```

## Stack UI
- TailwindCSS + PostCSS + DaisyUI (componentes base)
- SweetAlert2 (alertas/modal); configurado para salir por encima de overlays
- Leaflet (mapas) si lo usas en componentes específicos

Instalaciones útiles:
```
# Mapas
npm install leaflet

# SweetAlert2 (si no está ya)
npm install sweetalert2
```

## Convenciones de estilos
- Estilos globales en `src/style.css`. Ajustes importantes:
  - `.swal2-container` con z-index alto para que las alertas se muestren sobre cualquier modal.

## Estructura relevante
- `src/components/`
  - `UsuariosRegistrados.vue`: gestión de usuarios; usa SweetAlert2 para feedback.
  - `CarrosRegistrados.vue`: listado/gestión de carros.
  - `AgregarCarro.vue`: formulario para alta/edición de carros.

## Conexión con el backend
- El backend corre típicamente en `http://localhost:3000`.
- Asegúrate de que CORS está habilitado en el backend (ya configurado) y que `VITE_API_BASE` apunta correctamente si lo usas.

## Solución de problemas
- Alertas detrás de modales: ver `src/style.css` (z-index para `.swal2-container`).
- CORS/401: revisa la URL del backend y tokens/headers.
- Mapas sin estilos: asegúrate de importar los estilos de Leaflet en el componente o globalmente.


