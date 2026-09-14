const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

const usuarios = {
  aluno: { usuario: 'aluno', senha: '123456' },
  professor: { usuario: 'professor', senha: '123456' },
  coordenador: { usuario: 'coordenador', senha: '123456' },
  admin: { usuario: 'admin', senha: '123456' }
};

function getUsuarioLogado() {
  const localUser = localStorage.getItem('usuarioLogado');
  const sessionUser = sessionStorage.getItem('usuarioLogado');
  const rawUser = localUser || sessionUser;

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

loginForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const perfil = document.getElementById('perfil').value;

  const usuarioValido = usuarios[perfil];

  if (!usuarioValido) {
    message.textContent = 'Perfil inválido.';
    return;
  }

  if (usuario === usuarioValido.usuario && senha === usuarioValido.senha) {
    const usuarioLogado = { usuario, perfil };
    message.textContent = '';
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

    const paginas = {
      aluno: '../Pag_aluno/index.html',
      professor: '../Pag_Prof/index.html',
      coordenador: '../Pag_Coordenador/index.html',
      admin: '../Pag_Adm/index.html'
    };

    window.location.replace(paginas[perfil]);
  } else {
    message.textContent = 'Usuário, senha ou perfil incorretos.';
  }
});
