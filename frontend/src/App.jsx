import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RFQList from './pages/RFQList';
import RFQDetails from './pages/RFQDetails';
import CreateRFQ from './pages/CreateRFQ';

function App() {
  return (
    <Router>
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<RFQList />} />
            <Route path="/create" element={<CreateRFQ />} />
            <Route path="/rfq/:id" element={<RFQDetails />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
