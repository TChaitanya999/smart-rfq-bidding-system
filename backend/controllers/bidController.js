const db = require('../config/db');
const moment = require('moment');

exports.getSuppliers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM suppliers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.submitBid = async (req, res) => {
    try {
        const { 
            rfq_id, supplier_id, freight_charges, 
            origin_charges, destination_charges, transit_time, quote_validity 
        } = req.body;

        const total_amount = parseFloat(freight_charges) + parseFloat(origin_charges) + parseFloat(destination_charges);
        const currentTime = moment();

        const [rfqRows] = await db.execute(`
            SELECT r.*, c.trigger_window_mins, c.extension_duration_mins, 
            c.trigger_bid_received, c.trigger_rank_change, c.trigger_l1_change
            FROM rfqs r
            JOIN auction_config c ON r.id = c.rfq_id
            WHERE r.id = ?
        `, [rfq_id]);

        if (rfqRows.length === 0) return res.status(404).json({ error: "RFQ not found" });
        const rfq = rfqRows[0];

        if (currentTime.isBefore(moment(rfq.bid_start_time))) {
            return res.status(400).json({ error: "Auction has not started yet" });
        }
        if (currentTime.isAfter(moment(rfq.bid_close_time))) {
            return res.status(400).json({ error: "Auction has closed" });
        }

        const [oldBids] = await db.execute(`
            SELECT supplier_id, MIN(total_amount) as min_amount 
            FROM bids WHERE rfq_id = ? GROUP BY supplier_id ORDER BY min_amount ASC
        `, [rfq_id]);
        
        const oldL1 = oldBids.length > 0 ? oldBids[0] : null;
        const oldSupplierRank = oldBids.findIndex(b => b.supplier_id === parseInt(supplier_id));

        await db.execute(
            `INSERT INTO bids (rfq_id, supplier_id, freight_charges, origin_charges, destination_charges, total_amount, transit_time, quote_validity) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [rfq_id, supplier_id, freight_charges, origin_charges, destination_charges, total_amount, transit_time, quote_validity]
        );

        const [newBids] = await db.execute(`
            SELECT supplier_id, MIN(total_amount) as min_amount 
            FROM bids WHERE rfq_id = ? GROUP BY supplier_id ORDER BY min_amount ASC
        `, [rfq_id]);
        
        const newL1 = newBids[0];
        const newSupplierRank = newBids.findIndex(b => b.supplier_id === parseInt(supplier_id));

        const closeTime = moment(rfq.bid_close_time);
        const forcedCloseTime = moment(rfq.forced_close_time);
        const triggerWindowStart = moment(rfq.bid_close_time).subtract(rfq.trigger_window_mins, 'minutes');

        let shouldExtend = false;
        let extensionReason = "";

        if (currentTime.isBetween(triggerWindowStart, closeTime)) {
            if (rfq.trigger_bid_received) {
                shouldExtend = true;
                extensionReason = "Bid received within trigger window";
            }
            else if (rfq.trigger_rank_change && oldSupplierRank !== newSupplierRank) {
                shouldExtend = true;
                extensionReason = "Supplier rank changed within trigger window";
            }
            else if (rfq.trigger_l1_change && (!oldL1 || oldL1.supplier_id !== newL1.supplier_id)) {
                shouldExtend = true;
                extensionReason = "L1 bidder changed within trigger window";
            }
        }

        if (shouldExtend) {
            let newCloseTime = closeTime.add(rfq.extension_duration_mins, 'minutes');
            
            if (newCloseTime.isAfter(forcedCloseTime)) {
                newCloseTime = forcedCloseTime;
                extensionReason += " (Limited by Forced Close Time)";
            }

            if (newCloseTime.isAfter(moment(rfq.bid_close_time))) {
                await db.execute(`UPDATE rfqs SET bid_close_time = ? WHERE id = ?`, [newCloseTime.format('YYYY-MM-DD HH:mm:ss'), rfq_id]);
                
                await db.execute(
                    `INSERT INTO activity_logs (rfq_id, supplier_id, action, reason) VALUES (?, ?, ?, ?)`,
                    [rfq_id, supplier_id, 'time_extension', extensionReason]
                );
            }
        }

        await db.execute(
            `INSERT INTO activity_logs (rfq_id, supplier_id, action, reason) VALUES (?, ?, ?, ?)`,
            [rfq_id, supplier_id, 'bid_submission', `Submitted bid of ₹${total_amount}`]
        );

        const io = req.app.get('socketio');
        const [updatedRfq] = await db.execute(`
            SELECT r.*, 
            (SELECT MIN(total_amount) FROM bids b WHERE b.rfq_id = r.id) as lowest_bid
            FROM rfqs r WHERE r.id = ?
        `, [rfq_id]);

        const [allBids] = await db.execute(`
            SELECT b.*, s.name as supplier_name
            FROM bids b
            JOIN suppliers s ON b.supplier_id = s.id
            WHERE b.rfq_id = ?
            ORDER BY b.total_amount ASC, b.bid_timestamp ASC
        `, [rfq_id]);

        const [logs] = await db.execute(`
            SELECT l.*, s.name as supplier_name
            FROM activity_logs l
            LEFT JOIN suppliers s ON l.supplier_id = s.id
            WHERE l.rfq_id = ?
            ORDER BY l.timestamp DESC
        `, [rfq_id]);

        io.to(`rfq_${rfq_id}`).emit('rfq_update', {
            rfq: updatedRfq[0],
            bids: allBids,
            activity_logs: logs
        });
        
        io.emit('rfq_list_update');

        res.status(201).json({ message: "Bid submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
