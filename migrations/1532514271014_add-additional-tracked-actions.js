exports.up = (pgm) => {
  pgm.db.query(
    `INSERT INTO action(code, description) VALUES
    ('InstalledZapp', 'User installed Zapp.'),
    ('UninstalledZapp', 'User uninstalled Zapp.'),
    ('HeatingFirstLoginDone', 'User clicked "Done!" on first login reminder.'),
    ('HeatingFirstLoginNotNow', 'User clicked "Not now" on first login reminder.');`
  )
}

exports.down = (pgm) => {
  pgm.db.query(`DELETE 
  FROM action_log
  WHERE action_id IN (13, 14, 15, 16)
  ;`)
  pgm.db.query(`DELETE 
  FROM action
  WHERE id IN (13, 14, 15, 16)
  ;`)
}
