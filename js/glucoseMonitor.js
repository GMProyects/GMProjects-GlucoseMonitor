// Elementos DOM
const glucoseValueEl = document.getElementById("glucoseValueModal");
const lastUpdateEl = document.getElementById("lastUpdate");
const statusBadgeEl = document.getElementById("statusBadge");
const startButton = document.querySelector(".btn-monitor");
const glucoseNumberEl = document.getElementById("glucoseNumber");

let monitoring = false;
let intervalId;
const glucoseData = [];
const labels = [];

// ✅ Historial de valores finales
const measurementHistory = [];

// Variable que contiene el valor actual
let currentGlucoseValue = parseInt(glucoseNumberEl.textContent, 10);
console.log("Valor inicial cargado:", currentGlucoseValue);

// Chart.js config
let glucoseChart;
function initChart() {
  const ctx = document.getElementById('glucoseChart').getContext('2d');
  glucoseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Glucosa (mg/dL)',
        data: glucoseData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          suggestedMin: 50,
          suggestedMax: 200
        }
      }
    }
  });
}

function getStatusBadge(value) {
  if (value < 70) {
    return { text: "Baja", class: "bg-warning" };
  } else if (value > 140) {
    return { text: "Alta", class: "bg-danger" };
  } else {
    return { text: "Estable", class: "bg-success" };
  }
}

// Medición simulada
function generateMeasurement(startTime) {
  const elapsed = Date.now() - startTime;

  const variation = Math.floor(Math.random() * 21) - 10;
  const newValue = Math.max(50, currentGlucoseValue + variation);

  currentGlucoseValue = newValue;

  const now = new Date();
  const timeLabel = now.toLocaleTimeString();

  glucoseValueEl.textContent = `${newValue} mg/dL`;
  lastUpdateEl.textContent = `Última medición: ${timeLabel}`;

  const status = getStatusBadge(newValue);
  statusBadgeEl.textContent = status.text;
  statusBadgeEl.className = `badge ${status.class}`;

  labels.push(timeLabel);
  glucoseData.push(newValue);
  glucoseChart.update();

  if (labels.length > 10) {
    labels.shift();
    glucoseData.shift();
  }

  // ✅ Detener simulación a los 8s y guardar solo este valor
  if (elapsed >= 8000) {
  console.log("Deteniendo simulación tras 8 segundos");
  clearInterval(intervalId);
  monitoring = false;

  // Actualizar el valor en la tarjeta principal
  glucoseNumberEl.textContent = newValue;

  // Guardar solo este valor final en historial
  measurementHistory.push({
    timestamp: now.toISOString(),
    value: newValue
  });

  console.log("Historial actualizado:", measurementHistory);

  // ✅ Actualizar la alerta dinámica
  const alertContainer = document.getElementById("glucoseAlert");
  let alertHTML = "";
  let alertClass = "";
  
  if (newValue < 70) {
    alertClass = "alert-warning";
    alertHTML = `
      <strong>
        <i class="fas fa-exclamation-triangle text-warning"></i>
        Glucosa baja detectada:
      </strong> ${newValue} mg/dL
      <br>
      <small>Medición fuera del rango establecido</small>
    `;
  } else if (newValue > 140) {
    alertClass = "alert-danger";
    alertHTML = `
      <strong>
        <i class="fas fa-exclamation-circle text-danger"></i>
        Glucosa alta detectada:
      </strong> ${newValue} mg/dL
      <br>
      <small>Medición fuera del rango establecido</small>
    `;
  } else {
    alertClass = "alert-success";
    alertHTML = `
      <strong>
        <i class="fas fa-check-circle text-success"></i>
        Glucosa estable:
      </strong> ${newValue} mg/dL
      <br>
      <small>Dentro del rango recomendado</small>
    `;
  }

  // Actualizar contenido y clase
  alertContainer.className = `alert mb-2 ${alertClass}`;
  alertContainer.innerHTML = alertHTML;
  alertContainer.style.display = "block";
}
}

// Evento al hacer clic en "Iniciar monitoreo"
startButton.addEventListener("click", () => {
  currentGlucoseValue = parseInt(glucoseNumberEl.textContent, 10);
  console.log("Valor base al iniciar monitoreo:", currentGlucoseValue);

  const modal = new bootstrap.Modal(document.getElementById('monitorModal'));
  modal.show();

  if (!monitoring) {
    monitoring = true;
    initChart();

    const now = new Date();
    const timeLabel = now.toLocaleTimeString();

    glucoseValueEl.textContent = `${currentGlucoseValue} mg/dL`;
    lastUpdateEl.textContent = `Última medición: ${timeLabel}`;

    const status = getStatusBadge(currentGlucoseValue);
    statusBadgeEl.textContent = status.text;
    statusBadgeEl.className = `badge ${status.class}`;

    labels.push(timeLabel);
    glucoseData.push(currentGlucoseValue);
    glucoseChart.update();

    const startTime = Date.now();

    intervalId = setInterval(() => {
      generateMeasurement(startTime);
    }, 2000);
  }
});

