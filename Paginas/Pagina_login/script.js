const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const recoveryForm = document.getElementById('recoveryForm');
const message = document.getElementById('message');
const registerMessage = document.getElementById('registerMessage');
const recoveryMessage = document.getElementById('recoveryMessage');
const USERS_KEY = 'usuariosCampusSync';

const seedUsers = [
  { usuario: 'aluno', nome: 'Aluno demonstração', email: 'aluno@campussync.edu.br', perfil: 'aluno', status: 'Ativo', acesso: 'Hoje', senha: '123456' },
  { usuario: 'professor', nome: 'Professor demonstração', email: 'professor@campussync.edu.br', perfil: 'professor', status: 'Ativo', acesso: 'Hoje', senha: '123456' },
  { usuario: 'coordenador', nome: 'Coordenador demonstração', email: 'coordenador@campussync.edu.br', perfil: 'coordenador', status: 'Ativo', acesso: 'Hoje', senha: '123456' },
  { usuario: 'admin', nome: 'Administrador', email: 'admin@campussync.edu.br', perfil: 'admin', status: 'Ativo', acesso: 'Hoje', senha: '123456' }
];

const pages = {
  aluno: '../Pag_aluno/index.html',
  professor: '../Pag_Prof/index.html',
  coordenador: '../Pag_Coordenador/index.html',
  admin: '../Pag_Adm/index.html'
};

function readUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(USERS_KEY));
    const users = Array.isArray(saved) ? saved : [];
    seedUsers.forEach((seed) => {
      const existing = users.find((item) => item.usuario === seed.usuario);
      if (!existing) users.push({ ...seed });
      else {
        existing.email = existing.email || seed.email;
        existing.nome = existing.nome || seed.nome;
        existing.status = existing.status || seed.status;
        if (!existing.passwordHash && !existing.senha) existing.senha = seed.senha;
      }
    });
    return users;
  } catch {
    return seedUsers.map((user) => ({ ...user }));
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(password);
    const hash = await window.crypto.subtle.digest('SHA-256', bytes);
    return `sha256:${Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  }
  return `plain:${password}`;
}

async function passwordMatches(user, password) {
  if (user.passwordHash) return user.passwordHash === await hashPassword(password);
  return user.senha === password;
}

function setMessage(element, text, success = false) {
  element.textContent = text;
  element.classList.toggle('message-success', success);
}

function showForm(form) {
  [loginForm, registerForm, recoveryForm].forEach((item) => { item.hidden = item !== form; });
  [message, registerMessage, recoveryMessage].forEach((item) => setMessage(item, ''));
}

document.getElementById('showRegister').addEventListener('click', () => showForm(registerForm));
document.getElementById('showRecovery').addEventListener('click', () => showForm(recoveryForm));
document.querySelectorAll('[data-back-login]').forEach((button) => button.addEventListener('click', () => showForm(loginForm)));

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const usuario = document.getElementById('usuario').value.trim().toLowerCase();
  const senha = document.getElementById('senha').value;
  const perfil = document.getElementById('perfil').value;
  const users = readUsers();
  const user = users.find((item) => item.usuario.toLowerCase() === usuario && item.perfil === perfil && item.status !== 'Inativo');
  if (!user || !(await passwordMatches(user, senha))) {
    setMessage(message, 'Usuário, senha ou perfil incorretos.');
    return;
  }
  user.acesso = new Date().toLocaleString('pt-BR');
  user.passwordHash = user.passwordHash || await hashPassword(senha);
  delete user.senha;
  saveUsers(users);
  const loggedUser = { usuario: user.usuario, perfil: user.perfil, nome: user.nome };
  localStorage.setItem('usuarioLogado', JSON.stringify(loggedUser));
  sessionStorage.setItem('usuarioLogado', JSON.stringify(loggedUser));
  window.location.replace(pages[user.perfil]);
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const usuario = document.getElementById('novoUsuario').value.trim().toLowerCase();
  const email = document.getElementById('novoEmail').value.trim().toLowerCase();
  const senha = document.getElementById('novaSenha').value;
  const confirmacao = document.getElementById('confirmarSenha').value;
  const users = readUsers();
  if (users.some((item) => item.usuario.toLowerCase() === usuario || item.email?.toLowerCase() === email)) {
    setMessage(registerMessage, 'Usuário ou e-mail já cadastrado.');
    return;
  }
  if (senha !== confirmacao) {
    setMessage(registerMessage, 'As senhas não conferem.');
    return;
  }
  users.push({ usuario, nome: document.getElementById('novoNome').value.trim(), email, perfil: document.getElementById('novoPerfil').value, status: 'Ativo', acesso: 'Ainda não acessou', criadoEm: new Date().toISOString(), passwordHash: await hashPassword(senha) });
  saveUsers(users);
  registerForm.reset();
  showForm(loginForm);
  setMessage(message, 'Usuário criado. Entre com seus novos dados.', true);
});

recoveryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const usuario = document.getElementById('recuperarUsuario').value.trim().toLowerCase();
  const email = document.getElementById('recuperarEmail').value.trim().toLowerCase();
  const senha = document.getElementById('recuperarSenha').value;
  const confirmacao = document.getElementById('confirmarRecuperacao').value;
  const users = readUsers();
  const user = users.find((item) => item.usuario.toLowerCase() === usuario && item.email?.toLowerCase() === email);
  if (!user) {
    setMessage(recoveryMessage, 'Não encontramos uma conta com esses dados.');
    return;
  }
  if (senha !== confirmacao) {
    setMessage(recoveryMessage, 'As senhas não conferem.');
    return;
  }
  user.passwordHash = await hashPassword(senha);
  delete user.senha;
  saveUsers(users);
  recoveryForm.reset();
  showForm(loginForm);
  setMessage(message, 'Senha redefinida com sucesso. Faça login novamente.', true);
});
