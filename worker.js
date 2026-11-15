
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/cms" && request.method === "GET") {
      const result = await env.DB
        .prepare("SELECT data FROM cms_data WHERE id = ?")
        .bind("main")
        .first();

      return Response.json(result ? JSON.parse(result.data) : null);
    }

    if (url.pathname === "/api/cms" && request.method === "PUT") {
      const token = request.headers.get("Authorization");

      if (!env.ADMIN_TOKEN || token !== `Bearer ${env.ADMIN_TOKEN}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      let data;

      try {
        data = await request.json();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }

      await env.DB
        .prepare(`
          INSERT INTO cms_data (id, data, updated_at)
          VALUES ('main', ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(JSON.stringify(data))
        .run();

      return Response.json({ success: true });
    }

    return env.ASSETS.fetch(request);
  }
};

