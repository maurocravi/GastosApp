<script>
  import { Timestamp, addDoc, collection } from "firebase/firestore";
  import { db } from "../utils/firebase";
  import { showNotification } from "./Notification.svelte";

  let descripcion = "";
  let monto = "";
  let fecha = new Date().toISOString().slice(0, 10);
  let categoria = "Ocio";

  const categories = [
    "Ocio",
    "Comida/Bebida",
    "Hogar",
    "Gastos Personales",
    "Otros",
  ];

  const handleSubmit = async () => {
    if (!descripcion || !monto || !fecha || !categoria) return;

    try {
      await addDoc(collection(db, "gastos"), {
        descripcion: descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        categoria: categoria,
      });

      showNotification("Gasto agregado correctamente", "success");

      // Reset form
      descripcion = "";
      monto = "";
      fecha = new Date().toISOString().slice(0, 10);
      categoria = "Ocio";
    } catch (e) {
      console.error("Error adding document: ", e);
      showNotification("Error al agregar el gasto", "error");
    }
  };
</script>

<form
  on:submit|preventDefault={handleSubmit}
  class="space-y-6 bg-white p-8 rounded-lg shadow-md"
>
  <div>
    <label for="descripcion" class="block text-sm font-medium text-gray-700"
      >Descripción</label
    >
    <input
      type="text"
      id="descripcion"
      bind:value={descripcion}
      required
      class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="Ej. Cena con amigos"
    />
  </div>

  <div>
    <label for="monto" class="block text-sm font-medium text-gray-700"
      >Monto</label
    >
    <input
      type="number"
      id="monto"
      bind:value={monto}
      required
      class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="0.00"
    />
  </div>

  <div>
    <label for="fecha" class="block text-sm font-medium text-gray-700"
      >Fecha</label
    >
    <input
      type="date"
      id="fecha"
      bind:value={fecha}
      required
      class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  </div>

  <div>
    <label for="categoria" class="block text-sm font-medium text-gray-700"
      >Categoría</label
    >
    <select
      id="categoria"
      bind:value={categoria}
      required
      class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    >
      {#each categories as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
  </div>

  <button
    type="submit"
    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
  >
    Agregar Gasto
  </button>
</form>
