import type { APIRoute } from 'astro';
import { honoApp } from '../../server/honoEngine';

export const ALL: APIRoute = async (ctx) => {
  return honoApp.fetch(ctx.request);
};
