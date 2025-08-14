<script>
  import { onMount } from 'svelte';
  import { Chart, DoughnutController, ArcElement, CategoryScale, Legend, Title, Tooltip } from 'chart.js';
  import { expenses as expenseStore } from '../stores/expenseStore';

  let canvas;
  let chart;
  let expenses = [];

  // Register Chart.js components
  Chart.register(DoughnutController, ArcElement, CategoryScale, Legend, Title, Tooltip);

  // Subscribe to the expense store
  const unsubscribe = expenseStore.subscribe(value => {
    if (value.data) {
      expenses = value.data;
      if (chart) {
        updateChart();
      }
    }
  });

  onMount(() => {
    const ctx = canvas.getContext('2d');
    chart = new Chart(ctx, {
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
    updateChart();

    return () => {
      unsubscribe();
      chart.destroy();
    };
  });

  function updateChart() {
    if (!chart || !expenses.length) return;

    const categories = {};
    expenses.forEach(expense => {
      if (categories[expense.categoria]) {
        categories[expense.categoria] += expense.cantidad;
      } else {
        categories[expense.categoria] = expense.cantidad;
      }
    });

    const categoryColors = {
        'Comida/Bebida': '#3B82F6', // blue-500
        'Gastos Personales': '#10B981', // green-500
        'Hogar': '#F59E0B',    // yellow-500
        'Ocio': '#EF4444',      // red-500
        'Otros': '#8B5CF6',    // purple-500
    };

    chart.data.labels = Object.keys(categories);
    chart.data.datasets[0].data = Object.values(categories);
    chart.data.datasets[0].backgroundColor = chart.data.labels.map(label => categoryColors[label] || '#6B7280'); // gray-500 for fallback
    chart.update();
  }
</script>

<div class="bg-white shadow-lg rounded-lg p-4 h-full">
  <canvas bind:this={canvas}></canvas>
</div>
