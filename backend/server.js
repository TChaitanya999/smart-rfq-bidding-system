const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const rfqRoutes = require('./routes/rfqRoutes');
const bidRoutes = require('./routes/bidRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.set('socketio', io);

app.use('/api/rfqs', rfqRoutes);
app.use('/api/bids', bidRoutes);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('join_rfq', (rfqId) => {
        socket.join(`rfq_${rfqId}`);
        console.log(`User joined room: rfq_${rfqId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
