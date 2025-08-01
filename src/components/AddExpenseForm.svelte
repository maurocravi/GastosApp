<script>
  import { collection, addDoc } from 'firebase/firestore';
  import { db } from '../utils/firebase';

  let description = '';
  let amount = '';
  let date = '';

  const addExpense = async () => {
    try {
      const newExpense = {
        descripcion: description,
        cantidad: parseFloat(amount), // Convertir a número
        fecha: new Date(date), // Convertir a objeto Date
        año: new Date(date).getFullYear(),
        mes: new Date(date).getMonth() + 1, // getMonth() es base 0
      };
      await addDoc(collection(db, 'gastos'), newExpense);
      // Limpiar el formulario después de guardar
      description = '';
      amount = '';
      date = '';
      // Opcional: Emitir un evento para notificar a la lista que se actualice
      // dispatch('expenseAdded');
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };
</script>

<div class="container mx-auto p-4">
  <h2 class="text-2xl  font-bold mb-4">Agregar Nuevo Gasto</h2>
  <form on:submit|preventDefault={addExpense} class="mb-4">
    <div class="mb-4">
      <label for="description" class="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
      <input type="text" id="description" bind:value={description} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
    </div>
    <div class="mb-4">
      <label for="amount" class="block text-gray-700 text-sm font-bold mb-2">Cantidad:</label>
      <input type="number" id="amount" bind:value={amount} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
    </div>
    <div class="mb-4">
      <label for="date" class="block text-gray-700 text-sm font-bold mb-2">Fecha:</label>
      <input type="date" id="date" bind:value={date} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
    </div>
    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
      Guardar Gasto
    </button>
  </form>
</div>