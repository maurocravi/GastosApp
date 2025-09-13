<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import { expenses, categoryColors } from '../stores/expenseStore.js';

  let chartCanvas;
  let expenseChart;
  let currentMonthTotal = 0;

  expenses.subscribe(value => {
    if (value.loading || !value.data.length) return;

    const monthlyData = processMonthlyData(value.data);
    currentMonthTotal = monthlyData.currentMonthTotal;
    if (expenseChart) {
      updateChart(monthlyData.chartData);
    } else {
      createChart(monthlyData.chartData);
    }
  });

  function processMonthlyData(data) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = data.filter(e => {
      const expenseDate = new Date(e.fecha);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const total = monthlyExpenses.reduce((acc, curr) => acc + curr.monto, 0);

    const categoryTotals = monthlyExpenses.reduce((acc, curr) => {
      acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.monto;
      return acc;
    }, {});

    const labels = Object.keys(categoryTotals);
    const chartDataValues = Object.values(categoryTotals);
    const backgroundColors = labels.map(label => categoryColors[label] || categoryColors.Default);

    return {
      currentMonthTotal: total,
      chartData: {
        labels,
        datasets: [{
          data: chartDataValues,
          backgroundColor: backgroundColors
        }]
      }
    };
  }

  function createChart(data) {
    if (!chartCanvas) return;
    expenseChart = new Chart(chartCanvas, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  }

  function updateChart(data) {
    if (!expenseChart) return;
    expenseChart.data = data;
    expenseChart.update();
  }

  onMount(() => {
    const currentExpenses = $expenses;
    if (!currentExpenses.loading && currentExpenses.data.length) {
        const monthlyData = processMonthlyData(currentExpenses.data);
        if(!expenseChart){
            createChart(monthlyData.chartData);
        }
    }
  });
</script>

<div class="bg-white p-4 rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-2">Resumen del Mes</h2>
    <p class="text-lg">Total gastado este mes: <span class="font-semibold">${currentMonthTotal.toFixed(2)}</span></p>
    <div class="mt-4 h-64">
        <canvas bind:this={chartCanvas}></canvas>
    </div>
</div>
