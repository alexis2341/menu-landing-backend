// Este archivo es el punto de entrada para el servidor Express que se conecta a Firestore
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

// Inicializar Firebase Admin SDK con las credenciales
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
const db = admin.firestore();

// Crear servidor Express
const app = express();
// Configurar middlewares
app.use(cors());
app.use(express.json()); // Middleware para parsear JSON

// Ruta para agregar un usuario a la base de datos
app.post("/addUser", async (req, res) => {
  const { nombre, email, telefono, captcha } = req.body;

  if (!captcha) {
    return res.status(400).json({ message: "Falta el CAPTCHA" });
  }

  // Verificar captcha con Google
  try {
    const captchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`;
    const fetch = await import("node-fetch");
    const response = await fetch.default(captchaVerifyUrl, { method: "POST" });
    const data = await response.json();

    if (!data.success) {
      return res.status(403).json({ message: "Fallo la verificación CAPTCHA" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error al verificar CAPTCHA" });
  }

  // Guardar en Firestore
  try {
    const docRef = await db.collection("usuarios").add({
      nombre,
      email,
      telefono,
    });

    res.status(200).send(`Usuario agregado con ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send("Error al agregar usuario: " + error.message);
  }
});


// Iniciar el servidor en el puerto 5000
const port = 5000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
