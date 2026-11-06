/**
 * Web Mercator (EPSG:3857) Real HCMC Street Map Tile Renderer for HTML5 Canvas.
 * Serves 100% same-origin pre-bundled OpenStreetMap tiles (`/tiles/{z}/{x}/{y}.png`)
 * for Ho Chi Minh City (z=11..14) with built-in vector river/district fallback,
 * eliminating all third-party CORS / rate-limit / firewall failures.
 */

const TILE_CACHE = new Map<string, HTMLImageElement | 'loading' | 'error'>();

const BUNDLED_HCMC_BOUNDS: Record<number, { minX: number; maxX: number; minY: number; maxY: number }> = {
  11: { minX: 1629, maxX: 1632, minY: 961, maxY: 963 },
  12: { minX: 3259, maxX: 3264, minY: 1922, maxY: 1926 },
  13: { minX: 6520, maxX: 6527, minY: 3846, maxY: 3851 },
  14: { minX: 13042, maxX: 13053, minY: 7694, maxY: 7701 },
};

function isBundledHcmcTile(z: number, x: number, y: number): boolean {
  const b = BUNDLED_HCMC_BOUNDS[z];
  if (!b) return false;
  return x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
}

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
  const tileZ = Math.max(11, Math.min(14, Math.round(vp.zoom)));
  const scale = Math.pow(2, vp.zoom - tileZ);
  const cxWorld = lngToWorldX(vp.centerLng, tileZ);
  const cyWorld = latToWorldY(vp.centerLat, tileZ);
  const xWorld = lngToWorldX(lng, tileZ);
  const yWorld = latToWorldY(lat, tileZ);

  const sx = vp.width / 2 + (xWorld - cxWorld) * scale + vp.panX;
  const sy = vp.height / 2 + (yWorld - cyWorld) * scale + vp.panY;
  return [sx, sy];
}

const SAIGON_RIVER_PATH: Array<[number, number]> = [
  [106.7105, 10.855],
  [106.718, 10.836],
  [106.734, 10.818],
  [106.742, 10.804],
  [106.715, 10.798],
  [106.7065, 10.782],
  [106.7085, 10.768],
  [106.728, 10.755],
  [106.742, 10.742],
];

const TAU_HU_CANAL_PATH: Array<[number, number]> = [
  [106.625, 10.738],
  [106.655, 10.748],
  [106.682, 10.755],
  [106.7068, 10.7675],
];

const NHIEU_LOC_CANAL_PATH: Array<[number, number]> = [
  [106.658, 10.793],
  [106.675, 10.788],
  [106.692, 10.792],
  [106.708, 10.7885],
];

const HCMC_DISTRICT_LABELS: Array<{ name: string; lng: number; lat: number }> = [
  { name: 'QUẬN 1', lng: 106.699, lat: 10.7765 },
  { name: 'QUẬN 3', lng: 106.684, lat: 10.781 },
  { name: 'QUẬN 5', lng: 106.667, lat: 10.755 },
  { name: 'QUẬN 7', lng: 106.721, lat: 10.735 },
  { name: 'QUẬN 10', lng: 106.6675, lat: 10.773 },
  { name: 'TÂN BÌNH', lng: 106.652, lat: 10.8015 },
  { name: 'PHÚ NHUẬN', lng: 106.68, lat: 10.7995 },
  { name: 'BÌNH THẠNH', lng: 106.709, lat: 10.8105 },
  { name: 'GÒ VẤP', lng: 106.665, lat: 10.835 },
  { name: 'TP. THỦ ĐỨC', lng: 106.748, lat: 10.805 },
];

/**
 * Draws real Ho Chi Minh City Web Mercator street map tiles from same-origin `/tiles/{z}/{x}/{y}.png`
 * onto the given 2D canvas context, triggering `onTileLoad` when new tiles arrive.
 */
export function drawHcmcMapTiles(
  ctx: CanvasRenderingContext2D,
  vp: MercatorViewport,
  onTileLoad?: () => void
): void {
  const { width, height } = vp;
  ctx.fillStyle = '#f2efe9';
  ctx.fillRect(0, 0, width, height);

  const drawWaterway = (pts: Array<[number, number]>, lineW: number) => {
    ctx.beginPath();
    pts.forEach(([lng, lat], i) => {
      const [x, y] = projectLatLngToCanvas(lng, lat, vp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#aad3df';
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  drawWaterway(SAIGON_RIVER_PATH, 14);
  drawWaterway(TAU_HU_CANAL_PATH, 6);
  drawWaterway(NHIEU_LOC_CANAL_PATH, 4.5);

  ctx.save();
  ctx.font = '700 9.5px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(100, 116, 139, 0.55)';
  ctx.textAlign = 'center';
  for (const d of HCMC_DISTRICT_LABELS) {
    const [dx, dy] = projectLatLngToCanvas(d.lng, d.lat, vp);
    if (dx >= 20 && dx <= width - 20 && dy >= 15 && dy <= height - 15) {
      ctx.fillText(d.name, dx, dy);
    }
  }
  ctx.restore();

  if (typeof window === 'undefined' || typeof Image === 'undefined') return;

  const tileZ = Math.max(11, Math.min(14, Math.round(vp.zoom)));
  const scale = Math.pow(2, vp.zoom - tileZ);
  const tileSize = 256 * scale;

  const cxWorld = lngToWorldX(vp.centerLng, tileZ);
  const cyWorld = latToWorldY(vp.centerLat, tileZ);

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
        ctx.strokeStyle = 'rgba(180, 172, 156, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, drawY, tileSize, tileSize);

        if (!cached && isBundledHcmcTile(tileZ, tx, ty)) {
          TILE_CACHE.set(key, 'loading');
          const img = new Image();
          img.onload = () => {
            TILE_CACHE.set(key, img);
            onTileLoad?.();
          };
          img.onerror = () => {
            TILE_CACHE.set(key, 'error');
          };
          // 100% same-origin static tile asset: zero CORS, zero third-party rate limits!
          img.src = `/tiles/${tileZ}/${tx}/${ty}.png`;
        }
      }
    }
  }

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.fillRect(width - 148, height - 16, 148, 16);
  ctx.fillStyle = '#4b5563';
  ctx.font = '500 9.5px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('© OpenStreetMap contributors', width - 5, height - 4.5);
  ctx.restore();
}
