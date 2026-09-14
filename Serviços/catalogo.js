(function () {
  'use strict';

  const storageKey = 'laboratoriosCampusSync';
  const defaultLabs = [
    {
      id: 1,
      nome: 'Laboratório de Informática 01',
      bloco: 'Bloco A',
      capacidade: 30,
      tipo: 'Informática',
      equipamentos: '20 computadores, projetor, impressora',
      status: 'Disponível',
      observacoes: 'Acesso por credencial da turma.'
    },
    {
      id: 2,
      nome: 'Laboratório de Química',
      bloco: 'Bloco C',
      capacidade: 24,
      tipo: 'Química',
      equipamentos: 'Bancadas, ventilação, microscópio',
      status: 'Em uso',
      observacoes: 'Reservado para aulas práticas.'
    },
    {
      id: 3,
      nome: 'Laboratório de Eletrônica',
      bloco: 'Bloco D',
      capacidade: 18,
      tipo: 'Eletrônica',
      equipamentos: 'Osciloscópios, protoboards, soldagem',
      status: 'Em manutenção',
      observacoes: 'Acesso restrito até revisão.'
    }
  ];

  function getLoggedUser() {
    try {
      const raw = localStorage.getItem('usuarioLogado') || sessionStorage.getItem('usuarioLogado');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getLabs() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) return saved;
    } catch {
      return defaultLabs.map((lab) => ({ ...lab }));
    }
    return defaultLabs.map((lab) => ({ ...lab }));
  }

  function saveLabs(labs) {
    localStorage.setItem(storageKey, JSON.stringify(labs));
    window.dispatchEvent(new Event('campusSyncDataChanged'));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function logout() {
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioLogado');
    window.location.replace('../Pagina_login/index.html');
  }

  window.CampusSync = Object.freeze({ getLoggedUser, getLabs, saveLabs, escapeHtml, logout });
})();
