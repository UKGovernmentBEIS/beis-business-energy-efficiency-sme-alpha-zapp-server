const express = require('express')
const app = express()
const s3Proxy = require('s3-proxy')
const http = require('http').Server(app)
const io = require('socket.io')(http)
const bodyParser = require('body-parser')
const enforce = require('express-sslify')

app.use(enforce.HTTPS({ trustProtoHeader: true }))
app.use(express.static('public'))
app.use(bodyParser.json())

app.get('/Releases/*', s3Proxy({
  bucket: 'beis-sme-alpha',
  region: 'eu-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}))

app.post('/heating/message', (req, res) => {
  const json = req.body
  if (!json.token || json.token !== process.env.AD_HOC_NOTIFICATION_TOKEN) {
    res.status(403).send('Forbidden.')
    return
  }
  if (!networkExists(json.network)) {
    res.status(404).send(`Could not find network '${json.network}'.`)
    return
  }
  io.sockets.in(json.network).emit('heating-notification', json.title, json.message)
  res.send('OK.')
})

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

function networkExists (network) {
  return Object.values(NETWORK_MAP).indexOf(network) !== -1
}

function updateNetworkUsersCount (network) {
  const roomUsers = io.sockets.adapter.rooms[network]
  const count = roomUsers ? roomUsers.length : 0
  console.log(`Currently ${count} user(s) on ${network} network.`)
  io.sockets.in(network).emit('network-count-change', count)
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
