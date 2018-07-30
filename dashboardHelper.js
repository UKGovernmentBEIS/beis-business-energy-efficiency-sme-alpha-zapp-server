const { query } = require('./databaseClient')

module.exports = {

  getCumulativeData: async function (companyName) {
    const zappHibernations = await getCumulativeDataByAction(companyName, 'ZappHibernation')
    const heatingActions = await getCumulativeDataByAction(companyName, 'HeatingFirstLoginDone')
    return {
      zappHibernations,
      heatingActions
    }
  },

  getChartData: async function (companyName) {
    const totalUsers = await getTotalUsersData(companyName)
    const labels = [...Array(totalUsers.length).keys()].map(k => `${k + 1}`)

    const dailyUserData = await getDailyUserData(companyName, totalUsers)
    const installationData = await getInstallationData(companyName)
    const optedInData = await getOptedInData(companyName, totalUsers)
    const hibernationData = await getHibernationData(companyName, totalUsers)
    const heatingNotificationData = await getHeatingNotificationData(companyName)
    return {
      labels,
      dailyUserData,
      installationData,
      optedInData,
      hibernationData,
      heatingNotificationData
    }
  }
}


async function getCumulativeDataByAction (companyName, action) {
  const data = await query(`SELECT 
  company.name, action.code
  FROM action_log
  INNER JOIN company ON action_log.company_id = company.id
  INNER JOIN action ON action_log.action_id = action.id
  WHERE company.name ILIKE $1
  AND action.code ILIKE $2;`, [companyName, action])
  return data.rowCount
}

async function getDailyUserData (companyName, totalUsers) {
  const activeUsers = await getActiveUsersData(companyName)

  return {
    totalUsers: totalUsers.map(d => d.totalusers),
    activeUsers: activeUsers.map(d => d.activeusers)
  }
}

async function getActiveUsersData (companyName) {
  const data = await query(`SELECT 
  datetable.date, COALESCE(activeuserstable.activeusers, 0) AS activeusers 
  FROM (
    SELECT i::date AS date from generate_series((
      SELECT timestamp::date FROM action_log
      ORDER BY timestamp ASC
      LIMIT 1), 
    current_date, '1 day'::interval) AS i
  WHERE (EXTRACT(ISODOW FROM i) < 6)) AS datetable 
  LEFT JOIN (
    SELECT activedaystable.date, COUNT(pseudonym) AS activeusers
      FROM (
        SELECT DISTINCT  a1.pseudonym,  a1."timestamp"::date AS date
        FROM action_log AS a1
        INNER JOIN company ON a1.company_id = company.id
        LEFT JOIN action_log a2 On a1.pseudonym = a2.pseudonym AND a1.timestamp::date = a2.timestamp::date AND a2.action_id = 14
        WHERE a2.id IS NULL
        AND (EXTRACT(ISODOW FROM a1."timestamp") < 6)
        AND company.name ILIKE $1
        ) AS activedaystable
    GROUP BY activedaystable.date
    ORDER BY activedaystable.date
  ) AS activeuserstable
  ON datetable.date = activeuserstable.date
  ;`, [companyName])
  return data.rows
}

async function getTotalUsersData (companyName) {
  const data = await query(`SELECT 
  datetable.date, COUNT(installtable.pseudonym) AS totalusers 
  FROM (
    SELECT i::date AS date from generate_series((
      SELECT timestamp::date FROM action_log
      ORDER BY timestamp ASC
      LIMIT 1), 
    current_date, '1 day'::interval) AS i
  WHERE (EXTRACT(ISODOW FROM i) < 6)) AS datetable 
  LEFT JOIN (
    SELECT  a1.pseudonym,  a1."timestamp"::date AS installdate, a2."timestamp"::date AS uninstalldate
    FROM action_log AS a1
    LEFT JOIN action_log AS a2 ON a1.pseudonym = a2.pseudonym AND a2.action_id = 14
    INNER JOIN company ON a1.company_id = company.id
    WHERE a1.action_id = 13 AND company.name = $1) AS installtable
  ON installtable.installdate <= datetable.date AND (installtable.uninstalldate > datetable.date OR installtable.uninstalldate IS NULL)
  GROUP BY datetable.date
  ORDER BY datetable.date ASC;`, [companyName])
  return data.rows
}

async function getInstallationData (companyName) {
  const data = await query(`SELECT 
  datetable.date, COALESCE(a1.installs, 0) AS installs, COALESCE(a1.uninstalls, 0) AS uninstalls
  FROM (
    SELECT i::date AS date from generate_series((
      SELECT timestamp::date FROM action_log
      ORDER BY timestamp ASC
      LIMIT 1), 
    current_date, '1 day'::interval) AS i
  WHERE (EXTRACT(ISODOW FROM i) < 6)) AS datetable 
  LEFT JOIN (
    SELECT timestamp::date AS date, COUNT(NULLIF(action_id = 13, FALSE)) AS installs, COUNT(NULLIF(action_id = 14, FALSE)) AS uninstalls
    FROM action_log
    INNER JOIN company ON action_log.company_id = company.id
    WHERE (EXTRACT(ISODOW FROM "timestamp") < 6)
    AND company.name ILIKE $1
    GROUP BY (date)
    ORDER BY (date)
  ) AS a1
  ON datetable.date = a1.date;`, [companyName])

  const installations = data.rows.map(d => d.installs)
  const uninstallations = data.rows.map(d => d.uninstalls)
  return {
    installations,
    uninstallations
  }
}

