/**
 * Web Mercator (EPSG:3857) Real HCMC Street Map Tile Renderer for HTML5 Canvas.
 * Renders crisp CartoDB Voyager / OpenStreetMap raster tiles of Ho Chi Minh City
 * with in-memory tile caching and exact (lat, lng) -> (pixelX, pixelY) projection.
 */

const TILE_CACHE = new Map<string, HTMLImageElement | 'loading' | 'error'>();

export function lngToWorldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * 256 * Math.pow(2, zoom);
}

export function latToWorldY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  return ((1 - n / Math.PI) / 2) * 256 * Math.pow(2, zoom);
}

export interface MercatorViewport {
  centerLat: number;
  centerLng: number;
  zoom: number; // e.g., 12.6 to 15.5
  panX: number; // pixel offset
  panY: number; // pixel offset
  width: number;
  height: number;
}

/**
 * Projects a geographic (lng, lat) coordinate to canvas (x, y) CSS pixels
 * matching the exact Web Mercator tile grid.
 */
export function projectLatLngToCanvas(
  lng: number,
  lat: number,
  vp: MercatorViewport
): [number, number] {
  const tileZ = Math.max(11, Math.min(17, Math.round(vp.zoom)));
  const scale = Math.pow(2, vp.zoom - tileZ);
  const cxWorld = lngToWorldX(vp.centerLng, tileZ);
  const cyWorld = latToWorldY(vp.centerLat, tileZ);
  const xWorld = lngToWorldX(lng, tileZ);
  const yWorld = latToWorldY(lat, tileZ);

  const sx = vp.width / 2 + (xWorld - cxWorld) * scale + vp.panX;
  const sy = vp.height / 2 + (yWorld - cyWorld) * scale + vp.panY;
  return [sx, sy];
}

/**
 * Draws real Ho Chi Minh City Web Mercator street map tiles (Carto Voyager / OSM)
 * onto the given 2D canvas context, triggering `onTileLoad` when new tiles arrive.
 */
export function drawHcmcMapTiles(
  ctx: CanvasRenderingContext2D,
  vp: MercatorViewport,
  onTileLoad?: () => void
): void {
  const { width, height } = vp;
  // Base warm cartographic background while tiles stream in
  ctx.fillStyle = '#ebe5d9';
  ctx.fillRect(0, 0, width, height);

  if (typeof window === 'undefined' || typeof Image === 'undefined') return;

  const tileZ = Math.max(11, Math.min(17, Math.round(vp.zoom)));
  const scale = Math.pow(2, vp.zoom - tileZ);
  const tileSize = 256 * scale;

  const cxWorld = lngToWorldX(vp.centerLng, tileZ);
  const cyWorld = latToWorldY(vp.centerLat, tileZ);

  // World pixel bounds visible in the canvas
  const leftWorld = cxWorld - (width / 2 + vp.panX) / scale;
  const rightWorld = cxWorld + (width / 2 - vp.panX) / scale;
  const topWorld = cyWorld - (height / 2 + vp.panY) / scale;
  const bottomWorld = cyWorld + (height / 2 - vp.panY) / scale;

  const maxTileIdx = Math.pow(2, tileZ) - 1;
  const minTx = Math.max(0, Math.floor(leftWorld / 256));
  const maxTx = Math.min(maxTileIdx, Math.floor(rightWorld / 256));
  const minTy = Math.max(0, Math.floor(topWorld / 256));
  const maxTy = Math.min(maxTileIdx, Math.floor(bottomWorld / 256));

  for (let tx = minTx; tx <= maxTx; tx++) {
    for (let ty = minTy; ty <= maxTy; ty++) {
      const key = `${tileZ}/${tx}/${ty}`;
      const cached = TILE_CACHE.get(key);

      const drawX = width / 2 + (tx * 256 - cxWorld) * scale + vp.panX;
      const drawY = height / 2 + (ty * 256 - cyWorld) * scale + vp.panY;

      if (cached && cached !== 'loading' && cached !== 'error') {
        ctx.drawImage(cached, drawX, drawY, tileSize + 0.5, tileSize + 0.5);
      } else {
        // Subtle tile grid placeholder while tile loads
        ctx.strokeStyle = 'rgba(180, 172, 156, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, drawY, tileSize, tileSize);

        if (!cached) {
          TILE_CACHE.set(key, 'loading');
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            TILE_CACHE.set(key, img);
            onTileLoad?.();
          };
          img.onerror = () => {
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = 'anonymous';
            fallbackImg.onload = () => {
              TILE_CACHE.set(key, fallbackImg);
              onTileLoad?.();
            };
            fallbackImg.onerror = () => {
              TILE_CACHE.set(key, 'error');
            };
            fallbackImg.src = `https://a.tile.openstreetmap.fr/hot/${tileZ}/${tx}/${ty}.png`;
          };
          img.src = `https://tile.openstreetmap.org/${tileZ}/${tx}/${ty}.png`;
        }
      }
    }
  }

  // Subtle OpenStreetMap attribution in bottom-right corner
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.fillRect(width - 148, height - 16, 148, 16);
  ctx.fillStyle = '#4b5563';
  ctx.font = '500 9.5px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('© OpenStreetMap contributors', width - 5, height - 4.5);
  ctx.restore();
}
