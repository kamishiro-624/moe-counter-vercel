'use strict'

const mongoose = require('mongoose')

let schema = new mongoose.Schema({
  name: { type: String, required: true },
  num:  { type: Number, required: true }
}, { collection: 'tb_count', versionKey: false });

const mongodbURL = process.env.DB_URL
let up_sert = process.env.DB_UPSERT || false

if (!mongodbURL) throw new Error('未设置环境变量 DB_URL')
up_sert = up_sert === "true"

let isConnected = false

async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return
  }
  
  try {
    await mongoose.connect(mongodbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
    isConnected = true
    console.log("连接mongo数据库成功")
  } catch (error) {
    console.log("连接mongo数据库失败:" + error.message)
    throw error
  }
}

const Count = mongoose.models.Count || mongoose.model('Count', schema)

async function getNum(name) {
  await connectDB()
  return Count.findOne({ name }, '-_id -__v').exec()
}

async function getAll() {
  await connectDB()
  return Count.find({ }, '-_id -__v').exec()
}

async function setNum(name, num) {
  await connectDB()
  return Count.findOneAndUpdate({ name }, { name, num }, { upsert: true }).exec()
}

async function setNumMulti(counters) {
  await connectDB()

  const bulkOps = counters.map(obj => {
    const { name, num } = obj
    return {
      updateOne: {
        filter: { name },
        update: { $set: { name, num } },
        upsert: true
      }
    }
  })

  return Count.bulkWrite(bulkOps, { ordered : false })
}

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti
}