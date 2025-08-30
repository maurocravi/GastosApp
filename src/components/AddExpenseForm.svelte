<script>
    import { collection, addDoc, Timestamp } from 'firebase/firestore';
    import { db } from '../utils/firebase';
    import { showNotification } from './Notification.svelte';

    let description = '';
    let amount = '';
    let date = '';
    let category = 'Ocio'; // Default category
    let isLoading = false;
    const categories = ['Ocio', 'Comida/Bebida', 'Hogar', 'Gastos Personales', 'Otros'];
    
    // Nuevas variables para el manejo de cuotas
    let inInstallments = false;
    let installmentsCount = 2;

    const addExpense = async () => {
        if (!description || !amount || !date) {
            showNotification('Por favor, completa todos los campos', 'error');
            return;
        }
        isLoading = true;
        try {
            if (inInstallments) {
                const totalAmount = parseFloat(amount);
                const installmentAmount = totalAmount / installmentsCount;
                const originalDate = new Date(date);

                for (let i = 0; i < installmentsCount; i++) {
                    const installmentDate = new Date(originalDate.getTime());
                    installmentDate.setMonth(originalDate.getMonth() + i);

                    const newExpense = {
                        descripcion: `${description} (Cuota ${i + 1}/${installmentsCount})`,
                        cantidad: parseFloat(installmentAmount.toFixed(2)),
                        categoria: category,
                        fecha: Timestamp.fromDate(installmentDate),
                    };

                    await addDoc(collection(db, 'gastos'), newExpense);
                }
                
                showNotification(`Gasto en ${installmentsCount} cuotas agregado correctamente`, 'success');

            } else {
                const newExpense = {
                    descripcion: description,
                    cantidad: parseFloat(amount),
                    categoria: category,
                    fecha: Timestamp.fromDate(new Date(date)),
                };

                await addDoc(collection(db, 'gastos'), newExpense);
                showNotification('Gasto agregado correctamente', 'success');
            }

            // Limpiar el formulario
            description = '';
            amount = '';
            date = '';
            category = 'Ocio';
            inInstallments = false;
            installmentsCount = 2;

        } catch (e) {
            console.error("Error adding document: ", e);
            showNotification('Error al agregar el gasto', 'error');
        } finally {
            isLoading = false;
        }
    }
</script>

<form on:submit|preventDefault={addExpense} class="space-y-4">
    <div>
        <label class="block text-gray-700 text-sm font-bold mb-2" for="description">
            Descripción
        </label>
        <input type="text" id="description" bind:value={description} class="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isLoading}>
    </div>

    <div>
        <label class="block text-gray-700 text-sm font-bold mb-2" for="amount">
            Monto
        </label>
        <input type="number" id="amount" bind:value={amount} class="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isLoading}>
    </div>

    <div>
        <label class="block text-gray-700 text-sm font-bold mb-2" for="category">
            Categoría
        </label>
        <select id="category" bind:value={category} class="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isLoading}>
            {#each categories as cat}
                <option value={cat}>{cat}</option>
            {/each}
        </select>
    </div>

    <div>
        <label class="block text-gray-700 text-sm font-bold mb-2" for="date">
            Fecha
        </label>
        <input type="date" id="date" bind:value={date} class="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isLoading}>
    </div>
    
    <div class="flex items-center">
        <input type="checkbox" id="installments" bind:checked={inInstallments} class="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
        <label for="installments" class="text-gray-700 text-sm font-bold">Agregar en cuotas</label>
    </div>

    {#if inInstallments}
    <div>
        <label class="block text-gray-700 text-sm font-bold mb-2" for="installmentsCount">
            Número de cuotas
        </label>
        <select id="installmentsCount" bind:value={installmentsCount} class="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isLoading}>
            {#each Array.from({length: 11}, (_, i) => i + 2) as count}
                <option value={count}>{count}</option>
            {/each}
        </select>
    </div>
    {/if}


    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300" disabled={isLoading}>
        {#if isLoading}
            Agregando...
        {:else}
            Guardar Gasto
        {/if}
    </button>
</form>
