<script>
  import { expenses } from '../stores/expenseStore.js';

  let currentPage = 1;
  const itemsPerPage = 12;

  $: paginatedExpenses = $expenses.data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: totalPages = Math.ceil($expenses.data.length / itemsPerPage);

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage += 1;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage -= 1;
    }
  }
</script>

<div class="bg-white p-4 md:p-6 rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold text-gray-800 mb-4">Lista de Gastos</h2>
  
  {#if $expenses.loading}
    <p class="text-gray-500">Cargando gastos...</p>
  {:else if $expenses.error}
    <p class="text-red-500">Error: {$expenses.error}</p>
  {:else if $expenses.data.length === 0}
    <p class="text-gray-500">No hay gastos registrados. ¡Añade uno para empezar!</p>
  {:else}
    <ul class="space-y-4">
      {#each paginatedExpenses as expense (expense.id)}
        <li class="flex items-center justify-between p-3 rounded-md transition-shadow duration-200 hover:shadow-md" style="border-left: 5px solid {expense.color};">
          <div>
            <p class="font-semibold text-gray-700">{expense.descripcion}</p>
            <p class="text-sm text-gray-500">{expense.categoria}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-lg text-gray-800">${typeof expense.monto === 'number' ? expense.monto.toFixed(2) : 'N/A'}</p>
            <p class="text-xs text-gray-400">{new Date(expense.fecha).toLocaleDateString()}</p>
          </div>
        </li>
      {/each}
    </ul>

    {#if totalPages > 1}
      <div class="mt-6 flex justify-center items-center">
        <button on:click={prevPage} disabled={currentPage === 1} class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
          Anterior
        </button>
        <span class="px-4 text-gray-700">
          Página {currentPage} de {totalPages}
        </span>
        <button on:click={nextPage} disabled={currentPage === totalPages} class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
          Siguiente
        </button>
      </div>
    {/if}
  {/if}
</div>
