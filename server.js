const express = require('express');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const TINUS_BASE = 'https://www.tinus.com.br/csp/PARNAMIRIM/portal/';
const TINUS_INDEX_URL =
  TINUS_BASE +
  'index.csp?656ANjD3104RcEWq40607hhaq4345LR=ZrNJ99KhU975Usp13457mmTgT255Pwhmt4713x6616658CWny586';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Gerenciador de Sessão Tinus por Visitante
// ---------------------------------------------------------------------------
const sessions = new Map(); // sid -> { cookies: Map<string, string>, lastAccess: number, initialized: boolean }

// Limpa sessões inativas há mais de 2 horas
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [sid, sess] of sessions.entries()) {
    if (sess.lastAccess < cutoff) sessions.delete(sid);
  }
}, 15 * 60 * 1000);

function parseCookiesFromRequest(req) {
  const header = req.headers.cookie || '';
  const map = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      map[k] = decodeURIComponent(v);
    }
  }
  return map;
}

function getOrCreateSession(req, res) {
  const reqCookies = parseCookiesFromRequest(req);
  let sid = reqCookies['novo_portal_sid'];
  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomUUID();
    sessions.set(sid, {
      cookies: new Map(),
      lastAccess: Date.now(),
      initialized: false,
    });
    res.setHeader(
      'Set-Cookie',
      `novo_portal_sid=${sid}; Path=/; HttpOnly; SameSite=Lax`
    );
  }
  const sess = sessions.get(sid);
  sess.lastAccess = Date.now();
  return sess;
}

function storeSetCookies(sess, headers) {
  const setCookies =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : headers.get('set-cookie')
      ? [headers.get('set-cookie')]
      : [];

  for (const raw of setCookies) {
    if (!raw) continue;
    const firstPart = raw.split(';')[0];
    const eq = firstPart.indexOf('=');
    if (eq > -1) {
      const name = firstPart.slice(0, eq).trim();
      const val = firstPart.slice(eq + 1).trim();
      sess.cookies.set(name, val);
    }
  }
}

function buildCookieHeader(sess) {
  const parts = [];
  for (const [k, v] of sess.cookies.entries()) {
    parts.push(`${k}=${v}`);
  }
  return parts.join('; ');
}

function decodeBuffer(buf, contentType = '') {
  const ctLower = contentType.toLowerCase();
  if (ctLower.includes('iso-8859-1') || ctLower.includes('latin1')) {
    return iconv.decode(buf, 'win1252');
  }
  const utf8 = buf.toString('utf8');
  if (utf8.includes('\ufffd')) {
    return iconv.decode(buf, 'win1252');
  }
  // Também checa meta charset no HTML
  if (/charset\s*=\s*iso-8859-1/i.test(utf8.slice(0, 1000)) && /[^\x00-\x7F]/.test(utf8) === false) {
    return iconv.decode(buf, 'win1252');
  }
  return utf8;
}

async function tinusFetch(sess, targetUrl, options = {}) {
  if (!sess.initialized && targetUrl !== TINUS_INDEX_URL) {
    await ensureTinusSession(sess);
  }

  const fullUrl = targetUrl.startsWith('http')
    ? targetUrl
    : TINUS_BASE + targetUrl.replace(/^\/+/, '');

  const headers = {
    'User-Agent': USER_AGENT,
    ...(options.headers || {}),
  };

  const cookieStr = buildCookieHeader(sess);
  if (cookieStr) {
    headers['Cookie'] = cookieStr;
  }

  const resp = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    redirect: 'follow',
  });

  storeSetCookies(sess, resp.headers);
  return resp;
}

async function ensureTinusSession(sess) {
  const resp = await fetch(TINUS_INDEX_URL, {
    headers: { 'User-Agent': USER_AGENT },
  });
  storeSetCookies(sess, resp.headers);
  await resp.arrayBuffer();
  sess.initialized = true;
}

// Garante que apenas URLs do domínio tinus.com.br sejam acessadas via proxy
function assertSafeTinusUrl(rawUrl) {
  if (!rawUrl) throw new Error('URL ausente');
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    const u = new URL(rawUrl);
    if (u.hostname !== 'www.tinus.com.br' && u.hostname !== 'tinus.com.br') {
      throw new Error('Domínio não permitido no proxy');
    }
    return u.toString();
  }
  // Caminho relativo ao portal
  return TINUS_BASE + rawUrl.replace(/^\/+/, '');
}

