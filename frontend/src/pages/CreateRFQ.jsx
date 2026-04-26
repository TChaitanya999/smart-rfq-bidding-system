import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const CreateRFQ = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    reference_id: '',
    bid_start_time: moment().format('YYYY-MM-DDTHH:mm'),
    bid_close_time: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
    forced_close_time: moment().add(2, 'hours').format('YYYY-MM-DDTHH:mm'),
    pickup_date: moment().format('YYYY-MM-DD'),
    config: {
      trigger_window_mins: 5,
      extension_duration_mins: 10,
      trigger_bid_received: true,
      trigger_rank_change: true,
      trigger_l1_change: true
    }
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('config.')) {
      const configKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configKey]: e.target.type === 'checkbox' ? e.target.checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (moment(formData.forced_close_time).isSameOrBefore(moment(formData.bid_close_time))) {
      setError('Forced Close Time must be later than Bid Close Time');
      return;
    }

    try {
      await axios.post('/api/rfqs', formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create RFQ');
    }
  };

  return (
    <div className="max-w-800 mx-auto">
      <div className="card">
        <div className="card-header bg-white">
          <h4 className="mb-0">Create New RFQ</h4>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">RFQ Name</label>
                <input type="text" className="form-control" name="name" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Reference ID</label>
                <input type="text" className="form-control" name="reference_id" required value={formData.reference_id} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Bid Start Time</label>
                <input type="datetime-local" className="form-control" name="bid_start_time" required value={formData.bid_start_time} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Bid Close Time</label>
                <input type="datetime-local" className="form-control" name="bid_close_time" required value={formData.bid_close_time} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Forced Close Time</label>
                <input type="datetime-local" className="form-control" name="forced_close_time" required value={formData.forced_close_time} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Pickup Date</label>
                <input type="date" className="form-control" name="pickup_date" required value={formData.pickup_date} onChange={handleChange} />
              </div>
            </div>

            <hr className="my-4" />
            <h5>Auction Configuration</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Trigger Window (X minutes)</label>
                <input type="number" className="form-control" name="config.trigger_window_mins" value={formData.config.trigger_window_mins} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Extension Duration (Y minutes)</label>
                <input type="number" className="form-control" name="config.extension_duration_mins" value={formData.config.extension_duration_mins} onChange={handleChange} />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="config.trigger_bid_received" checked={formData.config.trigger_bid_received} onChange={handleChange} />
                  <label className="form-check-label">Trigger on any bid received</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="config.trigger_rank_change" checked={formData.config.trigger_rank_change} onChange={handleChange} />
                  <label className="form-check-label">Trigger on supplier rank change</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="config.trigger_l1_change" checked={formData.config.trigger_l1_change} onChange={handleChange} />
                  <label className="form-check-label">Trigger on L1 (lowest bidder) change</label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button type="submit" className="btn btn-primary px-5">Create RFQ</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRFQ;
