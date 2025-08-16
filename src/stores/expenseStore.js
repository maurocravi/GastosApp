import { writable, derived } from 'svelte/store';
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
  const { subscribe, set, update } = writable({
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
        
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        return {
          id: doc.id,
          ...data,
          fecha: adjustedDate,
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
    update, // Expose update for optimistic UI
    unsubscribe,
  };
};

export const expenses = createExpensesStore();
export { categoryColors };

// --- Pagination Store ---
const ITEMS_PER_PAGE = 10;

export const currentPage = writable(1);

export const paginatedExpenses = derived(
  [expenses, currentPage],
  ([$expenses, $currentPage]) => {
    if ($expenses.loading) {
      return { loading: true, paginatedData: [], totalPages: 1 };
    }
    if ($expenses.error) {
      return { error: $expenses.error, paginatedData: [], totalPages: 1 };
    }

    const totalItems = $expenses.data.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const startIndex = ($currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = $expenses.data.slice(startIndex, endIndex);

    return {
      ...$expenses,
      paginatedData,
      totalPages
    };
  }
);

export function nextPage(totalPages) {
  currentPage.update(n => (n < totalPages ? n + 1 : n));
}

export function prevPage() {
  currentPage.update(n => (n > 1 ? n - 1 : 1));
}
