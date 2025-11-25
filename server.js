require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL en Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Ruta para recibir datos desde tu ESP32
app.post("/sensores", async (req, res) => {
  try {
    const { node, temperatura, vibracion, rpm, corriente, presion, humedad } = req.body;

    const query = `
      INSERT INTO sensores (temperatura, vibracion, rpm, corriente, presion, humedad)
      VALUES ($1,$2,$3,$4,$5,$6)
    `;
    const values = [temperatura, vibracion, rpm, corriente, presion, humedad];

    await pool.query(query, values);
    res.json({ ok: true, mensaje: "Datos guardados correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error guardando datos" });
  }
});

// Probar que el servidor funciona
app.get("/", (req, res) => {
  res.send("API funcionando correctamente");
});

app.listen(4000, () => console.log("Servidor corriendo en puerto 4000"));
