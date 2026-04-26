import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { io } from 'socket.io-client';
import { Trophy, Clock, History, Send, Info } from 'lucide-react';

const RFQDetails = () => {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [bidForm, setBidForm] = useState({
    supplier_id: '',
    freight_charges: '',
    origin_charges: '',
    destination_charges: '',
    transit_time: '',
    quote_validity: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm')
  });
  const [timeLeft, setTimeLeft] = useState('');
  const [error, setError] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      const res = await axios.get(`/api/rfqs/${id}`);
      setRfq(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
    axios.get('/api/bids/suppliers').then(res => setSuppliers(res.data));

    const socket = io('http://localhost:5000');
    socket.emit('join_rfq', id);
    
    socket.on('rfq_update', (data) => {
      setRfq(prev => ({
        ...prev,
        ...data.rfq,
        bids: data.bids,
        activity_logs: data.activity_logs
      }));
    });

    return () => socket.disconnect();
  }, [id, fetchDetails]);

  useEffect(() => {
    if (!rfq) return;

    const timer = setInterval(() => {
      const now = moment();
      const end = moment(rfq.bid_close_time);
      const forcedEnd = moment(rfq.forced_close_time);
      
      if (now.isAfter(forcedEnd)) {
        setTimeLeft('FORCE CLOSED');
        clearInterval(timer);
      } else if (now.isAfter(end)) {
        setTimeLeft('CLOSED');
        clearInterval(timer);
      } else {
        const duration = moment.duration(end.diff(now));
        const h = Math.floor(duration.asHours());
        const m = duration.minutes();
        const s = duration.seconds();
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [rfq]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/bids', { ...bidForm, rfq_id: id });
      setBidForm({ ...bidForm, freight_charges: '', origin_charges: '', destination_charges: '', transit_time: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit bid');
    }
  };

  if (!rfq) return <div className="text-center mt-5">Loading...</div>;

  const isClosed = moment().isAfter(moment(rfq.bid_close_time)) || moment().isAfter(moment(rfq.forced_close_time));

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h2 className="mb-1 fw-bold">{rfq.name}</h2>
          <span className="badge bg-light text-muted border">REF: {rfq.reference_id}</span>
        </div>
        <div className="text-end">
          <div className="text-muted small mb-1">Auction Ends In</div>
          <div className="countdown-timer text-primary shadow-sm border">
            {timeLeft}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          {/* Bid Form Section */}
          {!isClosed && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                  <span className="bg-primary text-white p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                    <Send size={20} />
                  </span>
                  Place Your Bid
                </h5>
              </div>
              <div className="card-body p-4">
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleBidSubmit} className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-semibold text-muted small text-uppercase">Select Carrier</label>
                    <select className="form-select shadow-sm" required value={bidForm.supplier_id} onChange={e => setBidForm({...bidForm, supplier_id: e.target.value})}>
                      <option value="">Choose your company...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted small text-uppercase">Freight Charges (₹)</label>
                    <input type="number" className="form-control shadow-sm" required value={bidForm.freight_charges} onChange={e => setBidForm({...bidForm, freight_charges: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold text-muted small text-uppercase">Origin (₹)</label>
                    <input type="number" className="form-control shadow-sm" required value={bidForm.origin_charges} onChange={e => setBidForm({...bidForm, origin_charges: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold text-muted small text-uppercase">Dest. (₹)</label>
                    <input type="number" className="form-control shadow-sm" required value={bidForm.destination_charges} onChange={e => setBidForm({...bidForm, destination_charges: e.target.value})} placeholder="0.00" />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted small text-uppercase">Transit Time</label>
                    <input type="text" className="form-control shadow-sm" required value={bidForm.transit_time} onChange={e => setBidForm({...bidForm, transit_time: e.target.value})} placeholder="e.g. 5-7 Days" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted small text-uppercase">Quote Validity</label>
                    <input type="datetime-local" className="form-control shadow-sm" required value={bidForm.quote_validity} onChange={e => setBidForm({...bidForm, quote_validity: e.target.value})} />
                  </div>
                  
                  <div className="col-12 mt-4">
                    <button type="submit" className="btn btn-primary w-100 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                      Submit Secure Bid <Send size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rankings Section */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Live Bid Rankings</h5>
              <span className="badge bg-soft-primary text-primary">{rfq.bids.length} Bids Received</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="py-3">Carrier</th>
                      <th className="py-3">Total Amount</th>
                      <th className="py-3">Transit</th>
                      <th className="py-3 text-end px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfq.bids.map((bid, index) => (
                      <tr key={bid.id} className={index === 0 ? 'l1-highlight' : ''}>
                        <td className="px-4 py-3 align-middle">
                          <span className={`badge ${index === 0 ? 'bg-success' : 'bg-light text-dark border'} rounded-pill px-3`}>
                            {index === 0 ? <Trophy size={14} className="me-1" /> : ''}L{index + 1}
                          </span>
                        </td>
                        <td className="py-3 align-middle fw-semibold text-dark">{bid.supplier_name}</td>
                        <td className="py-3 align-middle"><strong className="text-primary fs-6">₹{bid.total_amount}</strong></td>
                        <td className="py-3 align-middle text-muted">{bid.transit_time}</td>
                        <td className="py-3 align-middle text-end px-4 text-muted small">
                          {moment(bid.bid_timestamp).format('HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                    {rfq.bids.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">No bids submitted yet. Be the first to bid!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <Info size={20} className="me-2 text-primary" />
                Configuration
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted small text-uppercase fw-semibold">Trigger Window</span>
                <span className="fw-bold">{rfq.trigger_window_mins} mins</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted small text-uppercase fw-semibold">Extension</span>
                <span className="fw-bold">{rfq.extension_duration_mins} mins</span>
              </div>
              <div className="alert alert-info py-2 px-3 mb-0 small border-0">
                Extends if {rfq.trigger_bid_received ? 'any bid received' : 
                          rfq.trigger_rank_change ? 'rank changes' : 
                          'L1 changes'} in last {rfq.trigger_window_mins}m.
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <History size={20} className="me-2 text-primary" />
                Activity Log
              </h5>
            </div>
            <div className="card-body p-0" style={{maxHeight: '400px', overflowY: 'auto'}}>
              <div className="list-group list-group-flush">
                {rfq.activity_logs.map(log => (
                  <div key={log.id} className="list-group-item border-0 px-4 py-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className={`badge ${log.action === 'time_extension' ? 'bg-warning text-dark' : 'bg-info'} small`}>
                        {log.action.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-muted small">{moment(log.timestamp).format('HH:mm:ss')}</span>
                    </div>
                    <p className="small mb-0 text-muted">
                      <strong className="text-dark">{log.supplier_name || 'System'}</strong>: {log.reason}
                    </p>
                  </div>
                ))}
                {rfq.activity_logs.length === 0 && (
                  <div className="text-center py-5 text-muted small">No activity recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFQDetails;
