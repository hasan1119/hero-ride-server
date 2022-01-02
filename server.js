// import modules
const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
const stripe = require("stripe")(
  "sk_test_51Jw18bENzfYAZQfTtWaJWHeXVEVU141LYZfr1USbD3AU5f58CSTaNoQuwLQ7YtzUlLTZpopFYYnz37zC9Tk6YB1r00c1OcMqmC"
);

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// port
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri =
  "mongodb+srv://Hasan1:hasan_1119@cluster0.fqtnc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("hero-rider-project");
    const user_collection = database.collection("user");
    const lession_collection = database.collection("lessons");
    const payment_collection = database.collection("payment");

    app.post("/joinRider", async (req, res) => {
      function imgProcessor(img) {
        const encodeImg = img?.data?.toString("base64");
        const imgBuffer = Buffer.from(encodeImg, "base64");
        return imgBuffer;
      }
      const riderInfo = req.body;
      riderInfo.profile = imgProcessor(req?.files?.profile);
      riderInfo.nid = imgProcessor(req?.files?.nid);
      riderInfo.license = imgProcessor(req?.files?.license);
      riderInfo.status = "Active";

      const result = await user_collection.insertOne(riderInfo);
      res.json(result.insertedId);
    });

    app.post("/joinLearner", async (req, res) => {
      function imgProcessor(img) {
        const encodeImg = img?.data?.toString("base64");
        const imgBuffer = Buffer.from(encodeImg, "base64");
        return imgBuffer;
      }
      const learnerInfo = req.body;
      learnerInfo.profile = imgProcessor(req?.files?.profile);
      learnerInfo.nid = imgProcessor(req?.files?.nid);
      learnerInfo.status = "Active";
      const result = await user_collection.insertOne(learnerInfo);
      res.json(result.insertedId);
    });

    app.get("/users", async (req, res) => {
      const result = await user_collection.find({}).toArray();
      const filteredData = result.filter((data) => data.usrType !== "admin");
      res.send(filteredData);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await user_collection.findOne({ email });
      res.json(result);
    });

    app.put("/changestatus", async (req, res) => {
      const id = req.body.id;
      const status = req.body.status;

      const result = await user_collection.updateOne(
        { _id: ObjectId(id) },
        {
          $set: { status },
        }
      );
      res.json(result.modifiedCount);
    });

    app.get("/lessions", async (req, res) => {
      const result = await lession_collection.find({}).toArray();
      res.json(result);
    });

    app.get("/lession/:id", async (req, res) => {
      const id = req.params.id;
      const result = await lession_collection.findOne({
        _id: ObjectId(id),
      });
      res.json(result);
    });

    app.post("/payment", async (req, res) => {
      const result = await payment_collection.insertOne(req.body);
      console.log(result);
      res.json(result.insertedId);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
