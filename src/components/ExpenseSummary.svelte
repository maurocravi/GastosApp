<script>
  import { dailyExpensesTotal, weeklyExpensesTotal } from '../stores/expenseStore.js';
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-4">Gastos de Hoy</h2>
    <div class="bg-white shadow-lg rounded-lg p-6">
        <p class="text-2xl font-bold text-gray-800">${$dailyExpensesTotal.toFixed(2)}</p>
    </div>
  </div>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-4">Gastos de la Semana</h2>
    <div class="bg-white shadow-lg rounded-lg p-6">
        <p class="text-2xl font-bold text-gray-800">${$weeklyExpensesTotal.toFixed(2)}</p>
    </div>
  </div>
</div>
