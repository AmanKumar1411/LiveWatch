import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Skeleton } from './components/ui';
import { MarketDataProvider } from './context/MarketDataProvider';
import { RouteError } from './pages/RouteError';
import { WatchlistPage } from './pages/WatchlistPage';

// The coin page pulls in the charting library, so it is split into its own chunk and loaded on demand.
const CoinPage = lazy(() => import('./pages/CoinPage'));

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <WatchlistPage /> },
      {
        path: 'coin/:symbol',
        element: (
          <Suspense fallback={<PageLoading />}>
            <CoinPage />
          </Suspense>
        ),
      },
    ],
  },
]);

function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function App() {
  return (
    <MarketDataProvider>
      <RouterProvider router={router} />
    </MarketDataProvider>
  );
}
