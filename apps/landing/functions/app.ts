export const onRequest = async (context: { request: Request }) => {
  const url = new URL(context.request.url);
  const target = `https://greenlogix-api.9ez.workers.dev/app${url.search}`;
  return fetch(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body
  });
};
