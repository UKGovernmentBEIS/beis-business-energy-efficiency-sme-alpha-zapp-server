exports.up = (pgm) => {
  pgm.createTable('action', {
    id: 'id',
    code: { type: 'varchar(255)', notNull: true, unique: true },
    description: { type: 'varchar(255)', notNull: true }
  })

  pgm.createTable('action_log', {
    id: 'id',
    company_id: {
      type: 'int',
      notNull: true,
      references: 'company'
    },
    pseudonym: {
      type: 'varchar(255)',
      notNull: true
    },
    action_id: {
      type: 'int',
      notNull: true,
      references: 'action'
    },
    timestamp: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  })
}

exports.down = (pgm) => {
  pgm.dropTable('action_log')
  pgm.dropTable('action')
}
