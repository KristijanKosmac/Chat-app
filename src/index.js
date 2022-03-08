const path = require("path")
const http = require("http")
const express = require('express')
const socketio = require("socket.io")
const Filter = require('bad-words')
const { generateMessage } = require("./utils/messages")
const { generateLocationMessage } = require("./utils/location")
const { addUser, getUser, getUsersInRoom, removeUser} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public") 

app.use(express.json())
app.use(express.static(publicDirectoryPath))

// let count = 0
io.on('connection', (socket) => {
  console.log("New web soceket connection")

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, room, username })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)
    
    socket.emit("message", generateMessage(user.username, "Welcome"))
    // socket.broadcast.emit('message', generateMessage("a new user has joined!")) 
    socket.broadcast.to(user.room).emit('message', generateMessage(user.username ,`${user.username} has joined!`))
  
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter()
    const user = getUser(socket.id)

    if ( filter.isProfane(message) ) {
        return callback('Profanity is not allowed!')
    }

    io.to(user.room).emit("message", generateMessage(user.username, message))
    callback()
  })

  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id)
    // socket.broadcast.emit("message", `https://google.com/maps?q=${location.latitude},${location.longitude}`)
    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
    callback()
  })

  // socket.emit('countUpdated', count)

  // socket.on('increment', () => {
  //   count++
  //   // socket.emit("countUpdated", count)
  //   io.emit("countUpdated", count)
  // })

  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage(user.username, `${user.username} has left!`))
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log('Server is up on port ' + port)
})