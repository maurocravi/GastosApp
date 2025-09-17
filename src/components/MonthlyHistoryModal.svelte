<script>
  import { monthlyExpenses } from '../stores/expenseStore.js';

  export let isOpen = false;

  function closeModal() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-gray-100/80  z-50 flex justify-center items-center" on:click={closeModal}>
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" on:click|stopPropagation>
      <h2 class="text-lg font-bold mb-4">Historial de Gastos Mensuales</h2>
      <div class="overflow-y-auto max-h-96">
        <ul>
          {#each $monthlyExpenses as { month, year, total }}
            <li class="border-b last:border-b-0 py-2 flex justify-between">
              <span>{month} {year}</span>
              <span class="font-semibold">${total.toFixed(2)}</span>
            </li>
          {/each}
        </ul>
      </div>
      <button class="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300 cursor-pointer" on:click={closeModal}>
        Cerrar
      </button>
    </div>
  </div>
{/if}
