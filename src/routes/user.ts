import { Router } from 'express';
import sqlite3 from 'sqlite3';
import { exec } from 'child_process';
import lodash from 'lodash';

const router = Router();

// Tokens falsos con formatos exactos que Gitleaks detecta 100% por sus reglas regex (AWS y GitHub)
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const GITHUB_TOKEN = "ghp_1234567890abcdef1234567890abcdef1234";

// Inicializar SQLite en memoria
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE users (id INT, username TEXT, password TEXT)");
    db.run("INSERT INTO users VALUES (1, 'admin', 'supersecret123')");
    db.run("INSERT INTO users VALUES (2, 'john', 'password')");
});

// Endpoint 1: SQL Injection (SAST Target)
// Ejemplo de llamada: GET /users/search?username=admin' OR '1'='1
router.get('/search', (req, res) => {
    const username = req.query.username;
    // Construcción de consulta vulnerable concatenando strings
    const query = `SELECT * FROM users WHERE username = '${username}'`;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Endpoint 2: Command Injection (SAST Target)
// Ejemplo de llamada: GET /users/ping?host=127.0.0.1; cat /etc/passwd
router.get('/ping', (req, res) => {
    const host = req.query.host as string;
    // Ejecución de comandos vulnerable concatenando el input directamente
    exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).send(`Error: ${stderr}`);
            return;
        }
        res.send(`<pre>${stdout}</pre>`);
    });
});

// Endpoint 3: Dependencia vulnerable en uso (SCA Target)
// Usando una versión antigua de lodash (v4.17.15) que es vulnerable a prototype pollution
router.post('/merge', (req, res) => {
    const target = {};
    const source = req.body;

    // Lodash merge.Version con vulnerabilidad
    lodash.merge(target, source);
    res.json({ merged: target });
});

export default router;
