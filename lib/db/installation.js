const { pool } = require('./connection')

exports.list = (installations) => {
  // cast ids to strings
  installations = installations.map(String)

  return pool.query('SELECT * FROM installations LEFT JOIN orgs USING (id) WHERE id = ANY ($1)', [[installations]])
}

exports.remove = (installation) => {
  pool.query('DELETE FROM installations WHERE id = $1', [installation])
  pool.query('DELETE FROM repositories WHERE installation = $1', [installation])
}

exports.add = (installation) => {
  const row = [
    installation.id,
    installation.account.login,
    installation.account.type,
    installation.html_url
  ]

  return pool.query(`INSERT INTO
    installations (id, name, type, url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    url = EXCLUDED.url`, row)
}

exports.get = (org) => {
  return pool.query('SELECT * FROM installations WHERE name = $1', [org])
}
