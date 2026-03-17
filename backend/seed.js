import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pi_sdr1',
    password: 'root',
    port: 5432,
});

const sql = fs.readFileSync('database.sql', 'utf8')
    .replace(/CREATE DATABASE pi_sdr1;/g, '')
    .replace(/\\c pi_sdr1/g, '');

pool.query(sql)
    .then(() => console.log('DB seeded successfully'))
    .catch((err) => console.error('Error seeding DB:', err))
    .finally(() => pool.end());
