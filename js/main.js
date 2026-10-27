import { FICHAS } from './fichas.js';

const FASES = ['Explorando', 'Concorrendo', 'Ingressando', 'Instalando-se', 'Cursando'];
const FICHA_INICIAL = 'UFMG';
const formatoNota = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const iniciarHero = () => {
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('pronto')));
};

const iniciarRevelacao = () => {
  const alvos = document.querySelectorAll('.revela');
  if (!('IntersectionObserver' in window)) {
    alvos.forEach((alvo) => alvo.classList.add('visivel'));
    return;
  }
  document.querySelectorAll('section').forEach((secao) => {
    secao.querySelectorAll('.revela').forEach((alvo, ordem) => alvo.style.setProperty('--atraso', `${ordem * 80}ms`));
  });
  const observador = new IntersectionObserver((entradas) => {
    entradas.filter((entrada) => entrada.isIntersecting).forEach((entrada) => {
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15 });
  alvos.forEach((alvo) => observador.observe(alvo));
};

const iniciarTour = () => {
  const tour = document.getElementById('tour');
  const entrada = document.getElementById('etapa');
  const rotulos = tour.querySelectorAll('[data-ir]');
  const camadas = tour.querySelectorAll('.fala, .tela');

  const mostrar = (indice) => {
    tour.dataset.etapa = String(indice);
    entrada.value = String(indice);
    entrada.setAttribute('aria-valuetext', FASES[indice]);
    camadas.forEach((camada) => camada.classList.toggle('ativa', camada.dataset.i === String(indice)));
    rotulos.forEach((rotulo) => rotulo.setAttribute('aria-pressed', String(rotulo.dataset.ir === String(indice))));
  };

  entrada.addEventListener('input', () => mostrar(Number(entrada.value)));
  rotulos.forEach((rotulo) => rotulo.addEventListener('click', () => mostrar(Number(rotulo.dataset.ir))));
  document.querySelectorAll('.dialogo [data-ir]').forEach((opcao) => {
    opcao.addEventListener('click', () => mostrar(Number(opcao.dataset.ir)));
  });
  mostrar(0);
};

const mediaPonderada = (notas, pesos) => {
  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);
  const somaNotas = notas.reduce((soma, nota, i) => soma + nota * pesos[i], 0);
  return somaPesos === 0 ? 0 : somaNotas / somaPesos;
};

const iniciarCalculadora = () => {
  const barras = [...document.querySelectorAll('.barra')];
  const botoesPeso = document.querySelectorAll('[data-pesos]');
  const valor = document.getElementById('media-valor');
  let pesos = [1, 1, 1, 1, 1];

  const atualizar = () => {
    const notas = barras.map((barra) => Number(barra.querySelector('input').value));
    const contribuicoes = notas.map((nota, i) => nota * pesos[i]);
    const lider = contribuicoes.indexOf(Math.max(...contribuicoes));
    barras.forEach((barra, i) => {
      barra.style.setProperty('--nota', String(notas[i]));
      barra.querySelector('b').textContent = String(notas[i]);
      barra.querySelector('small span').textContent = String(pesos[i]);
      barra.classList.toggle('lider', i === lider);
    });
    valor.textContent = formatoNota.format(mediaPonderada(notas, pesos));
  };

  barras.forEach((barra) => barra.querySelector('input').addEventListener('input', atualizar));
  botoesPeso.forEach((botao) => {
    botao.addEventListener('click', () => {
      pesos = botao.dataset.pesos.split(',').map(Number);
      botoesPeso.forEach((outro) => outro.setAttribute('aria-pressed', String(outro === botao)));
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
    botao.innerHTML = `${ficha.sigla}<small></small>`;
    botao.querySelector('small').textContent = ficha.uf;
    botao.addEventListener('click', () => escolher(ficha, botao));
    lista.append(botao);
  });
  preencher(FICHAS.find((ficha) => ficha.sigla === FICHA_INICIAL));
};

iniciarHero();
iniciarTour();
iniciarCalculadora();
iniciarFichas();
iniciarRevelacao();
