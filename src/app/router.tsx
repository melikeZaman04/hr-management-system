import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from './App'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { DevicesPage } from '../pages/DevicesPage'
import { DocumentsPage } from '../pages/DocumentsPage'
import { EmployeeDetailPage } from '../pages/EmployeeDetailPage'
import { EmployeesPage } from '../pages/EmployeesPage'
import { LeaveRequestsPage } from '../pages/LeaveRequestsPage'
import { LoginPage } from '../pages/LoginPage'
import { SalaryCalculationPage } from '../pages/SalaryCalculationPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: 'dashboard',
                element: <DashboardPage />,
              },
              {
                path: 'employees',
                element: <EmployeesPage />,
              },
              {
                path: 'employees/:id',
                element: <EmployeeDetailPage />,
              },
              {
                path: 'leave-requests',
                element: <LeaveRequestsPage />,
              },
              {
                path: 'salary-calculation',
                element: <SalaryCalculationPage />,
              },
              {
                path: 'devices',
                element: <DevicesPage />,
              },
              {
                path: 'documents',
                element: <DocumentsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
])
