// Inicializar Firebase (asegúrate de que init.js ya llamó firebase.initializeApp)
let db;
try {
    db = firebase.database();
} catch (error) {
    console.error("Error al inicializar Firebase:", error);
    document.querySelector(".dashboard").innerHTML =
        "<p style='text-align: center; color: #e53935;'>Error al conectar con la base de datos.</p>";
}

// Evento para el botón Volver
document.getElementById("btn-volver").addEventListener("click", () => {
    window.location.href = "index.html";
});

// Verificar autenticación al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    if (!usuario) {
        alert("Debes iniciar sesión para ver el análisis");
        window.location.href = "index.html";
        return;
    }
    if (!db) {
        document.querySelector(".dashboard").innerHTML =
            "<p style='text-align: center; color: #e53935;'>Error al conectar con la base de datos.</p>";
        return;
    }
    cargarDatosDashboard();
});

// Función para cargar datos y crear gráficos
function cargarDatosDashboard() {
    try {
        db.ref("ventas").once("value", (snapshotVentas) => {
            db.ref("compras").once("value", (snapshotCompras) => {
                const ventas = snapshotVentas.val() || {};
                const compras = snapshotCompras.val() || {};

                if (!Object.keys(ventas).length && !Object.keys(compras).length) {
                    document.querySelector(".dashboard").innerHTML =
                        "<p style='text-align: center; color: #e53935;'>No hay datos disponibles para mostrar.</p>";
                    return;
                }

                const ventasPorVendedor = procesarVentasPorVendedor(ventas);
                const productosMasVendidos = procesarProductosMasVendidos(ventas);
                const comprasPorFecha = procesarComprasPorFecha(compras);

                crearGraficoVentasPorVendedor(ventasPorVendedor);
                crearGraficoProductosMasVendidos(productosMasVendidos);
                crearGraficoComprasPorFecha(comprasPorFecha);
            }, (error) => {
                console.error("Error al cargar compras:", error);
                document.querySelector(".dashboard").innerHTML =
                    "<p style='text-align: center; color: #e53935;'>Error al cargar los datos.</p>";
            });
        }, (error) => {
            console.error("Error al cargar ventas:", error);
            document.querySelector(".dashboard").innerHTML =
                "<p style='text-align: center; color: #e53935;'>Error al cargar los datos.</p>";
        });
    } catch (error) {
        console.error("Error en cargarDatosDashboard:", error);
        document.querySelector(".dashboard").innerHTML =
            "<p style='text-align: center; color: #e53935;'>Error al cargar los datos.</p>";
    }
}

// Procesar datos: Ventas por vendedor
function procesarVentasPorVendedor(ventas) {
    const resultado = {};
    for (let id in ventas) {
        const venta = ventas[id];
        const vendedor = venta.vendedor || "Desconocido";
        const total = parseFloat(venta.total) || 0;
        resultado[vendedor] = (resultado[vendedor] || 0) + total;
    }
    return resultado;
}

// Procesar datos: Productos más vendidos
function procesarProductosMasVendidos(ventas) {
    const resultado = {};
    for (let id in ventas) {
        const venta = ventas[id];
        if (venta.productos && Array.isArray(venta.productos)) {
            venta.productos.forEach((producto) => {
                const nombre = producto.nombre;
                const cantidad = producto.cantidad || 1;
                resultado[nombre] = (resultado[nombre] || 0) + cantidad;
            });
        }
    }
    return resultado;
}

// Procesar datos: Compras por fecha
function procesarComprasPorFecha(compras) {
    const resultado = {};
    for (let id in compras) {
        const compra = compras[id];
        if (compra.fecha) {
            const fecha = new Date(compra.fecha).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
            const total = parseFloat(compra.total) || 0;
            resultado[fecha] = (resultado[fecha] || 0) + total;
        }
    }
    return resultado;
}

// Gráfico: Ventas por Vendedor (Barras)
function crearGraficoVentasPorVendedor(data) {
    const ctx = document.getElementById("ventasPorVendedor").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(data),
            datasets: [
                {
                    label: "Total Ventas (S/)",
                    data: Object.values(data),
                    backgroundColor: "rgba(3, 155, 229, 0.6)",
                    borderColor: "#039be5",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: "Total (S/)" } },
                x: { title: { display: true, text: "Vendedor" } },
            },
        },
    });
}

// Gráfico: Productos Más Vendidos (Pastel)
function crearGraficoProductosMasVendidos(data) {
    const ctx = document.getElementById("productosMasVendidos").getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(data),
            datasets: [
                {
                    label: "Cantidad Vendida",
                    data: Object.values(data),
                    backgroundColor: [
                        "rgba(3, 155, 229, 0.6)",
                        "rgba(255, 161, 0, 0.6)",
                        "rgba(229, 57, 53, 0.6)",
                        "rgba(76, 175, 80, 0.6)",
                    ],
                    borderColor: ["#039be5", "#ffa100", "#e53935", "#4caf50"],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
        },
    });
}

// Gráfico: Compras por Fecha (Líneas)
function crearGraficoComprasPorFecha(data) {
    const ctx = document.getElementById("comprasPorFecha").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: Object.keys(data).sort(),
            datasets: [
                {
                    label: "Total Compras (S/)",
                    data: Object.values(data),
                    backgroundColor: "rgba(255, 161, 0, 0.6)",
                    borderColor: "#ffa100",
                    borderWidth: 2,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: "Total (S/)" } },
                x: { title: { display: true, text: "Fecha" } },
            },
        },
    });
}