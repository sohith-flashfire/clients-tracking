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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Monitor userRole={JSON.parse(localStorage.getItem('user'))?.role || 'admin'} />,
        index : true
      },
      {
        path: '/clients/new',
        element: <Monitor userRole={JSON.parse(localStorage.getItem('user'))?.role || 'admin'} />
      },
      {
        path : '/monitor-clients',
        element: <Monitor userRole={JSON.parse(localStorage.getItem('user'))?.role || 'admin'} />
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
        element: <Monitor userRole={JSON.parse(localStorage.getItem('user'))?.role || 'admin'} />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
