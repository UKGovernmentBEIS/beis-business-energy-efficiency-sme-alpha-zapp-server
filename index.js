const apicache = require('apicache')
const basicAuth = require('express-basic-auth')
const bodyParser = require('body-parser')
const express = require('express')
const exphbs = require('express-handlebars')
const enforce = require('express-sslify')
const { Client } = require('pg')
const request = require('request')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const cache = apicache.options({ statusCodes: { include: [200] } }).middleware

const users = {}
const adminPassword = process.env.ADMIN_PASSWORD
if (adminPassword) {
  users['admin'] = adminPassword
}
const auth = basicAuth({ users, challenge: true })

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'

if (process.env.ENFORCE_HTTPS === 'yes') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }))
}

const hbs = exphbs.create({ defaultLayout: 'main' })
app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/admin', auth, async (req, res) => {
  const result = await query('SELECT * FROM company;')
  res.render('admin', { companies: result.rows })
})

app.get('/admin/company/:code', async (req, res) => {
  const { code } = req.params
  const name = await getCompanyName(code)
  res.render('company', { name })
})

app.post('/admin/company/:code/delete', auth, async (req, res) => {
  const { code } = req.params
  await query('DELETE FROM company WHERE code = $1', [code])
  res.redirect('/admin')
})

app.post('/admin/company/new', auth, async (req, res) => {
  const { code, name } = req.body
  if (code && name) {
    try {
      await query('INSERT INTO company (code, name) VALUES ($1, $2);', [code, name])
    } catch (err) {
      console.warn(err)
    }
  }
  res.redirect('/admin')
})

app.get('/company/:code', async (req, res) => {
  const { code } = req.params
  const company = await getCompanyName(code)
  if (!company) {
    res.status(404).send('Company not found')
    return
  }
  res.json({ company })
})

app.get('/weather/forecast', cache('1 hour'), (req, res) => {
  const location = req.query.location
  request({
    uri: WEATHER_API_URL,
    qs: {
      appid: process.env.OPENWEATHERMAP_API_KEY,
      units: 'metric',
      q: location
    }
  }).pipe(res)
})

io.on('connection', socket => {
  let company = null
  let userPseudonym = null

  const formatMessage = message => `[${company || 'Unknown'} | ${userPseudonym || 'Anonymous'}] ${message}`
  const info = message => console.log(formatMessage(message))
  const warn = message => console.warn(formatMessage(message))
  const error = message => console.error(formatMessage(message))

  socket.on('join', async (companyCode, pseudonym) => {
    company = await getCompanyName(companyCode)
    userPseudonym = pseudonym
    if (company) {
      socket.join(company)
      info('Connected.')
      updateCompanyUsersCount(company)
    } else {
      info(`No company found for company code '${companyCode}'.`)
    }
  })

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

async function getCompanyName (code) {
  const result = await query('SELECT name FROM company WHERE code = $1;', [code])
  const company = result.rows[0]
  return company ? company.name : null
}

async function query (queryTextOrConfig, values) {
  const client = getPgClient()
  await client.connect()
  const result = await client.query(queryTextOrConfig, values)
  await client.end()
  return result
}

function getPgClient () {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PG_USE_SSL === 'yes'
  })
}

function updateCompanyUsersCount (company) {
  const roomUsers = io.sockets.adapter.rooms[company]
  const count = roomUsers ? roomUsers.length : 0
  console.log(`Currently ${count} user(s) on ${company} network.`)
  io.sockets.in(company).emit('company-count-change', count)
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
