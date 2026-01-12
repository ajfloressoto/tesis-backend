require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- CONEXIÓN POSTGRES ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ---------------- CREAR TABLA AUTOMÁTICAMENTE ----------------
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS sensores (
      id SERIAL PRIMARY KEY,
      temperatura DOUBLE PRECISION,
      vibracion DOUBLE PRECISION,
      rpm DOUBLE PRECISION,
      corriente DOUBLE PRECISION,
      presion DOUBLE PRECISION,
      humedad DOUBLE PRECISION,
      fecha TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Tabla 'sensores' lista");
  } catch (err) {
    console.error("❌ Error creando tabla:", err);
  }
};

createTable();

// ---------------- RUTA ESP32 ----------------
app.post("/sensores", async (req, res) => {
  try {
    const { temperatura, vibracion, rpm, corriente, presion, humedad } = req.body;

    const query = `
      INSERT INTO sensores
      (temperatura, vibracion, rpm, corriente, presion, humedad)
      VALUES ($1,$2,$3,$4,$5,$6)
    `;

    const values = [
      temperatura,
      vibracion,
      rpm,
      corriente,
      presion,
      humedad
    ];

    await pool.query(query, values);
    res.json({ ok: true, mensaje: "Datos guardados correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error guardando datos" });
  }
});

// ---------------- TEST SERVER ----------------
app.get("/", (req, res) => {
  res.send("API funcionando correctamente");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log("🚀 Servidor corriendo en puerto " + PORT)
);
