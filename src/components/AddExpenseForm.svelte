<script>
  import { showNotification } from './Notification.svelte';
  import { db } from '../utils/firebase';
  import { collection, addDoc, Timestamp } from 'firebase/firestore';

  let description = '';
  let amount = '';
  let date = '';
  let category = 'Ocio'; // Valor por defecto
  let isLoading = false;

  const categories = ['Ocio', 'Comida/Bebida', 'Hogar', 'Gastos Personales', 'Otros'];

  async function addExpense() {
    if (!description || !amount || !date || !category) {
      showNotification('Por favor, completa todos los campos', 'error');
      return;
    }

    isLoading = true;
    try {
      // Create a date object in UTC from the date string 'YYYY-MM-DD'
      await addDoc(collection(db, 'gastos'), {
        descripcion: description,
        cantidad: parseFloat(amount),
        fecha: Timestamp.fromDate(new Date(date)),
        categoria: category
      });
      
      showNotification('Gasto agregado correctamente', 'success');

      // Limpiar el formulario
      description = '';
      amount = '';
      date = '';
      category = 'Ocio'; // Resetear a valor por defecto

    } catch (e) {
      console.error("Error adding document: ", e);
      showNotification('Error al agregar el gasto', 'error');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="mb-6">
  <h2 class="text-xl font-semibold mb-4">Agregar Nuevo Gasto</h2>
  <form on:submit|preventDefault={addExpense}>
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="description">
        Descripción
      </label>
      <input type="text" id="description" bind:value={description} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled={isLoading}>
    </div>

    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="amount">
        Monto
      </label>
      <input type="number" id="amount" bind:value={amount} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled={isLoading}>
    </div>

    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="category">
          Categoría
        </label>
        <select id="category" bind:value={category} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled={isLoading}>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
    </div>

    <div class="mb-6">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="date">
        Fecha
      </label>
      <input type="date" id="date" bind:value={date} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled={isLoading}>
    </div>

    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-all duration-300 ease-in-out cursor-pointer" disabled={isLoading}>
      {isLoading ? 'Guardando...' : 'Guardar Gasto'}
    </button>
  </form>
</div>
