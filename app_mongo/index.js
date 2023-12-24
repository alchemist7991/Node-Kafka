const express = require('express');
const kafka = require('kafka-node');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());


const setupDone = async () => {
  mongoose.connect(process.env.MONGO_URL);
  const User = new mongoose.model('user', { 
    name: String,
    password: String,
    email: String
  });
  const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_PORT });
  const consumer = new kafka.Consumer(client, [{topic: process.env.KAFKA_TOPIC}], {autoCommit: false});
  consumer.on('message', async(message) => { 
    console.log('New message received' + JSON.stringify(message.value));
    const newUser = await new User(JSON.parse(message.value));
    await newUser.save();
  });

  consumer.on('error', (err) => {
    console.log(err);
  })
}
setTimeout(setupDone, 2000);


app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});
// Once you boot up all services with docker. There are no existing Topics to read from.
// Thus you can hit an api such that it will create the topic first and write some data into kafka
// Then you can make a small change in the code, since we have volume mounted and there is nodeMon so it will auto restart all the services
