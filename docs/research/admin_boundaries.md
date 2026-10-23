# Admin Boundaries — NSO Ward Dataset (T-LOOP-GEO, CR-08 honest slice)

## Dataset version

- `admin_boundary_version`: `nso-2024-v1-centroid-fallback`
- Lookup method: `centroid-fallback` (nearest-centroid assignment only)

## Source

- In-repo curated centroid snapshot: `apps/api/src/greenlogix_api/geo/admin_boundaries.py`
  (`HCMC_WARDS`, 9 central HCMC wards: Tan Binh, Phu Nhuan, Quan 10, Quan 3,
  Quan 1 x2, Binh Thanh, Thu Duc).
- This is NOT an official NSO polygon extract. Ward codes follow the
  `VN_<province>_<district>_<ward>` convention used internally; they are
  reference keys for the centroid snapshot, not a certified registry dump.

## Validity

- HCMC demo only. Centroids + `approx_radius_km` are planning-grade
  approximations for the "Di qua phuong nao" corridor label.
- Valid while the snapshot covers the operating area; stops outside central
  HCMC resolve to the nearest listed centroid and are therefore approximate.

## Centroid-limitation note (binding)

- The API NEVER claims polygon intersection. There is no PostGIS in this
  sqlite-only env, no boundary polygons are stored, and no point-in-polygon
  test is performed.
- Every consumer labels the method honestly:
  - `GET /routes/{id}/admin-areas` returns `method: "centroid-fallback"`.
  - Report `extra` carries `admin_boundary_version` (same version string).
- Upgrading to versioned polygons (NSO shapefile + PostGIS/SpatiaLite) is a
  future work package; until then the `-centroid-fallback` suffix stays.
