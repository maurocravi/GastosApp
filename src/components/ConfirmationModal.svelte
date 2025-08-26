<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  export let isOpen = false;
  export let message = '¿Estás seguro?';

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-gray-100/90 overflow-y-auto h-full w-full z-50 flex items-center justify-center" on:click={handleCancel}>
    <div transition:fly={{ y: -50, duration: 300 }} class="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white" on:click|stopPropagation>
      <div class="mt-3 text-center">
        <h3 class="text-xl leading-6 font-medium text-gray-900">Confirmación</h3>
        <div class="mt-4 mb-6">
          <p class="text-base text-gray-600">{message}</p>
        </div>
        <div class="flex justify-center space-x-4">
          <button on:click={handleCancel} class="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200">
            Cancelar
          </button>
          <button on:click={handleConfirm} class="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
