import { writable, derived } from 'svelte/store';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';

const createExpenseStore = () => {
  const { subscribe, set } = writable({ loading: true, data: [], error: null });

  const q = query(collection(db, 'gastos'), orderBy('fecha', 'desc'));

  const unsubscribe = onSnapshot(q,
    (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          descripcion: d.descripcion,
          categoria: d.categoria || 'Otros',
          fecha: d.fecha?.toDate ? d.fecha.toDate() : new Date(),
          monto: Number(d.cantidad) || 0,
        };
      });
      set({ loading: false, data, error: null });
    },
    (err) => {
      console.error("Firebase snapshot error:", err);
      set({ loading: false, data: [], error: 'Failed to load expenses.' });
    }
  );

  return {
    subscribe,
    unsubscribe
  };
};

export const expenses = createExpenseStore();

// Colores para las categorías
export const categoryColors = {
  'Ocio': '#FF6384',
  'Comida/Bebida': '#36A2EB',
  'Hogar': '#FFCE56',
  'Gastos Personales': '#4BC0C0',
  'Otros': '#9966FF',
  'Default': '#C9CBCF'
};

// Derived stores for aggregated data
export const yearlyExpenses = derived(expenses, ($expenses) => {
  if ($expenses.loading || !$expenses.data.length) return [];

  const yearlyMap = $expenses.data.reduce((acc, expense) => {
    const year = expense.fecha.getFullYear();
    const amount = expense.monto;

    if (!acc[year]) {
      acc[year] = { year, total: 0 };
    }
    acc[year].total += amount;

    return acc;
  }, {});

  return Object.values(yearlyMap).sort((a, b) => a.year - b.year);
});

export const monthlyExpenses = derived(expenses, ($expenses) => {
  if ($expenses.loading || !$expenses.data.length) return [];

  const monthlyMap = $expenses.data.reduce((acc, expense) => {
    const date = expense.fecha;
    const year = date.getFullYear();
    const month = date.toLocaleString('es-ES', { month: 'long' });
    const key = `${year}-${month}`;
    const amount = expense.monto;

    if (!acc[key]) {
      acc[key] = { year, month, total: 0 };
    }
    acc[key].total += amount;

    return acc;
  }, {});

  const monthOrder = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  return Object.values(monthlyMap).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return monthOrder.indexOf(b.month.toLowerCase()) - monthOrder.indexOf(a.month.toLowerCase());
  });
});


// Paginación
export const currentPage = writable(1);
export const itemsPerPage = writable(10);

export const paginatedExpenses = derived(
  [expenses, currentPage, itemsPerPage],
  ([$expenses, $currentPage, $itemsPerPage]) => {
    if ($expenses.loading) {
      return { paginatedData: [], totalPages: 1, ...$expenses };
    }
    const totalPages = Math.ceil($expenses.data.length / $itemsPerPage);
    const startIndex = ($currentPage - 1) * $itemsPerPage;
    const endIndex = startIndex + $itemsPerPage;
    const paginatedData = $expenses.data.slice(startIndex, endIndex);

    return {
      ...$expenses,
      paginatedData,
      totalPages,
    };
  }
);

export const nextPage = (totalPages) => {
  currentPage.update(n => {
    if (n < totalPages) return n + 1;
    return n;
  });
};

export const prevPage = () => {
  currentPage.update(n => {
    if (n > 1) return n - 1;
    return n;
  });
};
