const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");

const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB ERROR ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
app.use(express.json());
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let getUserQuery = `select * from user where username = '${username}'`;
  let dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    let postQuery = `insert into user(username,name,password,gender,location)
        values(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )`;
    if (password.length <= 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    respond.status(400);
    response.send("User Already Exists");
  }
});

//API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUser = `select * from user where username = '${username}'`;
  const dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("user not Registered");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      const lengthOfPassword = newPassword.length;
      if (lengthOfPassword <= 5) {
        response.status(400);
        response.send("Password is too Short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        const updateQuery = `update user set(
                password = '${encryptedPassword}' where username = '${username}'
            )`;
        await db.run(updateQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
