import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DoctorListPage from './pages/DoctorListPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import AppointmentLookupPage from './pages/AppointmentLookupPage';

function App() {
  return (
    <BrowserRouter>
      {/* Toast Notification */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="doctors" element={<DoctorListPage />} />
          <Route path="doctor/:id" element={<DoctorDetailPage />} />
          <Route path="booking-success" element={<BookingSuccessPage />} />
          <Route path="tra-cuu" element={<AppointmentLookupPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
