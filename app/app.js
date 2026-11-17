/* PsyTote — estudos para Psicóloga(o) do CRP/05 (FGV). Sem dependências. */
'use strict';

const DATA_PROVA = new Date('2027-02-28T13:00:00-03:00');
const CHAVE = 'psytote-v1';
const INTERVALOS = [1, 3, 7, 16, 35]; // dias, revisão espaçada (caixas de Leitner)
const LETRAS = 'ABCDE';
const PRESETS = {
  completo: { nome: 'Prova completa', q: { portugues: 15, legislacao: 15, rlm: 10, especificos: 30 }, min: 240,
    desc: '70 questões em 4h, igual à prova (lembre: no dia, as 4h incluem a redação).' },
  objetiva: { nome: 'Só objetiva (3h)', q: { portugues: 15, legislacao: 15, rlm: 10, especificos: 30 }, min: 180,
    desc: '70 questões em 3h, reservando 1h para a redação como no dia da prova.' },
  mini: { nome: 'Mini-simulado', q: { portugues: 4, legislacao: 4, rlm: 3, especificos: 9 }, min: 60,
    desc: '20 questões em 1h, na mesma proporção da prova.' },
  especifico: { nome: 'Bloco da área', q: { portugues: 0, legislacao: 15, rlm: 0, especificos: 30 }, min: 130,
    desc: 'Legislação + Específicos (45 questões, o coração da prova).' },
};

const SAUDACOES = [
  'Salve, ó Exímia Acadêmica! Thoth aguarda vossa sapiência.',
  'Vossa Excelência Discente, as questões vos esperam com reverência.',
  'Cara Estudante, que a pena de Íbis guie vossos acertos.',
  'Ilustríssima Doutora em Potencial, o papiro do dia está desenrolado.',
  'Eis que retorna a Mais Erudita das Candidatas! Os gabaritos tremem.',
  'Sapientíssima Senhora, a FGV não sabe o que a espera.',
  'Ó Luminar da Psique, dignai-vos a resolver mais algumas questões.',
  'Excelentíssima Estudiosa, Thoth anotou vossa chegada em seus registros.',
  'Salve, Guardiã do Código de Ética! A Resolução 10/2005 vos saúda.',
  'Nobre Acadêmica, até o SATEPSI aprovaria vossa dedicação.',
  'Veneranda Candidata, os escribas do Nilo já afiam os cálamos.',
  'Ó Erudita Exímia, vossa presença eleva a média do Conselho.',
  'Cara Estudante de Insigne Estirpe, hoje é dia de gabaritar.',
  'Sereníssima Sábia, o cronômetro aguarda vossa ordem.',
  'Augusta Discípula de Thoth, o conhecimento não se estudará sozinho.',
  'Salve, Futura Psicóloga Fiscal! Que nenhum laudo escape ao vosso olhar.',
  'Magnífica Mestra das Alternativas, a letra certa já vos pressente.',
  'Ó Sumidade Acadêmica, até Freud tomaria notas.',
  'Preclara Estudante, os deuses do Egito torcem por vós.',
  'Douta Senhora dos Prontuários, vossos registros serão impecáveis.',
  'Exímia Acadêmica, a Lei 5.766/71 sente vossa falta.',
  'Ó Iluminada pela Ciência Psicológica, avante rumo ao 28 de fevereiro!',
  'Vossa Sapiência chegou! Que se abram os papiros.',
  'Cara Estudante, Thoth pesa os corações — e as alternativas também.',
  'Altíssima Erudita, o raciocínio lógico curva-se diante de vós.',
  'Ó Primorosa Candidata, a crase não ousará vos enganar hoje.',
  'Ilustre Acadêmica, a Comissão de Orientação e Fiscalização vos aguarda.',
  'Salve, ó Sábia! Mais um dia, mais um passo rumo ao CRP/05.',
  'Eminentíssima Estudante, a vitória se escreve em hieróglifos de esforço.',
  'Ó Íbis da Psicologia, pousai sobre as questões e conquistai-as.',
];

// ---------- utilidades ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const embaralhar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = (a, n) => n ? Math.round(100 * a / n) : 0;
const diaStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const somaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtData = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const fmtTempo = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(ss).padStart(2, '0'); };

