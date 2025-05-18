const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Inicializar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();

// Configuración de CORS para permitir tu frontend y preflight
app.use(cors({
  origin: "https://menu-landing-frontend.vercel.app", // URL exacta de tu frontend
  methods: ["POST", "OPTIONS"], // Añade OPTIONS para preflight
  allowedHeaders: ["Content-Type"],
}));

// Middleware para manejar preflight
app.options("*", cors()); // Respuesta automática para OPTIONS

app.use(express.json());

// Configurar Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

// Ruta para agregar usuario
app.post("/addUser", async (req, res) => {
  const { nombre, email, telefono, captcha } = req.body;

  if (!captcha) {
    return res.status(400).json({ error: "Falta el CAPTCHA" });
  }

  // Verificar reCAPTCHA
  try {
    const captchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`;
    const fetch = await import("node-fetch");
    const response = await fetch.default(captchaVerifyUrl, { method: "POST" });
    const data = await response.json();

    if (!data.success) {
      return res.status(403).json({ error: "CAPTCHA inválido" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Error al validar CAPTCHA" });
  }

  // Guardar en Firestore y enviar email
  try {
    const docRef = await db.collection("usuarios").add({
      nombre,
      email,
      telefono,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
    });

    await transporter.sendMail({
      from: `"Menu Landing" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "¡Registro exitoso!",
      text: `Hola ${nombre}, gracias por registrarte.`,
    });

    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));