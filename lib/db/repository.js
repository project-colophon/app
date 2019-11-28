const { pool } = require('./connection')

exports.get = (org, name) => {
  return pool.query('SELECT * FROM repositories WHERE org = $1 AND name = $2', [org, name])
}

exports.list = (org, limit = 25, offset = 0) => {
  return pool.query('SELECT COUNT(*) OVER() AS total, * FROM repositories WHERE org = $1 LIMIT $2 OFFSET $3', [org, limit, Math.abs(offset)])
}

// TODO: optimize for multiple inserts
exports.add = (installation, repo) => {
  const [org, name] = repo.full_name.split('/')

  const row = [
    installation,
    repo.id,
    org,
    name,
    repo.url,
    repo.language ? repo.language.name.toLowerCase() : null,
    repo.private,
    repo.filename,
    repo.content,
    repo.colophon,
    repo.updated
  ]

  return pool.query(`INSERT INTO
    repositories (installation, id, org, name, url, language, private, filename, content, colophon, updated)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO UPDATE
    SET org = EXCLUDED.org,
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    language = EXCLUDED.language,
    private = EXCLUDED.private,
    filename = EXCLUDED.filename,
    content = EXCLUDED.content,
    colophon = EXCLUDED.colophon,
    updated = EXCLUDED.updated`, row)
}

exports.remove = (installation, id) => {
  return pool.query('DELETE FROM repositories WHERE installation = $1 AND id = $2', [installation, id])
}
