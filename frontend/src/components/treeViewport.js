export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 1.8;
export const ZOOM_STEP = 0.12;

export function clampZoom(zoom) {
  return Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) * 100) / 100;
}

export function fitZoom(viewportWidth, viewportHeight, treeWidth, treeHeight) {
  const gutter = 16;
  if (viewportWidth <= gutter || viewportHeight <= gutter || treeWidth <= 0 || treeHeight <= 0) return 1;
  return clampZoom(Math.min((viewportWidth - gutter) / treeWidth, (viewportHeight - gutter) / treeHeight));
}

export function zoomedScroll(contentCoordinate, contentOrigin, zoom, anchorInViewport) {
  return contentOrigin + contentCoordinate * zoom - anchorInViewport;
}
