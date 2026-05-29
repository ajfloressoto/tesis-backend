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
      Temperatura DOUBLE PRECISION,
      Vibracion_Alta DOUBLE PRECISION,
      Vibracion_Baja DOUBLE PRECISION,
      Campo_Magnetico DOUBLE PRECISION,
      Microfono DOUBLE PRECISION,      
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
    // 1. CORREGIDO: Se cerró la llave '}' correctamente aquí
    const { Temperatura, Vibracion_Baja, Vibracion_Alta, Microfono, Campo_Magnetico } = req.body;

    // ---------------- GUARDAR EN TU BASE DE DATOS (POSTGRES) ----------------
    // 2. CORREGIDO: Se eliminó el '$6' sobrante
    const query = `
      INSERT INTO sensores
      (Temperatura, Vibracion_Baja, Vibracion_Alta, Microfono, Campo_Magnetico)
      VALUES ($1, $2, $3, $4, $5)
    `;

    const values = [
      Temperatura, 
      Vibracion_Baja, 
      Vibracion_Alta, 
      Microfono, 
      Campo_Magnetico
    ];

    await pool.query(query, values);
    console.log("💾 Datos guardados en Postgres");

    // ---------------- REENVÍO AUTOMÁTICO A DATACAKE ----------------
    // Usamos la URL que encontramos en el paso anterior guardada en el .env
    const datacakeUrl = process.env.DATACAKE_URL; 

    if (datacakeUrl) {
      // Creamos el JSON con los identificadores exactos que espera Datacake
      const datacakePayload = {
        TEMPERATURA: Temperatura,
        VIBRACION_BAJA: Vibracion_Baja,
        VIBRACION_ALTA: Vibracion_Alta,
        MICROFONO: Microfono,
        CAMPO_MAGNETICO: Campo_Magnetico
      };

      // Enviamos los datos a Datacake en segundo plano
      fetch(datacakeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datacakePayload)
      })
      .then(() => console.log("🚀 Datos replicados en Datacake con éxito"))
      .catch(err => console.error("❌ Error al enviar a Datacake:", err));
    } else {
      console.log("⚠️ Advertencia: No se encontró la DATACAKE_URL en el archivo .env");
    }

    // Responder al ESP32 que todo salió bien
    res.json({ ok: true, mensaje: "Datos guardados y replicados correctamente" });

  } catch (err) {
    console.error("❌ Error general en la ruta /sensores:", err);
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