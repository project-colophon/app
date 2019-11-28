const db = require('../lib/db/')
const scan = require('../lib/scan/repo')
const parser = require('@colophon/schema')

// capture error tree
const parseErrors = content => parser(content).catch(error => error.name === 'ColophonError' ? error.errors : error.message)

exports.index = async function repository (req, res) {
  const org = req.params.org
  const name = req.params.name

  let guest = true

  if (req.user) {
    const installations = req.user.installations.map(installation => installation.account.login)

    // validate this user is a member of this org
    if (installations.includes(org)) {
      guest = false
    }
  }

  const { rows: [repository] } = await db.repository.get(org, name)
  const { rows: [installation] } = await db.installation.get(org)

  if (!repository) {
    // guest mode?
    return res.render(`repository/${guest ? 'public' : 'private'}/404`, { org, name, installation })
  }

  // guest mode on a private repo?
  if (guest && repository.private) {
    return res.render('repository/public/404', { org, name })
  }

  // errors placeholder
  let errors

  // was this a valid colophon
  if (repository.content !== null && repository.colophon === null) {
    errors = await parseErrors(repository.content)
  }

  return res.render(`repository/${guest ? 'public' : 'private'}/index`, { org, name, repository, errors })
}

exports.scan = async function (req, res) {
  const org = req.params.org
  const name = req.params.name

  const installations = req.user.installations.map(installation => installation.account.login)

  // validate this user is a member of this org
  if (!installations.includes(org)) {
    return res.redirect('/dashboard')
  }

  const { rows: [repository] } = await db.repository.get(org, name)

  // TODO check for existence

  scan(repository.installation, org, name)

  // TODO send to intermediary page

  res.redirect(`/${org}/${name}`)
}
