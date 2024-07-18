const express = require('express');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

const app = express();
const port = 8082;

const uri = 'mongodb://localhost:27017'; 
const client = new MongoClient(uri);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

async function runMongoDBCommands() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('test');
    const users = db.collection('users');

    const nullUsers = await users.find({ username: null }).toArray();
    console.log('Documents with null usernames:', nullUsers);

    const result = await users.updateMany({ username: null }, { $set: { username: 'defaultUsername' } });
    console.log(`${result.matchedCount} documents matched, ${result.modifiedCount} documents updated`);

    await users.createIndex({ username: 1 }, { unique: true, partialFilterExpression: { username: { $exists: true, $ne: null } } });
    console.log('Created partial index on username');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await client.close();
  }
}

async function createUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB with Mongoose');

    const newUser = new User({ username: 'newUser', email: 'newuser@example.com' });
    await newUser.save();
    console.log('Inserted new user:', newUser);
  } catch (error) {
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.message);
    } else {
      console.error('An error occurred:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB with Mongoose');
  }
}

app.get('/', async (req, res) => {
  await runMongoDBCommands();
  await createUser();
  res.send('MongoDB commands executed. Check the console for details.');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
