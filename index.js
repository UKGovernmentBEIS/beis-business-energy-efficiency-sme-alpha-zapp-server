const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

io.on('connection', (socket) => {
  console.log('CONNECTED')

  socket.on('join', (network) => {
    console.log(`Network - ${network}`)
    socket.room = selectRoom(network)
    if (socket.room) {
      socket.join(socket.room)
      console.log(`Currently ${calculateCurrentUsers(socket.room)} user(s) on ${socket.room} network`)
    }
  })

  socket.on('disconnect', () => {
    console.log(`DISCONNECTED`)
    if (socket.room) {
      socket.leave(socket.room)
      const usersRemaining = calculateCurrentUsers(socket.room)
      console.log(`Currently ${usersRemaining} user(s) on ${socket.room} network`)
      if (usersRemaining < 2) {
        socket.to(socket.room).emit('lastManReminder', 'You are the last person in the office. Remember to turn off the lights')
      }
    }
  })
  socket.on('network', network => console.log(`NETWORK: ${network}`))
})

function calculateCurrentUsers (room) {
  if (io.sockets.adapter.rooms[room]) {
    return io.sockets.adapter.rooms[room].length
  } else {
    return 0
  }
}

function selectRoom (network) {
  if (networkMap[network]) {
    return networkMap[network]
  } else {
    console.log(`This network is not currently registered with RemindS Me.`)
  }
}

const networkMap = {
  'zoo.lan': 'Softwire'
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
