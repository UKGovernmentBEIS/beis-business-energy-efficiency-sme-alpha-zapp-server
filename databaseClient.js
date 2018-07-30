const { Client } = require('pg')

module.exports = {
  query: async function (queryTextOrConfig, values) {
    const client = getPgClient()
    await client.connect()
    const result = await client.query(queryTextOrConfig, values)
    await client.end()
    return result
  }
}

function getPgClient () {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.POSTGRES_USE_SSL === 'yes'
  })
}
