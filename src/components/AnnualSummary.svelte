<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { yearlyExpenses } from '../stores/expenseStore.js';

  let canvas;
  let chart = null;

  // Paleta de colores para el gráfico
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
    '#FF9F40', '#C9CBCF', '#7A8E9A', '#F7464A', '#46BFBD'
  ];

  // Registra los componentes de Chart.js una sola vez
  onMount(() => {
    Chart.register(...registerables);
  });

  // Destruye el gráfico al eliminar el componente para evitar fugas de memoria
  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  // Esta sección "reactiva" se ejecutará cada vez que $yearlyExpenses cambie
  $: if ($yearlyExpenses.length > 0 && canvas) {
    const labels = $yearlyExpenses.map(d => d.year);
    const totals = $yearlyExpenses.map(d => d.total);

    if (chart) {
      // Si el gráfico ya existe, actualiza sus datos
      chart.data.labels = labels;
      chart.data.datasets[0].data = totals;
      chart.data.datasets[0].backgroundColor = chartColors.slice(0, $yearlyExpenses.length);
      chart.update();
    } else {
      // Si el gráfico no existe, créalo
      chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label:' ' + 'Total Anual',
            data: totals,
            backgroundColor: chartColors.slice(0, $yearlyExpenses.length),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString('es-ES');
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) { label += ': '; }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }
  }
</script>

<div class="bg-white shadow-lg rounded-lg p-4">
  <h2 class="text-xl font-bold text-gray-800 mb-4">Resumen Anual</h2>
  <div class="relative h-64">
    {#if $yearlyExpenses && $yearlyExpenses.length > 0}
      <canvas bind:this={canvas}></canvas>
    {:else}
      <div class="absolute inset-0 flex items-center justify-center">
        <p class="text-center text-gray-500">No hay datos para mostrar en el gráfico anual.</p>
      </div>
    {/if}
  </div>
</div>
