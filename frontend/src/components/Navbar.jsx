import { Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <Gavel className="me-2" />
          British Auction RFQ
        </Link>
        <div className="navbar-nav ms-auto">
          <Link className="nav-link active" to="/">All RFQs</Link>
          <Link className="btn btn-light ms-2" to="/create">Create RFQ</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