async function getOptedInData (companyName, totalUsers) {
  let optedInHibernationData = await getOptedInDataByActionId(companyName, 7, 8)
  let optedInHeatingData = await getOptedInDataByActionId(companyName, 9, 10)

  optedInHibernationData = optedInHibernationData.map(d => parseInt(d.optedinusers))
  optedInHeatingData = optedInHeatingData.map(d => parseInt(d.optedinusers))
  totalUsers = totalUsers.map(d => parseInt(d.totalusers))

  const optedInHibernationPercentages = calculateAsPercentageOfTotalUsers(optedInHibernationData, totalUsers)
  const optedInHeatingPercentages = calculateAsPercentageOfTotalUsers(optedInHeatingData, totalUsers)

  return {
    optedInHibernationPercentages,
    optedInHeatingPercentages
  }
}

function calculateAsPercentageOfTotalUsers (values, totalUsers) {
  return totalUsers.map((t, i) => (t === 0) ? (0).toString() : (100 * (values[i] / t)).toFixed(1))
}

async function getOptedInDataByActionId (companyName, optInActionId, optOutActionId) {
  const data = await query(`SELECT 
  datetable.date, COUNT(optintable.pseudonym) AS optedinusers 
  FROM (
    SELECT i::date AS date from generate_series((
      SELECT timestamp::date FROM action_log
      ORDER BY timestamp ASC
      LIMIT 1), 
    current_date, '1 day'::interval) AS i
  WHERE (EXTRACT(ISODOW FROM i) < 6)) AS datetable 
  LEFT JOIN (
    SELECT pseudonym, optindate, MIN(optoutdate) AS optoutdate 
    FROM (
      SELECT  a1.pseudonym,  a1."timestamp" AS optindate, a2."timestamp" AS optoutdate
      FROM action_log AS a1
      LEFT JOIN action_log AS a2 ON a1.pseudonym = a2.pseudonym AND a2.action_id IN ($3,14) AND a1."timestamp" < a2."timestamp"
    INNER JOIN company ON a1.company_id = company.id
    WHERE a1.action_id = $2 AND company.name ILIKE $1) AS dateranges
  GROUP BY pseudonym, optindate) 
  AS optintable
  ON optintable.optindate <= datetable.date + interval '1 day' AND (optintable.optoutdate > datetable.date + interval '1 day' OR optintable.optoutdate IS NULL)
  GROUP BY datetable.date
  ORDER BY datetable.date ASC 
  ;`, [companyName, optInActionId, optOutActionId])
  return data.rows
}

async function getHibernationData (companyName, totalUsers) {
  const data = await query(`SELECT 
  datetable.date, COALESCE(a1.hibernated, 0) AS hibernated, COALESCE(a1.nottonight, 0) AS nottonight 
  FROM (
    SELECT i::date AS date from generate_series((
      SELECT timestamp::date FROM action_log
      ORDER BY timestamp ASC
      LIMIT 1), 
    current_date, '1 day'::interval) AS i
  WHERE (EXTRACT(ISODOW FROM i) < 6)) AS datetable 
  LEFT JOIN (
    SELECT timestamp::date AS date, COUNT(NULLIF(action_id = 11, FALSE)) AS hibernated, COUNT(NULLIF(action_id = 12, FALSE)) AS nottonight
    FROM action_log
    INNER JOIN company ON action_log.company_id = company.id
    WHERE (EXTRACT(ISODOW FROM "timestamp") < 6)
    AND company.name ILIKE $1
    GROUP BY (date)
    ORDER BY (date)
  ) AS a1
  ON datetable.date = a1.date;`, [companyName])

  const hibernated = data.rows.map(d => parseInt(d.hibernated))
  const notTonight = data.rows.map(d => parseInt(d.nottonight))
  totalUsers = totalUsers.map(d => parseInt(d.totalusers))
  const other = totalUsers.map((d, i) => d - hibernated[i] - notTonight[i])

  const hibernatedPercentages = calculateAsPercentageOfTotalUsers(hibernated, totalUsers)
  const notTonightPercentages = calculateAsPercentageOfTotalUsers(notTonight, totalUsers)
  const otherPercentages = calculateAsPercentageOfTotalUsers(other, totalUsers)

  return {
    hibernatedPercentages,
    notTonightPercentages,
    otherPercentages
  }
}

async function getHeatingNotificationData (companyName) {
  const data = await query(`SELECT 
  datetable.date, COALESCE(a1.clickedDone, 0) AS clickeddone, COALESCE(a1.clickedNotNow, 0) AS clickednotnow 
  FROM (
    SELECT i::date AS date from generate_series((
      SELECT timestamp::date FROM action_log
      ORDER BY timestamp ASC
      LIMIT 1), 
    current_date, '1 day'::interval) AS i
  WHERE (EXTRACT(ISODOW FROM i) < 6)) AS datetable 
  LEFT JOIN (
    SELECT timestamp::date AS date, COUNT(NULLIF(action_id = 15, FALSE)) AS clickedDone, COUNT(NULLIF(action_id = 16, FALSE)) AS clickedNotNow
    FROM action_log
    INNER JOIN company ON action_log.company_id = company.id
    WHERE (EXTRACT(ISODOW FROM "timestamp") < 6)
    AND company.name ILIKE $1
    GROUP BY (date)
    ORDER BY (date)
  ) AS a1
  ON datetable.date = a1.date;`, [companyName])

  const clickedDone = data.rows.map(d => parseInt(d.clickeddone))
  const clickedNotNow = data.rows.map(d => parseInt(d.clickednotnow))
  const total = clickedDone.map((d, i) => d + clickedNotNow[i])
  const heatingNotificationData = total.map((d, i) => (d === 0) ? (0).toString() : (100 * (clickedDone[i] / d)).toFixed(1))
  return {
    heatingNotificationData
  }
}
