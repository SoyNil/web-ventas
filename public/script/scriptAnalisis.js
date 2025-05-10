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
    // Llamar a la función para cargar el reporte de Power BI
    embedPowerBiReport();
});

// Configuración de Power BI (reemplaza con tus valores reales)
const powerBiConfig = {
    reportId: "TU_REPORT_ID", // Obtén desde Power BI Service
    workspaceId: "TU_WORKSPACE_ID", // Obtén desde Power BI Service
    embedUrl: "https://app.powerbi.com/reportEmbed?reportId=TU_REPORT_ID",
    accessToken: "", // Se generará dinámicamente
};

// Función para obtener el token de acceso (requiere backend)
async function getPowerBiAccessToken() {
    try {
        // Llamada al backend para obtener el token
        const response = await fetch("TU_BACKEND_ENDPOINT", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId: "TU_CLIENT_ID",
                clientSecret: "TU_CLIENT_SECRET",
                tenantId: "TU_TENANT_ID",
            }),
        });
        const data = await response.json();
        return data.accessToken;
    } catch (error) {
        console.error("Error al obtener el token de Power BI:", error);
        throw error;
    }
}

// Función para embeber el reporte de Power BI
async function embedPowerBiReport() {
    try {
        // Obtener token de acceso
        powerBiConfig.accessToken = await getPowerBiAccessToken();

        // Configuración del reporte
        const embedConfig = {
            type: "report",
            id: powerBiConfig.reportId,
            embedUrl: powerBiConfig.embedUrl,
            accessToken: powerBiConfig.accessToken,
            tokenType: powerbi.models.TokenType.Aad,
            settings: {
                panes: {
                    filters: { expanded: false, visible: false },
                },
            },
        };

        // Embeber el reporte
        const reportContainer = document.getElementById("powerbi-report-container");
        const report = powerbi.embed(reportContainer, embedConfig);

        // Manejar eventos (opcional)
        report.on("loaded", () => console.log("Reporte cargado"));
        report.on("error", (event) => console.error("Error:", event.detail));
    } catch (error) {
        console.error("Error al embeber el reporte:", error);
        alert("No se pudo cargar el análisis. Intenta de nuevo.");
        document.getElementById("powerbi-report-container").innerHTML =
            "<p style='text-align: center; color: #e53935;'>Error al cargar el análisis.</p>";
    }
}