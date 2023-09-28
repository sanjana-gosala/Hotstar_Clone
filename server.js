var express = require('express');
const app = express();
var passwordHash = require("password-hash");
const bodyParser = require('body-parser')
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: false}));


app.use(express.static("public"));
const port = 8001;

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Filter} = require('firebase-admin/firestore');

var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
app.set("view engine", "ejs");

app.get("/", (req,res) => {
    res.render('home');
})

app.get("/signin", (req,res) => {
    res.render('signin');
})


// app.get("/signinsubmit", (req,res) => {
//     const email = req.query.email;
//     const password = req.query.password;

//     db.collection('personalData')
//         .where("email", "==", email )
//         .where("password", "==", password )
//         .get()
//         .then((docs) => {
//             if(docs.size>0){

//                 //query my database with all the users when login is successfull
//                 const usersData = [];
//                 db.collection('personalData')
//                   .get()
//                   .then((docs) =>{
//                        docs.forEach((doc) => {
//                           usersData.push(doc.data());
//                        });
//                   })
//                   .then(() =>{
//                     //console.log(usersData);
//                     res.render("dashboard" , {usersData:usersData});
                    
//                   })

                 
               
//             }
//             else{
//                 res.send("Login Failed");
//             }
//         });
//     });





    // app.post("/signupsubmit", function(req,res) {
    //     console.log(req.body);
    //     db.collection("personalData")
    //         .where(
    //             Filter.or(
    //                 Filter.where("email", "==", req.body.email),
    //                 Filter.where("user_name", "==", req.body.user_name)
    //             )
    //         )
    //         .get()
    //         .then((docs) => {
    //             if(docs.size > 0) {
    //                 res.send("Hey this account is already exits with email and username")
    //             } else{
    //                 db.collection("personalData")
    //                     .add({
    //                         user_name:req.body.user_name,
    //                         email:req.body.email,
    //                         password:passwordHash.generate(req.body.password),
    //                     })
    //                     .then(() => {
    //                         res.sendFile(__dirname + "/views/" + "signin");
    //                     })
    //                     .catch(() => {
    //                         res.send("Something Went Wrong")
    //                     });
    //             }
    //         });
    // });




    app.post("/signupsubmit", function(req, res) {
        console.log(req.body);
        db.collection("users")
            .where(
                Filter.or(
                    Filter.where("email", "==", req.body.email),
                    Filter.where("username", "==", req.body.username)
                )
            )
            .get()
            .then((docs) => {
                if (docs.size > 0) {
                    res.send("Hey, this account already exists with the email and username.");
                } else {
                    db.collection("users")
                        .add({
                            username: req.body.username,
                            email: req.body.email,
                            password: passwordHash.generate(req.body.password),
                        })
                        .then(() => {
                            // // Specify the correct file path to your "signin" page
                            // res.sendFile(__dirname + "/views/signin");

                            // const filePath = path.join(__dirname, "views", "signin");
                            // res.sendFile(filePath);
                            res.redirect("/signin");
                        })
                        .catch(() => {
                            res.send("Something Went Wrong");
                        });
                }
            });
    });

    app.post("/signinsubmit", (req, res) => {
        const email = req.body.email;
        const password = req.body.password;
        console.log(email)
        console.log(password)
      
        db.collection("users")
          .where("email", "==", email)
          .get()
          .then((docs) => {
            if (docs.empty) {
              res.send("User not found");
            } else {
              let verified = false;
              docs.forEach((doc) => {
                verified = passwordHash.verify(password, doc.data().password);
              });
              if (verified) {
                res.redirect('/dashboard');
              } else {
                res.send("Authentication failed");
              }
            }
          })
          .catch((error) => {
            console.error("Error querying Firestore:", error);
            res.send("Something went wrong.");
          });
      });




// app.get("/signupsubmit", (req, res) => {
//     const full_name = req.query.full_name;
//     const user_name = req.query.user_name;
//     const email = req.query.email;
//     const password = req.query.password;

//     // Adding new data to the collection
//     db.collection('personalData').add({
//         name: full_name + user_name,
//         email: email,
//         password: password,
//     })
//     .then(() => {
//         // res.send("sign up successfully");
//         res.render('signin');
        
        
//     })
//     // 
// });

app.get("/signup", (req, res) => {
    res.render('signup'); 
});
app.get("/movienamesearch", (req, res) => {
    const moviename = req.query.moviename;
    var movieData = []
  
    var url;
    if(moviename){
        url = "https://api.themoviedb.org/3/search/movie?api_key=690cef4345d32d355619a942d0af72b1&query="+moviename;
    }
    else{
      url="https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=690cef4345d32d355619a942d0af72b1";
    }
    
    request(url , function(error,response,body){
        var data = JSON.parse(body).results;
        if(data){
            showMovies(data);
            
            function showMovies(data) { 
                data.forEach(movie => {
                    movieData.push(movie);
                })
            }
            console.log(movieData);
            res.render('dashboard', {userData: movieData},);
  
        }
        else{
            console.log("not thier");
        }
    })
  })
  
  // Assuming you have userData defined somewhere in your Node.js code
  const userData = [];
  
  // Render the EJS template and pass userData to it
  app.get('/dashboard', (req, res) => {
    res.render('dashboard', { userData }); // Pass userData to the template
  });

app.get("/home", (req, res) => {
    res.render('home'); 
});

app.get("/dashboard", (req, res) => {
    res.render('dashboard'); 
});

app.get("/logout", (req, res) => {
    res.render('logout'); 
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