// ---------------------------------------------------------------------------
// API: Saúde & Informações
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, portal: 'Parnamirim', origin: TINUS_BASE });
});

// ---------------------------------------------------------------------------
// API: Calendário IPTU 2026 (webcalen.csp?TRIB=I)
// ---------------------------------------------------------------------------
app.get('/api/calendario', async (req, res) => {
  try {
    const sess = getOrCreateSession(req, res);
    const resp = await tinusFetch(sess, 'webcalen.csp?TRIB=I');
    const buf = Buffer.from(await resp.arrayBuffer());
    const html = decodeBuffer(buf, resp.headers.get('content-type') || '');
    const $ = cheerio.load(html);

    const rows = [];
    $('table tr').each((_, tr) => {
      const cells = $(tr)
        .find('td, th')
        .map((__, el) => $(el).text().replace(/\u00a0/g, ' ').trim())
        .get();
      if (cells.length >= 2 && cells[0] && cells[1] && !/^parcela$/i.test(cells[0])) {
        rows.push({ parcela: cells[0], vencimento: cells[1] });
      }
    });

    res.json({
      titulo: 'Calendário de Vencimentos do IPTU 2026',
      itens: rows,
    });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao consultar calendário no servidor Tinus', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// API: Legislação Tributária (webleilis.csp)
// ---------------------------------------------------------------------------
app.get('/api/legislacao/:tipo', async (req, res) => {
  try {
    const sess = getOrCreateSession(req, res);
    const tipo = String(req.params.tipo).replace(/[^0-9]/g, '') || '1';
    const resp = await tinusFetch(
      sess,
      `webleilis.csp?TPEI=E&EXIORD=A&EXITIPO=${tipo}`
    );
    const buf = Buffer.from(await resp.arrayBuffer());
    const html = decodeBuffer(buf, resp.headers.get('content-type') || '');
    const $ = cheerio.load(html);

    const itens = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const titulo = $(el).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      if (href && titulo && !href.startsWith('javascript')) {
        // Pega texto da linha/célula vizinha se houver descrição
        const rowText = $(el)
          .closest('tr')
          .text()
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const descricao = rowText.replace(titulo, '').replace(/^[\s\-–:]+/, '').trim();
        itens.push({
          titulo,
          descricao,
          url: href,
          proxyUrl: `/api/doc?url=${encodeURIComponent(href)}`,
        });
      }
    });

    res.json({ tipo, total: itens.length, itens });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao consultar legislação no servidor Tinus', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// API: Documentos e Formulários (webreqlis.csp)
// ---------------------------------------------------------------------------
app.get('/api/formularios', async (req, res) => {
  try {
    const sess = getOrCreateSession(req, res);
    const resp = await tinusFetch(sess, 'webreqlis.csp?EXITIPO=');
    const buf = Buffer.from(await resp.arrayBuffer());
    const html = decodeBuffer(buf, resp.headers.get('content-type') || '');
    const $ = cheerio.load(html);

    const categorias = [];
    let currentCat = { categoria: 'Documentos Gerais', itens: [] };

    $('table tr').each((_, tr) => {
      const text = $(tr).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      if (!text) return;

      if (text.includes('***')) {
        if (currentCat.itens.length > 0) categorias.push(currentCat);
        currentCat = {
          categoria: text.replace(/\*+/g, '').trim(),
          itens: [],
        };
        return;
      }

      const link = $(tr).find('a').first();
      if (link.length) {
        const href = link.attr('href') || '';
        const titulo = link.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        if (href && titulo) {
          currentCat.itens.push({
            titulo,
            url: href,
            proxyUrl: `/api/doc?url=${encodeURIComponent(href)}`,
          });
        }
      }
    });

    if (currentCat.itens.length > 0) categorias.push(currentCat);

    res.json({ categorias });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao consultar formulários no servidor Tinus', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// API: Instruções de Integração NFS-e (webnfinsint.csp) + Manuais do Menu
// ---------------------------------------------------------------------------
app.get('/api/nfse-docs', async (req, res) => {
  try {
    const sess = getOrCreateSession(req, res);

    // 1. Busca instruções em webnfinsint.csp
    const respInfo = await tinusFetch(sess, 'webnfinsint.csp');
    const bufInfo = Buffer.from(await respInfo.arrayBuffer());
    const htmlInfo = decodeBuffer(bufInfo, respInfo.headers.get('content-type') || '');
    const $info = cheerio.load(htmlInfo);
    $info('script, style').remove();
    const instrucoesTexto = $info('body')
      .text()
      .replace(/\u00a0/g, ' ')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // 2. Busca index.csp -> webmenu.csp para obter links frescos de abredoc.csp
    const respIdx = await tinusFetch(sess, TINUS_INDEX_URL);
    const htmlIdx = decodeBuffer(Buffer.from(await respIdx.arrayBuffer()));
    const menuMatch = htmlIdx.match(/(webmenu\.csp\?[^'"\s<>]+)/i);
    const manuais = [];

    if (menuMatch) {
      const respMenu = await tinusFetch(sess, menuMatch[1]);
      const htmlMenu = decodeBuffer(
        Buffer.from(await respMenu.arrayBuffer()),
        respMenu.headers.get('content-type') || ''
      );
      const regex = /window\.open\('([^']+)'[^)]*\).*?>(.*?)<\/a>/gis;
      let m;
      while ((m = regex.exec(htmlMenu)) !== null) {
        const url = m[1];
        const titulo = m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        if (url.startsWith('abredoc.csp') || url.includes('gov.br')) {
          manuais.push({
            titulo,
            url,
            isExternal: url.startsWith('http'),
            proxyUrl: url.startsWith('http') ? url : `/api/doc?url=${encodeURIComponent(url)}`,
          });
        }
      }
    }

    res.json({ instrucoes: instrucoesTexto, manuais });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao consultar documentação NFS-e', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// API: Proxy de Download / Visualização de Documentos e PDFs (abredoc.csp etc.)
// ---------------------------------------------------------------------------
app.get('/api/doc', async (req, res) => {
  try {
    const sess = getOrCreateSession(req, res);
    const target = assertSafeTinusUrl(req.query.url);
    const resp = await tinusFetch(sess, target);

    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    const contentDisp = resp.headers.get('content-disposition');
    res.setHeader('Content-Type', contentType);
    if (contentDisp) {
      res.setHeader('Content-Disposition', contentDisp);
    }

    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch (err) {
    res.status(502).send(`Erro ao carregar documento da Tinus: ${err.message}`);
  }
});

// ---------------------------------------------------------------------------
// API: Metadados e Tokens de Páginas Interativas .csp (sem login/captcha)
// ---------------------------------------------------------------------------
app.get('/api/csp/meta', async (req, res) => {
  try {
    const sess = getOrCreateSession(req, res);
    const page = String(req.query.page || '');
    const target = assertSafeTinusUrl(page);

    const resp = await tinusFetch(sess, target);
    const buf = Buffer.from(await resp.arrayBuffer());
    const html = decodeBuffer(buf, resp.headers.get('content-type') || '');
    const $ = cheerio.load(html);

    const titulo =
      $('.titpag').first().text().trim() ||
      $('title').first().text().trim() ||
      page;

    // Extrai funções JS (com suporte a blocos aninhados) e seus tokens cspHttpServerMethod('TOKEN', ...)
    const methods = {};
    const funcStartRegex = /function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g;
    let fm;
    while ((fm = funcStartRegex.exec(html)) !== null) {
      const fnName = fm[1];
      let depth = 1;
      let pos = fm.index + fm[0].length;
      while (pos < html.length && depth > 0) {
        if (html[pos] === '{') depth++;
        else if (html[pos] === '}') depth--;
        pos++;
      }
      const fnBody = html.slice(fm.index + fm[0].length, pos - 1);
      const tokMatches = [...fnBody.matchAll(/cspHttpServerMethod\(\s*['"]([^'"]+)['"]/g)].map(
        (x) => x[1]
      );
      if (tokMatches.length > 0) {
        methods[fnName] = tokMatches;
      }
    }

    // Extrai todos os tokens soltos caso algum esteja fora de function
    const allTokens = [...html.matchAll(/cspHttpServerMethod\(\s*['"]([^'"]+)['"]/g)].map(
      (x) => x[1]
    );

    // Extrai campos do formulário (inputs e selects)
    const fields = [];
    $('form input, form select, form textarea').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const name = $(el).attr('name') || $(el).attr('id') || '';
      const type = $(el).attr('type') || tag;
      if (!name || type === 'button' || type === 'submit' || type === 'reset') return;

      const options =
        tag === 'select'
          ? $(el)
              .find('option')
              .map((__, opt) => ({
                value: $(opt).attr('value') ?? $(opt).text().trim(),
                label: $(opt).text().trim(),
                selected: $(opt).attr('selected') !== undefined,
              }))
              .get()
          : undefined;

      fields.push({
        name,
        tag,
        type,
        value: $(el).attr('value') || '',
        maxlength: $(el).attr('maxlength') || '',
        options,
      });
    });

    res.json({
      page,
      titulo,
      methods,
      allTokens,
      fields,
    });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao carregar metadados da página Tinus', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// API: Execução de Método CSP Broker (cspHttpServerMethod via Proxy)
// ---------------------------------------------------------------------------
function parseBrokerScript(raw) {
  // O formato Caché Broker retorna:
  // <session_id>\r\n#R\r\n<js_code>\r\n#OK
  let script = raw;
  const rIdx = raw.indexOf('#R');
  const okIdx = raw.lastIndexOf('#OK');
  if (rIdx !== -1) {
    script = raw.slice(rIdx + 2, okIdx !== -1 ? okIdx : undefined).trim();
  }

  const alerts = [];
  const alertRegex = /alert\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*\)/g;
  let am;
  while ((am = alertRegex.exec(script)) !== null) {
    alerts.push(am[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'"));
  }

  const openUrls = [];
  const openRegex = /window\.open\(\s*(['"])([^'"]+)\1/g;
  let om;
  while ((om = openRegex.exec(script)) !== null) {
    const rawUrl = om[2];
    openUrls.push({
      originalUrl: rawUrl,
      proxyUrl: rawUrl.startsWith('http')
        ? `/api/doc?url=${encodeURIComponent(rawUrl)}`
        : `/api/doc?url=${encodeURIComponent(TINUS_BASE + rawUrl.replace(/^\/+/, ''))}`,
    });
  }

  // Extrai opções adicionadas a <select> (ex: new Option("text","val"))
  const selectOptions = [];
  const optRegex = /document\.form1\.([a-zA-Z0-9_]+)\.options\[[^\]]+\]\s*=\s*new\s+Option\(\s*(['"])([^'"]*)\2\s*,\s*(['"])([^'"]*)\4/g;
  let opm;
  while ((opm = optRegex.exec(script)) !== null) {
    selectOptions.push({
      field: opm[1],
      label: opm[3],
      value: opm[5],
    });
  }

  // Extrai atribuições de valor em inputs (ex: document.form1.txtDeno.value="...")
  const fieldValues = {};
  const valRegex = /document\.form1\.([a-zA-Z0-9_]+)\.value\s*=\s*(['"])((?:\\.|(?!\2).)*)\2/g;
  let vm;
  while ((vm = valRegex.exec(script)) !== null) {
    fieldValues[vm[1]] = vm[3];
  }

  // Extrai innerHTML (algumas telas como Verificação de NFS-e preenchem uma div)
  const htmlUpdates = [];
  const htmlRegex = /(?:document\.getElementById\(\s*(['"])([^'"]+)\1\s*\)|([a-zA-Z0-9_]+))\.innerHTML\s*=\s*(['"])((?:\\.|(?!\4).)*)\4/g;
  let hm;
  while ((hm = htmlRegex.exec(script)) !== null) {
    htmlUpdates.push({
      target: hm[2] || hm[3],
      html: hm[5].replace(/\\"/g, '"').replace(/\\'/g, "'"),
    });
  }

  return {
    alerts,
    openUrls,
    selectOptions,
    fieldValues,
    htmlUpdates,
    rawScript: script,
  };
}

app.post('/api/csp/broker', async (req, res) => {
  try {
    const sess = getOrCreateSession(req, res);
    const { page, token, args = [] } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'Token CSP ausente' });
    }

    const params = new URLSearchParams();
    params.set('WARGC', String(args.length));
    params.set('WEVENT', token);
    args.forEach((arg, idx) => {
      params.set(`WARG_${idx + 1}`, arg == null ? '' : String(arg));
    });

    const referer = page ? assertSafeTinusUrl(page) : TINUS_INDEX_URL;
    const resp = await tinusFetch(sess, '%25CSP.Broker.cls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: referer,
      },
      body: params.toString(),
    });

    const buf = Buffer.from(await resp.arrayBuffer());
    const raw = decodeBuffer(buf, resp.headers.get('content-type') || '');
    const parsed = parseBrokerScript(raw);

    res.json({ ok: true, ...parsed });
  } catch (err) {
    res.status(502).json({ error: 'Falha ao executar chamada no servidor Tinus', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// Fallback SPA
// ---------------------------------------------------------------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Novo Portal do Contribuinte de Parnamirim rodando em http://localhost:${PORT}`);
});
