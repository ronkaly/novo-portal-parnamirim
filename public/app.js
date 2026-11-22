const appEl = document.getElementById('app');
const toastContainer = document.getElementById('toastContainer');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');

const HERO_IMG = '/images/hero-parnamirim-3d.jpg?v=3';
const CARD_IPTU_IMG = '/images/card-iptu-3d.jpg';
const CARD_NFSE_IMG = '/images/card-nfse-3d.jpg';
const CARD_LEGIS_IMG = '/images/card-legislacao-3d.jpg';

mobileMenuBtn?.addEventListener('click', () => {
  mobileNav?.classList.toggle('hidden');
  mobileNav?.classList.toggle('flex');
});

document.getElementById('btnAreaRestrita')?.addEventListener('click', () => {
  mobileNav?.classList.add('hidden');
  location.hash = '#/direto/area-restrita';
});

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  const bg =
    type === 'error'
      ? 'bg-light-error text-light-on-error'
      : type === 'success'
      ? 'bg-success text-on-success'
      : 'bg-light-primary text-light-on-primary';
  const icon = type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info';
  el.className = `${bg} px-4 py-3 rounded-md shadow-lg flex items-center gap-2.5 text-[14px] max-w-sm`;
  el.innerHTML = `<span class="material-symbols-outlined text-[20px]">${icon}</span><span>${escapeHtml(msg)}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function setActiveNav(routeName) {
  document.querySelectorAll('.nav-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === routeName);
  });
}

function loadingHtml(msg = 'Consultando servidor oficial da Tinus...') {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-light-on-surface-variant gap-3">
      <div class="spinner"></div>
      <p class="text-[14px]">${escapeHtml(msg)}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
let currentCategory = 'todos';
let currentSearch = '';

function renderServiceCardsHtml(list) {
  if (list.length === 0) {
    return `
      <div class="col-span-full bg-light-surface-container-lowest border border-light-outline-variant rounded-xl p-12 text-center">
        <span class="material-symbols-outlined text-[40px] text-light-outline">search_off</span>
        <h3 class="font-headline font-semibold text-[18px] mt-3">Nenhum serviço encontrado</h3>
        <p class="text-[14px] text-light-on-surface-variant mt-1">Tente buscar por IPTU, ISS, Certidão, Alvará ou Legislação.</p>
      </div>
    `;
  }

  return list
    .map(
      (s) => `
    <article
      data-service-id="${s.id}"
      class="service-card group cursor-pointer h-full bg-light-surface-container-lowest rounded-xl p-6 border border-light-outline-variant shadow-sm hover:shadow-md hover:border-light-primary transition-all flex flex-col justify-between gap-4"
    >
      <div>
        <div class="flex items-start justify-between gap-3">
          <div class="w-12 h-12 rounded-lg ${s.tint || 'bg-light-secondary-container text-light-primary'} flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[24px]" aria-hidden="true">${s.icon}</span>
          </div>
          ${
            s.mode === 'native'
              ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container font-label text-[11px] font-semibold whitespace-nowrap">
                   <span class="material-symbols-outlined text-[13px]">bolt</span> Portal Novo
                 </span>`
              : s.mode === 'external'
              ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-civic-teal-container text-on-civic-teal-container font-label text-[11px] font-semibold whitespace-nowrap">
                   <span class="material-symbols-outlined text-[13px]">open_in_new</span> Site Externo
                 </span>`
              : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-civic-gold-container text-on-civic-gold-container font-label text-[11px] font-semibold whitespace-nowrap">
                   <span class="material-symbols-outlined text-[13px]">lock</span> Portal Antigo
                 </span>`
          }
        </div>
        <h3 class="font-headline font-semibold text-[18px] text-light-on-surface group-hover:text-light-primary mt-4">${escapeHtml(s.title)}</h3>
        <p class="font-body text-[14px] text-light-on-surface-variant mt-1.5">${escapeHtml(s.desc)}</p>
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-light-surface-container text-[12px] text-light-on-surface-variant">
        <span>${s.mode === 'native' ? 'Sem login/captcha' : s.mode === 'external' ? 'Abre em nova aba' : 'Exige login ou captcha'}</span>
        <span class="inline-flex items-center gap-1 font-label font-semibold text-light-primary">
          Acessar <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </span>
      </div>
    </article>
  `
    )
    .join('');
}

