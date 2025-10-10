import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import QRCodeManagement from './pages/QRCodeManagement';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/qr-codes" element={<QRCodeManagement />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;


