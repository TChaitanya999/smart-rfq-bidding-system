import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { io } from 'socket.io-client';
import { Clock, Tag, ExternalLink } from 'lucide-react';

const RFQList = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRFQs = async () => {
    try {
      const res = await axios.get('/api/rfqs');
      setRfqs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
    const socket = io('http://localhost:5000');
    
    socket.on('rfq_list_update', () => {
      fetchRFQs();
    });

    return () => socket.disconnect();
  }, []);

  const getStatusBadge = (rfq) => {
    const now = moment();
    const closeTime = moment(rfq.bid_close_time);
    const forcedCloseTime = moment(rfq.forced_close_time);

    if (now.isAfter(forcedCloseTime)) return <span className="badge bg-danger">Force Closed</span>;
    if (now.isAfter(closeTime)) return <span className="badge bg-secondary">Closed</span>;
    if (now.isBefore(moment(rfq.bid_start_time))) return <span className="badge bg-info">Upcoming</span>;
    return <span className="badge bg-success">Active</span>;
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold">Live Auctions</h2>
        <Link to="/create" className="btn btn-primary shadow-sm">Create New RFQ</Link>
      </div>
      <div className="row g-4">
        {rfqs.map(rfq => (
          <div key={rfq.id} className="col-md-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title mb-0 fw-bold text-dark">{rfq.name}</h5>
                  {getStatusBadge(rfq)}
                </div>
                <div className="mb-4">
                  <p className="text-muted small mb-2 d-flex align-items-center">
                    <span className="badge bg-light text-muted border me-2">REF: {rfq.reference_id}</span>
                  </p>
                </div>
                
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center text-muted small">
                      <Tag size={16} className="me-2 text-primary" />
                      <span>Lowest Bid</span>
                    </div>
                    <span className="fw-bold text-primary fs-5">{rfq.lowest_bid ? `₹${rfq.lowest_bid}` : '---'}</span>
                  </div>
                  {!rfq.lowest_bid && <div className="text-center small text-muted">No bids yet</div>}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="d-flex align-items-center text-muted small mb-2">
                    <Clock size={16} className="me-2 text-warning" />
                    <span>Closes: <strong>{moment(rfq.bid_close_time).format('MMM D, HH:mm')}</strong></span>
                  </div>
                  <div className="d-flex align-items-center text-muted small">
                    <Clock size={16} className="me-2 text-danger" />
                    <span>Forced: <strong>{moment(rfq.forced_close_time).format('MMM D, HH:mm')}</strong></span>
                  </div>
                </div>

                <Link to={`/rfq/${rfq.id}`} className="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center">
                  Enter Auction Room <ExternalLink size={16} className="ms-2" />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {rfqs.length === 0 && (
          <div className="col-12 text-center py-5">
            <div className="text-muted">No active auctions found. Create one to get started!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RFQList;
