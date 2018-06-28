const app = require('express')()
const s3Proxy = require('s3-proxy')
const http = require('http').Server(app)
const io = require('socket.io')(http)

const HEATING = 'HEATING'

app.get('/Releases/*', s3Proxy({
  bucket: 'beis-sme-alpha',
  region: 'eu-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}))

io.on('connection', socket => {
  logSocketMessage(socket, 'Connected.')
  let network = null
  socket.on('join', (networkId, heatingOptIn) => {
    network = getNetwork(networkId)
    if (network) {
      socket.join(network)
      logSocketMessage(socket, `Joined ${network} network.`)
      updateNetworkUsersCount(network)
      if (heatingOptIn) {
        const heatingNotificationRoom = getNotificationRoom(network, HEATING)
        socket.join(heatingNotificationRoom)
        logSocketMessage(socket, `Opted in for notifications from ${heatingNotificationRoom}.`)
      }
    } else {
      logSocketMessage(socket, `No network found for network ID '${networkId}'.`)
    }
  })
  socket.on('disconnect', () => {
    logSocketMessage(socket, 'Disconnected.')
    if (network) {
      updateNetworkUsersCount(network)
    }
  })
})

const NETWORK_MAP = {
  'zoo.lan': 'Softwire'
}

function getNetwork (networkId) {
  return NETWORK_MAP[networkId]
}

function getNotificationRoom (network, notificationType) {
  return `${network}_${notificationType}`
}

function updateNetworkUsersCount (network) {
  const roomUsers = io.sockets.adapter.rooms[network]
  const count = roomUsers ? roomUsers.length : 0
  console.log(`Currently ${count} user(s) on ${network} network.`)
  io.sockets.in(network).emit('network-count-change', count)
}

function logSocketMessage (socket, message) {
  console.log(`[${socket.id}] ${message}`)
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
