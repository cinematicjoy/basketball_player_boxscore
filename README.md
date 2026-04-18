# Planilla Individual de Básquet (PWA)

Incluye:
- Carga de TL, dobles y triples con anotados/fallados.
- Cálculo automático de intentos, puntos y porcentajes.
- Rebotes, asistencias, pases de gol no finalizados, robos, tapas, faltas recibidas y cometidas.
- Guardado local en el celular o navegador.
- Historial de planillas anteriores.
- Promedios por jugador usando las planillas guardadas.
- Exportación y compartido de la planilla como imagen PNG.
- Soporte PWA instalable.

## Cómo usar localmente
1. Abrí `index.html` en un navegador.
2. Para que el modo instalable funcione bien, publicalo con HTTPS.

## Publicarlo en GitHub Pages
Este proyecto ya queda listo para deploy automático en GitHub Pages usando GitHub Actions.

### Opción recomendada
1. Subí todos los archivos al repositorio.
2. Hacé merge del Pull Request a `main`.
3. En GitHub, entrá a **Settings → Pages**.
4. En **Source**, elegí **GitHub Actions**.
5. Esperá que termine el workflow `Deploy static site to GitHub Pages`.
6. Tu URL quedará así:
   - `https://TU-USUARIO.github.io/TU-REPO/`

### Estructura importante
No muevas los archivos dentro de subcarpetas raras. El sitio está preparado para publicarse desde la raíz del repo.

## Nota importante
La información se guarda en `localStorage`, así que queda almacenada en ese dispositivo/navegador.
Si cambiás de teléfono o borrás datos del navegador, el historial no se migra automáticamente.
