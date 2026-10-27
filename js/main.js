import { FICHAS } from './fichas.js';

const FICHA_INICIAL = 'UFMG';
const CORES_FASE = 5;
const REGUA_MIN = 550;
const REGUA_MAX = 850;
const NOTA_MIN = 300;
const NOTA_MAX = 1000;
const MARGEM_MUITO_ALTA = 10;
const MARGEM_ARRISCADO = -25;

const CURSOS = [
  { nome: 'Engenharia Civil', pesos: [1, 1, 2, 3, 1], corte: 698.12 },
  { nome: 'Medicina', pesos: [1, 1, 3, 2, 2], corte: 794.26 },
  { nome: 'Direito', pesos: [2, 3, 1, 1, 2], corte: 718.5 },
  { nome: 'Psicologia', pesos: [1, 2, 2, 1, 2], corte: 709.85 },
  { nome: 'Computação', pesos: [1, 1, 2, 4, 1], corte: 731.4 },
];

const formatoNota = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const limitar = (valor, min, max) => Math.min(max, Math.max(min, valor));

const iniciarHero = () => {
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('pronto')));
};

const iniciarTopo = () => {
  const topo = document.getElementById('topo');
  const atualizar = () => topo.classList.toggle('rolou', window.scrollY > 12);
  window.addEventListener('scroll', atualizar, { passive: true });
  atualizar();
};

const iniciarJornada = () => {
  const lista = document.getElementById('fases');
  const fases = [...lista.querySelectorAll('.fase')];
  const telas = document.querySelectorAll('#celular-jornada .tela');
  const palco = document.querySelector('.jornada__palco');
  let atual = -1;
  let agendado = false;

  const mostrar = (indice) => {
    if (indice === atual) return;
    atual = indice;
    fases.forEach((fase, i) => {
      fase.classList.toggle('ativa', i === indice);
      fase.classList.toggle('passou', i < indice);
    });
    telas.forEach((tela) => tela.classList.toggle('ativa', tela.dataset.i === String(indice)));
    palco.dataset.cor = String(indice % CORES_FASE);
  };

  const medir = () => {
    agendado = false;
    const meio = window.innerHeight * 0.55;
    const caixa = lista.getBoundingClientRect();
    lista.style.setProperty('--progresso', String(limitar((meio - caixa.top) / caixa.height, 0, 1)));
    const passadas = fases.filter((fase) => fase.getBoundingClientRect().top <= meio).length;
    mostrar(Math.max(0, passadas - 1));
  };

  const agendar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(medir);
  };

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  document.querySelectorAll('.dialogo [data-ir]').forEach((opcao) => {
    opcao.addEventListener('click', (evento) => {
      evento.preventDefault();
      fases[Number(opcao.dataset.ir)].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
  medir();
};

const mediaPonderada = (notas, pesos) => {
  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);
  const somaNotas = notas.reduce((soma, nota, i) => soma + nota * pesos[i], 0);
  return somaPesos === 0 ? 0 : somaNotas / somaPesos;
};

const chancePorMargem = (margem) => {
  if (margem >= MARGEM_MUITO_ALTA) return { texto: 'Muito Alta', cor: 'verde' };
  if (margem >= 0) return { texto: 'Boa', cor: 'azul' };
  if (margem >= MARGEM_ARRISCADO) return { texto: 'Arriscado', cor: 'ambar' };
  return { texto: 'Difícil', cor: 'vermelho' };
};

const posicaoNaRegua = (nota) => `${limitar((nota - REGUA_MIN) / (REGUA_MAX - REGUA_MIN), 0, 1) * 100}%`;

const iniciarSimulador = () => {
  const botoes = [...document.querySelectorAll('#cursos [data-curso]')];
  const notas = [...document.querySelectorAll('#notas .nota')];
  const selo = document.getElementById('res-selo');
  let curso = CURSOS[0];
  let chanceAnterior = '';

  const atualizar = () => {
    const valores = notas.map((nota) => Number(nota.querySelector('input').value));
    notas.forEach((nota, i) => {
      const entrada = nota.querySelector('input');
      entrada.style.setProperty('--p', `${((valores[i] - NOTA_MIN) / (NOTA_MAX - NOTA_MIN)) * 100}%`);
      nota.querySelector('output').textContent = String(valores[i]);
      nota.querySelector('label b').textContent = String(curso.pesos[i]);
    });
    const media = mediaPonderada(valores, curso.pesos);
    const chance = chancePorMargem(media - curso.corte);
    document.getElementById('res-curso').textContent = curso.nome;
    document.getElementById('res-media').textContent = formatoNota.format(media);
    document.getElementById('res-corte').textContent = formatoNota.format(curso.corte);
    document.getElementById('res-voce').style.setProperty('--x', posicaoNaRegua(media));
    document.getElementById('res-marca').style.setProperty('--x', posicaoNaRegua(curso.corte));
    selo.textContent = chance.texto;
    selo.className = `selo selo--grande selo--${chance.cor}`;
    if (chanceAnterior && chanceAnterior !== chance.texto) {
      void selo.offsetWidth;
      selo.classList.add('mudou');
    }
    chanceAnterior = chance.texto;
  };

  notas.forEach((nota) => nota.querySelector('input').addEventListener('input', atualizar));
  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      curso = CURSOS[Number(botao.dataset.curso)];
      botoes.forEach((outro) => outro.setAttribute('aria-pressed', String(outro === botao)));
      atualizar();
    });
  });
  atualizar();
};

