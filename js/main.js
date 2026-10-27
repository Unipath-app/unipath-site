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

const AREAS = [
  { nome: 'Linguagens', cor: 'var(--area-linguagens)' },
  { nome: 'Humanas', cor: 'var(--area-humanas)' },
  { nome: 'Natureza', cor: 'var(--area-natureza)' },
  { nome: 'Matemática', cor: 'var(--area-matematica)' },
  { nome: 'Redação', cor: 'var(--area-redacao)' },
];
const formatoPorcento = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');

const criarComposicao = () => {
  const barra = document.getElementById('res-barra');
  const legenda = document.getElementById('res-legenda');
  const partes = AREAS.map(({ cor }) => {
    const parte = document.createElement('span');
    parte.style.setProperty('--cor', cor);
    return parte;
  });
  const itens = AREAS.map(({ nome, cor }) => {
    const item = document.createElement('li');
    item.style.setProperty('--cor', cor);
    item.append(nome, document.createElement('b'));
    return item;
  });
  barra.replaceChildren(...partes);
  legenda.replaceChildren(...itens);
  return (valores, pesos) => {
    const contribuicoes = valores.map((nota, i) => nota * pesos[i]);
    const total = contribuicoes.reduce((soma, parte) => soma + parte, 0);
    contribuicoes.forEach((parte, i) => {
      partes[i].style.flexGrow = String(parte);
      itens[i].querySelector('b').textContent = formatoPorcento.format(total === 0 ? 0 : parte / total);
    });
  };
};

