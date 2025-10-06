import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.jsx'
// import RegisterClient from './components/RegisterClient.jsx'
// import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// // const routes = createBrowserRouter([
// //   {
// //     path: '/clients/new',
// //     element: <RegisterClient />,
// //   }
// // ]);

// createRoot(document.getElementById('root')).render(
//   <StrictMode>  
//     {/* <RouterProvider router={routes}>      */}
//     <App />
//     {/* </RouterProvider> */}
//   </StrictMode>,
// )

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { AdminLayout, PortalLayout } from './components/Navbar';
import Monitor from './components/Monitor';
import ReactDOM from 'react-dom/client';
import RegisterClient from './components/RegisterClient';
import AdminDashboard from './components/AdminDashboard.jsx';
import ManagerDashboard from './components/ManagerDashboard.jsx';

// Helper function to get user role safely
const getUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role || 'team_lead'; // Default to team_lead for security
  } catch {
    return 'team_lead'; // Default to team_lead if parsing fails
  }
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Monitor userRole={getUserRole()} />,
        index : true
      },
      {
        path: '/clients/new',
        element: <Monitor userRole={getUserRole()} />
      },
      {
        path : '/monitor-clients',
        element: <Monitor userRole={getUserRole()} />
      },
      {
        path : '/admin-dashboard',
        element: <AdminDashboard user={JSON.parse(localStorage.getItem('user'))} />
      },
      {
        path : '/manager-dashboard',
        element: <ManagerDashboard />
      },
      {
        path : '/operations',
        element: <Monitor userRole={getUserRole()} />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
