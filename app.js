const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
const dbpath = path.join(__dirname, 'covid19India.db')

app.use(express.json())
let db = null

const intializeDb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}

intializeDb()

const convertStates = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrict = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT 
      * 
    FROM 
      state;`

  const statesArray = await db.all(getStatesQuery)
  response.send(statesArray.map(eachState => convertStates(eachState)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateByIdQuery = `
  SELECT 
    *
  FROM 
    state
  WHERE 
    state_id=${stateId};`

  const stateById = await db.get(getStateByIdQuery)
  response.send(convertStates(stateById))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO 
    district (district_name, state_id, cases, cured, active, deaths)
  VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`
  await db.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictByIdQuery = `
  SELECT 
    * 
  FROM   
    district
  WHERE 
    district_id=${districtId};`

  const districtById = await db.get(getDistrictByIdQuery)
  response.send(convertDistrict(districtById))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM 
    district
  WHERE 
    district_id=${districtId};`

  await db.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
  UPDATE 
    district
  SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
  WHERE 
    district_id=${districtId};`

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
  FROM
    district
  WHERE
    state_id=${stateId};`

  const stats = await db.get(getStateStatsQuery)
  console.log(stats)

  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    tootalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateNameQuery = `
  SELECT 
    state.state_name as stateName
  FROM 
    district
  JOIN state ON district.state_id=state.state_id
  WHERE 
    district.district_id=${districtId};`

  const stateName = await db.get(stateNameQuery)
  response.send(stateName)
})
module.exports = app
