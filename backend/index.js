const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

// Middleware
app.use(cors());
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

        // Manejar clases
        app.get('/classes-manage', async (req, res) => {
            try {
                const result = await classesCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener las clases' });
            }
        });

        // Actualizar estado y motivo de las clases
        app.patch('/change-status/:id', async (req, res) => {
            const id = req.params.id;
            const { status, reason } = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: status,
                    reason: reason,
                },
            };
            try {
                const result = await classesCollection.updateOne(filter, updateDoc, options);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al actualizar el estado de la clase' });
            }
        });

        // Obtener clases aprobadas
        app.get('/approved-classes', async (req, res) => {  // Añadido '/' al principio
            const query = { status: 'approved' };
            try {
                const result = await classesCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener las clases aprobadas' });
            }
        });

        // Obtener detalles de una sola clase
        app.get('/class/:id', async (req, res) => {  // Corregido '/class/id:' a '/class/:id'
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await classesCollection.findOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener los detalles de la clase' });
            }
        });

        // Actualizar detalles de la clase (todos los datos)
        app.put('/update-class/:id', async (req, res) => {
            const id = req.params.id;
            const updateClass = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updateClass.name,
                    description: updateClass.description,
                    price: updateClass.price,
                    availableSeats: parseInt(updateClass.availableSeats),
                    videoLink: updateClass.videoLink,
                    status: 'pending',
                },
            };
            try {
                const result = await classesCollection.updateOne(filter, updateDoc, options);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al actualizar los detalles de la clase' });
            }
        });

        // Cart Routes
        app.post('/add-to-cart', async (req, res) => {
            const newCartItem = req.body;
            try {
                const result = await cartCollection.insertOne(newCartItem);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al agregar al carrito' });
            }
        });

        // Obtener Cart Item con id
        app.get('/cart-item/:id', async (req, res) => {
            const id = req.params.id;
            const email = req.body.email;
            const query = {
                classId: id,
                userMail: email,
            };
            const projection = { classId: 1 };
            try {
                const result = await cartCollection.findOne(query, { projection: projection });
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener el item del carrito' });
            }
        });

        //informacion de cart con mail de usuario 
        app.get('/cart/:email',async (req, res) => {
            const email = req.params.email;
            const query = {userMail: email};
            const production= {classId: 1};
            const carts = await cartCollection.find(query, {production: production});
            const classIds = carts.map((cart) =>new ObjectId(cart.classId));
            const query2 = {_id: {$in: classIds}};
            const result = await classesCollection.find(query2).toArray();
            res.send(result);
        })

        //eliminar item del carro
        app.delete('/delete-cart-item/:id'), async (req, res) => {
            const id = req.params.id;
            const query = {classId: id};
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        }

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
