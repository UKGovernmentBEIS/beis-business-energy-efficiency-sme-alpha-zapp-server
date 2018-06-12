const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

io.on('connection', (socket) => {
  console.log('CONNECTED')
  socket.on('disconnect', () => console.log('DISCONNECTED'))
  socket.on('network', network => console.log(`NETWORK: ${network}`))
})

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
