<script context="module">
  import { writable } from 'svelte/store';

  // Store para controlar la notificación, exportado desde el módulo
  export const notification = writable({ message: '', type: '', show: false });

  // Función para mostrar la notificación desde otros componentes, exportada desde el módulo
  export function showNotification(message, type = 'success') {
    notification.set({ message, type, show: true });
  }
</script>

<script>
  import { fade } from 'svelte/transition';

  // Este script de instancia se ejecuta cuando el componente se monta en el DOM.
  // Nos suscribimos al store para reaccionar a los cambios.
  notification.subscribe(value => {
    if (value.show) {
      const timer = setTimeout(() => {
        notification.set({ message: '', type: '', show: false });
      }, 3000); // Ocultar después de 3 segundos

      // Función de limpieza para evitar fugas de memoria
      return () => clearTimeout(timer);
    }
  });
</script>

{#if $notification.show}
  <div class="fixed bottom-4 right-4 p-4 rounded-md shadow-lg text-white z-50"
       class:bg-green-500={$notification.type === 'success'}
       class:bg-red-500={$notification.type === 'error'}
       transition:fade|local>
    {$notification.message}
  </div>
{/if}