function renderHome() {
  setActiveNav('home');

  const filtered = SERVICES.filter((s) => {
    const matchCat = currentCategory === 'todos' || s.category === currentCategory;
    const q = currentSearch.trim().toLowerCase();
    const matchQ =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  appEl.innerHTML = `
    <!-- Visual Hero Banner -->
    <section class="bg-light-primary text-light-on-primary py-6 sm:py-8 lg:py-12">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        <div class="lg:col-span-7 flex flex-col gap-4">
          <div class="flex flex-wrap items-center gap-2.5">
            <span role="status" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-civic-gold-container text-on-civic-gold-container">
              <span class="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
              <span class="font-label text-[11px] font-semibold">IPTU 2026 com cota única aberta</span>
            </span>
            <span class="font-body text-[12px] text-light-on-primary-container">Portal do Contribuinte Digital</span>
          </div>

          <h1 class="font-headline font-bold text-[28px] lg:text-[40px] leading-tight tracking-tight text-light-on-primary">
            Sua cidade mais simples: resolva tributos e guias em minutos
          </h1>
          <p class="font-body text-[16px] text-light-on-primary-container max-w-prose">
            Emita boletos do IPTU, valide certidões negativas, gerencie notas fiscais (NFS-e) e acompanhe processos com clareza, sem filas.
          </p>

          <!-- Elevated Search Bar -->
          <div class="bg-light-surface-container-lowest text-light-on-surface rounded-lg p-2 shadow-lg max-w-xl mt-1">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div class="relative flex-1 flex items-center">
                <span aria-hidden="true" class="material-symbols-outlined text-[22px] text-light-primary absolute left-3 pointer-events-none">search</span>
                <input
                  id="serviceSearch"
                  type="search"
                  placeholder="O que você precisa? Ex.: 2ª via IPTU, Certidão, NFS-e, Alvará..."
                  value="${escapeHtml(currentSearch)}"
                  class="w-full rounded-md pl-10 pr-3 py-2.5 bg-light-surface-container-low border-0 text-light-on-surface placeholder:text-light-outline font-body text-[14px] focus:ring-2 focus:ring-light-primary"
                />
              </div>
              <button id="btnHeroSearch" type="button" class="px-6 py-2.5 rounded-md bg-light-primary text-light-on-primary hover:bg-light-primary-container font-label text-[14px] font-semibold transition-colors shrink-0">
                Buscar
              </button>
            </div>
          </div>

          <!-- Quick Shortcuts -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <span class="font-label text-[11px] font-semibold text-light-on-primary-container">Atalhos:</span>
            <a href="#/direto/dam-iptu-2026" class="px-3 py-1 rounded-full bg-light-primary-container text-light-on-primary hover:bg-civic-teal font-label text-[12px] font-semibold transition-colors">2ª via IPTU 2026</a>
            <a href="#/direto/cnd-imovel" class="px-3 py-1 rounded-full bg-light-primary-container text-light-on-primary hover:bg-civic-teal font-label text-[12px] font-semibold transition-colors">Certidão Negativa</a>
            <a href="#/servico/wsicm80cl.csp" class="px-3 py-1 rounded-full bg-light-primary-container text-light-on-primary hover:bg-civic-teal font-label text-[12px] font-semibold transition-colors">DAM Alvará / ISS</a>
            <a href="#/calendario" class="px-3 py-1 rounded-full bg-light-primary-container text-light-on-primary hover:bg-civic-teal font-label text-[12px] font-semibold transition-colors">Calendário IPTU</a>
          </div>
        </div>

        <!-- Hero Illustration -->
        <div class="lg:col-span-5">
          <div class="rounded-xl overflow-hidden shadow-xl border border-light-primary-container bg-light-primary-container">
            <img src="${HERO_IMG}" alt="Ilustração 3D da cidade de Parnamirim" class="w-full h-52 sm:h-64 lg:h-80 object-cover" />
          </div>
        </div>
      </div>
    </section>

    <!-- Visual Bento Highlights -->
    <section id="destaques" class="py-8 sm:py-12 bg-light-surface-container-low border-b border-light-outline-variant">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h2 class="font-headline font-bold text-[28px] lg:text-[32px] text-light-on-surface">Principais jornadas do portal</h2>
            <p class="font-body text-[14px] text-light-on-surface-variant">Acesse direto o que cidadãos e empresas mais procuram em Parnamirim.</p>
          </div>
          <a href="#/direto/solicitar-senha" class="inline-flex items-center gap-1.5 font-label text-[14px] font-semibold text-civic-teal hover:underline">
            <span>Primeiro acesso? Solicite sua senha</span>
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <!-- Featured Card 1 -->
          <article class="bg-light-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow border border-light-outline-variant overflow-hidden flex flex-col justify-between">
            <div>
              <div class="h-44 bg-light-surface-container overflow-hidden">
                <img src="${CARD_IPTU_IMG}" alt="Ilustração 3D IPTU 2026" class="w-full h-full object-cover" />
              </div>
              <div class="p-6 flex flex-col gap-1.5">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-civic-gold-container text-on-civic-gold-container font-label text-[11px] font-semibold w-fit">Cidadão · Imóveis</span>
                <h3 class="font-headline font-semibold text-[18px] text-light-on-surface pt-1">IPTU 2026 e Parcelamentos</h3>
                <p class="font-body text-[14px] text-light-on-surface-variant">Consulte o calendário de vencimentos, gere a 2ª via do DAM ou emita guias de parcelamentos.</p>
              </div>
            </div>
            <div class="px-6 pb-6 flex flex-col gap-2">
              <a href="#/direto/dam-iptu-2026" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-light-primary text-light-on-primary hover:bg-light-primary-container font-label text-[14px] font-semibold transition-colors">
                <span>Consultar e emitir boleto</span>
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </a>
            </div>
          </article>

          <!-- Featured Card 2 -->
          <article class="bg-light-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow border border-light-outline-variant overflow-hidden flex flex-col justify-between">
            <div>
              <div class="h-44 bg-light-surface-container overflow-hidden">
                <img src="${CARD_NFSE_IMG}" alt="Ilustração 3D Verificação NFS-e" class="w-full h-full object-cover" />
              </div>
              <div class="p-6 flex flex-col gap-1.5">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container font-label text-[11px] font-semibold w-fit">Portal Novo · Sem login</span>
                <h3 class="font-headline font-semibold text-[18px] text-light-on-surface pt-1">Verificação de NFS-e e RPS</h3>
                <p class="font-body text-[14px] text-light-on-surface-variant">Valide notas fiscais eletrônicas, consulte o Cartão de Inscrição Municipal (CIM) e emita DAM de Alvará.</p>
              </div>
            </div>
            <div class="px-6 pb-6">
              <a href="#/servico/wsinevlne.csp" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[14px] font-semibold transition-colors">
                <span>Verificar NFS-e agora</span>
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">verified</span>
              </a>
            </div>
          </article>

          <!-- Featured Card 3 -->
          <article class="bg-light-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow border border-light-outline-variant overflow-hidden flex flex-col justify-between">
            <div>
              <div class="h-44 bg-light-surface-container overflow-hidden">
                <img src="${CARD_LEGIS_IMG}" alt="Ilustração 3D Legislação e Manuais" class="w-full h-full object-cover" />
              </div>
              <div class="p-6 flex flex-col gap-1.5">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-civic-teal-container text-on-civic-teal-container font-label text-[11px] font-semibold w-fit">Acesso Direto via Proxy</span>
                <h3 class="font-headline font-semibold text-[18px] text-light-on-surface pt-1">Leis, Decretos e Padrão Nacional</h3>
                <p class="font-body text-[14px] text-light-on-surface-variant">Acesse todo o acervo de legislação municipal, formulários de isenção e documentação técnica NFS-e.</p>
              </div>
            </div>
            <div class="px-6 pb-6">
              <a href="#/legislacao" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[14px] font-semibold transition-colors">
                <span>Consultar legislação</span>
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Catálogo Completo com Abas -->
    <section id="servicos" class="py-8 sm:py-12">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h2 class="font-headline font-bold text-[24px] lg:text-[28px] text-light-on-surface">Todos os serviços do portal</h2>
            <p class="font-body text-[14px] text-light-on-surface-variant">Serviços sem captcha rodam direto no novo portal; serviços com login/captcha abrem com segurança no quadro oficial.</p>
          </div>
          <span id="servicesCount" class="font-label text-[12px] font-semibold text-light-on-surface-variant">
            ${filtered.length} ${filtered.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
          </span>
        </div>

        <div class="flex flex-wrap gap-2" id="categoryPills">
          ${CATEGORIES.map(
            (c) => `
            <button
              type="button"
              data-cat="${c.id}"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full font-label text-[13px] font-semibold transition-colors ${
                currentCategory === c.id
                  ? 'bg-light-primary text-light-on-primary shadow-sm'
                  : 'bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container-high hover:text-light-on-surface'
              }"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">${c.icon}</span>
              <span>${c.label}</span>
            </button>
          `
          ).join('')}
        </div>

        <div id="servicesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          ${renderServiceCardsHtml(filtered)}
        </div>
      </div>
    </section>

    <!-- Rich Navy Placar da Transparência -->
    <section id="placar" class="bg-light-primary text-light-on-primary py-8 sm:py-12">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h2 class="font-headline font-bold text-[28px] lg:text-[32px] text-light-on-primary">Placar da Tributação Digital</h2>
            <p class="font-body text-[14px] text-light-on-primary-container">Indicadores do atendimento eletrônico em Parnamirim.</p>
          </div>
          <span class="font-body text-[12px] text-light-on-primary-container">Portal SEMUT · Parnamirim/RN</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-light-primary-container rounded-xl p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-civic-teal text-light-on-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px]" aria-hidden="true">storefront</span>
            </div>
            <div>
              <p class="font-headline font-bold text-[28px] text-light-on-primary tabular-nums">17.468+</p>
              <p class="font-body text-[12px] text-light-on-primary-container">Autorizados a emitir NFS-e</p>
            </div>
          </div>

          <div class="bg-light-primary-container rounded-xl p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-civic-gold text-light-on-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px]" aria-hidden="true">group</span>
            </div>
            <div>
              <p class="font-headline font-bold text-[28px] text-light-on-primary tabular-nums">28.772+</p>
              <p class="font-body text-[12px] text-light-on-primary-container">Usuários ativos no sistema</p>
            </div>
          </div>

          <div class="bg-light-primary-container rounded-xl p-6 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-success text-on-success flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px]" aria-hidden="true">receipt</span>
            </div>
            <div>
              <p class="font-headline font-bold text-[28px] text-light-on-primary tabular-nums">7.422.214+</p>
              <p class="font-body text-[12px] text-light-on-primary-container">NFS-e emitidas no portal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Bind search sem perder foco nem recarregar a página inteira
  const searchInput = document.getElementById('serviceSearch');
  const updateGridOnly = () => {
    const q = currentSearch.trim().toLowerCase();
    const list = SERVICES.filter((s) => {
      const matchCat = currentCategory === 'todos' || s.category === currentCategory;
      const matchQ =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    const grid = document.getElementById('servicesGrid');
    const count = document.getElementById('servicesCount');
    if (grid) {
      grid.innerHTML = renderServiceCardsHtml(list);
      bindServiceCards();
    }
    if (count) {
      count.textContent = `${list.length} ${list.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}`;
    }
  };

  searchInput?.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    updateGridOnly();
  });

  document.getElementById('btnHeroSearch')?.addEventListener('click', () => {
    document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('#categoryPills button').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.cat;
      renderHome();
      document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  bindServiceCards();
}

function bindServiceCards() {
  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('click', () => {
      const s = SERVICES.find((x) => x.id === card.dataset.serviceId);
      if (!s) return;
      if (s.mode === 'external') {
        window.open(s.externalUrl, '_blank', 'noopener,noreferrer');
      } else {
        location.hash = s.mode === 'native' ? s.route : `#/direto/${s.id}`;
      }
    });
  });
}

