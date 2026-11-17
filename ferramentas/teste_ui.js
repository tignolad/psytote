// Teste de fumaça do PsyTote em viewport de celular.
// Uso: node ferramentas/teste_ui.js <url-base> <pasta-prints>
const pw = require(process.env.PLAYWRIGHT_MOD || 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const out = process.argv[3] || '/tmp';

(async () => {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: process.env.ESCURO ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  const shot = async n => page.screenshot({ path: `${out}/${n}.png`, fullPage: false });
  const ok = (c, msg) => { if (!c) { erros.push('FALHOU: ' + msg); } else console.log('ok -', msg); };

  await page.goto(base);
  await page.waitForSelector('.saudacao');
  await shot('01-inicio');
  ok(await page.locator('.contagem b').isVisible(), 'contagem regressiva visível');

  // Treino: filtro por disciplina e sessão de 10
  await page.click('.abas button[data-ir=treino]');
  await page.click('.chip[data-v=legislacao]');
  await page.click('.chip[data-acao=qtd][data-v="10"]');
  await shot('02-filtros');
  await page.click('[data-acao=comecar]');
  for (let i = 0; i < 3; i++) {
    await page.click('.alt[data-i="1"] .txt');
    if (i === 0) await page.click('.alt[data-i="0"] .riscar');
    await page.click('[data-acao=conferir]');
    if (i === 0) await shot('03-questao-corrigida');
    await page.click('[data-acao=proxima]');
  }
  ok((await page.textContent('.barra-q')).includes('4 de'), 'avançou para a 4ª questão');

  // Rápido + resultado
  await page.click('.abas button[data-ir=inicio]');
  await page.click('[data-acao=rapido]');
  for (let i = 0; i < 10; i++) { await page.click('.alt[data-i="0"] .txt'); await page.click('[data-acao=conferir]'); await page.click('[data-acao=proxima]'); }
  ok(await page.locator('text=Fim da sessão').isVisible(), 'fim da sessão rápida');
  await shot('04-fim-sessao');

  // Revisão deve ter pendências amanhã — forçamos vencimento
  await page.evaluate(() => { const e = JSON.parse(localStorage.getItem('psytote-v1')); for (const k in e.srs) e.srs[k].vence = '2000-01-01'; localStorage.setItem('psytote-v1', JSON.stringify(e)); });
  await page.goto(base + '#inicio'); await page.reload(); await page.waitForSelector('.saudacao');
  ok(/Revisão \(\d+\)/.test(await page.textContent('[data-acao=revisao]')), 'revisão com pendências');

  // Simulado mini
  await page.click('.abas button[data-ir=simulado]');
  await shot('05-simulado');
  await page.click('[data-acao=sim][data-p=mini]');
  await page.waitForSelector('.mapa');
  ok(await page.locator('#relogio').isVisible(), 'cronômetro visível');
  await page.click('.alt[data-i="2"] .txt');
  await page.click('[data-acao=rev]');
  await shot('06-prova');
  await page.goto(base + '#inicio'); await page.reload(); await page.waitForSelector('.saudacao');
  ok(await page.locator('text=simulado em andamento').isVisible(), 'simulado sobrevive a recarregar');
  await page.goto(base + '#prova'); await page.waitForSelector('.mapa');
  await page.click('[data-acao=entregar]');
  await page.waitForSelector('text=Por disciplina');
  await shot('07-resultado');
  await page.click('.mapa button >> nth=0');
  ok(await page.waitForSelector('.feedback', {timeout: 5000}).then(() => true, () => false), 'gabarito comentado do simulado');

  // Cronograma: importar texto
  await page.click('.abas button[data-ir=cronograma]');
  await page.fill('#colar', 'Semana 1 (17/11 a 23/11)\n- Código de Ética arts 1-10\n- 20 questões Res 06/2019\nSegunda:\n1. Lei 5.766\n| Dia | Tarefa |\n|---|---|\n| Terça | RLM proposições |');
  await page.click('[data-acao=meuImportar]');
  ok((await page.locator('.tarefa .tag').count()) === 4, 'importou 4 tarefas minhas');
  await page.click('.semana.atual input[type=checkbox] >> nth=0').catch(() => {});
  await shot('08-cronograma');

  // Materiais
  await page.click('.abas button[data-ir=materiais]');
  await page.click('[data-rota="materia/leg-codigo-etica"]');
  await shot('09-materia');

  // Stats
  await page.goto(base + '#stats'); await page.waitForSelector('text=Por disciplina');
  await shot('10-stats');

  console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'SEM ERROS');
  await browser.close();
  process.exit(erros.length ? 1 : 0);
})();
