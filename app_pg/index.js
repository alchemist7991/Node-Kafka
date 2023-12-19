const express = require('express');
const kafka = require('kafka-node');
const sequelize = require('sequelize');
const app = express();

app.use(express.json());

const setupDone = async () => {
  const db = new sequelize(process.env.POSTGRES_URL);
  const User = db.define('user', {
    name: sequelize.STRING,
    password: sequelize.STRING,
    email: sequelize.STRING
  })
  db.sync({ force: true });

  const client = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_BOOTSTRAP_PORT});
  const producer = new kafka.Producer(client);
  producer.on('ready', async () => {
    app.post('/', async (req, res) => {
      producer.send([{ topic: process.env.KAFKA_TOPIC, messages: JSON.stringify(req.body)}], async (err, data) => {
        if (err) console.error(err);
        else {
          await User.create(req.body);
          res.send("New User Created");
        }
      });
    });
  });
}

setTimeout(setupDone, 10000);


app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});