function md(txt) {
  // Markdown mínimo e seguro: escapa tudo, depois aplica títulos, negrito, itálico, listas e links.
  const linhas = esc(txt || '').split('\n');
  let html = '', lista = null;
  const inline = s => s
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const fecha = () => { if (lista) { html += `</${lista}>`; lista = null; } };
  for (const l of linhas) {
    let m;
    if ((m = l.match(/^#{1,6}\s+(.*)/))) { fecha(); html += `<h4>${inline(m[1])}</h4>`; }
    else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (lista !== 'ul') { fecha(); html += '<ul>'; lista = 'ul'; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (lista !== 'ol') { fecha(); html += '<ol>'; lista = 'ol'; } html += `<li>${inline(m[1])}</li>`; }
    else if (!l.trim()) fecha();
    else { fecha(); html += `<p>${inline(l)}</p>`; }
  }
  fecha();
  return html;
}

// ---------- estado persistente ----------
function estadoPadrao() {
  return { resp: {}, srs: {}, fav: {}, dias: {}, simulados: [], simAtual: null,
    crono: { inicio: null, feitos: {}, meu: [], visao: 'ambos' }, criado: Date.now() };
}
let E = estadoPadrao();
try { const s = localStorage.getItem(CHAVE); if (s) E = Object.assign(estadoPadrao(), JSON.parse(s)); } catch (_) { /* armazenamento indisponível */ }
let avisoSalvar = false;
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(E)); }
  catch (_) { if (!avisoSalvar) { avisoSalvar = true; alert('Não consegui salvar o progresso neste navegador. Faça um backup em Estatísticas › Backup.'); } }
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------- banco ----------
let B = null, Q = {}, ASS = {}, DISC = {};
async function carregarBanco() {
  const r = await fetch('dados/banco.json', { cache: 'no-cache' });
  B = await r.json();
  for (const q of B.questoes) Q[q.id] = q;
  for (const a of B.assuntos) ASS[a.id] = a;
  for (const d of B.disciplinas) DISC[d.id] = d;
}
const nomeAssunto = id => (ASS[id] ? ASS[id].nome : id);
const nomeCurto = id => nomeAssunto(id).replace(/^\d+\.\s*/, '').split(/[:–(]/)[0].trim();

function seloOrigem(q) {
  const o = q.o;
  if (o.tipo === 'banca') return `<span class="selo banca" title="Questão real da banca do concurso">FGV · ${esc([o.orgao, o.ano, o.cargo].filter(Boolean).join(' · '))}</span>`;
  if (o.tipo === 'outra') return `<span class="selo outra" title="Questão real de outra banca">${esc([o.banca, o.orgao, o.ano].filter(Boolean).join(' · '))}${o.cargo ? ' · ' + esc(o.cargo) : ''}</span>`;
  return '<span class="selo autoral" title="Questão escrita pelo Claude com base no edital">Autoral · Claude</span>';
}

// ---------- registro de respostas ----------
function registrar(id, certo) {
  const r = E.resp[id] || { n: 0, ac: 0 };
  r.n++; if (certo) r.ac++; r.ult = Date.now(); r.ok = certo; E.resp[id] = r;
  const d = diaStr(); E.dias[d] = (E.dias[d] || 0) + 1;
  const s = E.srs[id];
  if (!certo) E.srs[id] = { cx: 0, vence: diaStr(somaDias(new Date(), INTERVALOS[0])) };
  else if (s) {
    s.cx++;
    if (s.cx >= INTERVALOS.length) delete E.srs[id];
    else s.vence = diaStr(somaDias(new Date(), INTERVALOS[s.cx]));
  }
}
const pendentesRevisao = () => Object.entries(E.srs).filter(([id, s]) => Q[id] && s.vence <= diaStr()).map(([id]) => id);

function sequenciaDias() {
  let n = 0, d = new Date();
  if (!E.dias[diaStr(d)]) d = somaDias(d, -1);
  while (E.dias[diaStr(d)]) { n++; d = somaDias(d, -1); }
  return n;
}

// ---------- roteamento ----------
const tela = $('#tela');
const telas = {};
let relogioTimer = null;
function ir(rota) { if (location.hash === '#' + rota) render(); else location.hash = rota; }
window.addEventListener('hashchange', render);
function render() {
  const [rota, ...args] = (location.hash.slice(1) || 'inicio').split('/');
  const fn = telas[rota] || telas.inicio;
  if (rota !== 'prova') pararRelogio();
  const raiz = ['inicio', 'treino', 'simulado', 'cronograma', 'materiais'];
  $('#voltar').hidden = raiz.includes(rota) || rota === 'prova';
  document.querySelectorAll('.abas button').forEach(b => b.classList.toggle('ativa', b.dataset.ir === rota));
  $('#abas').classList.toggle('oculto', rota === 'prova');
  fn(...args.map(decodeURIComponent));
  window.scrollTo(0, 0);
}
$('#voltar').onclick = () => history.back();
$('#abas').onclick = e => { const b = e.target.closest('button'); if (b) ir(b.dataset.ir); };
const titulo = t => { $('#titulo').textContent = t; document.title = t === 'PsyTote' ? 'PsyTote' : t + ' · PsyTote'; };

// Ações por delegação: elementos com data-acao="nome" chamam ACOES.nome(el, evento)
const ACOES = {};
tela.addEventListener('click', e => {
  const el = e.target.closest('[data-acao]');
  if (el && ACOES[el.dataset.acao]) { e.preventDefault(); ACOES[el.dataset.acao](el, e); }
});
tela.addEventListener('change', e => {
  const el = e.target.closest('[data-mudou]');
  if (el && ACOES[el.dataset.mudou]) ACOES[el.dataset.mudou](el, e);
});

// ---------- INÍCIO ----------
telas.inicio = () => {
  titulo('PsyTote');
  const agora = new Date();
  const dias = Math.ceil((DATA_PROVA - agora) / 864e5);
  const hoje = E.dias[diaStr()] || 0;
  const pend = pendentesRevisao().length;
  const respondidas = Object.keys(E.resp).length;
  const tot = Object.values(E.resp).reduce((s, r) => s + r.n, 0), ac = Object.values(E.resp).reduce((s, r) => s + r.ac, 0);
  const cont = { banca: 0, outra: 0, autoral: 0 };
  B.questoes.forEach(q => cont[q.o.tipo]++);
  const prox = proximasTarefas(3);
  tela.innerHTML = `
    <p class="saudacao">${esc(SAUDACOES[Math.floor(Math.random() * SAUDACOES.length)])}</p>
    <div class="cartao">
      <div class="contagem"><b>${dias > 0 ? dias : 0}</b><span>${dias === 1 ? 'dia' : 'dias'} para a prova · 28/02/2027, 13h</span></div>
      <p class="suave pequeno">CRP/05 · Psicóloga(o) · FGV · 70 questões + redação · corte: 35 acertos</p>
    </div>
    <div class="grade">
      <button class="bloco" data-acao="rapido"><b>⚡ 10 questões rápidas</b><span>mistura do edital todo</span></button>
      <button class="bloco" data-acao="revisao"><b>↻ Revisão${pend ? ` (${pend})` : ''}</b><span>${pend ? 'questões que você errou voltaram' : 'nada pendente hoje'}</span></button>
      <button class="bloco" data-acao="ir" data-rota="simulado"><b>⏱️ Simulado</b><span>com cronômetro</span></button>
      <button class="bloco" data-acao="ir" data-rota="stats"><b>📊 Desempenho</b><span>${tot ? pct(ac, tot) + '% de acerto' : 'ainda sem dados'}</span></button>
    </div>
    <div class="cartao" style="margin-top:14px">
      <div class="linha-stat"><span>Hoje</span><b>${hoje} questões</b></div>
      <div class="linha-stat"><span>Sequência</span><b>${sequenciaDias()} dia(s) seguidos</b></div>
      <div class="linha-stat"><span>Já respondidas</span><b>${respondidas} de ${B.questoes.length}</b></div>
    </div>
    ${prox.length ? `<div class="cartao"><h2>Próximas do cronograma</h2>${prox.map(t => tarefaHTML(t)).join('')}
      <div class="linha-botoes"><button class="botao sec" data-acao="ir" data-rota="cronograma">Ver cronograma</button></div></div>` : ''}
    ${E.simAtual ? `<div class="aviso">Tem um simulado em andamento. <a href="#prova" >Continuar</a></div>` : ''}
    <p class="suave pequeno centro">Banco: ${B.questoes.length} questões — ${cont.banca} FGV, ${cont.outra} de outras bancas, ${cont.autoral} autorais (Claude).</p>`;
};
ACOES.ir = el => ir(el.dataset.rota);
ACOES.rapido = () => iniciarSessao(escolher(B.questoes.filter(q => !q.anulada), 10, true), 'Questões rápidas');
ACOES.revisao = () => {
  const p = pendentesRevisao();
  if (!p.length) return alert('Nada para revisar hoje. Thoth está satisfeito!');
  iniciarSessao(embaralhar(p), 'Revisão');
};

// ---------- TREINO (filtros) ----------
const filtro = { disc: [], ass: [], orig: [], status: 'todas', qtd: 20 };
telas.treino = () => {
  titulo('Questões');
  const discs = B.disciplinas;
  const assuntosVis = B.assuntos.filter(a => !filtro.disc.length || filtro.disc.includes(a.disciplina));
  const pool = filtrar();
  tela.innerHTML = `
    <div class="cartao">
      <label class="campo">Disciplina</label>
      <div class="chips">${discs.map(d => `<button class="chip ${filtro.disc.includes(d.id) ? 'on' : ''}" data-acao="tgl" data-k="disc" data-v="${d.id}">${esc(d.nome.replace(' – Psicóloga(o)', ''))}</button>`).join('')}</div>
      <label class="campo">Assunto <span class="suave">(nenhum = todos)</span></label>
      <div class="chips">${assuntosVis.map(a => `<button class="chip ${filtro.ass.includes(a.id) ? 'on' : ''}" data-acao="tgl" data-k="ass" data-v="${a.id}" title="${esc(a.nome)}">${esc(nomeCurto(a.id))} <span class="suave">${contaAssunto(a.id)}</span></button>`).join('')}</div>
      <label class="campo">Quem fez a questão</label>
      <div class="chips">
        <button class="chip ${filtro.orig.includes('banca') ? 'on' : ''}" data-acao="tgl" data-k="orig" data-v="banca">FGV (banca)</button>
        <button class="chip ${filtro.orig.includes('outra') ? 'on' : ''}" data-acao="tgl" data-k="orig" data-v="outra">Outras bancas</button>
        <button class="chip ${filtro.orig.includes('autoral') ? 'on' : ''}" data-acao="tgl" data-k="orig" data-v="autoral">Autorais (Claude)</button>
      </div>
      <label class="campo">Quais</label>
      <div class="chips">${[['todas', 'Todas'], ['novas', 'Nunca respondidas'], ['erradas', 'Que errei'], ['fav', 'Favoritas ★']].map(([v, n]) =>
        `<button class="chip ${filtro.status === v ? 'on' : ''}" data-acao="status" data-v="${v}">${n}</button>`).join('')}</div>
      <label class="campo">Quantas</label>
      <div class="chips">${[10, 20, 30, 50, 0].map(n => `<button class="chip ${filtro.qtd === n ? 'on' : ''}" data-acao="qtd" data-v="${n}">${n || 'Todas'}</button>`).join('')}</div>
      <div class="linha-botoes"><button class="botao cheio" data-acao="comecar" ${pool.length ? '' : 'disabled'}>Começar · ${Math.min(pool.length, filtro.qtd || pool.length)} de ${pool.length} disponíveis</button></div>
      ${filtro.disc.length || filtro.ass.length || filtro.orig.length || filtro.status !== 'todas' ? '<div class="centro"><button class="botao sec" style="margin-top:8px" data-acao="limpar">Limpar filtros</button></div>' : ''}
    </div>`;
};
function contaAssunto(id) { return B.questoes.filter(q => q.a === id).length; }
function filtrar() {
  return B.questoes.filter(q => {
    if (filtro.disc.length && !filtro.disc.includes(q.d)) return false;
    if (filtro.ass.length && !filtro.ass.includes(q.a)) return false;
    if (filtro.orig.length && !filtro.orig.includes(q.o.tipo)) return false;
    const r = E.resp[q.id];
    if (filtro.status === 'novas' && r) return false;
    if (filtro.status === 'erradas' && !(r && r.ok === false)) return false;
    if (filtro.status === 'fav' && !E.fav[q.id]) return false;
    return true;
  });
}
ACOES.tgl = el => {
  const k = el.dataset.k, v = el.dataset.v, arr = filtro[k], i = arr.indexOf(v);
  if (i >= 0) arr.splice(i, 1); else arr.push(v);
  if (k === 'disc') filtro.ass = filtro.ass.filter(a => !filtro.disc.length || filtro.disc.includes(ASS[a].disciplina));
  telas.treino();
};
ACOES.status = el => { filtro.status = el.dataset.v; telas.treino(); };
ACOES.qtd = el => { filtro.qtd = +el.dataset.v; telas.treino(); };
ACOES.limpar = () => { Object.assign(filtro, { disc: [], ass: [], orig: [], status: 'todas' }); telas.treino(); };
ACOES.comecar = () => iniciarSessao(escolher(filtrar(), filtro.qtd || Infinity, true), 'Questões');

// Escolhe n questões priorizando as nunca respondidas, depois as menos recentes; mantém textos-base juntos.
function escolher(lista, n, priorizarNovas) {
  let ordenada = embaralhar(lista);
  if (priorizarNovas) {
    const novas = ordenada.filter(q => !E.resp[q.id]);
    const velhas = ordenada.filter(q => E.resp[q.id]).sort((a, b) => E.resp[a.id].ult - E.resp[b.id].ult);
    ordenada = novas.concat(velhas);
  }
  const sel = ordenada.slice(0, n);
  // agrupa questões com mesmo texto-base, mantendo a ordem de primeira aparição
  const grupos = new Map();
  sel.forEach(q => { const k = q.t ?? 'q' + q.id; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(q); });
  return [...grupos.values()].flat().map(q => q.id);
}

// ---------- SESSÃO DE QUESTÕES ----------
let S = null; // { ids, i, nome, esc:{}, ok:0, riscadas:{} }
function iniciarSessao(ids, nome) {
  if (!ids.length) return alert('Nenhuma questão com esses filtros.');
  S = { ids, i: 0, nome, esc: {}, ok: 0, feitas: 0, riscadas: {} };
  ir('sessao');
}
telas.sessao = () => {
  if (!S) return ir('treino');
  titulo(S.nome);
  if (S.i >= S.ids.length) return fimSessao();
  const id = S.ids[S.i], q = Q[id], resp = S.esc[id];
  tela.innerHTML = `
    <div class="barra-q"><span>${S.i + 1} de ${S.ids.length} · ${S.ok}/${S.feitas} certas</span>
      <span><button class="icone-btn ${E.fav[id] ? 'on' : ''}" data-acao="fav" title="Favoritar">★</button></span></div>
    <div class="cartao">${questaoHTML(q, { escolha: resp?.marcada, corrigida: resp?.conferida, riscadas: S.riscadas[id] })}
      <div class="linha-botoes">
        ${resp?.conferida
          ? `<button class="botao cheio" data-acao="proxima">${S.i + 1 < S.ids.length ? 'Próxima ›' : 'Ver resultado'}</button>`
          : `<button class="botao sec" data-acao="pular">Pular</button><button class="botao" data-acao="conferir" ${resp?.marcada == null ? 'disabled' : ''}>Responder</button>`}
      </div></div>`;
};
function questaoHTML(q, { escolha, corrigida, riscadas = {}, semRiscar = false }) {
  const texto = q.t != null ? B.textos[q.t] : '';
  const certo = corrigida && escolha === q.g;
  return `
    <div class="cabecalho-q">${seloOrigem(q)}<span class="selo assunto">${esc(nomeCurto(q.a))}</span>${q.anulada ? '<span class="selo anulada">anulada</span>' : ''}</div>
    ${texto ? `<details class="texto-base-box" open><summary>Texto-base</summary><div class="texto-base">${esc(texto)}</div></details>` : ''}
    <div class="enunciado">${esc(q.e)}</div>
    <ul class="alts">${q.alt.map((a, i) => {
      let cl = 'alt';
      if (corrigida) { if (i === q.g) cl += ' correta'; else if (i === escolha) cl += ' errada'; }
      else if (i === escolha) cl += ' marcada';
      if (riscadas[i] && !corrigida) cl += ' riscada';
      return `<li><div class="${cl}" role="button" tabindex="0" data-acao="${corrigida ? '' : 'marcar'}" data-i="${i}">
        <span class="letra">${LETRAS[i]}</span><span class="txt">${esc(a)}</span>
        ${corrigida || semRiscar ? '' : `<button class="riscar" data-acao="riscar" data-i="${i}" title="Riscar alternativa">✕</button>`}</div></li>`;
    }).join('')}</ul>
    ${corrigida ? `<div class="feedback ${certo ? 'ok' : 'nok'}">
        <b>${q.anulada ? 'Questão anulada pela banca' : certo ? 'Acertou! ✓' : escolha == null ? `Gabarito: ${LETRAS[q.g]}` : `Errou — gabarito: ${LETRAS[q.g]}`}</b>
        <div class="comentario">${esc(q.c)}</div>
        ${q.o.fonte ? `<div class="fonte">Fonte: ${fonteHTML(q.o.fonte)}</div>` : ''}
      </div>` : ''}`;
}
function fonteHTML(f) {
  return String(f).split(/\s+;\s+/).map(x => /^https?:\/\//.test(x) ? `<a href="${esc(x)}" target="_blank" rel="noopener">${esc(x.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}${x.length > 70 ? '…' : ''}</a>` : esc(x)).join(' · ');
}
ACOES.marcar = el => {
  if (location.hash === '#prova') return marcarProva(el);
  const id = S.ids[S.i];
  S.esc[id] = { marcada: +el.dataset.i };
  telas.sessao();
};
ACOES.riscar = (el, e) => {
  e.stopPropagation();
  const alvo = location.hash === '#prova' ? P : S;
  const id = alvo.ids[alvo.i], i = +el.dataset.i;
  alvo.riscadas[id] = alvo.riscadas[id] || {};
  alvo.riscadas[id][i] = !alvo.riscadas[id][i];
  if (alvo === P) { salvarProva(); telas.prova(); } else telas.sessao();
};
ACOES.conferir = () => {
  const id = S.ids[S.i], q = Q[id], r = S.esc[id];
  r.conferida = true;
  const certo = r.marcada === q.g;
  if (!q.anulada) { registrar(id, certo); S.feitas++; if (certo) S.ok++; salvar(); }
  telas.sessao();
  const fb = $('.feedback'); if (fb) fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
ACOES.pular = () => { S.i++; telas.sessao(); };
ACOES.proxima = () => { S.i++; telas.sessao(); };
ACOES.fav = () => {
  const id = location.hash === '#prova' ? P.ids[P.i] : S.ids[S.i];
  if (E.fav[id]) delete E.fav[id]; else E.fav[id] = 1;
  salvar(); location.hash === '#prova' ? telas.prova() : telas.sessao();
};
function fimSessao() {
  const msg = S.feitas === 0 ? 'Nenhuma respondida desta vez.' : pct(S.ok, S.feitas) >= 80 ? 'Desempenho digno de uma sacerdotisa de Thoth!' : pct(S.ok, S.feitas) >= 50 ? 'Acima do corte! Continue assim.' : 'Os erros de hoje são os acertos de fevereiro.';
  tela.innerHTML = `<div class="cartao centro">
    <h2>Fim da sessão</h2>
    <p class="numero">${S.ok}/${S.feitas}</p><p>${pct(S.ok, S.feitas)}% de acerto</p>
    <p class="suave">${msg}</p>
    <div class="linha-botoes"><button class="botao sec" data-acao="ir" data-rota="treino">Novos filtros</button>
    <button class="botao" data-acao="denovo">Mais ${Math.min(S.ids.length, 20)} iguais</button></div></div>`;
}
ACOES.denovo = () => {
  const base = S.nome === 'Revisão' ? null : filtrar();
  if (!base) return ACOES.revisao();
  iniciarSessao(escolher(S.nome === 'Questões rápidas' ? B.questoes.filter(q => !q.anulada) : base, Math.min(S.ids.length, 20), true), S.nome);
};

// ---------- SIMULADO ----------
let P = null; // prova em andamento (espelho de E.simAtual)
telas.simulado = () => {
  titulo('Simulado');
  if (E.simAtual) {
    tela.innerHTML = `<div class="cartao"><h2>Simulado em andamento</h2>
      <p>${esc(E.simAtual.nome)} · ${Object.keys(E.simAtual.esc).length}/${E.simAtual.ids.length} respondidas</p>
      <div class="linha-botoes"><button class="botao" data-acao="ir" data-rota="prova">Continuar</button>
      <button class="botao sec" data-acao="descartar">Descartar</button></div></div>`;
    return;
  }
  const hist = E.simulados.slice(-5).reverse();
  tela.innerHTML = `
    <div class="aviso">No simulado as respostas só aparecem no final, como na prova. Questões de Certo/Errado ficam de fora (a FGV usa 5 alternativas). Dá para fechar o app e continuar depois — o tempo segue correndo.</div>
    ${Object.entries(PRESETS).map(([k, p]) => `<div class="cartao"><h2>${p.nome}</h2><p class="suave">${p.desc}</p>
      <p class="pequeno">${Object.entries(p.q).filter(([, n]) => n).map(([d, n]) => `${n} ${esc(DISC[d].nome.replace(' – Psicóloga(o)', ''))}`).join(' · ')} · ${p.min} min</p>
      <button class="botao cheio" data-acao="sim" data-p="${k}">Começar</button></div>`).join('')}
    <div class="cartao"><h2>Personalizado</h2>
      ${B.disciplinas.map(d => `<label class="campo">${esc(d.nome)}</label><input type="number" min="0" max="100" value="${PRESETS.mini.q[d.id]}" id="n-${d.id}">`).join('')}
      <label class="campo">Tempo (minutos)</label><input type="number" min="5" max="600" value="60" id="n-min">
      <div class="linha-botoes"><button class="botao cheio" data-acao="simPers">Começar personalizado</button></div></div>
    ${hist.length ? `<div class="cartao"><h2>Últimos simulados</h2>${hist.map((s, i) => `<div class="linha-stat"><span>${new Date(s.data).toLocaleDateString('pt-BR')} · ${esc(s.nome)}</span>
      <a href="#resultado/${E.simulados.length - 1 - i}">${s.acertos}/${s.total} (${pct(s.acertos, s.total)}%)</a></div>`).join('')}</div>` : ''}`;
};
ACOES.sim = el => { const p = PRESETS[el.dataset.p]; montarProva(p.nome, p.q, p.min); };
ACOES.simPers = () => {
  const q = {}; B.disciplinas.forEach(d => q[d.id] = Math.max(0, +$('#n-' + d.id).value || 0));
  const min = Math.max(5, +$('#n-min').value || 60);
  if (!Object.values(q).some(Boolean)) return alert('Escolha pelo menos uma questão.');
  montarProva('Personalizado', q, min);
};
ACOES.descartar = () => { if (confirm('Descartar o simulado em andamento?')) { E.simAtual = null; P = null; salvar(); telas.simulado(); } };

function montarProva(nome, quant, minutos) {
  const ids = [];
  const faltas = [];
  for (const d of B.disciplinas) {
    const n = quant[d.id] || 0; if (!n) continue;
    const pool = B.questoes.filter(q => q.d === d.id && !q.anulada && q.alt.length === 5);
    // prioridade: nunca vistas > FGV > outras; distribui entre assuntos (round-robin)
    const peso = q => (E.resp[q.id] ? 2 : 0) + (q.o.tipo === 'banca' ? 0 : 1) + Math.random();
    const porAss = {};
    pool.sort((a, b) => peso(a) - peso(b)).forEach(q => (porAss[q.a] = porAss[q.a] || []).push(q));
    const filas = embaralhar(Object.values(porAss));
    const escolhidas = [];
    while (escolhidas.length < n && filas.some(f => f.length)) for (const f of filas) { if (f.length && escolhidas.length < n) escolhidas.push(f.shift()); }
    if (escolhidas.length < n) faltas.push(`${d.nome}: só ${escolhidas.length}`);
    // Português: agrupa por texto-base
    if (d.id === 'portugues') escolhidas.sort((a, b) => (a.t ?? 1e9) - (b.t ?? 1e9));
    ids.push(...escolhidas.map(q => q.id));
  }
  if (!ids.length) return alert('Não há questões suficientes.');
  if (faltas.length) alert('Banco ainda pequeno nestas disciplinas — ' + faltas.join('; '));
  E.simAtual = { nome, ids, i: 0, esc: {}, rev: {}, riscadas: {}, inicio: Date.now(), fim: Date.now() + minutos * 60e3, min: minutos };
  salvar(); P = E.simAtual; ir('prova');
}
function salvarProva() { E.simAtual = P; salvar(); }
function pararRelogio() { clearInterval(relogioTimer); relogioTimer = null; $('#relogio').hidden = true; }
telas.prova = () => {
  P = E.simAtual;
  if (!P) return ir('simulado');
  titulo(P.nome);
  if (!relogioTimer) {
    const tick = () => {
      const rest = (P.fim - Date.now()) / 1000, el = $('#relogio');
      el.hidden = false; el.textContent = fmtTempo(rest); el.classList.toggle('alerta', rest < 600);
      if (rest <= 0) { pararRelogio(); alert('Tempo esgotado! Vamos ver o resultado.'); finalizarProva(); }
    };
    tick(); relogioTimer = setInterval(tick, 1000);
  }
  const id = P.ids[P.i], q = Q[id];
  const dq = q.d, iniDisc = P.ids.findIndex(x => Q[x].d === dq);
  tela.innerHTML = `
    <div class="barra-q"><span>Questão ${P.i + 1} de ${P.ids.length} · ${esc(DISC[dq].nome.replace(' – Psicóloga(o)', ''))} (${P.i - iniDisc + 1})</span>
      <span><button class="icone-btn ${P.rev[id] ? 'on' : ''}" data-acao="rev" title="Marcar para revisar">⚑</button></span></div>
    <div class="cartao">${questaoHTML(q, { escolha: P.esc[id], riscadas: P.riscadas[id] })}
      <div class="linha-botoes"><button class="botao sec" data-acao="pAnt" ${P.i ? '' : 'disabled'}>‹ Anterior</button>
      <button class="botao" data-acao="pProx">${P.i + 1 < P.ids.length ? 'Próxima ›' : 'Revisar e entregar'}</button></div></div>
    <div class="cartao"><h2>Mapa da prova</h2><div class="mapa">${P.ids.map((x, i) => `<button class="${P.esc[x] != null ? 'resp' : ''} ${P.rev[x] ? 'revisar' : ''} ${i === P.i ? 'atual' : ''}" data-acao="pIr" data-i="${i}">${i + 1}</button>`).join('')}</div>
      <p class="suave pequeno">${Object.keys(P.esc).length} respondidas · ⚑ = marcada para revisar</p>
      <div class="linha-botoes"><button class="botao ouro" data-acao="entregar">Entregar prova</button></div></div>`;
};
function marcarProva(el) { const id = P.ids[P.i]; P.esc[id] = +el.dataset.i; salvarProva(); telas.prova(); }
ACOES.rev = () => { const id = P.ids[P.i]; if (P.rev[id]) delete P.rev[id]; else P.rev[id] = 1; salvarProva(); telas.prova(); };
ACOES.pAnt = () => { P.i = Math.max(0, P.i - 1); salvarProva(); telas.prova(); window.scrollTo(0, 0); };
ACOES.pProx = () => { if (P.i + 1 < P.ids.length) { P.i++; salvarProva(); telas.prova(); window.scrollTo(0, 0); } else ACOES.entregar(); };
ACOES.pIr = el => { P.i = +el.dataset.i; salvarProva(); telas.prova(); window.scrollTo(0, 0); };
ACOES.entregar = () => {
  const falta = P.ids.length - Object.keys(P.esc).length;
  if (confirm(falta ? `Ainda há ${falta} em branco. Entregar mesmo assim?` : 'Entregar a prova?')) finalizarProva();
};
function finalizarProva() {
  pararRelogio();
  const porDisc = {};
  let acertos = 0;
  for (const id of P.ids) {
    const q = Q[id], e = P.esc[id], ok = e === q.g;
    porDisc[q.d] = porDisc[q.d] || { n: 0, ac: 0 }; porDisc[q.d].n++;
    if (ok) { acertos++; porDisc[q.d].ac++; }
    if (e != null) registrar(id, ok);
  }
  E.simulados.push({ data: Date.now(), nome: P.nome, total: P.ids.length, acertos, porDisc,
    dur: Math.min(Date.now(), P.fim) - P.inicio, min: P.min, itens: P.ids.map(id => [id, P.esc[id] ?? null]) });
  E.simAtual = null; P = null; salvar();
  history.replaceState(null, '', '#resultado/' + (E.simulados.length - 1)); render();
}
telas.resultado = (k, rev) => {
  const s = E.simulados[+k];
  if (!s) return ir('simulado');
  titulo('Resultado');
  const p = pct(s.acertos, s.total), passou = p >= 50;
  if (rev != null) {
    const [id, esc_] = s.itens[+rev], q = Q[id];
    if (!q) return history.back();
    tela.innerHTML = `<div class="barra-q"><span>Questão ${+rev + 1} de ${s.itens.length}</span></div>
      <div class="cartao">${questaoHTML(q, { escolha: esc_, corrigida: true })}
      <div class="linha-botoes"><button class="botao sec" data-acao="resNav" data-k="${k}" data-i="${+rev - 1}" ${+rev ? '' : 'disabled'}>‹ Anterior</button>
      <button class="botao" data-acao="resNav" data-k="${k}" data-i="${+rev + 1}" ${+rev + 1 < s.itens.length ? '' : 'disabled'}>Próxima ›</button></div></div>`;
    return;
  }
  tela.innerHTML = `
    <div class="cartao centro"><h2>${esc(s.nome)}</h2>
      <p class="numero">${s.acertos}/${s.total}</p><p>${p}% · ${passou ? '✓ acima do corte de 50%' : '✗ abaixo do corte de 50%'}</p>
      <p class="suave pequeno">${new Date(s.data).toLocaleString('pt-BR')} · tempo usado: ${fmtTempo(s.dur / 1000)} de ${s.min} min</p>
      <p class="suave">${passou ? 'Os escribas registram: aprovação à vista!' : 'Thoth ensina: cada erro mostra o caminho.'}</p></div>
    <div class="cartao"><h2>Por disciplina</h2>${Object.entries(s.porDisc).map(([d, v]) => barraHTML(DISC[d]?.nome || d, v.ac, v.n)).join('')}</div>
    <div class="cartao"><h2>Gabarito comentado</h2><div class="mapa">${s.itens.map(([id, e], i) => {
      const q = Q[id]; const cl = e == null ? '' : q && e === q.g ? 'certa' : 'errada';
      return `<button class="${cl}" data-acao="resNav" data-k="${k}" data-i="${i}">${i + 1}</button>`; }).join('')}</div>
      <p class="suave pequeno">Verde = certa · vermelho = errada · branco = em branco. Toque para ver o comentário.</p></div>
    <div class="linha-botoes"><button class="botao" data-acao="ir" data-rota="simulado">Novo simulado</button></div>`;
};
ACOES.resNav = el => ir(`resultado/${el.dataset.k}/${el.dataset.i}`);
function barraHTML(nome, ac, n) {
  const p = pct(ac, n);
  return `<div class="linha-stat"><span>${esc(nome)}</span><b>${ac}/${n} · ${p}%</b></div>
    <div class="barra ${n ? (p >= 70 ? 'boa' : p < 50 ? 'ruim' : '') : ''}"><i style="width:${p}%"></i></div>`;
}

// ---------- ESTATÍSTICAS + BACKUP ----------
telas.stats = () => {
  titulo('Desempenho');
  const porD = {}, porA = {};
  for (const [id, r] of Object.entries(E.resp)) {
    const q = Q[id]; if (!q) continue;
    (porD[q.d] = porD[q.d] || { n: 0, ac: 0 }); porD[q.d].n += r.n; porD[q.d].ac += r.ac;
    (porA[q.a] = porA[q.a] || { n: 0, ac: 0 }); porA[q.a].n += r.n; porA[q.a].ac += r.ac;
  }
  const fracos = Object.entries(porA).filter(([, v]) => v.n >= 3).sort((a, b) => a[1].ac / a[1].n - b[1].ac / b[1].n).slice(0, 8);
  const ult14 = [...Array(14)].map((_, i) => diaStr(somaDias(new Date(), i - 13)));
  const max = Math.max(1, ...ult14.map(d => E.dias[d] || 0));
  tela.innerHTML = `
    <div class="cartao"><h2>Por disciplina</h2>${B.disciplinas.map(d => barraHTML(d.nome, porD[d.id]?.ac || 0, porD[d.id]?.n || 0)).join('')}</div>
    ${fracos.length ? `<div class="cartao"><h2>Pontos a reforçar</h2>${fracos.map(([a, v]) => `<div data-acao="praticar" data-a="${a}" style="cursor:pointer">${barraHTML(nomeCurto(a), v.ac, v.n)}</div>`).join('')}
      <p class="suave pequeno">Toque num assunto para praticá-lo.</p></div>` : ''}
    <div class="cartao"><h2>Últimos 14 dias</h2>
      <div style="display:flex;align-items:flex-end;gap:4px;height:90px">${ult14.map(d => `<div title="${d}: ${E.dias[d] || 0}" style="flex:1;background:var(--ouro);border-radius:4px 4px 0 0;height:${Math.max(2, 85 * (E.dias[d] || 0) / max)}px;opacity:${E.dias[d] ? 1 : .25}"></div>`).join('')}</div>
      <p class="suave pequeno">Sequência atual: ${sequenciaDias()} dia(s). Simulados feitos: ${E.simulados.length}.</p></div>
    <div class="cartao"><h2>Backup do progresso</h2>
      <p class="suave pequeno">O progresso fica salvo só neste aparelho. Exporte de vez em quando para não perder (ou para passar para outro celular/computador).</p>
      <div class="linha-botoes"><button class="botao" data-acao="exportar">Exportar backup</button>
      <label class="botao sec">Importar backup<input type="file" accept="application/json,.json" data-mudou="importar" hidden></label></div>
      <hr><button class="botao sec" data-acao="zerar">Apagar todo o progresso</button></div>`;
};
ACOES.praticar = el => { Object.assign(filtro, { disc: [], ass: [el.dataset.a], orig: [], status: 'todas' }); ACOES.comecar(); };
ACOES.exportar = () => {
  const blob = new Blob([JSON.stringify(E)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `psytote-backup-${diaStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
ACOES.importar = async el => {
  const f = el.files[0]; if (!f) return;
  try {
    const dados = JSON.parse(await f.text());
    if (!dados || typeof dados.resp !== 'object') throw new Error('arquivo não é um backup do PsyTote');
    if (!confirm('Substituir o progresso atual pelo do backup?')) return;
    E = Object.assign(estadoPadrao(), dados); salvar(); alert('Backup restaurado!'); telas.stats();
  } catch (ex) { alert('Não consegui ler o backup: ' + ex.message); }
};
ACOES.zerar = () => { if (confirm('Apagar TODO o progresso (respostas, simulados, cronograma)? Isso não tem volta.') && confirm('Certeza mesmo?')) { E = estadoPadrao(); salvar(); telas.stats(); } };

// ---------- MATERIAIS ----------
telas.materiais = () => {
  titulo('Materiais');
  const m = B.materiais || {};
  tela.innerHTML = `
    ${(m.gerais || []).length ? `<div class="cartao links"><h2>Essenciais</h2>${m.gerais.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.titulo)} <small>↗</small></a>`).join('')}</div>` : ''}
    ${B.disciplinas.map(d => `<div class="cartao"><h2>${esc(d.nome)}</h2><p class="suave pequeno">${d.questoes_prova} questões na prova</p>
      ${B.assuntos.filter(a => a.disciplina === d.id).map(a => {
        const r = desempenhoAssunto(a.id);
        return `<div class="tarefa" data-acao="ir" data-rota="materia/${a.id}" style="cursor:pointer"><span class="desc">${esc(a.nome)}</span>
          <span class="suave pequeno">${contaAssunto(a.id)}q${r.n ? ` · ${pct(r.ac, r.n)}%` : ''} ›</span></div>`;
      }).join('')}</div>`).join('')}`;
};
const TIPO_LINK = { lei: 'Lei', resolucao: 'Resolução', cartilha: 'Cartilha', video: 'Vídeo', apostila: 'Apostila', outro: 'Site' };
function desempenhoAssunto(a) {
  let n = 0, ac = 0;
  for (const [id, r] of Object.entries(E.resp)) if (Q[id]?.a === a) { n += r.n; ac += r.ac; }
  return { n, ac };
}
telas.materia = a => {
  const as = ASS[a]; if (!as) return ir('materiais');
  titulo(nomeCurto(a));
  const m = (B.materiais?.assuntos || {})[a] || {};
  const n = contaAssunto(a);
  tela.innerHTML = `
    <div class="cartao"><h2>${esc(as.nome)}</h2><p class="suave pequeno">${esc(DISC[as.disciplina].nome)}</p>
      <div class="linha-botoes"><button class="botao" data-acao="praticar" data-a="${a}" ${n ? '' : 'disabled'}>Praticar · ${n} questões</button></div></div>
    ${m.dicas_fgv ? `<div class="aviso"><b>Como a FGV cobra:</b> ${esc(m.dicas_fgv)}</div>` : ''}
    ${(m.links || []).length ? `<div class="cartao links"><h2>Material</h2>${m.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.titulo)} <small>${esc(TIPO_LINK[l.tipo] || 'Site')} ↗</small></a>`).join('')}</div>` : ''}
    ${m.resumo_md ? `<div class="cartao md"><h2>Resumo</h2>${md(m.resumo_md)}</div>` : '<p class="suave">Resumo em preparação.</p>'}`;
};

// ---------- CRONOGRAMA ----------
function semanasAteProva() {
  if (!E.crono.inicio) { E.crono.inicio = diaStr(); salvar(); }
  const ini = new Date(E.crono.inicio + 'T00:00:00');
  // começa na segunda-feira da semana de início
  const seg = somaDias(ini, -((ini.getDay() + 6) % 7));
  const semanas = [];
  for (let d = seg; d < DATA_PROVA; d = somaDias(d, 7)) semanas.push(d);
  return semanas;
}
// Gera o plano do Thoth (determinístico a partir da data de início).
function planoThoth() {
  const sem = semanasAteProva(), W = sem.length;
  const conteudo = Math.max(1, W - 2); // últimas 2 semanas = revisão e simulados
  const porDisc = d => B.assuntos.filter(a => a.disciplina === d).map(a => a.id);
  const listas = {
    legislacao: porDisc('legislacao'),
    especificos: porDisc('especificos').flatMap(a => [a, a + '#2']), // cada eixo aparece 2x
    portugues: porDisc('portugues'),
    rlm: porDisc('rlm'),
  };
  const plano = sem.map((d, w) => ({ w, ini: d, fim: somaDias(d, 6), tarefas: [] }));
  for (const [disc, lst] of Object.entries(listas)) {
    lst.forEach((x, k) => {
      const w = Math.min(conteudo - 1, Math.floor(k * conteudo / lst.length));
      const [a, volta] = x.split('#');
      const n = disc === 'especificos' || disc === 'legislacao' ? 20 : 15;
      if (!volta) plano[w].tarefas.push({ tipo: 'ler', a, txt: `Ler resumo e material: ${nomeCurto(a)}` });
      plano[w].tarefas.push({ tipo: 'q', a, n, txt: `${n} questões${volta ? ' (2ª rodada)' : ''}: ${nomeCurto(a)}` });
    });
  }
  plano.forEach((p, w) => {
    if (w < conteudo) {
      if (w >= 1) p.tarefas.push({ tipo: 'rev', txt: 'Fazer a revisão do dia (questões que voltaram)' });
      if (w >= 2 && w % 3 !== 2) p.tarefas.push({ tipo: 'sim', p: 'mini', txt: 'Mini-simulado (20 questões, 1h)' });
      if (w >= 2 && w % 3 === 2) p.tarefas.push({ tipo: 'sim', p: 'objetiva', txt: 'Simulado completo (70 questões)' });
    } else {
      p.tarefas.push({ tipo: 'sim', p: 'objetiva', txt: 'Simulado completo (70 questões, 3h + 1h de redação no papel)' });
      p.tarefas.push({ tipo: 'erros', txt: 'Refazer as questões que errei' });
      p.tarefas.push({ tipo: 'sim', p: 'especifico', txt: 'Bloco da área: Legislação + Específicos' });
      if (w === W - 1) p.tarefas.push({ tipo: 'livre', txt: 'Véspera: revisão leve, separar documento + caneta preta transparente, chegar 1h30 antes (portões fecham 12h30)' });
    }
    p.tarefas.forEach((t, i) => { t.id = `t${w}-${i}`; t.origem = 'thoth'; });
  });
  return plano;
}
function tarefaHTML(t) {
  const feita = !!E.crono.feitos[t.id];
  let acao = '';
  if (t.tipo === 'ler') acao = `<a class="acao" href="#materia/${t.a}">abrir</a>`;
  if (t.tipo === 'q') acao = `<a class="acao" href="#" data-acao="cronoQ" data-a="${t.a}" data-n="${t.n}">fazer</a>`;
  if (t.tipo === 'sim') acao = `<a class="acao" href="#simulado">ir</a>`;
  if (t.tipo === 'rev') acao = `<a class="acao" href="#" data-acao="revisao">ir</a>`;
  if (t.tipo === 'erros') acao = `<a class="acao" href="#" data-acao="cronoErros">fazer</a>`;
  return `<div class="tarefa ${feita ? 'feita' : ''}"><input type="checkbox" ${feita ? 'checked' : ''} data-mudou="feito" data-id="${t.id}" aria-label="feito">
    <span class="desc">${esc(t.txt)}${t.origem === 'meu' ? '<span class="tag">meu</span>' : ''}</span>${acao}
    ${t.origem === 'meu' ? `<button class="riscar" data-acao="meuDel" data-id="${t.id}" title="Apagar">✕</button>` : ''}</div>`;
}
function proximasTarefas(n) {
  const hoje = new Date(), out = [];
  for (const p of planoThoth()) {
    if (p.fim < somaDias(hoje, -1)) continue;
    for (const t of p.tarefas) if (!E.crono.feitos[t.id]) out.push(t);
    if (out.length >= n) break;
  }
  for (const g of E.crono.meu) for (const t of g.itens) if (!E.crono.feitos[t.id] && grupoEhHoje(g.grupo)) out.unshift(t);
  return out.slice(0, n);
}
function grupoEhHoje(nome) {
  const h = new Date();
  const dd = String(h.getDate()).padStart(2, '0'), mm = String(h.getMonth() + 1).padStart(2, '0');
  return new RegExp(`\\b0?${h.getDate()}\\s*/\\s*0?${h.getMonth() + 1}\\b`).test(nome) || nome.includes(`${dd}/${mm}`);
}
telas.cronograma = () => {
  titulo('Cronograma');
  const v = E.crono.visao;
  const plano = planoThoth(), hoje = new Date();
  const feitasT = plano.flatMap(p => p.tarefas).filter(t => E.crono.feitos[t.id]).length, totT = plano.flatMap(p => p.tarefas).length;
  const meuHTML = `<div class="cartao"><h2>Meu cronograma</h2>
    ${E.crono.meu.length ? E.crono.meu.map((g, gi) => `<details class="semana ${grupoEhHoje(g.grupo) ? 'atual' : ''}" ${grupoEhHoje(g.grupo) || E.crono.meu.length < 4 ? 'open' : ''}>
      <summary>${esc(g.grupo)} <span class="suave pequeno">${g.itens.filter(t => E.crono.feitos[t.id]).length}/${g.itens.length}</span></summary>
      ${g.itens.map(t => tarefaHTML(t)).join('')}
      <div class="linha-add"><input type="text" placeholder="Nova tarefa…" id="nova-${gi}"><button class="botao sec" data-acao="meuAdd" data-g="${gi}">+</button></div></details>`).join('')
      : '<p class="suave">Ainda vazio. Cole abaixo o cronograma que você montou (do GPT, de uma planilha, de onde for) — cada linha vira uma tarefa marcável; linhas como "Semana 1", "Segunda:" ou "18/11" viram grupos.</p>'}
    <details ${E.crono.meu.length ? '' : 'open'}><summary class="suave" style="cursor:pointer;margin-top:8px">${E.crono.meu.length ? 'Importar/colar mais' : 'Colar meu cronograma'}</summary>
      <textarea id="colar" placeholder="Semana 1 (18/11 a 24/11)&#10;- Código de Ética: ler arts. 1 a 10&#10;- 20 questões de Res. 06/2019&#10;Semana 2&#10;- ..."></textarea>
      <div class="linha-botoes"><button class="botao" data-acao="meuImportar">Importar</button>
      ${E.crono.meu.length ? '<button class="botao sec" data-acao="meuLimpar">Apagar o meu</button>' : ''}</div></details></div>`;
  const thothHTML = `<div class="cartao"><h2>Plano do Thoth</h2><p class="suave pequeno">${feitasT}/${totT} tarefas · do dia ${fmtData(new Date(E.crono.inicio + 'T00:00:00'))} até a prova. Peso maior em Legislação e Específicos (45 das 70 questões).</p>
    ${plano.map(p => { const atual = p.ini <= hoje && hoje <= somaDias(p.fim, 1); const passada = somaDias(p.fim, 1) < hoje;
      const f = p.tarefas.filter(t => E.crono.feitos[t.id]).length;
      return `<details class="semana ${atual ? 'atual' : ''}" ${atual ? 'open' : ''}><summary>Semana ${p.w + 1} · ${fmtData(p.ini)}–${fmtData(p.fim)} <span class="suave pequeno">${f}/${p.tarefas.length}${passada && f < p.tarefas.length ? ' · atrasada' : ''}</span></summary>
      ${p.tarefas.map(t => tarefaHTML(t)).join('')}</details>`; }).join('')}
    <div class="linha-botoes"><button class="botao sec" data-acao="recomecar">Recomeçar o plano a partir de hoje</button></div></div>`;
  tela.innerHTML = `<div class="chips" style="margin-bottom:14px">${[['ambos', 'Os dois'], ['thoth', 'Do Thoth'], ['meu', 'O meu']].map(([k, n]) => `<button class="chip ${v === k ? 'on' : ''}" data-acao="visao" data-v="${k}">${n}</button>`).join('')}</div>
    ${v !== 'thoth' ? meuHTML : ''}${v !== 'meu' ? thothHTML : ''}`;
};
ACOES.visao = el => { E.crono.visao = el.dataset.v; salvar(); telas.cronograma(); };
ACOES.feito = el => { if (el.checked) E.crono.feitos[el.dataset.id] = Date.now(); else delete E.crono.feitos[el.dataset.id]; salvar(); el.closest('.tarefa').classList.toggle('feita', el.checked); };
ACOES.cronoQ = el => { Object.assign(filtro, { disc: [], ass: [el.dataset.a], orig: [], status: 'todas', qtd: +el.dataset.n }); ACOES.comecar(); };
ACOES.cronoErros = () => { Object.assign(filtro, { disc: [], ass: [], orig: [], status: 'erradas', qtd: 30 }); ACOES.comecar(); };
ACOES.recomecar = () => { if (confirm('Recomeçar o plano do Thoth a partir desta semana? As marcações do plano antigo serão apagadas.')) {
  for (const k of Object.keys(E.crono.feitos)) if (k.startsWith('t')) delete E.crono.feitos[k];
  E.crono.inicio = diaStr(); salvar(); telas.cronograma(); } };
ACOES.meuImportar = () => {
  const txt = $('#colar').value;
  const grupos = importarCronograma(txt);
  if (!grupos.length) return alert('Não encontrei tarefas no texto.');
  E.crono.meu.push(...grupos); salvar(); telas.cronograma();
};
ACOES.meuLimpar = () => { if (confirm('Apagar o seu cronograma importado?')) { E.crono.meu.flatMap(g => g.itens).forEach(t => delete E.crono.feitos[t.id]); E.crono.meu = []; salvar(); telas.cronograma(); } };
ACOES.meuAdd = el => {
  const g = E.crono.meu[+el.dataset.g], inp = $('#nova-' + el.dataset.g), txt = inp.value.trim();
  if (!txt) return;
  g.itens.push({ id: 'm' + Date.now().toString(36), txt, origem: 'meu' }); salvar(); telas.cronograma();
};
ACOES.meuDel = el => {
  for (const g of E.crono.meu) g.itens = g.itens.filter(t => t.id !== el.dataset.id);
  E.crono.meu = E.crono.meu.filter(g => g.itens.length);
  delete E.crono.feitos[el.dataset.id]; salvar(); telas.cronograma();
};
// Transforma texto livre (lista, markdown, tabela colada) em grupos de tarefas.
function importarCronograma(txt) {
  const DIAS = /^(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)(-feira)?\b/i;
  const grupos = []; let atual = null, n = 0;
  const novoId = () => 'm' + Date.now().toString(36) + (n++).toString(36);
  const grupo = nome => { atual = { grupo: nome.replace(/[:：]\s*$/, '').trim() || 'Sem título', itens: [] }; grupos.push(atual); };
  const item = t => { t = t.trim(); if (!t) return; if (!atual) grupo('Meu plano'); atual.itens.push({ id: novoId(), txt: t, origem: 'meu' }); };
  for (let l of txt.split(/\r?\n/)) {
    l = l.trim(); if (!l) continue;
    if (/^\|?\s*:?-{3,}/.test(l)) continue; // separador de tabela markdown
    if (l.includes('|') || l.includes('\t')) { // linha de tabela
      const cel = l.split(/\||\t/).map(c => c.replace(/\*\*/g, '').trim()).filter(Boolean);
      if (!cel.length) continue;
      if (/^(dia|data|semana|hor[aá]rio|per[ií]odo)$/i.test(cel[0])) continue; // cabeçalho
      if (cel.length === 1) { item(cel[0]); continue; }
      if (!atual || atual.grupo !== cel[0]) grupo(cel[0]);
      item(cel.slice(1).join(' — '));
      continue;
    }
    const limpo = l.replace(/^#+\s*/, '').replace(/\*\*/g, '');
    const ehTitulo = /^#/.test(l) || /:\s*$/.test(limpo) && limpo.length < 60 ||
      /^(semana|dia|m[eê]s|fase|etapa|bloco)\s*\d*/i.test(limpo) && limpo.length < 70 ||
      DIAS.test(limpo) && limpo.length < 40 || /^\d{1,2}\/\d{1,2}(\/\d{2,4})?\s*[:\-–]?\s*$/.test(limpo);
    if (ehTitulo) { grupo(limpo); continue; }
    item(limpo.replace(/^([-*•✅☐□▪◦]|\[\s?[xX]?\s?\]|\d+[.)])\s*/, ''));
  }
  return grupos.filter(g => g.itens.length);
}

// ---------- inicialização ----------
(async () => {
  try { await carregarBanco(); }
  catch (ex) { tela.innerHTML = `<div class="cartao"><h2>Ops</h2><p>Não consegui carregar o banco de questões. Verifique a internet na primeira abertura.</p><p class="suave pequeno">${esc(ex.message)}</p></div>`; return; }
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
