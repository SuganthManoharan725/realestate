const express = require('express');
const session = require('express-session');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const flash = require('connect-flash');
const path = require('path');
const crypto = require('crypto');
const Property = require('./models/property');
const passport = require('./config/passport'); // Import Passport configuration
const { isLoggedIn } = require('./middleware/auth');
require('dotenv').config();


const app = express();
const port = 5500;
const localhostUrl = process.env.LOCAL_HOST;
const mongoUri = process.env.MONGODB_URI;

// MongoDB connection
mongoose.connect(mongoUri , {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Session middleware configuration
const generateSessionSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const sessionSecret = generateSessionSecret();

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

// Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware to handle form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static file middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/admin/login', express.static(path.join(__dirname, '..', 'public', 'adminLogin')));

app.use(flash());

// Log requests
app.use((req, res, next) => {
  next();
});

//restart server automatically

app.use((req, res, next) => {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // Check if it's the maintenance window (2:30 AM UTC)
  if (hour === 2 && minute === 30) {
      return res.status(503).send('<h1>Website maintenance is ongoing. Please try again later.</h1>');
  }

  // If not in maintenance window, proceed to next middleware/route
  next();
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 80000 } // Limit file size to 80KB
}).single('image');


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

// Serve login page
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'adminLogin', 'login.html'));
});


// Admin dashboard route (protected)
app.get('/admin', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});


app.get('/admin/admin.html', (req, res) => {
  res.redirect('/admin/login'); // Always redirect to login page if accessed directly
});


// Fetch all properties
app.get('/properties', async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (err) {
    res.status(500).send('Error fetching properties');
  }
});

// Login route
app.post('/admin/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.session.destroy(() => {
        res.redirect('/admin/login');
      });
      return;
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      return res.redirect('/admin');
    });
  })(req, res, next);
});



 
// Route to handle file uploads and data
app.post('/admin/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(500).send('Error uploading file');
    }

    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const { title, description, rate, sqft, beds, baths, rating, booking } = req.body;
    const image_path = req.file.filename; // Save filename (or full path as needed) to MongoDB

    const property = new Property({ title, description, rate, image_path, sqft, beds, baths, rating, booking });

    try {
      await property.save();
      res.redirect('/'); // Redirect to admin dashboard after successful upload
    } catch (err) {
      console.error('Error saving property:', err);
      res.status(500).send('Error saving property');
    }
  });
});




// Route to handle PUT request for updating a property
app.put('/admin/update/:id', async (req, res) => {
  const id = req.params.id;
  const updatedProperty = req.body;

  try {
    const property = await Property.findByIdAndUpdate(id, updatedProperty, { new: true });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Route to handle DELETE request for deleting a property
app.delete('/admin/delete/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).send('Property not found');
    }

    const imagePath = property.image_path;
    if (imagePath) {
      const filePath = path.join(__dirname, 'uploads', imagePath);

      try {
        await fs.promises.unlink(filePath); // Delete image file from 'uploads' directory
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.error('File not found:', err.path);
        } else {
          console.error('Error deleting image file:', err);
          return res.status(500).send('Error deleting image file');
        }
      }
    }

    await Property.findByIdAndDelete(req.params.id); // Delete property from MongoDB
    res.send('Property deleted successfully');
  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).send('Error deleting property');
  }
});






// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on ${localhostUrl}`);
});
