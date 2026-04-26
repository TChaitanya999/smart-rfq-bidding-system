const db = require('../config/db');

exports.createRFQ = async (req, res) => {
    try {
        const { 
            name, reference_id, bid_start_time, bid_close_time, 
            forced_close_time, pickup_date, config 
        } = req.body;

        if (new Date(forced_close_time) <= new Date(bid_close_time)) {
            return res.status(400).json({ error: "Forced Close Time must be later than Bid Close Time" });
        }

        const [rfqResult] = await db.execute(
            `INSERT INTO rfqs (name, reference_id, bid_start_time, bid_close_time, forced_close_time, pickup_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, reference_id, bid_start_time, bid_close_time, forced_close_time, pickup_date]
        );

        const rfqId = rfqResult.insertId;

        await db.execute(
            `INSERT INTO auction_config (rfq_id, trigger_window_mins, extension_duration_mins, trigger_bid_received, trigger_rank_change, trigger_l1_change) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                rfqId, 
                config.trigger_window_mins || 5, 
                config.extension_duration_mins || 10,
                config.trigger_bid_received !== undefined ? config.trigger_bid_received : true,
                config.trigger_rank_change !== undefined ? config.trigger_rank_change : true,
                config.trigger_l1_change !== undefined ? config.trigger_l1_change : true
            ]
        );

        res.status(201).json({ message: "RFQ created successfully", rfqId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getRFQs = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.*, 
            (SELECT MIN(total_amount) FROM bids b WHERE b.rfq_id = r.id) as lowest_bid
            FROM rfqs r 
            ORDER BY r.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRFQById = async (req, res) => {
    try {
        const [rfq] = await db.execute(`
            SELECT r.*, c.trigger_window_mins, c.extension_duration_mins, 
            c.trigger_bid_received, c.trigger_rank_change, c.trigger_l1_change
            FROM rfqs r
            LEFT JOIN auction_config c ON r.id = c.rfq_id
            WHERE r.id = ?
        `, [req.params.id]);

        if (rfq.length === 0) return res.status(404).json({ error: "RFQ not found" });

        const [bids] = await db.execute(`
            SELECT b.*, s.name as supplier_name
            FROM bids b
            JOIN suppliers s ON b.supplier_id = s.id
            WHERE b.rfq_id = ?
            ORDER BY b.total_amount ASC, b.bid_timestamp ASC
        `, [req.params.id]);

        const [logs] = await db.execute(`
            SELECT l.*, s.name as supplier_name
            FROM activity_logs l
            LEFT JOIN suppliers s ON l.supplier_id = s.id
            WHERE l.rfq_id = ?
            ORDER BY l.timestamp DESC
        `, [req.params.id]);

        res.json({ ...rfq[0], bids, activity_logs: logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
