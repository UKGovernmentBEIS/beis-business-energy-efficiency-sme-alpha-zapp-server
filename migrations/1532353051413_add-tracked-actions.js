exports.up = (pgm) => {
  pgm.db.query(
    `INSERT INTO action(code, description) VALUES
    ('OptInToHibernate', 'User opted in to scheduled hibernation.'),
    ('OptOutOfHibernate', 'User opted out of scheduled hibernation.'),
    ('OptInToHeating', 'User opted in to heating notifications.'),
    ('OptOutOfHeating', 'User opted out of heating notifications.'),
    ('ZappHibernation', 'Machine was hibernated automatically.'),
    ('ClickedNotTonight', 'User clicked "Not tonight" hibernation warning modal.');`
  )
}

exports.down = (pgm) => {
  pgm.db.query(`DELETE FROM action_log;`)
  pgm.db.query(`DELETE FROM action;`)
}
