<script>
  import { onMount } from 'svelte';
  import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
  import { db } from '../utils/firebase';

  let expenses = [];
  let editingExpense = null; // Para almacenar el gasto que se está editando
  let editedDescription = '';
  let editedAmount = '';
  let editedDate = '';

  // Variables para los resúmenes
  let monthlySummaries = {};
  let yearlySummaries = {};

  // Array con nombres de los meses para mostrar en los resúmenes
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                     ];

  onMount(() => {
    const q = query(collection(db, 'gastos'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      expenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Asegurar que la fecha sea un objeto Date para el formulario de edición
        fecha: doc.data().fecha.toDate() 
      }));
      calculateSummaries(); // Calcular resúmenes cada vez que los gastos cambian
    });

    return () => unsubscribe();
  });

  const deleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, 'gastos', id));
    } catch (e) {
      console.error("Error removing document: ", e);
    }
  };

  const startEditing = (expense) => {
    editingExpense = expense;
    editedDescription = expense.descripcion;
    editedAmount = expense.cantidad;
    editedDate = expense.fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
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
        fecha: new Date(editedDate),
        año: new Date(editedDate).getFullYear(),
        mes: new Date(editedDate).getMonth() + 1,
      });
      editingExpense = null; // Salir del modo de edición
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  // Función para calcular los resúmenes
  const calculateSummaries = () => {
    const monthly = {};
    const yearly = {};

    expenses.forEach(expense => {
      const year = new Date(expense.fecha).getFullYear();
      const month = new Date(expense.fecha).getMonth(); // 0-indexed

      // Resumen mensual
      const monthYearKey = `${year}-${month}`;
      if (!monthly[monthYearKey]) {
        monthly[monthYearKey] = { year: year, month: month, total: 0 };
      }
      monthly[monthYearKey].total += expense.cantidad;

      // Resumen anual
      if (!yearly[year]) {
        yearly[year] = { year: year, total: 0 };
      }
      yearly[year].total += expense.cantidad;
    });

    // Ordenar resúmenes mensuales por año y mes (descendente)
    monthlySummaries = Object.entries(monthly)
      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
      .map(([key, value]) => ({ ...value, monthName: monthNames[value.month] }));

    // Ordenar resúmenes anuales por año (descendente)
    yearlySummaries = Object.entries(yearly)
      .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
      .map(([key, value]) => value);
  };

  // Llamar a calculateSummaries inicialmente después de cargar los datos
  $: if (expenses) { // Reactividad de Svelte: Recalcular cuando 'expenses' cambia
    calculateSummaries();
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Control de Gastos Mensuales</h1>

  <!-- Resúmenes por Año -->
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">Resumen Anual</h2>
    {#if Object.keys(yearlySummaries).length > 0}
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

  <!-- Resúmenes por Mes -->
    <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">Resumen Mensual</h2>
    {#if Object.keys(monthlySummaries).length > 0}
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

  <!-- Lista de Gastos -->
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">Lista de Gastos</h2>
    {#if expenses.length > 0}
      <table class="min-w-full bg-white shadow-md rounded">
        <thead>
          <tr>
            <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Descripción</th>
            <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Cantidad</th>
            <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Fecha</th>
            <th class="text-left py-3 px-4 uppercase font-semibold text-sm">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each expenses as expense (expense.id)}
            {#if editingExpense && editingExpense.id === expense.id}
              <!-- Formulario de Edición en línea -->
              <tr>
                <td class="py-3 px-4">
                  <input type="text" bind:value={editedDescription} class="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </td>
                <td class="py-3 px-4">
                  <input type="number" bind:value={editedAmount} class="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </td>
                <td class="py-3 px-4">
                  <input type="date" bind:value={editedDate} class="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                </td>
                <td class="py-3 px-4">
                  <button on:click={updateExpense} class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2">Guardar</button>
                  <button on:click={cancelEditing} class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded">Cancelar</button>
                </td>
              </tr>
            {:else}
              <!-- Fila normal del gasto -->
              <tr>
                <td class="text-left py-3 px-4">{expense.descripcion}</td>
                <td class="text-left py-3 px-4">${expense.cantidad.toFixed(2)}</td>
                <td class="text-left py-3 px-4">{new Date(expense.fecha).toLocaleDateString()}</td>
                <td class="text-left py-3 px-4">
                  <button on:click={() => startEditing(expense)} class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2">Editar</button>
                  <button on:click={() => deleteExpense(expense.id)} class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Eliminar</button>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    {:else}
      <p>No hay gastos registrados aún.</p>
    {/if}
  </div>

</div>

<style>
  /* Puedes añadir estilos adicionales aquí si es necesario */
</style>