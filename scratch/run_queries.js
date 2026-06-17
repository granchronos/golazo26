const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] ? match[2].trim() : ''
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1)
    }
    env[match[1]] = value
  }
})

const apiKey = env.FOOTBALL_API_KEY || 'c95fc0d4a98faba4c05f37482279f61f'

async function checkApi() {
  const url = `https://v3.football.api-sports.io/fixtures?league=1&season=2026`
  console.log('Fetching football API:', url)
  try {
    const res = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
    })
    console.log('Status:', res.status, res.statusText)
    const json = await res.json()
    console.log('Error count / messages:', json.errors)
    console.log('Response count:', json.response ? json.response.length : 0)
    if (json.response && json.response.length > 0) {
      console.log('First fixture sample:', JSON.stringify(json.response[0], null, 2))
    }
  } catch (err) {
    console.error('Error fetching API:', err)
  }
}

checkApi()
