const fs = require('fs');
const path = require('path');

exports.up = async function (knex) {
  // If you already have backend/sql/schema.sql, run it
  const sqlPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    // run the whole schema
    await knex.raw(sql);
  } else {
    // fallback: create a minimal refresh_tokens table if schema.sql not found
    await knex.schema.createTable('refresh_tokens', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('users.id').onDelete('CASCADE');
      t.string('token').notNullable().unique();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('expires_at');
      t.boolean('revoked').defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  const sqlPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  if (fs.existsSync(sqlPath)) {
    // rollback isn't implemented for the whole schema file — keep simple:
    // drop refresh_tokens table only
    await knex.schema.dropTableIfExists('refresh_tokens');
  } else {
    await knex.schema.dropTableIfExists('refresh_tokens');
  }
};