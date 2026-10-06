import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Form from './pages/Form';
import People from './pages/People';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'form' | 'people'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* BASICS Green Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-emerald-950 text-white p-6 flex flex-col justify-between min-h-screen shadow-xl shrink-0">
        <div className="space-y-8">
          {/* Logo & Header */}
          <div className="flex items-center space-x-3">
            <div className="bg-lime-500 text-emerald-950 font-black text-2xl w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              B
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">B.A.S.I.C.S.</h1>
              <p className="text-[11px] text-emerald-300 font-medium">International NGO</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentPage === 'dashboard'
                  ? 'bg-emerald-700 text-white shadow-md ring-1 ring-emerald-500'
                  : 'text-emerald-200 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <span className="text-base">📊</span>
              <span>Analytics Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentPage('form')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentPage === 'form'
                  ? 'bg-emerald-700 text-white shadow-md ring-1 ring-emerald-500'
                  : 'text-emerald-200 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <span className="text-base">📝</span>
              <span>Intake Questionnaire</span>
            </button>

            <button
              onClick={() => setCurrentPage('people')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentPage === 'people'
                  ? 'bg-emerald-700 text-white shadow-md ring-1 ring-emerald-500'
                  : 'text-emerald-200 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <span className="text-base">👥</span>
              <span>People Directory</span>
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-emerald-900 text-[11px] text-emerald-300">
          <p className="font-bold text-white">Chorkor Digital Lab (CDL)</p>
          <p>© {new Date().getFullYear()} BASICS International</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'form' && <Form onComplete={() => setCurrentPage('people')} />}
        {currentPage === 'people' && <People onAddPerson={() => setCurrentPage('form')} />}
      </main>
    </div>
  );
}