const socket = io()

// socket.on('countUpdated', (count) => {
//   console.log("Count has been updated!", count)
// }) 

// Elements
const messageFormButton = document.querySelector('#sendMessage')
const messageFormInput = document.querySelector("#message")
const sendLocationButtom = document.querySelector("#send-location")
const messages = document.querySelector("#messages")
// const myLocation = document.querySelector("#location")


// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// document.querySelector('#increment').addEventListener('click', () => {
//   console.log("click")
//   socket.emit('increment')
// })

const autoscroll = () => {
  const newMessage = messages.lastElementChild
  
  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin

  const visibleHeight = messages.offsetHeight
  const containerHeight = messages.scrollHeight

  const scrollOffset = messages.scrollTop + visibleHeight

  if ( containerHeight - newMessageHeight >= scrollOffset ) {
    messages.scrollTop = messages.scrollHeight
  }
  console.log(scrollOffset)
}

socket.on("message", (message) => {
  console.log( message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  })
  messages.insertAdjacentHTML("beforeend", html)
  autoscroll()
})

socket.on("locationMessage", (locationMessage) => {
  const {username, url, createdAt} = locationMessage
  const html = Mustache.render(locationTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format("h:mm a")
  })

  messages.insertAdjacentHTML("beforeend", html)
  autoscroll()
})

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })

  document.querySelector("#sidebar").innerHTML = html
})

messageFormButton.addEventListener('click', () => {

  messageFormButton.setAttribute("disabled", "disabled")

  const message = document.getElementById("message").value
  socket.emit('sendMessage', message, ( error ) => {
    messageFormButton.removeAttribute("disabled")
    messageFormInput.value = ""
    messageFormInput.focus()

    if (error) {
      return console.log(error)
    } else {
      console.log("Message delivered!")
    }
  })
})

document.querySelector("#send-location").addEventListener('click', () => {
  if ( !navigator.geolocation ) {
    return alert("Geolocation is not supported by your browser")
  }
  
  sendLocationButtom.setAttribute("disabled", "disabled")
  navigator.geolocation.getCurrentPosition((position) => {

    const {latitude, longitude} = position.coords
    socket.emit('sendLocation', { 
      latitude,
      longitude 
    }, () => {
      console.log("Location shared")
      sendLocationButtom.removeAttribute("disabled")
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})