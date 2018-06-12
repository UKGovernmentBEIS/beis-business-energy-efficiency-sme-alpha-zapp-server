const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', (socket) => {
  console.log('a user connected')
  socket.on('disconnect', () => console.log('user disconnected'))
});

const port = process.env.PORT || 5001
http.listen(port, () => console.log(`Listening on port ${port}.`))