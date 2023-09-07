const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
var admin = require("firebase-admin");

const port = process.env.PORT || 5002; // Set the port to listen on

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies
app.use(bodyParser.json());

// app.use(express.static("./cred"));

var serviceAccount = require("./cred/govt-pro.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

app.post("/user-signin", (req, res) => {
  const body = req.body;
  if (body.mobile_number == "" && body.password == "") {
    res.status(500).json({
      status: 500,
      message: "Please enter your mobile number and password",
    });
  } else if (body.mobile_number == "") {
    res
      .status(500)
      .json({ status: 500, message: "Please enter a mobile number" });
  } else if (body.password == "") {
    res.status(500).json({ status: 500, message: "Please enter a password" });
  } else {
    const collectionRef = db.collection("user_register");

    // Query to check if both fields exist
    const query = collectionRef
      .where("mobile_number", "==", body.mobile_number)
      .where("password", "==", body.password);

    query
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          res.status(500).json({
            status: res.status,
            message: "mobile number or password is incorrect",
          });
        } else {
          querySnapshot.forEach((docRef) => {
            // const data = {
            //   key1: docRef.id,
            // };

            // // Build the query string from the data object
            // const queryString = Object.keys(data)
            //   .map(
            //     (key) =>
            //       `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
            //   )
            //   .join("&");

            res.status(200).json({
              status: res.status,
              doc_id: docRef.id,
              message: "user detail correct",
            });
          });
          console.log("Fields exist in the documents");
          // Perform further operations if needed
        }
      })
      .catch((error) => {
        console.error("Error checking fields:", error);
      });
  }
});

app.post("/user-register", (req, res) => {
  const body = req.body;

  if (
    body.password !== "" &&
    body.mobile_number !== "" &&
    body.confirm_pass !== ""
  ) {
    const collectionRef = db.collection("user_register");
    const query = collectionRef.where(
      "mobile_number",
      "==",
      body.mobile_number
    );

    query.get().then((querySnapshot) => {
      if (querySnapshot.empty) {
        body.created_date = admin.firestore.Timestamp.now();
        db.collection("user_register")
          .add(body)
          .then((docRef) => {
            res.status(200).json({
              status: res.status,
              message: "user created",
              doc_id: docRef.id,
            });
          });
      } else {
        res.status(500).json({
          status: res.status,
          message: "Already Exist",
        });
      }
    });
  } else {
    res.status(401).json({
      status: res.status,
      message: "internal server error",
    });
  }
});

app.post("/postal-code", (req, res) => {
  const body = req.body;

  const collectionRef = db.collection("user_register");

  // Query to check if both fields exist
  const query = collectionRef.where("postal", "==", body.postal);

  query
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        res.status(500).json({
          status: res.status,
          message: "No data found for this postal code",
        });
      } else {
        querySnapshot.forEach((docRef) => {
          // const data = {
          //   key1: docRef.id,
          // };

          // // Build the query string from the data object
          // const queryString = Object.keys(data)
          //   .map(
          //     (key) =>
          //       `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
          //   )
          //   .join("&");

          res.status(200).json({
            status: res.status,
            doc_id: docRef.id,
            doorNo: docRef.data().door_no,
            street: docRef.data().street,
            village: docRef.data().village,
            district: docRef.data().district,
            state: docRef.data().state,
            country: docRef.data().country,
          });
        });
        console.log("Fields exist in the documents");
        // Perform further operations if needed
      }
    })
    .catch((error) => {
      console.error("Error checking fields:", error);
    });
});

app.post("/gpmis-post", (req, res) => {
  const body = req.body;
  if (body.title !== "") {
    const collectionRef = db.collection("gpmis_data");

    collectionRef.get().then((querySnapshot) => {
      if (querySnapshot.empty) {
        body.report_number = 1;
        body.created_date = new Date().toDateString();
        db.collection("gpmis_data")
          .add(body)
          .then((docRef) => {
            res.status(200).json({
              status: res.status,
              message: "data added",
              doc_id: docRef.id,
            });
          });
      } else {
        body.report_number = querySnapshot.size + 1;
        body.created_date = new Date().toDateString();
        db.collection("gpmis_data")
          .add(body)
          .then((docRef) => {
            res.status(200).json({
              status: res.status,
              message: "data added",
              doc_id: docRef.id,
            });
          });
      }
    });
  } else {
    res.status(500).json({
      status: res.status,
      message: "Title name is missing",
    });
  }
});

app.get("/gpmis-get", (req, res) => {
  const collectionRef = db.collection("gpmis_data"); // Replace with the name of your collection

  collectionRef
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        res.status(500).json({
          status: res.status,
          message: "No record found",
          doc_id: docRef.id,
        });
        console.log("No documents found in the collection.");
      } else {
        let full_data = [];
        snapshot.forEach((doc) => {
          console.log("Document data:", doc.id, doc.data());
          let data = doc.data();
          data.docId = doc.id;
          full_data.push(data);
        });
        res.status(200).json({
          status: res.status,
          message: "fetch all",
          data: full_data,
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching collection:", error);
    });
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
