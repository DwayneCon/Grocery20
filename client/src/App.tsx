import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary from './components/common/ErrorBoundary';

// Eager-load critical components
import PrivateRoute from './components/auth/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import InstallPrompt from './components/pwa/InstallPrompt';

// Lazy-load route components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MealPlanPage = lazy(() => import('./pages/MealPlanPage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage'));
const HouseholdPage = lazy(() => import('./pages/HouseholdPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));

// Loading fallback component
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: 'var(--bg-primary)',
    }}
  >
    <CircularProgress size={48} sx={{ color: 'var(--chef-orange)' }} />
  </Box>
);

function App() {
  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <InstallPrompt />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/meal-plan" element={<MealPlanPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/shopping-list" element={<ShoppingListPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/household" element={<HouseholdPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Box>
    </ErrorBoundary>
  );
}

export default App;
