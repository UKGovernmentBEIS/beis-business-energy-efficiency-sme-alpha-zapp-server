const express = require('express')
const app = express()
const s3Proxy = require('s3-proxy')
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use(express.static('public'))

app.get('/Releases/*', s3Proxy({
  bucket: 'beis-sme-alpha',
  region: 'eu-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}))

io.on('connection', socket => {
  let network = null
  let userPseudonym = null

  const log = message => console.log(`[${network} | ${userPseudonym}] ${message}`)

  socket.on('join', (networkId, pseudonym) => {
    network = getNetwork(networkId)
    userPseudonym = pseudonym
    if (network) {
      socket.join(network)
      log('Connected.')
      updateNetworkUsersCount(network)
    } else {
      log(`No network found for network ID '${networkId}'.`)
    }
  })

  socket.on('track', log)

  socket.on('disconnect', () => {
    log('Disconnected.')
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

function updateNetworkUsersCount (network) {
  const roomUsers = io.sockets.adapter.rooms[network]
  const count = roomUsers ? roomUsers.length : 0
  console.log(`Currently ${count} user(s) on ${network} network.`)
  io.sockets.in(network).emit('network-count-change', count)
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
