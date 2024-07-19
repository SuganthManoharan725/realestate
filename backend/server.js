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

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/real_estate', {
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
  cookie: { secure: false }
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
  // Handle the file upload
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred (e.g., file size limit exceeded)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('File must be an image and should be less than 80KB');
      }
      return res.status(500).send('Error uploading file');
    } else if (err) {
      // An unknown error occurred
      console.error('Error uploading file:', err);
      return res.status(500).send('Error uploading file');
    }

    // If no file was uploaded or size limit exceeded
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Proceed with saving the property details if upload is successful
    const { title, description, rate, sqft, beds, baths, rating, booking } = req.body;
    const image_path = req.file.filename;
    const status = 'available';

    const property = new Property({ title, description, rate, image_path, status, sqft, beds, baths, rating, booking});

    try {
      await property.save();
      res.redirect('/'); // Redirect to index.html after successful upload
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

      fs.unlink(filePath, async (err) => {
        if (err) {
          console.error('Error deleting image file:', err);
          return res.status(500).send('Error deleting property and image');
        }

        try {
          await Property.findByIdAndDelete(req.params.id);
          res.send('Property deleted successfully');
        } catch (err) {
          console.error('Error deleting property:', err);
          res.status(500).send('Error deleting property');
        }
      });
    } else {
      try {
        await Property.findByIdAndDelete(req.params.id);
        res.send('Property deleted successfully');
      } catch (err) {
        console.error('Error deleting property:', err);
        res.status(500).send('Error deleting property');
      }
    }
  } catch (err) {
    console.error('Error finding property:', err);
    res.status(500).send('Error deleting property');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
