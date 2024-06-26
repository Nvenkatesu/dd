const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const cors = require('cors')
const dbPath = path.join(__dirname, 'userData.db')
const app = express()
app.use(cors())
app.use(express.json())
let db = null

const initializingDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at hhtp://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}
initializingDBAndServer()
//API 1
app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const checkUser = `
    select * 
    from user 
    where username = '${username}';
  `
  const dbUser = await db.get(checkUser)

  if (dbUser === undefined) {
    if (password.length > 5) {
      const createDatabase = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
        );
     `

      await db.run(createDatabase)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//API 2
app.post('/login/', async (request, response) => {
  const {username, password} = request.body

  const checkUser = `
        select * 
        from user 
        where username = '${username}';
     `

  const dbUser = await db.get(checkUser)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API 3
app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  const checkUser = `
     select * 
     from user 
     where username = '${username}'
   `
  const dbUser = await db.get(checkUser)
  const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password)
  if (isPasswordMatch === true) {
    if (newPassword.length > 5) {
      const updatePasswordQuery = `
         update user 
         set 
           password = '${hashedPassword}'
      `
      await db.run(updatePasswordQuery)
      response.status(200)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
