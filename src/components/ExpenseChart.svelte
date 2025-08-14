<script>
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { expenses, categoryColors } from '../stores/expenseStore.js';

  Chart.register(...registerables);

  let chartCanvas;
  let expenseChart = null;

  const unsubscribe = expenses.subscribe(({ data, loading, error }) => {
    if (!loading && !error) {
      updateChart(data);
    }
  });

  onMount(() => {
    renderChart();
  });

  onDestroy(() => {
    // Cleanup chart instance
    if (expenseChart) {
      expenseChart.destroy();
    }
    // Unsubscribe from the store to prevent memory leaks
    if (unsubscribe) {
      unsubscribe();
    }
  });

  function renderChart() {
    if (!chartCanvas) return;
    
    // Initial empty state for the chart
    expenseChart = new Chart(chartCanvas, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Distribución de Gastos por Categoría'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
              let amount = '';
              if (context.parsed !== null) {
              // Formatea el valor numérico como moneda y lo devuelve.
              amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
               }
              return amount;
             }
            }
          }
        }
      }
    });
  }

  function updateChart(data) {
    if (!expenseChart) return;

    const aggregateByCategory = data.reduce((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.cantidad;
      return acc;
    }, {});

    const labels = Object.keys(aggregateByCategory);
    const chartData = Object.values(aggregateByCategory);
    const backgroundColors = labels.map(label => categoryColors[label] || categoryColors.Default);

    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = chartData;
    expenseChart.data.datasets[0].backgroundColor = backgroundColors;
    expenseChart.update();
  }
</script>

<div class="bg-white shadow-md rounded-lg p-4 h-full">
  <canvas bind:this={chartCanvas}></canvas>
</div>
