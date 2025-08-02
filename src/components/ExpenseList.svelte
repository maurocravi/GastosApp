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
        
        // Adjust for timezone offset to display the correct date
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
      
      // The date from the input is already in 'YYYY-MM-DD' format, which is what we need.
      // Firestore's Timestamp.fromDate will handle it correctly.
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

<div class="container mx-auto p-4">
  <!-- Resúmenes -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <div>
      <h2 class="text-2xl font-bold mb-4">Resumen Anual</h2>
      {#if yearlySummaries.length > 0}
        <ul class="bg-white shadow overflow-hidden sm:rounded-md">
          {#each yearlySummaries as summary (summary.year)}
            <li class="px-4 py-3 sm:px-6 border-b last:border-b-0">
              <p class="text-lg font-semibold">{summary.year}: <span class="font-normal">${summary.total.toFixed(2)}</span></p>
            </li>
          {/each}
        </ul>
      {:else}
        <p>No hay resumen anual disponible.</p>
      {/if}
    </div>
    <div>
      <h2 class="text-2xl font-bold mb-4">Resumen Mensual</h2>
      {#if monthlySummaries.length > 0}
        <ul class="bg-white shadow overflow-hidden sm:rounded-md">
          {#each monthlySummaries as summary (`${summary.year}-${summary.month}`)}
            <li class="px-4 py-3 sm:px-6 border-b last:border-b-0">
              <p class="text-lg font-semibold">{summary.monthName} {summary.year}: <span class="font-normal">${summary.total.toFixed(2)}</span></p>
            </li>
          {/each}
        </ul>
      {:else}
        <p>No hay resumen mensual disponible.</p>
      {/if}
    </div>
  </div>

  <!-- Lista de Gastos -->
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">Lista de Gastos</h2>
    {#if expenses.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white shadow-md rounded">
          <thead>
            <tr>
              <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Descripción</th>
              <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Categoría</th>
              <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Cantidad</th>
              <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Fecha</th>
              <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each expenses as expense (expense.id)}
              {#if editingExpense && editingExpense.id === expense.id}
                <!-- Fila de Edición -->
                <tr>
                  <td class="py-3 px-4"><input type="text" bind:value={editedDescription} class="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></td>
                  <td class="py-3 px-4">
                    <select bind:value={editedCategory} class="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                      {#each categories as cat}<option value={cat}>{cat}</option>{/each}
                    </select>
                  </td>
                  <td class="py-3 px-4"><input type="number" bind:value={editedAmount} class="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></td>
                  <td class="py-3 px-4"><input type="date" bind:value={editedDate} class="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></td>
                  <td class="py-3 px-4">
                    <button on:click={updateExpense} class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2 transition-all duration-300 ease-in-out cursor-pointer">Guardar</button>
                    <button on:click={cancelEditing} class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded transition-all duration-300 ease-in-out cursor-pointer">Cancelar</button>
                  </td>
                </tr>
              {:else}
                <!-- Fila normal -->
                <tr>
                  <td class="text-left py-3 px-4">{expense.descripcion}</td>
                  <td class="text-left py-3 px-4">{expense.categoria || 'N/A'}</td>
                  <td class="text-left py-3 px-4">${expense.cantidad.toFixed(2)}</td>
                  <td class="text-left py-3 px-4">{expense.fecha.toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
                  <td class="text-left py-3 px-4">
                    <button on:click={() => startEditing(expense)} class="bg-yellow-500 hover:bg-yellow-700 transition-all duration-300 ease-in-out cursor-pointer text-white font-bold py-1 px-2 rounded mr-2">Editar</button>
                    <button on:click={() => deleteExpense(expense.id)} class="bg-red-500 hover:bg-red-700 transition-all duration-300 ease-in-out cursor-pointer text-white font-bold py-1 px-2 rounded">Eliminar</button>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p>No hay gastos registrados aún.</p>
    {/if}
  </div>
</div>
