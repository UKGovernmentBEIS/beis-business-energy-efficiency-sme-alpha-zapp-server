const app = require('express')()
const s3Proxy = require('s3-proxy')
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.get('/Releases/*', s3Proxy({
  bucket: 'beis-sme-alpha',
  region: 'eu-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}));

io.on('connection', socket => {
  console.log('CONNECTED')

  let room = null
  socket.on('join', network => {
    console.log(`Network - ${network}`)
    room = selectRoom(network)
    if (room) {
      socket.join(room)
      console.log(`Currently ${getRoomUsersCount(room)} user(s) on ${room} network`)
    }
  })

  socket.on('disconnect', () => {
    console.log(`DISCONNECTED`)
    handleLeave(room)
  })

  socket.on('network', network => console.log(`NETWORK: ${network}`))
})

const NETWORK_ROOM_MAP = {
  'zoo.lan': 'Softwire'
}
function selectRoom (network) {
  const room = NETWORK_ROOM_MAP[network]
  if (!room) {
    console.log(`This network is not currently registered with RemindS Me.`)
  }
  return room
}

function handleLeave (room) {
  const usersRemaining = getRoomUsersCount(room)
  console.log(`Currently ${usersRemaining} user(s) on ${room} network.`)
  if (usersRemaining === 1) {
    io.sockets.in(room).emit('last-man-reminder')
    console.log('Last man reminder sent.')
  }
}

function getRoomUsersCount (room) {
  const roomUsers = io.sockets.adapter.rooms[room]
  return roomUsers ? roomUsers.length : 0
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
