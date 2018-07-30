const apicache = require('apicache')
const basicAuth = require('express-basic-auth')
const bodyParser = require('body-parser')
const csv = require('csv-express')
const dashboardHelper = require('./dashboardHelper')
const enforce = require('express-sslify')
const exphbs = require('express-handlebars')
const express = require('express')
const flash = require('express-flash')
const { query } = require('./databaseClient')
const request = require('request')
const session = require('express-session')

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
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true
}))
app.use(flash())

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/admin', auth, async (req, res) => {
  const result = await query('SELECT * FROM company;')
  const messages = req.flash()
  res.render('admin', { companies: result.rows, error: messages.error })
})

app.get('/admin/company/:code', async (req, res) => {
  const { code } = req.params
  const company = await getCompany(code)
  const dashboardData = await dashboardHelper.getDashboardData(company.name)
  res.render('company', {
    name: company.name,
    dashboardData: JSON.stringify(dashboardData)
  })
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
      req.flash('error', `Could not add company '${name}' with code '${code}'. Please ensure that both the name and code are unique.`)
    }
  }
  res.redirect('/admin')
})

app.get('/company/:code', async (req, res) => {
  const { code } = req.params
  const company = await getCompany(code)
  if (!company) {
    res.status(404).send('Company not found')
    return
  }
  res.json({ company: company.name })
})

app.get('/admin/download/Zapp_usage_data.csv', auth, async (req, res) => {
  const sqlData = await getAllDataForDownload()
  res.csv(sqlData.rows, true)
})

app.get('/admin/download/:companyName/Zapp_usage_data.csv', auth, async (req, res) => {
  const { companyName } = req.params
  const sqlData = await getCompanyDataForDownload(companyName)
  res.csv(sqlData.rows, true)
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

  const formatMessage = message => `[${company ? company.name : 'Unknown'} | ${userPseudonym || 'Anonymous'}] ${message}`
  const info = message => console.log(formatMessage(message))
  const warn = message => console.warn(formatMessage(message))
  const error = message => console.error(formatMessage(message))

  socket.on('join', async (companyCode, pseudonym) => {
    company = await getCompany(companyCode)
    userPseudonym = pseudonym
    if (company) {
      socket.join(company.name)
      info('Connected.')
      updateCompanyUsersCount(company.name)
    } else {
      info(`No company found for company code '${companyCode}'.`)
    }
  })

  socket.on('track-info', async (message, action) => {
    console.log(formatMessage(message))
    const actionId = await getActionId(action)

    if (company.id && userPseudonym && actionId) {
      try {
        await query(`INSERT INTO action_log(company_id, pseudonym, action_id)
        VALUES ($1, $2, $3);`, [company.id, userPseudonym, actionId])
      } catch (err) {
        console.warn(err)
      }
    }
  })

  socket.on('track-warn', warn)
  socket.on('track-error', error)

  socket.on('disconnect', () => {
    info('Disconnected.')
    if (company) {
      updateCompanyUsersCount(company)
    }
  })
})

async function getCompany (code) {
  const result = await query('SELECT * FROM company WHERE code = $1;', [code])
  return result.rows[0]
}

async function getActionId (code) {
  const result = await query('SELECT id FROM action WHERE code = $1;', [code])
  const row = result.rows[0]
  return row ? row.id : null
}

async function getAllDataForDownload (code) {
  return query(`SELECT 
    to_char(timestamp::date,'DD/MM/YYYY') AS date,  
    timestamp::time(0) AS time,  
    company.name AS company, 
    pseudonym, 
    action.code, 
    action.description
  FROM action_log
  INNER JOIN company ON action_log.company_id = company.id
  INNER JOIN action ON action_log.action_id = action.id;`)
}

async function getCompanyDataForDownload (companyName) {
  return query(`SELECT 
    to_char(timestamp::date,'DD/MM/YYYY') AS date,  
    timestamp::time(0) AS time,  
    company.name AS company, 
    pseudonym, 
    action.code, 
    action.description
  FROM action_log
  INNER JOIN company ON action_log.company_id = company.id
  INNER JOIN action ON action_log.action_id = action.id
  WHERE company.name ILIKE $1;`, [companyName])
}

function updateCompanyUsersCount (company) {
  const roomUsers = io.sockets.adapter.rooms[company]
  const count = roomUsers ? roomUsers.length : 0
  console.log(`Currently ${count} user(s) on ${company} network.`)
  io.sockets.in(company).emit('company-count-change', count)
}

const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}.`))
