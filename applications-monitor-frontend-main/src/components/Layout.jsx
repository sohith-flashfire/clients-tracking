// import React from 'react';
// import { Link } from 'react-router-dom';

// export default function Layout({ children }) {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
//       <div className="flex min-h-[calc(100vh-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg">
//         {/* Fixed Left Sidebar */}
//         <div className="w-64 border-r border-slate-200 bg-blue-50 flex-shrink-0">
//           <div className="p-3 flex flex-col gap-3">
//             <Link to="/monitor-clients">
//               <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
//                 Clients
//               </button>
//             </Link>
//             <Link to="/operations">
//               <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
//                 Operations Team
//               </button>
//             </Link>
//             <Link to="/clients/new">
//               <button className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
//                 Register Client
//               </button>
//             </Link>
//             <Link to="/manager-dashboard">
//               <button className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
//                 Manager Dashboard
//               </button>
//             </Link>
//           </div>
//         </div>

//         {/* Main Content Area */}
//         <div className="flex-1 overflow-auto bg-slate-50">
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Layout({ children }) {


  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('user') || '{}')?.role || '';
    console.log(local);
  },[])
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="flex min-h-[calc(100vh-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg">
        {/* Fixed Left Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-blue-50 flex-shrink-0">
          <div className="p-3 flex flex-col gap-3">
            <Link to="/monitor-clients">
              <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Clients
              </button>
            </Link>

            <Link to="/operations">
              <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Operations Team
              </button>
            </Link>

            <Link to="/client-dashboard">
              <button className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Client Dashboard
              </button>
            </Link>

          <div className={((JSON.parse(localStorage.getItem('user') || '{}')?.role || '').toLowerCase() === 'team_lead') ? 'hidden' : 'contents'}>
  <Link to="/clients/new">
    <button className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
      Register Client
    </button>
  </Link>
  <Link to="/manager-dashboard">
    <button className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
      Manager Dashboard
    </button>
  </Link>
  <Link to="/job-analytics">
    <button className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
      Job Analytics
    </button>
  </Link>
  <Link to="/client-job-analysis">
    <button className="w-full p-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
      Client Job Analysis
    </button>
  </Link>
</div>



          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}
