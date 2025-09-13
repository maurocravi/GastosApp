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

        // FIX: Normalize data to handle old (cantidad) and new (monto) fields.
        const monto = data.monto !== undefined ? data.monto : data.cantidad;

        return {
          id: doc.id,
          ...data,
          monto: monto, // Ensure 'monto' is always present
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

export const monthlyExpenses = derived(expenses, $expenses => {
  if ($expenses.loading || !$expenses.data.length) return [];

  const monthlyTotals = $expenses.data.reduce((acc, expense) => {
    const date = new Date(expense.fecha);
    const month = date.toLocaleString('es-ES', { month: 'long' });
    const year = date.getFullYear();
    const key = `${month}-${year}`;

    if (!acc[key]) {
      acc[key] = { month, year, total: 0 };
    }
    acc[key].total += expense.monto;
    return acc;
  }, {});

  return Object.values(monthlyTotals);
});


export const dailyExpensesTotal = derived(expenses, $expenses => {
  if ($expenses.loading || !$expenses.data.length) return 0;
  const today = new Date().setHours(0, 0, 0, 0);
  return $expenses.data
    .filter(e => new Date(e.fecha).setHours(0, 0, 0, 0) === today)
    .reduce((acc, curr) => acc + curr.monto, 0); // FIX: Was acc.monto + curr.monto
}, 0);

export const weeklyExpensesTotal = derived(expenses, $expenses => {
    if ($expenses.loading || !$expenses.data.length) return 0;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return $expenses.data
        .filter(e => {
            const expenseDate = new Date(e.fecha);
            return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
        })
        .reduce((acc, curr) => acc + curr.monto, 0);
}, 0);


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
      ...
$expenses,
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
