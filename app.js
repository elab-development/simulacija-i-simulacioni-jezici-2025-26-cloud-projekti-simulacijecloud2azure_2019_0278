const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('<img src="https://www.shutterstock.com/image-photo/watercolor-illustration-little-prince-sitting-600nw-2648732357.jpg"></img>')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
