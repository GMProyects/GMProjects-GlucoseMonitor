// Datos de ejemplo
const validUsername = "ana_cristina@gmail.com";
const validPassword = "1234";

const form = document.getElementById("loginForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value.trim();

  if (usernameInput === validUsername && passwordInput === validPassword) {
    Swal.fire({
      icon: "success",
      title: "Bienvenido",
      text: "Inicio de sesión exitoso.",
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      // Redirigir a la app
      window.location.href = "./views/appGlucoseAlert.html";
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Credenciales incorrectas",
      text: "Verifica tu usuario y contraseña."
    });
  }
});
