import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { callBackend } from '../server/backend';

export const server = {
  seedDatabase: defineAction({
    handler: async () => {
      return await callBackend('/api/seed', { method: 'POST' });
    },
  }),

  optimizeRoutes: defineAction({
    input: z.object({
      cluster_radius_km: z.number().optional().default(3.0),
      optimizer: z.enum(['legacy', 'ecoalns']).optional().default('legacy'),
      enforce_time_windows: z.boolean().optional().default(false),
      enforce_truck_ban: z.boolean().optional().default(false),
    }),
    handler: async (input) => {
      return await callBackend('/api/optimize', {
        method: 'POST',
        body: input,
      });
    },
  }),

  publishRoutes: defineAction({
    input: z
      .object({
        route_ids: z.array(z.number()).optional(),
      })
      .optional(),
    handler: async (input) => {
      return await callBackend('/api/routes/publish', {
        method: 'POST',
        body: input || {},
      });
    },
  }),

  pushOrderEvents: defineAction({
    input: z.object({
      dataset_label: z.string().optional().default('dn-a-erp-sync'),
      orders: z
        .array(
          z.object({
            external_id: z.string(),
            address: z.string(),
            lat: z.number().finite().min(-90).max(90),
            lng: z.number().finite().min(-180).max(180),
            receiver: z.string(),
            phone: z.string(),
            kg: z.number().finite().min(0),
            window_start: z.string().regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/),
            window_end: z.string().regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/),
            cargo_type: z.enum(['thuong', 'lanh', 'de_vo']).default('thuong'),
            notes: z.string().optional().default(''),
          })
        )
        .max(50000),
    }),
    handler: async (input) => {
      return await callBackend('/api/ingest/events', {
        method: 'POST',
        body: input,
      });
    },
  }),

  updateStopStatus: defineAction({
    input: z.object({
      stop_id: z.number(),
      status: z.enum(['arrived', 'delivered', 'failed']),
      fail_reason: z.enum(['khach_vang', 'sai_dia_chi', 'hang_hong', 'tu_choi']).nullable().optional(),
      pin: z.string().optional().default('0000'),
    }),
    handler: async (input) => {
      return await callBackend(`/api/stops/${input.stop_id}/status`, {
        method: 'POST',
        headers: {
          'X-Driver-Pin': input.pin || '0000',
        },
        body: {
          status: input.status,
          reason: input.fail_reason || null,
        },
      });
    },
  }),

  getAnalyticsSummary: defineAction({
    input: z
      .object({
        bucket: z.enum(['day', 'hour']).optional().default('day'),
      })
      .optional(),
    handler: async (input) => {
      const bucket = input?.bucket || 'day';
      const [kpis, timeseries, fleet] = await Promise.all([
        callBackend('/api/analytics/kpis'),
        callBackend(`/api/analytics/timeseries?bucket=${bucket}`),
        callBackend('/api/analytics/fleet'),
      ]);
      return { kpis, timeseries, fleet };
    },
  }),
};
