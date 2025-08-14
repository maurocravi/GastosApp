import { writable } from 'svelte/store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

// Define color mappings for each category
const categoryColors = {
  'Ocio': '#FF6384',
  'Comida/Bebida': '#36A2EB',
  'Hogar': '#FFCE56',
  'Gastos Personales': '#4BC0C0',
  'Otros': '#9966FF',
  'Default': '#C9CBCF'
};

const createExpensesStore = () => {
  const { subscribe, set } = writable({
    loading: true,
    data: [],
    error: null,
  });

  const q = query(collection(db, 'gastos'), orderBy('fecha', 'desc'));

  const unsubscribe = onSnapshot(q, 
    (querySnapshot) => {
      const expenses = querySnapshot.docs.map(doc => {
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
          // Assign color to the expense based on its category
          color: categoryColors[data.categoria] || categoryColors.Default
        };
      });
      set({ loading: false, data: expenses, error: null });
    },
    (error) => {
      console.error("Error fetching expenses: ", error);
      set({ loading: false, data: [], error: "No se pudieron cargar los gastos." });
    }
  );

  return {
    subscribe,
    unsubscribe, // Optional: to manually stop listening to updates
  };
};

export const expenses = createExpensesStore();
export { categoryColors };
