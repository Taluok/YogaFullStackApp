const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

//Middleware
app.use(cors())
app.use(express.json());

// Conexión a MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga-master.hbq1wck.mongodb.net/?appName=yoga-master`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        console.log("Conexión exitosa a MongoDB");

        const database = client.db("yoga-master");
        const userCollections = database.collection("user");
        const classesCollection = database.collection("classes");
        const cartCollection = database.collection("cart");
        const paymentCollection = database.collection("payment");
        const enrolledCollection = database.collection("enrolled");
        const appliendCollection = database.collection("appliend");

        // Ruta para crear una nueva clase
        app.post('/new-class', async (req, res) => {
            const newClass = req.body;
            try {
                const result = await classesCollection.insertOne(newClass);
                res.status(201).send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al insertar la clase' });
            }
        });

        // Ruta para obtener las clases aprobadas
        app.get('/classes', async (req, res) => {
            try {
                const query = { status: 'approved' };
                const result = await classesCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener las clases' });
            }
        });

        // Ruta para obtener clases por instructor
        app.get('/classes/:email', async (req, res) => {
            const email = req.params.email;
            const query = { instructorEmail: email };
            try {
                const result = await classesCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener las clases del instructor' });
            }
        });


        // Ruta raíz
        app.get('/', (req, res) => {
            res.send('Hello World!');
        });

        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });

    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
    }
}

run().catch(console.dir);