// ---------------------------------------------------------------------------
// View: Calendário IPTU 2026
// ---------------------------------------------------------------------------
async function renderCalendario() {
  setActiveNav('calendario');
  appEl.innerHTML = `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div class="flex items-center gap-2 text-[13px] text-light-on-surface-variant mb-4">
        <a href="#/" class="text-light-primary font-semibold hover:underline">Início</a>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
        <span>Calendário IPTU 2026</span>
      </div>
      <div class="bg-light-surface-container-lowest border border-light-outline-variant rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-light-outline-variant">
          <div>
            <h2 class="font-headline font-bold text-[20px] sm:text-[24px] text-light-primary">Calendário de Vencimentos do IPTU 2026</h2>
            <p class="text-[14px] text-light-on-surface-variant mt-1">Dados obtidos em tempo real do servidor oficial da Tinus (sem necessidade de captcha).</p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-container text-on-success-container font-label text-[12px] font-semibold">
            <span class="material-symbols-outlined text-[15px]">bolt</span> Portal Novo
          </span>
        </div>
        <div id="calendarioBody">${loadingHtml()}</div>
      </div>
    </div>
  `;

  try {
    const res = await fetch('/api/calendario');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar');

    document.getElementById('calendarioBody').innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-[14px]">
          <thead>
            <tr class="bg-light-surface-container-low border-b border-light-outline-variant">
              <th class="py-3 px-4 font-label font-semibold text-light-on-surface">Parcela / Modalidade</th>
              <th class="py-3 px-4 font-label font-semibold text-light-on-surface">Data de Vencimento</th>
            </tr>
          </thead>
          <tbody>
            ${data.itens
              .map(
                (item) => `
              <tr class="border-b border-light-surface-container hover:bg-light-surface-container-low/60">
                <td class="py-3 px-4 font-semibold text-light-on-surface">${escapeHtml(item.parcela)}</td>
                <td class="py-3 px-4 text-light-on-surface-variant">${escapeHtml(item.vencimento)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="mt-6">
        <button class="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-light-primary text-light-on-primary hover:bg-light-primary-container font-label text-[14px] font-semibold transition-colors" onclick="location.hash='#/direto/dam-iptu-2026'">
          <span class="material-symbols-outlined text-[18px]">qr_code_2</span>
          Emitir Boleto / DAM do IPTU 2026
        </button>
      </div>
    `;
  } catch (err) {
    document.getElementById('calendarioBody').innerHTML = `
      <div class="p-4 rounded-md bg-light-error-container text-light-on-error-container text-[14px]"><strong>Erro:</strong> ${escapeHtml(err.message)}</div>
    `;
  }
}

// ---------------------------------------------------------------------------
// View: Legislação Tributária
// ---------------------------------------------------------------------------
const LEGIS_TIPOS = [
  { id: '1', label: 'IPTU' },
  { id: '3', label: 'ISS' },
  { id: '4', label: 'DMS' },
  { id: '5', label: 'NFS-e' },
  { id: '10', label: 'Simples Nacional' },
  { id: '11', label: 'CTM' },
  { id: '12', label: 'TLF' },
  { id: '13', label: 'REFIS' },
  { id: '15', label: 'ITIV' },
  { id: '16', label: 'Benefícios Fiscais' },
  { id: '17', label: 'Parcelamento' },
];

async function renderLegislacao(selectedTipo = '1') {
  setActiveNav('legislacao');
  appEl.innerHTML = `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div class="flex items-center gap-2 text-[13px] text-light-on-surface-variant mb-4">
        <a href="#/" class="text-light-primary font-semibold hover:underline">Início</a>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
        <span>Legislação Tributária</span>
      </div>
      <div class="bg-light-surface-container-lowest border border-light-outline-variant rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-light-outline-variant">
          <div>
            <h2 class="font-headline font-bold text-[20px] sm:text-[24px] text-light-primary">Legislação Tributária Municipal</h2>
            <p class="text-[14px] text-light-on-surface-variant mt-1">Consulte e baixe leis, decretos e portarias diretamente pelo novo portal.</p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-container text-on-success-container font-label text-[12px] font-semibold">
            <span class="material-symbols-outlined text-[15px]">bolt</span> Portal Novo
          </span>
        </div>

        <div class="flex flex-wrap gap-2 mb-5">
          ${LEGIS_TIPOS.map(
            (t) => `
            <button
              type="button"
              data-legis-tipo="${t.id}"
              class="px-3.5 py-1.5 rounded-full font-label text-[13px] font-semibold transition-colors ${
                selectedTipo === t.id
                  ? 'bg-light-primary text-light-on-primary'
                  : 'bg-light-surface-container-low text-light-on-surface-variant hover:bg-light-surface-container-high'
              }"
            >
              ${t.label}
            </button>
          `
          ).join('')}
        </div>

        <div class="max-w-md mb-6">
          <input type="text" id="legisFilter" class="w-full rounded-md border-light-outline-variant bg-light-surface-container-low text-[14px] focus:border-light-primary focus:ring-light-primary" placeholder="Filtrar por número da lei, decreto ou assunto..." />
        </div>

        <div id="legisBody">${loadingHtml()}</div>
      </div>
    </div>
  `;

  document.querySelectorAll('[data-legis-tipo]').forEach((btn) => {
    btn.addEventListener('click', () => renderLegislacao(btn.dataset.legisTipo));
  });

  try {
    const res = await fetch(`/api/legislacao/${selectedTipo}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar');

    const renderList = (q = '') => {
      const term = q.trim().toLowerCase();
      const rows = data.itens.filter(
        (i) =>
          !term ||
          i.titulo.toLowerCase().includes(term) ||
          i.descricao.toLowerCase().includes(term)
      );
      const legisBody = document.getElementById('legisBody');
      if (rows.length === 0) {
        legisBody.innerHTML = `<p class="text-[14px] text-light-on-surface-variant">Nenhum documento encontrado para esta categoria/filtro.</p>`;
        return;
      }
      legisBody.innerHTML = `
        <!-- Mobile Cards (sem scroll horizontal) -->
        <div class="flex flex-col gap-3 md:hidden">
          ${rows
            .map(
              (r) => `
            <div class="border border-light-outline-variant rounded-lg p-4 bg-light-surface-container-low/40 flex flex-col gap-2.5">
              <strong class="font-headline text-[15px] text-light-primary leading-snug">${escapeHtml(r.titulo)}</strong>
              ${r.descricao ? `<p class="text-[13px] text-light-on-surface-variant leading-relaxed">${escapeHtml(r.descricao)}</p>` : ''}
              <a href="${r.proxyUrl}" target="_blank" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[13px] font-semibold transition-colors mt-1">
                <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span> Abrir PDF
              </a>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr class="bg-light-surface-container-low border-b border-light-outline-variant">
                <th class="py-3 px-4 font-label font-semibold">Ato Normativo</th>
                <th class="py-3 px-4 font-label font-semibold">Descrição</th>
                <th class="py-3 px-4 font-label font-semibold w-36">Documento</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) => `
                <tr class="border-b border-light-surface-container hover:bg-light-surface-container-low/60">
                  <td class="py-3 px-4 font-semibold text-light-on-surface">${escapeHtml(r.titulo)}</td>
                  <td class="py-3 px-4 text-light-on-surface-variant">${escapeHtml(r.descricao || '—')}</td>
                  <td class="py-3 px-4">
                    <a href="${r.proxyUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[12px] font-semibold transition-colors">
                      <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span> Abrir PDF
                    </a>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    renderList();
    document.getElementById('legisFilter')?.addEventListener('input', (e) => renderList(e.target.value));
  } catch (err) {
    document.getElementById('legisBody').innerHTML = `
      <div class="p-4 rounded-md bg-light-error-container text-light-on-error-container text-[14px]"><strong>Erro:</strong> ${escapeHtml(err.message)}</div>
    `;
  }
}

// ---------------------------------------------------------------------------
// View: Documentos e Formulários
// ---------------------------------------------------------------------------
async function renderFormularios() {
  setActiveNav('formularios');
  appEl.innerHTML = `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div class="flex items-center gap-2 text-[13px] text-light-on-surface-variant mb-4">
        <a href="#/" class="text-light-primary font-semibold hover:underline">Início</a>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
        <span>Documentos e Formulários</span>
      </div>
      <div class="bg-light-surface-container-lowest border border-light-outline-variant rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-light-outline-variant">
          <div>
            <h2 class="font-headline font-bold text-[20px] sm:text-[24px] text-light-primary">Documentos, Requerimentos e Formulários</h2>
            <p class="text-[14px] text-light-on-surface-variant mt-1">Baixe modelos oficiais para abertura de processos, isenções e declarações.</p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-container text-on-success-container font-label text-[12px] font-semibold">
            <span class="material-symbols-outlined text-[15px]">bolt</span> Portal Novo
          </span>
        </div>
        <div id="formsBody">${loadingHtml()}</div>
      </div>
    </div>
  `;

  try {
    const res = await fetch('/api/formularios');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar');

    document.getElementById('formsBody').innerHTML = data.categorias
      .map(
        (cat) => `
      <div class="mb-8 last:mb-0">
        <h3 class="font-headline font-semibold text-[16px] text-light-primary flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-[20px]">folder_open</span>
          ${escapeHtml(cat.categoria)}
        </h3>
        <div class="flex flex-col gap-2.5 md:hidden">
          ${cat.itens
            .map(
              (item) => `
            <div class="border border-light-outline-variant rounded-lg p-3.5 bg-light-surface-container-low/40 flex flex-col gap-2.5">
              <span class="text-[14px] font-medium text-light-on-surface">${escapeHtml(item.titulo)}</span>
              <a href="${item.proxyUrl}" target="_blank" class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[13px] font-semibold transition-colors">
                <span class="material-symbols-outlined text-[17px]">download</span> Baixar
              </a>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="hidden md:block border border-light-outline-variant rounded-lg overflow-hidden">
          <table class="w-full text-left border-collapse text-[14px]">
            <tbody>
              ${cat.itens
                .map(
                  (item) => `
                <tr class="border-b last:border-b-0 border-light-surface-container hover:bg-light-surface-container-low/60">
                  <td class="py-3 px-4 text-light-on-surface">${escapeHtml(item.titulo)}</td>
                  <td class="py-3 px-4 w-36 text-right">
                    <a href="${item.proxyUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[12px] font-semibold transition-colors">
                      <span class="material-symbols-outlined text-[16px]">download</span> Baixar
                    </a>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    document.getElementById('formsBody').innerHTML = `
      <div class="p-4 rounded-md bg-light-error-container text-light-on-error-container text-[14px]"><strong>Erro:</strong> ${escapeHtml(err.message)}</div>
    `;
  }
}

// ---------------------------------------------------------------------------
// View: Manuais e Documentação Técnica NFS-e
// ---------------------------------------------------------------------------
async function renderNfseDocs() {
  setActiveNav('nfse-docs');
  appEl.innerHTML = `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div class="flex items-center gap-2 text-[13px] text-light-on-surface-variant mb-4">
        <a href="#/" class="text-light-primary font-semibold hover:underline">Início</a>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
        <span>Manuais e Integração NFS-e</span>
      </div>
      <div class="bg-light-surface-container-lowest border border-light-outline-variant rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-light-outline-variant">
          <div>
            <h2 class="font-headline font-bold text-[20px] sm:text-[24px] text-light-primary">Manuais e Integração NFS-e (Padrão Nacional & ABRASF)</h2>
            <p class="text-[14px] text-light-on-surface-variant mt-1">Instruções de integração via Webservice e arquivos técnicos atualizados.</p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-container text-on-success-container font-label text-[12px] font-semibold">
            <span class="material-symbols-outlined text-[15px]">bolt</span> Portal Novo
          </span>
        </div>
        <div id="nfseBody">${loadingHtml()}</div>
      </div>
    </div>
  `;

  try {
    const res = await fetch('/api/nfse-docs');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar');

    document.getElementById('nfseBody').innerHTML = `
      <div class="p-4 sm:p-5 rounded-lg bg-civic-teal-container/40 border border-civic-teal/30 mb-6">
        <h3 class="font-headline font-semibold text-[16px] text-on-civic-teal-container flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-[20px]">info</span> Comunicado Oficial — Integração NFS-e
        </h3>
        <div class="flex flex-col gap-1.5 text-[14px] text-light-on-surface-variant">
          ${data.instrucoes.slice(1).map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
        </div>
      </div>

      <h3 class="font-headline font-semibold text-[16px] text-light-on-surface mb-3">Manuais, XSDs e Tabelas Disponíveis</h3>
      <div class="flex flex-col gap-2.5 md:hidden">
        ${data.manuais
          .map(
            (m) => `
          <div class="border border-light-outline-variant rounded-lg p-3.5 bg-light-surface-container-low/40 flex flex-col gap-2.5">
            <strong class="text-[14px] text-light-on-surface">${escapeHtml(m.titulo)}</strong>
            <a href="${m.proxyUrl}" target="_blank" class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[13px] font-semibold transition-colors">
              <span class="material-symbols-outlined text-[17px]">${m.isExternal ? 'open_in_new' : 'download'}</span>
              ${m.isExternal ? 'Abrir Link' : 'Baixar'}
            </a>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="hidden md:block overflow-x-auto border border-light-outline-variant rounded-lg">
        <table class="w-full text-left border-collapse text-[14px]">
          <thead>
            <tr class="bg-light-surface-container-low border-b border-light-outline-variant">
              <th class="py-3 px-4 font-label font-semibold">Documento / Arquivo</th>
              <th class="py-3 px-4 font-label font-semibold w-40">Acesso</th>
            </tr>
          </thead>
          <tbody>
            ${data.manuais
              .map(
                (m) => `
              <tr class="border-b last:border-b-0 border-light-surface-container hover:bg-light-surface-container-low/60">
                <td class="py-3 px-4 font-semibold text-light-on-surface">${escapeHtml(m.titulo)}</td>
                <td class="py-3 px-4">
                  <a href="${m.proxyUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-light-secondary-container text-light-on-secondary-container hover:bg-light-primary hover:text-light-on-primary font-label text-[12px] font-semibold transition-colors">
                    <span class="material-symbols-outlined text-[16px]">${m.isExternal ? 'open_in_new' : 'download'}</span>
                    ${m.isExternal ? 'Abrir Link' : 'Baixar'}
                  </a>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.getElementById('nfseBody').innerHTML = `
      <div class="p-4 rounded-md bg-light-error-container text-light-on-error-container text-[14px]"><strong>Erro:</strong> ${escapeHtml(err.message)}</div>
    `;
  }
}

// ---------------------------------------------------------------------------
// View: Serviços Interativos .csp via Proxy (sem login/captcha)
// ---------------------------------------------------------------------------
const FIELD_LABELS = {
  txtInsc: 'Inscrição Mercantil',
  txtInscricao: 'Inscrição Mercantil',
  txtInscP: 'Inscrição do Prestador',
  txtContInsc: 'Inscrição Municipal',
  txtParc: 'Parcela',
  cboDia: 'Dia do Pagamento',
  cboMes: 'Mês do Pagamento',
  cboAno: 'Ano do Pagamento',
  txtCpfCnpj: 'CPF / CNPJ',
  txtCPFCNPJ: 'CPF / CNPJ',
  txtPresCpfCnpj: 'CPF/CNPJ do Prestador',
  txtTomaCpfCnpj: 'CPF/CNPJ do Tomador',
  txtCNPJPres: 'CNPJ do Prestador',
  txtCodValidacao: 'Código de Validação',
  txtCodVali: 'Código de Validação',
  txtNFFE: 'Número da NFS-e',
  txtNota: 'Número da Nota',
  txtNumRps: 'Número do RPS',
  txtRPS: 'Número do Lote / RPS',
  txtVlServico: 'Valor do Serviço (R$)',
  txtCpf: 'CPF',
  txtCdAut: 'Código do Autônomo',
  txtDeno: 'Nome / Razão Social',
  WDENO: 'Nome / Razão Social',
  WEND1: 'Endereço',
  WEND2: 'Complemento / Bairro',
  WVAL1: 'Valor (R$)',
  radTpOpr: 'Tipo de Operação',
};

function labelForField(name) {
  return FIELD_LABELS[name] || name.replace(/^(txt|cbo|rad|opt)/, '');
}

async function renderNativeService(endpoint) {
  setActiveNav('home');
  const serviceInfo = SERVICES.find((s) => s.endpoint === endpoint) || {
    title: endpoint,
    desc: 'Serviço integrado em tempo real com o servidor Tinus.',
    endpoint,
  };

  appEl.innerHTML = `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div class="flex items-center gap-2 text-[13px] text-light-on-surface-variant mb-4">
        <a href="#/" class="text-light-primary font-semibold hover:underline">Início</a>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
        <span class="truncate">${escapeHtml(serviceInfo.title)}</span>
      </div>
      <div class="bg-light-surface-container-lowest border border-light-outline-variant rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-light-outline-variant">
          <div>
            <h2 class="font-headline font-bold text-[20px] sm:text-[24px] text-light-primary">${escapeHtml(serviceInfo.title)}</h2>
            <p class="text-[14px] text-light-on-surface-variant mt-1">${escapeHtml(serviceInfo.desc)}</p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-container text-on-success-container font-label text-[12px] font-semibold">
            <span class="material-symbols-outlined text-[15px]">bolt</span> Portal Novo
          </span>
        </div>
        <div id="nativeServiceBody">${loadingHtml('Carregando formulário e sessão da Tinus...')}</div>
      </div>
    </div>
  `;

  try {
    const res = await fetch(`/api/csp/meta?page=${encodeURIComponent(endpoint)}`);
    const meta = await res.json();
    if (!res.ok) throw new Error(meta.error || 'Erro ao carregar serviço');

    const body = document.getElementById('nativeServiceBody');
    const methodNames = Object.keys(meta.methods || {});

    const uniqueFields = [];
    const seenNames = new Set();
    for (const f of meta.fields) {
      if (f.type === 'hidden') continue;
      if (seenNames.has(f.name) && f.type !== 'radio') continue;
      seenNames.add(f.name);
      uniqueFields.push(f);
    }

    body.innerHTML = `
      <form id="tinusProxyForm">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          ${uniqueFields
            .map((f) => {
              const label = labelForField(f.name);
              if (f.tag === 'select') {
                return `
                  <div class="flex flex-col gap-1.5">
                    <label for="field_${f.name}" class="font-label text-[13px] font-semibold text-light-on-surface">${escapeHtml(label)}</label>
                    <select id="field_${f.name}" name="${escapeHtml(f.name)}" class="rounded-md border-light-outline-variant bg-light-surface-container-low text-[14px] focus:border-light-primary focus:ring-light-primary">
                      ${(f.options || [])
                        .map(
                          (o) =>
                            `<option value="${escapeHtml(o.value)}" ${o.selected ? 'selected' : ''}>${escapeHtml(o.label)}</option>`
                        )
                        .join('')}
                    </select>
                  </div>
                `;
              }
              return `
                <div class="flex flex-col gap-1.5">
                  <label for="field_${f.name}" class="font-label text-[13px] font-semibold text-light-on-surface">${escapeHtml(label)}</label>
                  <input
                    id="field_${f.name}"
                    name="${escapeHtml(f.name)}"
                    type="text"
                    class="rounded-md border-light-outline-variant bg-light-surface-container-low text-[14px] focus:border-light-primary focus:ring-light-primary"
                    value="${escapeHtml(f.value)}"
                    ${f.maxlength ? `maxlength="${escapeHtml(f.maxlength)}"` : ''}
                  />
                </div>
              `;
            })
            .join('')}
        </div>

        <div class="flex flex-wrap gap-3" id="tinusActions">
          ${
            methodNames.length > 0
              ? methodNames
                  .filter((fn) => !/carregar|limpar/i.test(fn))
                  .map(
                    (fn, idx) => `
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-label text-[14px] font-semibold transition-colors ${
                      idx === 0
                        ? 'bg-light-primary text-light-on-primary hover:bg-light-primary-container'
                        : 'bg-success text-on-success hover:opacity-90'
                    }"
                    data-fn="${escapeHtml(fn)}"
                    data-token="${escapeHtml(meta.methods[fn][0])}"
                  >
                    <span class="material-symbols-outlined text-[18px]">send</span> ${escapeHtml(fn)}
                  </button>
                `
                  )
                  .join('')
              : `<button type="button" class="px-5 py-2.5 rounded-md bg-light-secondary-container text-light-on-secondary-container font-label text-[14px] font-semibold" onclick="location.hash='#/direto/${escapeHtml(serviceInfo.id || 'area-restrita')}'">Abrir Direto</button>`
          }
          <button type="reset" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-light-surface-container text-light-on-surface hover:bg-light-surface-container-high font-label text-[14px] font-semibold transition-colors">
            <span class="material-symbols-outlined text-[18px]">backspace</span> Limpar
          </button>
        </div>
      </form>

      <div id="tinusResultArea" class="mt-6"></div>
    `;

    document.querySelectorAll('#tinusActions button[data-token]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const fnName = btn.dataset.fn;
        const token = btn.dataset.token;
        const form = document.getElementById('tinusProxyForm');
        const formData = new FormData(form);

        let args = [];
        if (endpoint === 'wsicm80cl.csp') {
          if (fnName === 'Consultar') {
            args = [formData.get('txtInsc') || ''];
          } else if (fnName === 'Imprimir') {
            const dt = `${formData.get('cboDia') || ''}${formData.get('cboMes') || ''}${formData.get('cboAno') || ''}`;
            args = ['PDF', formData.get('txtInsc') || '', formData.get('txtParc') || '', dt, ''];
          }
        } else if (endpoint === 'wsinevlne.csp') {
          args = [
            formData.get('txtCodValidacao') || '',
            formData.get('txtNFFE') || '',
            formData.get('txtCPFCNPJ') || '',
            formData.get('txtVlServico') || '',
          ];
        } else if (endpoint === 'wsnnavulsasimplificadaDam.csp') {
          args = [formData.get('txtNota') || ''];
        } else if (endpoint === 'wsnnavulsasimplificadaNota.csp') {
          args = [formData.get('txtPresCpfCnpj') || '', formData.get('txtTomaCpfCnpj') || ''];
        } else {
          args = uniqueFields.map((f) => formData.get(f.name) || '');
        }

        const resultArea = document.getElementById('tinusResultArea');
        resultArea.innerHTML = loadingHtml('Enviando requisição para a Tinus...');
        btn.disabled = true;

        try {
          const bRes = await fetch('/api/csp/broker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: endpoint, token, args }),
          });
          const bData = await bRes.json();
          if (!bRes.ok) throw new Error(bData.error || 'Erro na chamada');

          if (bData.selectOptions?.length) {
            for (const opt of bData.selectOptions) {
              const sel = form.querySelector(`[name="${opt.field}"]`);
              if (sel) {
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                optionEl.textContent = opt.label;
                sel.appendChild(optionEl);
              }
            }
          }

          if (bData.fieldValues) {
            for (const [k, v] of Object.entries(bData.fieldValues)) {
              const input = form.querySelector(`[name="${k}"]`);
              if (input) input.value = v;
            }
          }

          const blocks = [];
          if (bData.alerts?.length) {
            blocks.push(`
              <div class="p-4 rounded-lg bg-warning-container text-on-warning-container border border-warning/20 text-[14px]">
                <strong class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px]">info</span> Retorno do Sistema Tinus:</strong>
                <p class="mt-1">${bData.alerts.map(escapeHtml).join('<br>')}</p>
              </div>
            `);
          }
          if (bData.openUrls?.length) {
            blocks.push(`
              <div class="p-4 rounded-lg bg-success-container text-on-success-container text-[14px]">
                <strong class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px]">check_circle</span> Documento / Relatório Gerado:</strong>
                <div class="mt-3 flex flex-wrap gap-2">
                  ${bData.openUrls
                    .map(
                      (u, i) => `
                    <a href="${u.proxyUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-success text-on-success font-label text-[13px] font-semibold">
                      <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span> Abrir Documento ${bData.openUrls.length > 1 ? i + 1 : ''}
                    </a>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `);
          }
          if (bData.htmlUpdates?.length) {
            blocks.push(`
              <div class="p-4 rounded-lg bg-light-surface-container-low border border-light-outline-variant text-[14px]">
                ${bData.htmlUpdates.map((h) => h.html).join('<hr class="my-3 border-light-outline-variant">')}
              </div>
            `);
          }
          if (blocks.length === 0) {
            blocks.push(`
              <div class="p-4 rounded-lg bg-success-container text-on-success-container text-[14px]">
                <strong class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px]">check_circle</span> Requisição processada pela Tinus.</strong>
                ${bData.selectOptions?.length ? '<p class="mt-1">As opções disponíveis foram carregadas no formulário acima.</p>' : ''}
              </div>
            `);
          }

          resultArea.innerHTML = `<div class="flex flex-col gap-3">${blocks.join('')}</div>`;
        } catch (err) {
          resultArea.innerHTML = `<div class="p-4 rounded-lg bg-light-error-container text-light-on-error-container text-[14px]"><strong>Erro:</strong> ${escapeHtml(err.message)}</div>`;
          showToast(err.message, 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    document.getElementById('nativeServiceBody').innerHTML = `
      <div class="p-4 rounded-lg bg-light-error-container text-light-on-error-container text-[14px]">
        <strong>Não foi possível carregar este serviço via proxy:</strong> ${escapeHtml(err.message)}
        <div class="mt-3">
          <a href="${TINUS_BASE + endpoint}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-light-surface-container-lowest text-light-on-surface font-label text-[13px] font-semibold">
            <span class="material-symbols-outlined text-[16px]">open_in_new</span> Abrir página original na Tinus
          </a>
        </div>
      </div>
    `;
  }
}

// ---------------------------------------------------------------------------
// View: Iframe Direto Tinus (Para Login / Captcha sem passar pelo novo servidor)
// ---------------------------------------------------------------------------
function renderIframeService(serviceId) {
  setActiveNav('home');
  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    renderHome();
    return;
  }

  const directUrl = TINUS_BASE + service.endpoint;

  appEl.innerHTML = `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div class="flex items-center gap-2 text-[13px] text-light-on-surface-variant mb-4">
        <a href="#/" class="text-light-primary font-semibold hover:underline">Início</a>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
        <span class="truncate">${escapeHtml(service.title)}</span>
      </div>

      <div class="bg-light-surface-container-lowest border border-light-outline-variant rounded-xl overflow-hidden shadow-md">
        <div class="bg-light-primary text-light-on-primary px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3 flex-wrap">
            <strong class="font-headline text-[16px]">${escapeHtml(service.title)}</strong>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-civic-gold-container text-on-civic-gold-container font-label text-[11px] font-semibold">
              <span class="material-symbols-outlined text-[13px]">lock</span> Conexão Direta Tinus (Sem Proxy)
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button id="btnReloadFrame" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-light-primary-container text-light-on-primary hover:bg-civic-teal font-label text-[13px] font-semibold transition-colors">
              <span class="material-symbols-outlined text-[16px]">refresh</span> Recarregar
            </button>
            <a href="${escapeHtml(directUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-light-surface-container-lowest text-light-primary hover:bg-light-secondary-container font-label text-[13px] font-semibold transition-colors">
              <span class="material-symbols-outlined text-[16px]">open_in_new</span> Abrir em Nova Aba
            </a>
          </div>
        </div>

        <div class="bg-civic-gold-container/60 text-on-civic-gold-container px-5 py-2.5 text-[13px] border-b border-civic-gold/20 flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] shrink-0">info</span>
          <span>
            Este serviço exige <strong>login ou validação de captcha</strong>. O quadro abaixo conecta diretamente ao servidor oficial da Tinus sem passar pelo novo servidor. Caso o navegador bloqueie o login dentro do quadro (cookie SameSite), clique em <strong>Abrir em Nova Aba</strong>.
          </span>
        </div>

        <iframe
          id="tinusDirectFrame"
          class="tinus-frame"
          src="${escapeHtml(directUrl)}"
          title="${escapeHtml(service.title)}"
        ></iframe>
      </div>
    </div>
  `;

  document.getElementById('btnReloadFrame')?.addEventListener('click', () => {
    const frame = document.getElementById('tinusDirectFrame');
    if (frame) frame.src = directUrl;
  });
}

// ---------------------------------------------------------------------------
// Roteador
// ---------------------------------------------------------------------------
function router() {
  const hash = location.hash || '#/';
  mobileNav?.classList.add('hidden');
  mobileNav?.classList.remove('flex');

  if (hash === '#/' || hash === '') {
    renderHome();
  } else if (hash === '#/calendario') {
    renderCalendario();
  } else if (hash === '#/legislacao') {
    renderLegislacao('1');
  } else if (hash === '#/formularios') {
    renderFormularios();
  } else if (hash === '#/nfse-docs') {
    renderNfseDocs();
  } else if (hash.startsWith('#/servico/')) {
    const ep = decodeURIComponent(hash.replace('#/servico/', ''));
    renderNativeService(ep);
  } else if (hash.startsWith('#/direto/')) {
    const id = decodeURIComponent(hash.replace('#/direto/', ''));
    renderIframeService(id);
  } else {
    renderHome();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
