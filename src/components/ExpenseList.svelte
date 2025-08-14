<script>
  import { onMount } from 'svelte';
  import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
  import { db } from '../utils/firebase';
  import { showNotification } from './Notification.svelte';

  let expenses = [];
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

  onMount(() => {
    const q = query(collection(db, 'gastos'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      expenses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const firestoreTimestamp = data.fecha;
        const date = firestoreTimestamp.toDate();
        
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        return {
          id: doc.id,
          ...data,
          fecha: adjustedDate,
        };
      });
      calculateSummaries();
    });

    return () => unsubscribe();
  });

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

  const calculateSummaries = () => {
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

  $: if (expenses) {
    calculateSummaries();
  }
</script>

<div class="container mx-auto p-4 sm:p-6 lg:p-8">
  <!-- Resúmenes -->
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
    {#if expenses.length > 0}
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
            {#each expenses as expense (expense.id)}
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
                    <button on:click={updateExpense} class="font-medium text-green-600 hover:text-green-800 mr-4">Guardar</button>
                    <button on:click={cancelEditing} class="font-medium text-gray-600 hover:text-gray-800">Cancelar</button>
                  </td>
                </tr>
              {:else}
                <!-- Fila normal -->
                <tr class="bg-white border-b border-gray-300 hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium text-gray-900">{expense.descripcion}</td>
                  <td class="px-6 py-4 text-gray-500">{expense.categoria || 'N/A'}</td>
                  <td class="px-6 py-4 text-gray-500">${expense.cantidad.toFixed(2)}</td>
                  <td class="px-6 py-4 text-gray-500">{expense.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}</td>
                  <td class="px-6 py-4 text-right">
                    <button on:click={() => startEditing(expense)} class="font-medium text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                    <button on:click={() => deleteExpense(expense.id)} class="font-medium text-red-600 hover:text-red-900">Eliminar</button>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="px-6 py-10 text-center text-gray-500">No hay gastos registrados. ¡Añade uno para empezar!</p>
    {/if}
  </div>
</div>