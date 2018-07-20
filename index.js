const apicache = require('apicache')
const basicAuth = require('express-basic-auth')
const bodyParser = require('body-parser')
const enforce = require('express-sslify')
const request = require('request')

const express = require('express')
const app = express()
const s3Proxy = require('s3-proxy')
const http = require('http').Server(app)
const io = require('socket.io')(http)

const cache = apicache.options({ statusCodes: { include: [200] } }).middleware

const users = {}
const adminPassword = process.env.ADMIN_PASSWORD
if (adminPassword) {
  users['admin'] = adminPassword
}
const auth = basicAuth({ users, challenge: true })

if (process.env.ENFORCE_HTTPS === 'yes') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }))
}
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

app.get('/registration/:companyId', (req, res) => {
  const { companyId } = req.params
  const company = getCompany(companyId)
  if (!company) {
    res.status(404).send('Company not found')
    return
  }
  res.send(company)
})

app.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params
  const company = getCompany(companyId)
  if (!company) {
    res.status(404).send('Company not found')
    return
  }
  res.json({ company })
})

app.get('/weather/forecast', cache('1 hour'), (req, res) => {
  const location = req.query.location
  request({
    uri: 'https://api.openweathermap.org/data/2.5/forecast',
    qs: {
      appid: process.env.OPENWEATHERMAP_API_KEY,
      units: 'metric',
      q: location
    }
  }).pipe(res)
})

app.get('/dashboard', auth, (req, res) => {
  res.send('Dashboard.')
})

io.on('connection', socket => {
  let company = null
  let userPseudonym = null

  const formatMessage = message => `[${company || 'Unknown'} | ${userPseudonym || 'Anonymous'}] ${message}`
  const info = message => console.log(formatMessage(message))
  const warn = message => console.warn(formatMessage(message))
  const error = message => console.error(formatMessage(message))

  socket.on('join', (companyId, pseudonym) => {
    company = getCompany(companyId)
    userPseudonym = pseudonym
    if (company) {
      socket.join(company)
      info('Connected.')
      updateCompanyUsersCount(company)
    } else {
      info(`No company found for company ID '${companyId}'.`)
    }
  })

  socket.on('track', info)
  socket.on('track-info', info)
  socket.on('track-warn', warn)
  socket.on('track-error', error)

  socket.on('disconnect', () => {
    info('Disconnected.')
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
