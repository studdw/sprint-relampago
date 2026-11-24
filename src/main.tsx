import { StrictMode } from 'react';
import { applyStoredTheme } from './components/ui';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { ToastProvider } from './components/ui';
import Home from './pages/Home';
import Play from './pages/Play';
import AdminHome from './pages/AdminHome';
import AdminRoom from './pages/AdminRoom';
import Telao from './pages/Telao';
import { Analytics } from "@vercel/analytics/next"

applyStoredTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sala/:code" element={<Play />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/:roomId" element={<AdminRoom />} />
          <Route path="/telao/:code" element={<Telao />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
);
