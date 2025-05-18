// index.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
const nodemailer = require("nodemailer");

// Inicializar Firebase Admin SDK con las credenciales
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Configurar nodemailer con Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // Tu correo Gmail
    pass: process.env.MAIL_PASS, // Contraseña de aplicación
  },
});

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

  // Guardar en Firestore y enviar correo
  try {
    const docRef = await db.collection("usuarios").add({
      nombre,
      email,
      telefono,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Enviar email de confirmación
    const mailOptions = {
      from: `"Menu Landing" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "¡Registro exitoso!",
      text: `Hola ${nombre}, gracias por registrarte. Te contactaremos pronto.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send(`Usuario agregado con ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send("Error al agregar usuario o enviar correo: " + error.message);
  }
});

// Iniciar servidor
const port = 5000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
