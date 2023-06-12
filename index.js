const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000;
const cors = require('cors')
require('dotenv').config();
app.use(express.json())
app.use(cors());

// JWT
const verifyJWT=(req,res,next) =>{
  const authorization =req.headers.authorization;
  if(!authorization){
    return res.status(401).send({ error: true, message: 'not valid user'});
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.TOKEN_SECRET,(error,secure)=>{
    if (error){
      return res.status(401).send({error: true, message: 'not valid user'})
    }
    req.secure =secure;
    next();
  })
}


const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://<username>:<password>@cluster0.20dr11o.mongodb.net/?retryWrites=true&w=majority";

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.20dr11o.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const { ObjectId } = require('mongodb');

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const instructorCollection = client.db("sportsDB").collection("instructor");

    // class
    const classCollection = client.db("sportsDB").collection("classes");

    // Enrol
    const enrollCollection = client.db("sportsDB").collection("enroll");

    // User
    const userCollection = client.db("sportsDB").collection("user");

    // add
    const addCollection = client.db("sportsDB").collection("add");

    // JWT
    app.post('/jwt', (req, res) => {
      const user=req.body;
      const token =jwt.sign(user,process.env.TOKEN_SECRET);
      res.send({token});
    })
    const verifyAdmin= async(req,res,next)=>{
      const email =req.secure.email;
      const query ={ email: email }
      const user= await userCollection.findOne(query);
      if (user?.role!=='admin') {
        return res.status(404).send({ error: true, message: 'enter valid user' });
      }
      next();
    }
    app.get('/instructor', async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    })

    app.get('/classes', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    })
    // ....................
    // Get class
    app.get('/enroll', async (req, res) => {
      const email = req.query.email;
      console.log(email);
      if (!email) {
        res.send([]);
      }
      const query={email:email};
      const result = await enrollCollection.find(query).toArray();
      res.send(result);
    })

    // Post enroll
    app.post('/enroll', async (req, res) => {
      const enrollClass = req.body;
      // console.log(enrollClass);
      const result = await enrollCollection.insertOne(enrollClass);
      res.send(result)
    })

    // Get user
    app.get('/user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    app.get('/add', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    // post user
    app.post('/user', async (req, res) => {
      const userClass = req.body;
      console.log(userClass);
      const query ={email:userClass.email};
      const alreadyUser= await userCollection.findOne(query);
      if (alreadyUser){
        return res.send({message:'This user already have'})
      } 
      const result = await userCollection.insertOne(userClass);
      res.send(result);
    })
    // get  to do
    app.get('/user/admin/:email',verifyJWT,async (req,res)=>{
      const email=req.params.email;
      if (req.secure.email!= email) {
        res.send({admin:false})
      }
      const query ={email:email}
      const adminUSer = await userCollection.findOne(query);
      const result = { admin:adminUSer?.role === 'admin' }
      res.send(result);
    })

      //user admin patch
      app.patch('/user/admin/:id', async(req,res) =>{
        const id = req.params.id;
        console.log(id);
        const filter = {_id:new ObjectId(id)};
        const updateRole={
          $set:{
            role: 'admin'
          },
        };
        const result = await userCollection.updateOne(filter,updateRole);
        res.send(result);
      })
      //user instructor patch
      app.patch('/user/instructor/:id', async(req,res) =>{
        const id = req.params.id;
        console.log(id);
        const filter = {_id:new ObjectId(id)};
        const updateInstructor={
          $set:{
            role: 'instructor'
          },
        };
        const result = await userCollection.updateOne(filter,updateInstructor);
        res.send(result);
      })


    // Delete
    app.delete('/enroll/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await enrollCollection.deleteOne(query);
      res.send(result);
    })


    //.............................
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment.");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// /////////


app.get('/', (req, res) => {
  res.send("Project-12");
})

app.listen(port, () => {
  console.log(`port is: ${port}`)
})