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
import { LandingPage } from '../pages/LandingPage'
import { SalaryCalculationPage } from '../pages/SalaryCalculationPage'
import { ProfilePage } from '../pages/ProfilePage'

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
        // Public marketing landing page ("/" is taken by the dashboard redirect)
        path: 'home',
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        // All authenticated routes
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
                path: 'profile',
                element: <ProfilePage />,
              },
              {
                path: 'leave-requests',
                element: <LeaveRequestsPage />,
              },
              {
                path: 'devices',
                element: <DevicesPage />,
              },
              {
                path: 'documents',
                element: <DocumentsPage />,
              },

              // Admin HR + Manager only
              {
                element: <ProtectedRoute allowedRoles={['admin_hr', 'manager']} />,
                children: [
                  {
                    path: 'employees',
                    element: <EmployeesPage />,
                  },
                  {
                    path: 'employees/:id',
                    element: <EmployeeDetailPage />,
                  },
                ],
              },

              // Admin HR only
              {
                element: <ProtectedRoute allowedRoles={['admin_hr']} />,
                children: [
                  {
                    path: 'salary-calculation',
                    element: <SalaryCalculationPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
