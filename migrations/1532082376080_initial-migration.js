exports.up = (pgm) => {
  pgm.createTable('company', {
    id: 'id',
    code: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true, unique: true }
  })
}

exports.down = (pgm) => {
  pgm.dropTable('company')
}
