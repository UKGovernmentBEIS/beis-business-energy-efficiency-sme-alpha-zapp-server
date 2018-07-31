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
    USING action
  WHERE action_log.action_id = action.id AND
  action.code IN ('InstalledZapp', 'UninstalledZapp', 'HeatingFirstLoginDone', 'HeatingFirstLoginNotNow');
    `)
  pgm.db.query(`DELETE 
  FROM action
  WHERE code IN ('InstalledZapp', 'UninstalledZapp', 'HeatingFirstLoginDone', 'HeatingFirstLoginNotNow')
  ;`)
}
