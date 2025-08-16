<script>
  import { onMount } from 'svelte';
  import { paginatedExpenses, currentPage, nextPage, prevPage } from '../stores/expenseStore';
  import { deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
  import { db } from '../utils/firebase';
  import { showNotification } from './Notification.svelte';

  let editingExpense = null;
  let editedDescription = '';
  let editedAmount = '';
  let editedDate = '';
  let editedCategory = '';

  const categories = ['Ocio', 'Comida/Bebida', 'Hogar', 'Gastos Personales', 'Otros'];
  let monthlySummaries = {};
  let yearlySummaries = {};

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  function formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  const deleteExpense = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return;
    try {
      await deleteDoc(doc(db, 'gastos', id));
      showNotification('Gasto eliminado correctamente', 'success');
    } catch (e) {
      console.error("Error removing document: ", e);
      showNotification('Error al eliminar el gasto', 'error');
    }
  };

  const startEditing = (expense) => {
    editingExpense = expense;
    editedDescription = expense.descripcion;
    editedAmount = expense.cantidad;
    editedDate = formatDateForInput(expense.fecha);
    editedCategory = expense.categoria || 'Otros';
  };

  const cancelEditing = () => {
    editingExpense = null;
  };

  const updateExpense = async () => {
    try {
      const expenseRef = doc(db, 'gastos', editingExpense.id);
      
      await updateDoc(expenseRef, {
        descripcion: editedDescription,
        cantidad: parseFloat(editedAmount),
        fecha: Timestamp.fromDate(new Date(editedDate)),
        categoria: editedCategory
      });
      editingExpense = null;
      showNotification('Gasto actualizado correctamente', 'success');
    } catch (e) {
      console.error("Error updating document: ", e);
      showNotification('Error al actualizar el gasto', 'error');
    }
  };

  const calculateSummaries = (expenses) => {
    const monthly = {};
    const yearly = {};

    expenses.forEach(expense => {
      const date = new Date(expense.fecha);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();

      const monthYearKey = `${year}-${month}`;
      if (!monthly[monthYearKey]) {
        monthly[monthYearKey] = { year: year, month: month, total: 0 };
      }
      monthly[monthYearKey].total += expense.cantidad;

      if (!yearly[year]) {
        yearly[year] = { year: year, total: 0 };
      }
      yearly[year].total += expense.cantidad;
    });

    monthlySummaries = Object.entries(monthly)
      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
      .map(([key, value]) => ({ ...value, monthName: monthNames[value.month] }));

    yearlySummaries = Object.entries(yearly)
      .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
      .map(([key, value]) => value);
  };

  // Subscribe to the paginated store
  paginatedExpenses.subscribe(value => {
    if (value && value.data) {
      calculateSummaries(value.data); // Calculate summaries based on all expenses
    }
  });
</script>