// Limpiar cuando se cierra el modal
document.getElementById('monitorModal').addEventListener('hidden.bs.modal', () => {
  clearInterval(intervalId);
  monitoring = false;
  glucoseData.length = 0;
  labels.length = 0;

  if (glucoseChart) {
    glucoseChart.destroy();
  }

  glucoseValueEl.textContent = '--';
  lastUpdateEl.textContent = 'No hay mediciones';
  statusBadgeEl.textContent = 'Sin datos';
  statusBadgeEl.className = 'badge bg-secondary';
});

// Botón "Enviar alerta a familiar"
const alertButton = document.querySelector(".glucose-card .btn-outline-secondary");
alertButton.addEventListener("click", () => {
  Swal.fire({
    icon: 'success',
    title: 'Notificación enviada',
    text: 'Se ha notificado a tu familiar sobre tu estado de glucosa.',
    confirmButtonText: 'Entendido'
  });
});

// Botón para abrir el historial
const viewHistoryButton = document.getElementById("viewHistoryButton");

// Modal Bootstrap
const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));

// Evento click
viewHistoryButton.addEventListener("click", () => {
  const historyContainer = document.getElementById("historyContent");

  if (measurementHistory.length === 0) {
    historyContainer.innerHTML = "<p class='text-muted'>No hay mediciones registradas.</p>";
  } else {
    // Crear tabla
    let tableHTML = `
      <table class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Fecha y hora</th>
            <th>Valor (mg/dL)</th>
          </tr>
        </thead>
        <tbody>
    `;

    measurementHistory.forEach((record, index) => {
      const date = new Date(record.timestamp);
      tableHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${date.toLocaleString()}</td>
          <td>${record.value}</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    historyContainer.innerHTML = tableHTML;
  }

  // Mostrar modal
  historyModal.show();
});


// Botón de ver recomendaciones
const viewRecommendationsButton = document.getElementById("viewRecommendationsButton");

// Modal Bootstrap
const recommendationsModal = new bootstrap.Modal(document.getElementById('recommendationsModal'));

// Evento click
viewRecommendationsButton.addEventListener("click", () => {
  const recommendationsContainer = document.getElementById("recommendationsContent");

  if (measurementHistory.length === 0) {
    recommendationsContainer.innerHTML = "<p class='text-muted'>No hay mediciones registradas para generar recomendaciones.</p>";
  } else {
    // Tomar la última medición
    const lastRecord = measurementHistory[measurementHistory.length - 1];
    const value = lastRecord.value;

    let recommendationText = "";

    if (value < 70) {
      recommendationText = `
        <div class="alert alert-warning">
          <strong>Nivel bajo de glucosa.</strong><br>
          - Consume alimentos con carbohidratos de rápida absorción (jugo, tabletas de glucosa).<br>
          - Mide tu glucosa nuevamente en 15 minutos.<br>
          - Si persisten síntomas, consulta con tu médico.
        </div>
      `;
    } else if (value > 140) {
      recommendationText = `
        <div class="alert alert-danger">
          <strong>Nivel alto de glucosa.</strong><br>
          - Asegúrate de mantenerte hidratado.<br>
          - Realiza actividad física moderada si tu médico lo recomienda.<br>
          - Si tienes síntomas de hiperglucemia, contacta a tu médico.
        </div>
      `;
    } else {
      recommendationText = `
        <div class="alert alert-success">
          <strong>Nivel estable de glucosa.</strong><br>
          - Continúa con tu alimentación balanceada.<br>
          - Mantén tu monitoreo regular.<br>
          - Sigue tus indicaciones médicas.
        </div>
      `;
    }

    recommendationsContainer.innerHTML = `
      <p>Última medición registrada: <strong>${value} mg/dL</strong></p>
      ${recommendationText}
    `;
  }

  recommendationsModal.show();
});

// Referencia al modal
const monitorModalEl = document.getElementById('monitorModal');

// Interceptar antes de cerrar
monitorModalEl.addEventListener('hide.bs.modal', (event) => {
  if (monitoring) {
    // Si está monitoreando, impedir cierre y mostrar alerta
    event.preventDefault();
    Swal.fire({
      icon: 'warning',
      title: 'Medición en curso',
      text: 'Por favor, espera a que finalice la medición antes de cerrar.',
      confirmButtonText: 'Entendido'
    });
  } 
  // Si no está monitoreando, permitir cerrar y mostrar confirmación
  else {
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Medición finalizada',
        text: 'La medición ha concluido correctamente.',
        confirmButtonText: 'Ok'
      });
    }, 300); // Un pequeño retardo para que no se solape con la animación del modal
  }
});

