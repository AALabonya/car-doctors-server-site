const express = require("express")
const cors = require("cors")
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware 

app.use(cors(
  {
    origin:["https://65414a07c1fce650af7d4c3a--papaya-sawine-ab0bca.netlify.app"],
    credentials:true
  }
))
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fgxmyrt.mongodb.net/?retryWrites=true&w=majority`
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middleware 
const logger = (req, res, next)=>{
  console.log("log info :", req.method, req.url);
  next()
}
 
const verifyToken = (req, res, next)=>{
  const token = req?.cookies?.token
  // console.log("token in the middleware", token);
  //jodi token na pai
  if(!token){
    return res.status(401).send({message: "unAuthorized access"})
  }
  jwt.verify(token, process.env.SECRET_KEY, (error, decode)=>{
    if(error){
      return res.status(401).send({message: "unAuthorized access"})
    }
    req.user = decode
    next()
  })

  
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //  client.connect();

    const serviceCollection = client.db("carDoctors").collection("service")
    const bookingCollection = client.db("carDoctors").collection("booking")
    
    //auth related api
    app.post("/jwt", async(req, res)=>{
      const user = req.body
      console.log("user for token", user);
      const token =jwt.sign(user, process.env.SECRET_KEY, {expiresIn:"10h"})
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({success:true})
    } )
//user logout ar jonno api create korbo
app.post("/logout", async(req, res)=>{
  const user = req.body
  console.log("user logout", user);
  res.clearCookie("token", {maxAge:0}).send({success:true})
})


    //services related api
    app.get("/service", async (req, res) => {
      const cursor = serviceCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    //   app.get("/serviceDetails/:id", async(req, res)=>{
    //     const id = req.params.id
    //     const query = {_id : new ObjectId(id)}
    //     const result = await serviceCollection.findOne(query)
    //     res.send(result)
    // })

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      // const options = {
      //     // Include only the `title` and `imdb` fields in the returned document
      //     projection: { title: 1, price: 1 ,service_id: 1, img: 1,}
      //   };
      const result = await serviceCollection.findOne(query)
      res.send(result)
    })

    //booking 
    app.get("/booking",logger, verifyToken,  async (req, res) => {
      console.log(req.query.email);
      console.log("here is cook cook cookies", req.user);
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: "forbidden access"})
      }
      let query = {}
      if (req.query?.email) {
        query = { email: req.query?.email }
      }
      const cursor = bookingCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })
 
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })

    app.patch("/booking/:id", async(req, res)=>{
      const id = req.params.id 
      const filter ={_id : new ObjectId(id)}
      const bookingUpdate = req.body
      console.log(bookingUpdate);
      const updateDoc = {
        $set: {
          status: bookingUpdate.status
        },
      }
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
     client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("This is my first car doctors full stack site")
})

app.listen(port, (req, res) => {
  console.log(`This is my PORT ${port}`);
})