<div class="container mx-auto p-4 sm:p-6 lg:p-8">
  <!-- Summaries -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <div>
      <h2 class="text-xl font-bold text-gray-800 mb-4">Resumen Anual</h2>
      <div class="bg-white shadow-lg rounded-lg overflow-hidden">
        {#if yearlySummaries.length > 0}
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-gray-700">
              <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th scope="col" class="px-6 py-3">Año</th>
                  <th scope="col" class="px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {#each yearlySummaries as summary (summary.year)}
                  <tr class="bg-white ">
                    <td class="px-6 py-4 font-medium text-gray-900">{summary.year}</td>
                    <td class="px-6 py-4 text-gray-500">${summary.total.toFixed(2)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="p-6 text-center text-gray-500">No hay datos para el resumen anual.</p>
        {/if}
      </div>
    </div>
    <div>
      <h2 class="text-xl font-bold text-gray-800 mb-4">Resumen Mensual</h2>
      <div class="bg-white shadow-lg rounded-lg overflow-hidden">
        {#if monthlySummaries.length > 0}
          <div class="overflow-x-auto max-h-80">
            <table class="min-w-full text-sm text-left text-gray-700">
              <thead class="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                <tr>
                  <th scope="col" class="px-6 py-3">Mes</th>
                  <th scope="col" class="px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody class="overflow-y-auto">
                {#each monthlySummaries as summary (`${summary.year}-${summary.month}`)}
                  <tr class="bg-white">
                    <td class="px-6 py-4 font-medium text-gray-900">{summary.monthName} {summary.year}</td>
                    <td class="px-6 py-4 text-gray-500">${summary.total.toFixed(2)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="p-6 text-center text-gray-500">No hay datos para el resumen mensual.</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Lista de Gastos -->
  <h2 class="text-xl font-bold text-gray-800 mb-4">Lista de Gastos</h2>
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    {#if $paginatedExpenses.loading}
      <p class="px-6 py-10 text-center text-gray-500">Cargando gastos...</p>
    {:else if $paginatedExpenses.error}
      <p class="px-6 py-10 text-center text-red-500">{$paginatedExpenses.error}</p>
    {:else if $paginatedExpenses.paginatedData.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-700">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th scope="col" class="px-6 py-3">Descripción</th>
              <th scope="col" class="px-6 py-3">Categoría</th>
              <th scope="col" class="px-6 py-3">Cantidad</th>
              <th scope="col" class="px-6 py-3">Fecha</th>
              <th scope="col" class="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each $paginatedExpenses.paginatedData as expense (expense.id)}
              {#if editingExpense && editingExpense.id === expense.id}
                <!-- Fila de Edición -->
                <tr class="bg-blue-50 border-b">
                  <td class="px-6 py-4"><input type="text" bind:value={editedDescription} class="w-full bg-white border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"></td>
                  <td class="px-6 py-4">
                    <select bind:value={editedCategory} class="w-full bg-white border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                      {#each categories as cat}<option value={cat}>{cat}</option>{/each}
                    </select>
                  </td>
                  <td class="px-6 py-4"><input type="number" bind:value={editedAmount} class="w-full bg-white border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"></td>
                  <td class="px-6 py-4"><input type="date" bind:value={editedDate} class="w-full bg-white border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"></td>
                  <td class="px-6 py-4 text-right">
                    <button on:click={updateExpense} class="font-medium text-green-600 hover:text-green-800 mr-4 transition-all duration-300 ease-in-out cursor-pointer">Guardar</button>
                    <button on:click={cancelEditing} class="font-medium text-gray-600 hover:text-gray-800 transition-all duration-300 ease-in-out cursor-pointer">Cancelar</button>
                  </td>
                </tr>
              {:else}
                <!-- Fila normal -->
                <tr class="bg-white border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium text-gray-900">{expense.descripcion}</td>
                  <td class="px-6 py-4 text-gray-500">{expense.categoria || 'N/A'}</td>
                  <td class="px-6 py-4 text-gray-500">${expense.cantidad.toFixed(2)}</td>
                  <td class="px-6 py-4 text-gray-500">{expense.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}</td>
                  <td class="px-6 py-4 text-right">
                    <button on:click={() => startEditing(expense)} class="font-medium text-indigo-600 hover:text-indigo-900 mr-4 transition-all duration-300 ease-in-out cursor-pointer">Editar</button>
                    <button on:click={() => deleteExpense(expense.id)} class="font-medium text-red-600 hover:text-red-900 transition-all duration-300 ease-in-out cursor-pointer">Eliminar</button>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
      <!-- Pagination Controls -->
      <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div class="flex flex-1 justify-between sm:hidden">
          <button on:click={prevPage} disabled={$currentPage === 1} class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-300 ease-in-out cursor-pointer">Anterior</button>
          <button on:click={() => nextPage($paginatedExpenses.totalPages)} disabled={$currentPage === $paginatedExpenses.totalPages} class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-300 ease-in-out cursor-pointer">Siguiente</button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Página
              <span class="font-medium">{$currentPage}</span>
              de
              <span class="font-medium">{$paginatedExpenses.totalPages}</span>
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button on:click={prevPage} disabled={$currentPage === 1} class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors duration-300 ease-in-out cursor-pointer">
                <span class="sr-only">Anterior</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" /></svg>
              </button>
              <button on:click={() => nextPage($paginatedExpenses.totalPages)} disabled={$currentPage === $paginatedExpenses.totalPages} class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors duration-300 ease-in-out cursor-pointer">
                <span class="sr-only">Siguiente</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    {:else}
      <p class="px-6 py-10 text-center text-gray-500">No hay gastos registrados. ¡Añade uno para empezar!</p>
    {/if}
  </div>
</div>
