const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

// Inicializar Firebase Admin SDK con las credenciales
const serviceAccount = require(path.join(__dirname, "firebase-adminsdk.json"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
const db = admin.firestore();

// Crear servidor Express
const app = express();
app.use(express.json()); // Middleware para parsear JSON

// Ruta para agregar un usuario a la base de datos
app.post("/addUser", async (req, res) => {
  const { nombre, email } = req.body;

  try {
    const docRef = await db.collection("usuarios").add({
      nombre,
      email,
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
