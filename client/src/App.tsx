import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './constants/routes'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { RoleGuard } from './guards/RoleGuard'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './error/ErrorBoundary'

const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const ChangePasswordPage = lazy(() => import('./pages/Auth/ChangePasswordPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const POSPage = lazy(() => import('./pages/POS'))
const TablesIndex = lazy(() => import('./pages/Tables'))
const InventoryIndex = lazy(() => import('./pages/Inventory'))
const RecipesIndex = lazy(() => import('./pages/Recipes'))
const SuppliersIndex = lazy(() => import('./pages/Suppliers'))
const HRIndex = lazy(() => import('./pages/HR'))
const AccountingIndex = lazy(() => import('./pages/Accounting'))
const CRMIndex = lazy(() => import('./pages/CRM'))
const DeliveryIndex = lazy(() => import('./pages/Delivery'))
const ReportsIndex = lazy(() => import('./pages/Reports'))
const SettingsIndex = lazy(() => import('./pages/Settings'))
const MenuPage = lazy(() => import('./pages/Menu'))

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-950"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />
          <Route path={ROUTES.PUBLIC_MENU} element={<MenuPage />} />
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<RoleGuard module="POS"><POSPage /></RoleGuard>} />
            <Route path="orders" element={<RoleGuard module="Orders"><POSPage /></RoleGuard>} />
            <Route path="tables" element={<RoleGuard module="Tables"><TablesIndex /></RoleGuard>} />
            <Route path="inventory" element={<RoleGuard module="Inventory"><InventoryIndex /></RoleGuard>} />
            <Route path="recipes" element={<RoleGuard module="Recipes"><RecipesIndex /></RoleGuard>} />
            <Route path="suppliers" element={<RoleGuard module="Suppliers"><SuppliersIndex /></RoleGuard>} />
            <Route path="hr" element={<RoleGuard module="HR"><HRIndex /></RoleGuard>} />
            <Route path="accounting" element={<RoleGuard module="Accounting"><AccountingIndex /></RoleGuard>} />
            <Route path="crm" element={<RoleGuard module="CRM"><CRMIndex /></RoleGuard>} />
            <Route path="delivery" element={<RoleGuard module="Delivery"><DeliveryIndex /></RoleGuard>} />
            <Route path="reports" element={<RoleGuard module="Reports"><ReportsIndex /></RoleGuard>} />
            <Route path="settings" element={<RoleGuard module="Settings"><SettingsIndex /></RoleGuard>} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
