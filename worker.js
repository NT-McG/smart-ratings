export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== "GET") {
      return json(
        { error: "Method not allowed. Use GET or OPTIONS." },
        405
      );
    }

    try {
      const url = "https://hemaratings.com/periods/details/?ratingsetid=1";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      let res;
      try {
        res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
          cf: {
            cacheTtl: 300,
            cacheEverything: false,
          },
        });
      } catch (err) {
        clearTimeout(timeout);

        const message =
          err && err.name === "AbortError"
            ? "Upstream request timed out"
            : err instanceof Error
              ? err.message
              : String(err);

        return json(
          {
            error: "Failed to fetch upstream data",
            message,
            upstream: url,
          },
          503
        );
      }

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await safeText(res);
        return json(
          {
            error: `Upstream request failed with HTTP ${res.status}`,
            upstream: url,
            body_preview: text.slice(0, 500),
          },
          502
        );
      }

      const html = await res.text();
      const players = parsePlayers(html);

      if (!players.length) {
        return json(
          {
            error: "Parsed zero players from upstream HTML",
            upstream: url,
          },
          502
        );
      }

      return new Response(JSON.stringify(players), {
        status: 200,
        headers: {
          ...corsHeaders(),
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (err) {
      return json(
        {
          error: "Worker failed",
          message: err instanceof Error ? err.message : String(err),
        },
        500
      );
    }
  },
};

function parsePlayers(html) {
  const players = [];
  const rowRe = /<tr[^>]*>(.*?)<\/tr>/gs;
  const rows = [...html.matchAll(rowRe)];

  for (const match of rows) {
    const row = match[1];

    const confMatch = row.match(/title="[^"]*\(([\d.]+)\)[^"]*"/i);
    const confidence = confMatch ? parseFloat(confMatch[1]) : 0;

    const colsRaw = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(
      (x) => x[1]
    );

    if (colsRaw.length < 6) continue;

    const cols = colsRaw.map(stripHtml);

    const athlete = cols[2];
    const club = cols[4];
    const rating = parseFloat(cols[5]);

    const nationalityMatch =
      colsRaw[3].match(/data-search="([^"]+)"/i) ||
      colsRaw[3].match(/title="([^"]+)"/i);

    const nationality = nationalityMatch ? nationalityMatch[1].trim() : "";

    if (!athlete || Number.isNaN(rating)) continue;

    players.push({
      athlete,
      nationality,
      club,
      rating,
      confidence,
    });
  }

  return players;
}

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}
