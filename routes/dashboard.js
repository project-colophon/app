const express = require('express')

const db = require('../lib/db/installation')
const log = require('../lib/log')
const api = require('../lib/github/api')
const install = require('../lib/install')

const percentage = (x, y) => Math.floor((x / y) * 100)

const dashboard = express.Router()

// dashboard overview
dashboard.get('/', async function (req, res) {
  // refresh session when user is redirected back from github
  if (req.query.installation_id && req.query.setup_action) {
    return res.redirect('/auth/refresh')
  }

  // only show installations belonging to the user
  const userInstallations = req.user.installations.map(installation => installation.id)

  if (userInstallations.length === 0) {
    return res.render('dashboard/404')
  }

  const { rows } = await db.list(userInstallations)

  if (rows.length === 0) {
    return res.render('dashboard/404')
  }

  const installations = rows.map(row => {
    row.available = row.available || 0
    row.total = row.total || 0

    row.progress = percentage(row.available, row.total)

    row.status = row.progress > 0 ? row.progress > 50 ? 'green' : 'yellow' : 'red'

    return row
  })

  res.render('dashboard/index', { installations })
})

dashboard.get('/scan', async function (req, res) {
  const octokit = await api.user(req.user.accessToken)

  // fetch installations for this user
  const { data: { installations } } = await octokit.apps.listInstallationsForAuthenticatedUser() // TODO paginate

  log.info('found %d:cyan installations', installations.length)

  // re-install user apps
  installations.map(install)

  res.redirect('/dashboard')
})

module.exports = dashboard