const iniciarSimulador = () => {
  const botoes = [...document.querySelectorAll('#cursos [data-curso]')];
  const notas = [...document.querySelectorAll('#notas .nota')];
  const selo = document.getElementById('res-selo');
  const mediaSaida = document.getElementById('res-media');
  const atualizarComposicao = criarComposicao();
  let curso = CURSOS[0];
  let chanceAnterior = '';
  let mediaAnterior = null;

  const mostrarMedia = (media, animar) => {
    if (animar && mediaAnterior !== null && !movimentoReduzido.matches) {
      contar(mediaSaida, mediaAnterior, media, (v) => formatoNota.format(v), DURACAO_TROCA);
    } else {
      mediaSaida.textContent = formatoNota.format(media);
    }
    mediaAnterior = media;
  };

  const atualizar = (animar = false) => {
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
    mostrarMedia(media, animar);
    atualizarComposicao(valores, curso.pesos);
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

  notas.forEach((nota) => nota.querySelector('input').addEventListener('input', () => atualizar()));
  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      curso = CURSOS[Number(botao.dataset.curso)];
      botoes.forEach((outro) => outro.setAttribute('aria-pressed', String(outro === botao)));
      atualizar(true);
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

const observarUmaVez = (alvos, aoVer) => {
  if (!('IntersectionObserver' in window)) {
    alvos.forEach(aoVer);
    return;
  }
  const observador = new IntersectionObserver((entradas) => {
    entradas.filter((entrada) => entrada.isIntersecting).forEach((entrada) => {
      aoVer(entrada.target);
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  alvos.forEach((alvo) => observador.observe(alvo));
};

const marcarVisivel = (alvo) => alvo.classList.add('visivel');

const iniciarRevelacao = () => {
  const alvos = [...document.querySelectorAll(ALVOS_REVELACAO)];
  if (!('IntersectionObserver' in window)) return;
  alvos.forEach((alvo) => {
    const irmaos = [...alvo.parentElement.children].filter((filho) => alvos.includes(filho));
    alvo.style.setProperty('--atraso', `${irmaos.indexOf(alvo) * 80}ms`);
    alvo.classList.add('surge');
  });
  document.querySelectorAll('.mapa__preco').forEach((pino, i) => pino.style.setProperty('--i', String(i)));
  observarUmaVez(alvos, marcarVisivel);
  observarUmaVez([document.getElementById('calendario')], marcarVisivel);
};

const DURACAO_CONTAGEM = 1200;
const DURACAO_TROCA = 450;

const contar = (elemento, de, ate, formatar, duracao = DURACAO_CONTAGEM) => {
  const inicio = performance.now();
  const passo = (agora) => {
    const t = limitar((agora - inicio) / duracao, 0, 1);
    const suave = 1 - (1 - t) ** 3;
    elemento.textContent = formatar(de + (ate - de) * suave);
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
};

const iniciarNumeros = () => {
  const numeros = [...document.querySelectorAll('[data-alvo]')];
  if (movimentoReduzido.matches) return;
  observarUmaVez(numeros, (numero) => contar(numero, 0, Number(numero.dataset.alvo), (v) => String(Math.round(v))));
};

const ANOS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const SERIES_CORTE = [
  { curso: 'Medicina', ampla: [781, 788, 792, 799, 803, 797, 806, 812], publica: [742, 750, 755, 761, 768, 760, 771, 776] },
  { curso: 'Direito', ampla: [712, 718, 709, 724, 731, 726, 735, 738], publica: [681, 690, 684, 697, 702, 699, 707, 711] },
  { curso: 'Eng. Civil', ampla: [688, 694, 679, 671, 684, 690, 697, 701], publica: [655, 661, 648, 640, 652, 660, 668, 672] },
];
const MODOS = [{ id: 'ampla', nome: 'Ampla concorrência' }, { id: 'publica', nome: 'Escola pública' }];
const G = { largura: 480, altura: 220, esquerda: 44, direita: 14, topo: 16, base: 30, passoGrade: 20 };
const SVG_NS = 'http://www.w3.org/2000/svg';

const elementoSvg = (nome, atributos) => {
  const el = document.createElementNS(SVG_NS, nome);
  Object.entries(atributos).forEach(([chave, valor]) => el.setAttribute(chave, String(valor)));
  return el;
};

const escalaDoGrafico = (valores) => {
  const min = Math.floor((Math.min(...valores) - 10) / G.passoGrade) * G.passoGrade;
  const max = Math.ceil((Math.max(...valores) + 10) / G.passoGrade) * G.passoGrade;
  const x = (i) => G.esquerda + (i / (ANOS.length - 1)) * (G.largura - G.esquerda - G.direita);
  const y = (v) => G.topo + (1 - (v - min) / (max - min)) * (G.altura - G.topo - G.base);
  return { min, max, x, y };
};

const desenharGrade = (svg, { min, max, x, y }) => {
  const grade = elementoSvg('g', { class: 'grafico__grade' });
  for (let v = min; v <= max; v += G.passoGrade * 2) {
    grade.append(elementoSvg('line', { x1: G.esquerda, x2: G.largura - G.direita, y1: y(v), y2: y(v) }));
    const rotulo = elementoSvg('text', { x: G.esquerda - 8, y: y(v) + 4, 'text-anchor': 'end' });
    rotulo.textContent = String(v);
    grade.append(rotulo);
  }
  const eixo = elementoSvg('g', { class: 'grafico__eixo' });
  ANOS.forEach((ano, i) => {
    const rotulo = elementoSvg('text', { x: x(i), y: G.altura - 8, 'text-anchor': 'middle' });
    rotulo.textContent = String(ano);
    eixo.append(rotulo);
  });
  svg.append(grade, eixo);
};

const resumirSerie = (valores) => {
  const variacao = valores.at(-1) - valores[0];
  return [
    { rotulo: 'Corte em 2025', valor: formatoNota.format(valores.at(-1)) },
    { rotulo: 'Desde 2018', valor: `${variacao >= 0 ? '+' : ''}${formatoNota.format(variacao)}`, classe: variacao >= 0 ? 'sobe' : 'desce' },
    { rotulo: 'Menor corte', valor: `${formatoNota.format(Math.min(...valores))} em ${ANOS[valores.indexOf(Math.min(...valores))]}` },
  ];
};

const preencherResumo = (resumo, valores) => {
  resumo.replaceChildren(...resumirSerie(valores).map(({ rotulo, valor, classe }) => {
    const item = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = rotulo;
    dd.textContent = valor;
    if (classe) dd.className = classe;
    item.append(dt, dd);
    return item;
  }));
};

const criarBotoes = (alvo, itens, rotulo, aoEscolher) => {
  const botoes = itens.map((item, i) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = rotulo(item);
    botao.setAttribute('aria-pressed', String(i === 0));
    botao.addEventListener('click', () => {
      botoes.forEach((outro) => outro.setAttribute('aria-pressed', String(outro === botao)));
      aoEscolher(item);
    });
    return botao;
  });
  alvo.replaceChildren(...botoes);
};

const iniciarGrafico = () => {
  const caixa = document.getElementById('grafico-corte');
  const resumo = document.getElementById('grafico-resumo');
  let serie = SERIES_CORTE[0];
  let modo = MODOS[0];

  const desenhar = () => {
    const valores = serie[modo.id];
    const escala = escalaDoGrafico(valores);
    const svg = elementoSvg('svg', { viewBox: `0 0 ${G.largura} ${G.altura}` });
    desenharGrade(svg, escala);
    const pontos = valores.map((v, i) => `${escala.x(i)} ${escala.y(v)}`);
    const chao = escala.y(escala.min);
    svg.append(elementoSvg('path', { class: 'grafico__area', d: `M${escala.x(0)} ${chao} L${pontos.join(' L')} L${escala.x(valores.length - 1)} ${chao} Z` }));
    svg.append(elementoSvg('path', { class: 'grafico__linha redesenha', pathLength: 1, d: `M${pontos.join(' L')}` }));
    const guia = elementoSvg('line', { class: 'grafico__guia', y1: G.topo, y2: chao });
    svg.append(guia);
    const circulos = valores.map((v, i) => elementoSvg('circle', { class: 'grafico__ponto', cx: escala.x(i), cy: escala.y(v), r: 4.5 }));
    svg.append(...circulos);
    const dica = document.createElement('div');
    dica.className = 'grafico__dica';
    caixa.replaceChildren(svg, dica);

    const mostrarAno = (i) => {
      circulos.forEach((c, j) => c.classList.toggle('ativo', i === j));
      guia.setAttribute('x1', String(escala.x(i)));
      guia.setAttribute('x2', String(escala.x(i)));
      guia.classList.add('ativa');
      dica.innerHTML = `${ANOS[i]}: <b></b>`;
      dica.querySelector('b').textContent = formatoNota.format(valores[i]);
      dica.style.setProperty('--x', `${(escala.x(i) / G.largura) * 100}%`);
      dica.style.top = `${(escala.y(valores[i]) / G.altura) * 100}%`;
      dica.classList.add('ativa');
    };
    svg.addEventListener('pointermove', (evento) => {
      const area = svg.getBoundingClientRect();
      const fracao = ((evento.clientX - area.left) / area.width) * G.largura;
      const largura = G.largura - G.esquerda - G.direita;
      mostrarAno(Math.round(limitar((fracao - G.esquerda) / largura, 0, 1) * (ANOS.length - 1)));
    });
    svg.addEventListener('pointerleave', () => {
      circulos.forEach((c) => c.classList.remove('ativo'));
      guia.classList.remove('ativa');
      dica.classList.remove('ativa');
    });
    preencherResumo(resumo, valores);
  };

  criarBotoes(document.getElementById('grafico-cursos'), SERIES_CORTE, (s) => s.curso, (s) => { serie = s; desenhar(); });
  criarBotoes(document.getElementById('grafico-modos'), MODOS, (m) => m.nome, (m) => { modo = m; desenhar(); });
  observarUmaVez([caixa], desenhar);
};

iniciarHero();
iniciarTopo();
iniciarJornada();
iniciarSimulador();
iniciarFichas();
iniciarRevelacao();
iniciarNumeros();
iniciarGrafico();
