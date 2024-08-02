const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const stripe = require('stripe')(process.env.PAYMENT_SECRET);
const jwt = require('jwt');

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

        //routes for users
        app.post('/new-user', async (req, res) => {
            const newUser = req.body;
            const result = await userCollections.insertOne(newUser);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const result = await userCollections.find({}).toArray();
            res.send(result);
        });

        app.get('/users/:id', async (req, res) => {
            const id = reqparams.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollections.findOne(query);
            res.send(result);
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollections.findOne(query);
            res.send(result)
        });

        app.delete('/delete-user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id)}; 
            const result = await userCollections.deleteOne(query);
            res.send(result);
        });

        app.put('/update-user/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.option,
                    address: updatedUser.address,
                    about:updatedUser.about,
                    photoUrl: updatedUser.photoUrl,
                    skills: updatedUser.skills ? updatedUser.skills : null,

                }
            }

            const result = await userCollections.updateOne(filter, updateDoc, options);
            res.send(result);
        })

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
        app.get('/approved-classes', async (req, res) => {
            const query = { status: 'approved' };
            try {
                const result = await classesCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener las clases aprobadas' });
            }
        });

        // Obtener detalles de una sola clase
        app.get('/class/:id', async (req, res) => {
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

        // Informacion de cart con mail de usuario 
        app.get('/cart/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userMail: email };
            const projection = { classId: 1 };
            try {
                const carts = await cartCollection.find(query, { projection: projection }).toArray();
                const classIds = carts.map((cart) => new ObjectId(cart.classId));
                const query2 = { _id: { $in: classIds } };
                const result = await classesCollection.find(query2).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener la información del carrito' });
            }
        });

        // Eliminar item del carro
        app.delete('/delete-cart-item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { classId: id };
            try {
                const result = await cartCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al eliminar el item del carrito' });
            }
        });

        // Payment routes
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price) * 100;
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: "usd",
                    payment_method_types: ["card"],
                });
                res.send({
                    clientSecret: paymentIntent.clientSecret,
                });
            } catch (error) {
                res.status(500).send({ error: 'Error al crear el intento de pago' });
            }
        });

        // Post payment info to db
        app.post("/payment-info", async (req, res) => {
            const paymentInfo = req.body;
            const classesId = paymentInfo.classId;
            const userEmail = paymentInfo.userEmail; // Corrección aquí
            const signleClassId = req.query.classId;
            let query;
            if (signleClassId) {
                query = { classId: signleClassId, userMail: userEmail };
            } else {
                query = { classId: { $in: classesId } };
            }
            const classesQuery = { _id: { $in: classesId.map(id => new ObjectId(id)) } };
            try {
                const classes = await classesCollection.find(classesQuery).toArray();
                const newEnrolledData = {
                    userEmail: userEmail,
                    classId: classesId.map(id => new ObjectId(id)), // Corrección aquí
                    trasnsactionId: paymentInfo.trasnsactionId, // Corregido "trasnsactionId" a "transactionId"
                };
                const updateDoc = {
                    $set: {
                        totalEnrolled: classes.reduce((total, current) => total + current.totalEnrolled, 0) + 1 || 0,
                        availableSeats: classes.reduce((total, current) => total + current.availableSeats, 0) - 1 || 0,
                    }
                };
                const updatedResult = await classesCollection.updateMany(classesQuery, updateDoc, { upsert: true });
                const enrolledResult = await enrolledCollection.insertOne(newEnrolledData);
                const deletedResult = await cartCollection.deleteMany(query);
                const paymentResult = await paymentCollection.insertOne(paymentInfo);

                res.send({ paymentResult, deletedResult, enrolledResult, updatedResult });
            } catch (error) {
                res.status(500).send({ error: 'Error al procesar el pago' });
            }
        });

        // Obtener historial de pago
        app.get("/payment-history/:email", async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            try {
                const result = await paymentCollection.find(query).sort({ date: -1 }).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener el historial de pagos' });
            }
        });

        // Payment history length
        app.get("/payment-history-length/:email", async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            try {
                const total = await paymentCollection.countDocuments(query);
                res.send({ total });
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener la longitud del historial de pagos' });
            }
        });

        // Enrollment Routes
        app.get("/popular_classes", async (req, res) => {
            try {
                const result = await classesCollection.find().sort({ totalEnrolled: -1 }).limit(6).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener las clases populares' });
            }
        });

        app.get('/popular-instructors', async (req, res) => {
            const pipeline = [
                {
                    $group: {
                        _id: "$instructorEmail",
                        totalEnrolled: { $sum: "$totalEnrolled" }
                    }
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "_id",
                        foreignField: "email",
                        as: "instructor"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        instructor: { $arrayElemAt: ["$instructor", 0] },
                        totalEnrolled: 1
                    }
                },
                {
                    $sort: { totalEnrolled: -1 }
                },
                { $limit: 6 }
            ];
            try {
                const result = await classesCollection.aggregate(pipeline).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener los instructores populares' });
            }
        });

        //Admin Status
        app.get('/admin-status', async (req, res) => {
            const approvedClasses = (await classesCollection.find({ status: 'approved' })).toArray().length;
            const pendingClasses = (await classesCollection.find({ status: 'pending' })).toArray().length;
            const instructors = (await userCollections.find({ role: 'instructor' })).toArray().length;
            const totalClasses = (await classesCollection.find()).toArray().length;
            const totalEnrolled = (await enrolledCollection.find().toArray()).length;

            const result = {
                approvedClasses,
                pendingClasses,
                instructors,
                totalClasses,
                totalEnrolled
            }

            res.send(result)
        })

        //Get All Instructor
        app.get('/instructors', async (req, res) => {
            const result = await userCollections.find({ role: 'instructor' }).toArray();
            res.send(result);
        });

        // Ruta para obtener todos los instructores
        app.get('/instructors', async (req, res) => {
            try {
                const result = await userCollections.find({ role: 'instructor' }).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener los instructores' });
            }
        });

        // Ruta para obtener las clases inscritas por email
        app.get('/enrolled-classes/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const pipeline = [
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: "classes",
                        localField: "classId",
                        foreignField: "_id",
                        as: "classes"
                    }
                },
                {
                    $unwind: "$classes"
                },
                {
                    $lookup: {
                        from: "user",
                        localField: "classes.instructorEmail",
                        foreignField: "email",
                        as: "instructors"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        instructor: {
                            $arrayElemAt: ["$instructors", 0]
                        },
                        classes: 1
                    }
                }
            ];

            try {
                const result = await enrolledCollection.aggregate(pipeline).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: 'Error al obtener las clases inscritas' });
            }
        });

        //appliend for instructors
        app.post('/ass-instructor', async (req, res) => {

            const data = req.body;
            const result = await appliendCollection.insertOne(data);
            res.send(result);
        });

        app.get('/applied-instructors/:email', async (req, res) => {
            const email = req.params.email;
            const result = await appliedCollection.findOne({email});
            res.send(result);
        })

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