const itemDaFicha = ({ titulo, url }) => {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = titulo;
  item.append(link);
  return item;
};

const iniciarFichas = () => {
  const lista = document.getElementById('lista-fichas');
  const folha = document.getElementById('folha');

  const preencher = (ficha) => {
    document.getElementById('folha-sigla').textContent = ficha.sigla;
    document.getElementById('folha-nome').textContent = `${ficha.nome} · ${ficha.cidade}, ${ficha.uf}`;
    document.getElementById('folha-itens').replaceChildren(...ficha.itens.map(itemDaFicha));
    document.getElementById('folha-data').textContent = `Links conferidos em ${formatoData.format(new Date(ficha.verificado))}.`;
  };

  const escolher = (ficha, botao) => {
    lista.querySelectorAll('button').forEach((outro) => outro.setAttribute('aria-pressed', String(outro === botao)));
    folha.classList.add('trocando');
    setTimeout(() => {
      preencher(ficha);
      folha.classList.remove('trocando');
    }, 220);
  };

  FICHAS.forEach((ficha) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.setAttribute('aria-pressed', String(ficha.sigla === FICHA_INICIAL));
    botao.append(ficha.sigla);
    const uf = document.createElement('small');
    uf.textContent = ficha.uf;
    botao.append(uf);
    botao.addEventListener('click', () => escolher(ficha, botao));
    lista.append(botao);
  });
  preencher(FICHAS.find((ficha) => ficha.sigla === FICHA_INICIAL));
};

const ALVOS_REVELACAO = [
  '.jornada__cabeca > *',
  '.simulador__texto > *',
  '.resultado',
  '.fichas__texto > *',
  '.folha',
  '.extras h2',
  '.bloco',
  '.faq h2',
  '.faq details',
  '.convite__texto > *',
  '.dialogo',
].join(',');

const iniciarRevelacao = () => {
  const alvos = [...document.querySelectorAll(ALVOS_REVELACAO)];
  if (!('IntersectionObserver' in window)) return;
  alvos.forEach((alvo) => {
    const irmaos = [...alvo.parentElement.children].filter((filho) => alvos.includes(filho));
    alvo.style.setProperty('--atraso', `${irmaos.indexOf(alvo) * 80}ms`);
    alvo.classList.add('surge');
  });
  const observador = new IntersectionObserver((entradas) => {
    entradas.filter((entrada) => entrada.isIntersecting).forEach((entrada) => {
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  alvos.forEach((alvo) => observador.observe(alvo));
};

iniciarHero();
iniciarTopo();
iniciarJornada();
iniciarSimulador();
iniciarFichas();
iniciarRevelacao();
