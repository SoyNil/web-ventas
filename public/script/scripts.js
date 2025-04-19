// script/scripts.js
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("usuarioActual");
        actualizarInterfazUsuario();
        alert("Sesión cerrada");
      });
    const db = firebase.database();

// REGISTRARSE
document.getElementById("register-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = e.target[0].value;
  const correo = e.target[1].value;
  const contraseña = e.target[2].value;

  // Validación rápida
  if (!nombre || !correo || !contraseña) return alert("Completa todos los campos");

  const nuevoUsuario = {
    nombre,
    correo,
    contraseña
  };

  db.ref("usuarios").push(nuevoUsuario)
    .then(() => {
      alert("Usuario registrado con éxito");
      e.target.reset();
      document.getElementById("modal-register").style.display = "none";
    })
    .catch(err => alert("Error al registrar: " + err.message));
});

// INICIAR SESIÓN
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const correo = e.target[0].value;
  const contraseña = e.target[1].value;

  db.ref("usuarios").once("value", (snapshot) => {
    let usuarioValido = false;
    snapshot.forEach(child => {
      const data = child.val();
      if (data.correo === correo && data.contraseña === contraseña) {
        usuarioValido = true;
        alert(`Bienvenido, ${data.nombre}`);
        // Aquí puedes guardar el usuario logueado en localStorage o como prefieras
        document.getElementById("modal-login").style.display = "none";
      }
      if (data.correo === correo && data.contraseña === contraseña) {
        usuarioValido = true;
        alert(`Bienvenido, ${data.nombre}`);
        localStorage.setItem("usuarioActual", JSON.stringify(data)); // Guardamos sesión
        document.getElementById("modal-login").style.display = "none";
        actualizarInterfazUsuario(); // Llamamos a la función para actualizar botones
      }      
    });
    if (!usuarioValido) alert("Correo o contraseña incorrectos");
  });
});
function actualizarInterfazUsuario() {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
  
    const btnsAuth = document.getElementById("auth-buttons");
    const btnsUser = document.getElementById("user-buttons");
  
    if (usuario) {
      btnsAuth.style.display = "none";
      btnsUser.style.display = "flex";
    } else {
      btnsAuth.style.display = "flex";
      btnsUser.style.display = "none";
    }
  }

  const form = document.getElementById("form-producto");
  const lista = document.getElementById("lista-productos");
  const btnAgregar = document.getElementById("btn-agregar");

  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = document.getElementById("imagen").files[0];
    const base64Image = await convertToBase64(file);

    const producto = {
      nombre: form.nombre.value,
      descripcion: form.descripcion.value,
      precio: form.precio.value,
      imagen: base64Image,
    };

    db.ref("productos").push(producto);
    form.reset();
    form.style.display = "none";
  });

  db.ref("productos").on("value", (snapshot) => {
    lista.innerHTML = "";
    const data = snapshot.val();
    for (let id in data) {
      const p = data[id];
      lista.innerHTML += `
        <div class="producto">
          <img src="${p.imagen}" alt="${p.nombre}" />
          <h2>${p.nombre}</h2>
          <p>${p.descripcion}</p>
          <strong>S/ ${p.precio}</strong>
        </div>
      `;
    }
  });

  btnAgregar.addEventListener("click", () => {
    form.style.display = form.style.display === "none" || form.style.display === "" ? "block" : "none";
  });
});
// Botones y modales
const btnLogin = document.getElementById("btn-login");
const btnRegister = document.getElementById("btn-register");
const modalLogin = document.getElementById("modal-login");
const modalRegister = document.getElementById("modal-register");

btnLogin.addEventListener("click", () => {
  modalLogin.style.display = "block";
});

btnRegister.addEventListener("click", () => {
  modalRegister.style.display = "block";
});

document.querySelectorAll(".close").forEach(btn => {
  btn.addEventListener("click", () => {
    const modalId = btn.getAttribute("data-close");
    document.getElementById(modalId).style.display = "none";
  });
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
});
actualizarInterfazUsuario();