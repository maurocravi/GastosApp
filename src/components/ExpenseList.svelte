<script>
  import { paginatedExpenses, currentPage, nextPage, prevPage } from '../stores/expenseStore';
  import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
  import { db } from '../utils/firebase';
  import { showNotification } from './Notification.svelte';
  import ConfirmationModal from './ConfirmationModal.svelte';

  let editingExpense = null;
  let editedDescription = '';
  let editedAmount = '';
  let editedDate = '';
  let editedCategory = '';

  let isConfirmationModalOpen = false;
  let expenseToDeleteId = null;

  const categories = ['Ocio', 'Comida/Bebida', 'Hogar', 'Gastos Personales', 'Otros'];

  $: if ($currentPage > $paginatedExpenses.totalPages) {
    currentPage.set($paginatedExpenses.totalPages || 1);
  }

  function formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  const handleDeleteRequest = (id) => {
    expenseToDeleteId = id;
    isConfirmationModalOpen = true;
  };

  const handleModalConfirm = async () => {
    isConfirmationModalOpen = false;
    if (expenseToDeleteId) {
      try {
        await deleteDoc(doc(db, 'gastos', expenseToDeleteId));
        showNotification('Gasto eliminado correctamente', 'success');
      } catch (e) {
        console.error("Error removing document: ", e);
        showNotification('Error al eliminar el gasto', 'error');
      } finally {
        expenseToDeleteId = null;
      }
    }
  };

  const handleModalCancel = () => {
    isConfirmationModalOpen = false;
    expenseToDeleteId = null;
  };

  const startEditing = (expense) => {
    editingExpense = expense;
    editedDescription = expense.descripcion;
    editedAmount = expense.monto;
    editedDate = formatDateForInput(expense.fecha);
    editedCategory = expense.categoria || 'Otros';
  };

  const cancelEditing = () => {
    editingExpense = null;
  };

  const updateExpense = async () => {
    try {
      const expenseRef = doc(db, 'gastos', editingExpense.id);
      
      const date = new Date(editedDate);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const correctedDate = new Date(date.getTime() + userTimezoneOffset);

      await updateDoc(expenseRef, {
        descripcion: editedDescription,
        monto: parseFloat(editedAmount),
        fecha: correctedDate,
        categoria: editedCategory
      });
      editingExpense = null;
      showNotification('Gasto actualizado correctamente', 'success');
    } catch (e) {
      console.error("Error updating document: ", e);
      showNotification('Error al actualizar el gasto', 'error');
    }
  };

  function formatExpenseDate(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

</script>

<ConfirmationModal
  bind:isOpen={isConfirmationModalOpen}
  message="¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer."
  on:confirm={handleModalConfirm}
  on:cancel={handleModalCancel}
/>

<div class="container mx-auto p-4 sm:p-6 lg:p-8">
  <!-- Lista de Gastos -->
  <h2 class="text-xl font-bold text-gray-800 mb-4">Lista de Gastos</h2>
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    {#if $paginatedExpenses.loading}
      <p class="px-6 py-10 text-center text-gray-500">Cargando gastos...</p>
    {:else if $paginatedExpenses.error}
      <p class="px-6 py-10 text-center text-red-500">{$paginatedExpenses.error}</p>
    {:else if $paginatedExpenses.paginatedData && $paginatedExpenses.paginatedData.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-gray-700">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th scope="col" class="px-6 py-3">Descripción</th>
              <th scope="col" class="px-6 py-3">Categoría</th>
              <th scope="col" class="px-6 py-3">Monto</th>
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
                  <td class="px-6 py-4 text-gray-500">${expense.monto.toFixed(2)}</td>
                  <td class="px-6 py-4 text-gray-500">{formatExpenseDate(expense.fecha)}</td>
                  <td class="px-6 py-4 text-right">
                    <button on:click={() => startEditing(expense)} class="font-medium text-indigo-600 hover:text-indigo-900 mr-4 transition-all duration-300 ease-in-out cursor-pointer">Editar</button>
                    <button on:click={() => handleDeleteRequest(expense.id)} class="font-medium text-red-600 hover:text-red-900 transition-all duration-300 ease-in-out cursor-pointer">Eliminar</button>
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
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="h-5 w-5 icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
              </button>
              <button on:click={() => nextPage($paginatedExpenses.totalPages)} disabled={$currentPage === $paginatedExpenses.totalPages} class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors duration-300 ease-in-out cursor-pointer">
                <span class="sr-only">Siguiente</span>
                <svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="h-5 w-5 icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    {:else if !$paginatedExpenses.loading}
      <p class="px-6 py-10 text-center text-gray-500">No hay gastos registrados. ¡Añade uno para empezar!</p>
    {/if}
  </div>
</div>
