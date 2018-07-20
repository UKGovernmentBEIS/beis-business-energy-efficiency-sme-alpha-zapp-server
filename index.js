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
  if (!companyExists(json.network)) {
    res.status(404).send(`Could not find network '${json.network}'.`)
    return
  }
  io.sockets.in(json.network).emit('heating-notification', json.title, json.message)
  res.send('OK.')
})

app.get('/registration/company-id', (req, res) => {
  const json = req.body
  const company = getCompany(json.companyId)
  company ? res.send(company) : res.send('Company not found')
})

io.on('connection', socket => {
  let company = null
  let userPseudonym = null

  const log = message => console.log(`[${company || 'Unknown'} | ${userPseudonym || 'Anonymous'}] ${message}`)

  socket.on('join', (companyId, pseudonym) => {
    company = getCompany(companyId)
    userPseudonym = pseudonym
    if (company) {
      socket.join(company)
      log('Connected.')
      updateCompanyUsersCount(company)
    } else {
      log(`No company found for company ID '${companyId}'.`)
    }
  })

  socket.on('track', log)

  socket.on('disconnect', () => {
    log('Disconnected.')
    if (company) {
      updateCompanyUsersCount(company)
    }
  })
})

const COMPANY_MAP = {
}

function getCompany (companyId) {
  return COMPANY_MAP[companyId]
}

function companyExists (company) {
  return Object.values(COMPANY_MAP).indexOf(company) !== -1
}

function updateCompanyUsersCount (company) {
  const roomUsers = io.sockets.adapter.rooms[company]
  const count = roomUsers ? roomUsers.length : 0
  console.log(`Currently ${count} user(s) on ${company} network.`)
  io.sockets.in(company).emit('company-count-change', count)
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
