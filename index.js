const app = require('express')()
const s3Proxy = require('s3-proxy')
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.get('/Releases/*', s3Proxy({
  bucket: 'beis-sme-alpha',
  region: 'eu-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}))

io.on('connection', socket => {
  let network = null
  let pseudonym = null

  const log = message => console.log(`[${network} | ${pseudonym}] ${message}`)

  socket.on('join', (networkId, pseudo) => {
    network = getNetwork(networkId)
    pseudonym = pseudo
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
