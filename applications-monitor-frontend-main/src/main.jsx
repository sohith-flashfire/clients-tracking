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
        element: <Monitor />,
        index : true
      },
      // {
      //   path: 'admin',
      //   element: <AdminLayout />,
      // },
      {
        path: '/clients/new',
        element : <RegisterClient />
      },
      {
        path : '/monitor-clients',
        element: <Monitor />
      },
      {
        path : '/admin-dashboard',
        element: <AdminDashboard />
      },
      {
        path : '/manager-dashboard',
        element: <ManagerDashboard />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
