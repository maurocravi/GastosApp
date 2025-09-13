<script>
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let title = '';
  export let expenses = [];

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  function formatExpenseDate(fecha) {
    const date = fecha.toDate ? fecha.toDate() : fecha;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  }
</script>

{#if isOpen}
<div class="fixed inset-0 bg-gray-100/70  flex justify-center items-center z-50">
  <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
    <div class="p-6 border-b border-gray-200">
      <h3 class="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    <div class="p-6 max-h-96 overflow-y-auto">
      {#if expenses.length > 0}
        <ul class="space-y-4">
          {#each expenses as expense (expense.id)}
            <li class="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p class="font-medium text-gray-900">{expense.descripcion}</p>
                <p class="text-sm text-gray-500">{expense.categoria || 'N/A'} - {formatExpenseDate(expense.fecha)}</p>
              </div>
              <p class="text-lg font-semibold text-gray-800">${expense.cantidad.toFixed(2)}</p>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-center text-gray-500">No hay gastos para mostrar.</p>
      {/if}
    </div>
    <div class="p-6 bg-gray-50 rounded-b-lg text-right">
      <button on:click={closeModal} class="cursor-pointer px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300">
        Cerrar
      </button>
    </div>
  </div>
</div>
{/if}
