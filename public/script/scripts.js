// script/scripts.js
document.addEventListener("DOMContentLoaded", () => {
    // Evento para el botón Análisis
    document.getElementById("btn-analisis").addEventListener("click", () => {
        const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
        if (!usuario) {
            alert("Debes iniciar sesión para ver el análisis");
            return;
        }
        window.location.href = "analisis.html"; // Redirige a analisis.html
    });
    const listaCesta = document.getElementById("lista-cesta");
    const modalCesta = document.getElementById("modal-cesta");
    const btnCesta = document.getElementById("btn-cesta");
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
    const modalRegister = document.getElementById("modal-register");
    const mensajeRegistro = document.getElementById("mensaje-registro");

    function convertToBase64(file) {
        return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        });
    }

    // Mostrar/ocultar formulario al presionar botón
    btnAgregar.addEventListener("click", () => {
        const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

        if (!usuario) {
        mensajeRegistro.textContent = "Debe iniciar sesión para agregar un producto";
        modalRegister.style.display = "block"; // Mostrar modal de registro
        return;
        }

        form.style.display = form.style.display === "none" ? "block" : "none";
    });

    // Subida del producto
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const file = document.getElementById("imagen").files[0];
        const base64Image = await convertToBase64(file);
        const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

        if (!usuario) return;

        const producto = {
        nombre: form.nombre.value,
        descripcion: form.descripcion.value,
        precio: form.precio.value,
        imagen: base64Image,
        autor: usuario.nombre || "Anónimo"
        };

        db.ref("productos").push(producto);
        form.reset();
        form.style.display = "none";
    });

    // Crear arreglo global para la cesta
    let cesta = [];

    db.ref("productos").on("value", (snapshot) => {
        lista.innerHTML = "";
        const data = snapshot.val();
        for (let id in data) {
        const p = data[id];
        lista.innerHTML += `
            <div class="producto">
                <img src="${p.imagen}" alt="${p.nombre}"/>
            <h2>${p.nombre}</h2>
            <p>${p.descripcion}</p>
            <strong>S/ ${p.precio}</strong>
            <p style="font-size: 12px; color: gray;">Agregado por: ${p.autor || "Desconocido"}</p>
            <button class="agregar-carrito" data-id="${id}" data-nombre="${p.nombre}" data-precio="${p.precio}">🛒 Agregar</button>
            </div>
        `;
        }

        // Botones de agregar al carrito
        document.querySelectorAll(".agregar-carrito").forEach(btn => {
        btn.addEventListener("click", () => {
            const nombre = btn.dataset.nombre;
            const precio = btn.dataset.precio;

            cesta.push({ nombre, precio });
            actualizarContadorCesta();
            alert(`"${nombre}" añadido a la cesta`);
        });
        });
    });

    function actualizarContadorCesta() {
        document.getElementById("contador-cesta").textContent = cesta.length;
    }

    // Mostrar cesta al hacer clic en el ícono
    btnCesta.addEventListener("click", () => {
        renderizarCesta();
        modalCesta.style.display = "block";
    });

    // Función para renderizar la cesta completamente
    function renderizarCesta() {
        listaCesta.innerHTML = "";

        if (cesta.length === 0) {
        listaCesta.innerHTML = "<li>Tu cesta está vacía.</li>";
        return;
        }   

        cesta.forEach((p, index) => {
        listaCesta.innerHTML += `
            <li class="item-cesta">
            <span><strong>${p.nombre}</strong> - S/ ${p.precio}</span>
            <button class="eliminar-item" data-index="${index}">❌</button>
            </li>
        `;
        });

        listaCesta.innerHTML += `
        <li><strong id="total-cesta">Total: S/ ${calcularTotal()}</strong></li>
        <li><button id="btn-pagar">Pagar</button></li>
        `;

        // Botón "Pagar" con nueva lógica
        document.getElementById("btn-pagar").addEventListener("click", () => {
            const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
            if (!usuario) {
                alert("Debes iniciar sesión para realizar una compra");
                return;
            }

            // Obtener detalles de los productos comprados
            const compra = {
                usuario: usuario.nombre,
                correo: usuario.correo,
                productos: cesta,
                total: calcularTotal(),
                fecha: new Date().toISOString()
            };

            // Registrar en la tabla "Compras"
            db.ref("compras").push(compra)
                .then(() => {
                    // Registrar en la tabla "Ventas"
                    registrarVentas(cesta, usuario)
                        .then(() => {
                            alert("¡Compra realizada exitosamente!");
                            cesta = []; // Vaciar la cesta
                            actualizarContadorCesta();
                            renderizarCesta(); // Mostrar la cesta vacía
                            modalCesta.style.display = "none"; // Cerrar el modal
                        })
                        .catch(err => alert("Error al registrar ventas: " + err.message));
                })
                .catch(err => alert("Error al registrar compra: " + err.message));
        });
    }

    // Nueva función para registrar las ventas
    async function registrarVentas(cesta, comprador) {
        // Agrupar productos por vendedor (autor)
        const ventasPorVendedor = {};

        // Obtener todos los productos de la base de datos para obtener el autor
        const snapshot = await db.ref("productos").once("value");
        const productos = snapshot.val();

        cesta.forEach(item => {
            // Buscar el producto en la base de datos para obtener su autor
            for (let id in productos) {
                if (productos[id].nombre === item.nombre && productos[id].precio === item.precio) {
                    const autor = productos[id].autor || "Desconocido";
                    if (!ventasPorVendedor[autor]) {
                        ventasPorVendedor[autor] = {
                            vendedor: autor,
                            comprador: comprador.nombre,
                            productos: [],
                            total: 0
                        };
                    }
                    ventasPorVendedor[autor].productos.push(item);
                    ventasPorVendedor[autor].total += parseFloat(item.precio);
                    break;
                }
            }
        });

        // Registrar cada venta en la tabla "Ventas"
        const promesasVentas = [];
        for (let autor in ventasPorVendedor) {
            const venta = {
                vendedor: autor,
                comprador: comprador.nombre,
                productos: ventasPorVendedor[autor].productos,
                total: ventasPorVendedor[autor].total.toFixed(2),
                fecha: new Date().toISOString()
            };
            promesasVentas.push(db.ref("ventas").push(venta));
        }

        // Esperar a que todas las ventas se registren
        await Promise.all(promesasVentas);
    }

    // Delegación de eventos para eliminar producto
    listaCesta.addEventListener("click", (event) => {
        if (event.target && event.target.classList.contains("eliminar-item")) {
        const index = event.target.dataset.index;
        cesta.splice(index, 1); // Eliminar producto de la lista
        actualizarContadorCesta();
        actualizarInterfazUsuario();
        renderizarCesta(); // Redibujar la cesta completa (productos y total)
        }
    });

    // Función para calcular el total (ya definida en tu código)
    function calcularTotal() {
        let total = 0;
        cesta.forEach(p => {
            total += parseFloat(p.precio);
        });
        return total.toFixed(2);
    }


    // Botones y modales
    const btnLogin = document.getElementById("btn-login");
    const btnRegister = document.getElementById("btn-register");
    const modalLogin = document.getElementById("modal-login");

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

    document.getElementById("btn-perfil").addEventListener("click", () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    if (!usuario) return;

    const seccionPerfil = document.getElementById("perfil-usuario");
    const listaPerfil = document.getElementById("lista-perfil");

    // Si está visible, lo ocultamos y limpiamos contenido
    if (seccionPerfil.classList.contains("visible")) {
        seccionPerfil.classList.remove("visible");
        seccionPerfil.style.display = "none";
        listaPerfil.innerHTML = "";
        return;
    }

    // Si no está visible, lo mostramos y cargamos los productos
    seccionPerfil.classList.add("visible");
    seccionPerfil.style.display = "block";
    listaPerfil.innerHTML = "";

    db.ref("productos").once("value", (snapshot) => {
        const data = snapshot.val();
        let productosUsuario = 0;

        for (const id in data) {
        const producto = data[id];

        if (producto.autor === usuario.nombre) {
            productosUsuario++;

            const li = document.createElement("li");
            li.innerHTML = `
            <input type="text" value="${producto.nombre}" data-id="${id}" class="edit-nombre" />
            <input type="text" value="${producto.descripcion}" data-id="${id}" class="edit-descripcion" />
            <input type="number" value="${producto.precio}" data-id="${id}" class="edit-precio" />
            <button class="guardar-cambios" data-id="${id}">Guardar</button>
            `;
            listaPerfil.appendChild(li);
        }
        }

        if (productosUsuario === 0) {
        listaPerfil.innerHTML = "<li>No has agregado ningún producto aún.</li>";
        }
    });
    });

    // Guardar cambios al hacer clic
    document.getElementById("lista-perfil").addEventListener("click", (e) => {
    if (e.target.classList.contains("guardar-cambios")) {
        const id = e.target.dataset.id;

        const nombre = document.querySelector(`.edit-nombre[data-id="${id}"]`).value;
        const descripcion = document.querySelector(`.edit-descripcion[data-id="${id}"]`).value;
        const precio = document.querySelector(`.edit-precio[data-id="${id}"]`).value;

        db.ref("productos/" + id).update({
        nombre,
        descripcion,
        precio
        });

        alert("¡Producto actualizado!");
    }
    });
});