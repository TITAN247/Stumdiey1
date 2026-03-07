var express = require('express');
var router = express.Router();
const userModel=require("./users");
const Note = require('../models/Note');
const passport = require('passport');
const localStrategy=require("passport-local");
const { isValidPassword } = require('./users');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { tavily } = require('@tavily/core');

passport.use(new localStrategy(userModel.authenticate()));

// --- Tavily API Configuration ---
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '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';
const tavilyClient = tavily({ apiKey: TAVILY_API_KEY });

// --- OpenRouter.ai API Configuration ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const openrouter = axios.create({
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000', // Optional: Replace with your site URL
        'X-Title': 'STUMDieY', // Optional: Replace with your site name
        'Content-Type': 'application/json'
    }
});

// --- User Activity Tracking ---
const userActivityLog = [];
let totalUserLogins = 0;
const activeUserSessions = new Set();

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'profile_' + req.user._id + '_' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

// Multer setup for note file uploads
const noteStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/notes'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'note_' + req.user._id + '_' + Date.now() + ext);
  }
});
const noteUpload = multer({ 
  storage: noteStorage,
  fileFilter: function (req, file, cb) {
    // Allow PDF, DOC, DOCX, TXT files
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// get login page
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get("/main",isLoggedIn,function(req,res){
  res.render("main", { user: req.user });
});
router.get("/notes", isLoggedIn, (req, res) => {
  res.render("notes"); // assuming notes.ejs is in views folder
});
router.get("/pyq", isLoggedIn, (req, res) => {
  res.render("pyq"); // assuming pyqs is in views folder
});
router.get("/contact", isLoggedIn, (req, res) => {
  res.render("contact"); // assuming pyqs is in views folder
});
router.get("/bcaI", isLoggedIn, (req, res) => {
  res.render("bcaI"); // assuming pyqs is in views folder
});
router.get("/bcaII", isLoggedIn, (req, res) => {
  res.render("bcaII"); // assuming pyqs is in views folder
});
router.get("/bcaIII", isLoggedIn, (req, res) => {
  res.render("bcaIII"); // assuming pyqs is in views folder
});
router.get("/bcaIV", isLoggedIn, (req, res) => {
  res.render("bcaIV"); // assuming pyqs is in views folder
});
router.get("/bcaV", isLoggedIn, (req, res) => {
  res.render("bcaV"); // assuming pyqs is in views folder
});
router.get("/bcaVI", isLoggedIn, (req, res) => {
  res.render("bcaVI"); // assuming pyqs is in views folder
});
router.get('/profile', isLoggedIn, async function(req, res) {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.render('profile', { user: req.user, notes: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.render('profile', { user: req.user, notes: [] });
  }
});


router.post("/register",function(req,res){
  if (!isValidPassword(req.body.password)) {
    return res.render('index', { error: 'Password must be at least 8 characters long and contain at least one letter and one number.' });
  }
  var userdata=new userModel({
    username:req.body.username,
    email:req.body.email,
    fullName: req.body.fullName,
    phoneNumber: req.body.phoneNumber
  });
  userModel.register(userdata,req.body.password, function(err, registereduser) {
    if (err) {
      let msg = 'Registration failed.';
      if (err.name === 'UserExistsError') {
        msg = 'Username already exists.';
      } else if (err.message) {
        msg = err.message;
      }
      return res.render('index', { error: msg });
    }
    passport.authenticate("local")(req,res,function(){
      res.redirect("/main");
    });
  });
});
router.post("/login", passport.authenticate("local", {
  successRedirect: "/main",
  failureRedirect: "/"
}), function(req, res) {
  // This callback is not called due to passport.authenticate's options, so use a custom callback below if needed
});

// Custom login handler to track activity
router.post('/login-track', function(req, res, next) {
  const { username, password } = req.body;
  // Check for admin credentials first
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Remove user session if any
    req.logout(function() {
      req.session.isAdmin = true;
      return res.redirect('/admin');
    });
    return;
  }
  // Remove admin session if any
  req.session.isAdmin = false;
  // Otherwise, try user login
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      // Show error on index page
      return res.render('index', { error: 'Invalid credentials' });
    }
    req.logIn(user, async function(err) {
      if (err) { return next(err); }
      // Log activity
      userActivityLog.push({ username: user.username, time: new Date().toLocaleString() });
      if (!activeUserSessions.has(user._id.toString())) {
        totalUserLogins++;
        activeUserSessions.add(user._id.toString());
      }
      // Update prevLogin and lastLogin
      const currentUser = await userModel.findById(user._id);
      await userModel.findByIdAndUpdate(user._id, {
        prevLogin: currentUser.lastLogin || null,
        lastLogin: new Date()
      });
      return res.redirect('/main');
    });
  })(req, res, next);
});

// Profile picture upload route
router.post('/profile/upload', isLoggedIn, upload.single('profilePic'), async (req, res) => {
  if (req.file) {
    await userModel.findByIdAndUpdate(req.user._id, { profilePic: '/images/' + req.file.filename });
  }
  res.redirect('/profile');
});

// Contact form email sender
router.post('/contact', isLoggedIn, async (req, res) => {
  const { name, email, message } = req.body;
  // Configure your email transport (use your real credentials in production)
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'shivachaurasiya633@gmail.com', // use env var on render
      pass: process.env.EMAIL_PASS || 'ukpv hqmk hlbg okmk' // use app password env var on render
    }
  });
  const mailOptions = {
    from: 'email', // your Gmail
    to: 'shivansh0962@gmail.com', // your support/receiving email
    replyTo: email, // user's email
    subject: `Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };
  try {
    await transporter.sendMail(mailOptions);
    res.redirect('/main?contact_success=true');
  } catch (err) {
    res.redirect('/main?contact_error=true');
  }
});

// PDF download route
router.get('/download/pdf/:filename', isLoggedIn, async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../public/pdfs', filename);
  // Increment user's pdfDownloads
  await userModel.findByIdAndUpdate(req.user._id, { $inc: { pdfDownloads: 1 } });
  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Admin logout
router.get('/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  req.logout(function() {
    res.redirect('/');
  });
});

// User logout
router.get("/logout",function(req,res,next){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    req.session.isAdmin = false; // Remove admin session on user logout
    if (req.user && req.user._id) {
      activeUserSessions.delete(req.user._id.toString());
    }
    res.redirect('/');
  });
});
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
}
 res.redirect("/");
}

// --- Admin Auth Setup ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Overwrite this in production ENV!

// Middleware to check admin session
function isAdminLoggedIn(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

// Update admin dashboard to use activity data and show user count and all users
router.get('/admin', isAdminLoggedIn, async (req, res) => {
  const userCount = await userModel.countDocuments();
  const users = await userModel.find({}, 'username email _id');

  // Aggregate registrations by date
  const registrations = await userModel.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Prepare data for chart: daily and cumulative
  let dailyLabels = registrations.map(r => r._id);
  let dailyCounts = registrations.map(r => r.count);
  let cumulativeCounts = [];
  let total = 0;
  for (let c of dailyCounts) {
    total += c;
    cumulativeCounts.push(total);
  }

  // Aggregate users by role (default to 'User' if no role field)
  const roleAggregation = await userModel.aggregate([
    {
      $group: {
        _id: { $ifNull: ["$role", "User"] },
        count: { $sum: 1 }
      }
    }
  ]);
  const roleLabels = roleAggregation.map(r => r._id);
  const roleCounts = roleAggregation.map(r => r.count);

  res.render('admin_dashboard', {
    activity: userActivityLog,
    totalLogins: totalUserLogins,
    userCount,
    users,
    dailyLabels: JSON.stringify(dailyLabels),
    dailyCounts: JSON.stringify(dailyCounts),
    cumulativeCounts: JSON.stringify(cumulativeCounts),
    roleLabels,
    roleCounts
  });
});

// Delete user (admin only)
router.post('/admin/users/:id/delete', isAdminLoggedIn, async (req, res) => {
  await userModel.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

// ===== CHATBOT ROUTE =====
router.post('/chat', isLoggedIn, async (req, res) => {
    const userMessage = req.body.message;
    const currentUser = req.user;
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Fetch recent notes for activity context
    const recentNotes = await Note.find({ user: currentUser._id }).sort({ updatedAt: -1 }).limit(3);
    let noteSummary = "The user has not created or updated any notes recently.";
    if (recentNotes.length > 0) {
        noteSummary = "Here are the titles of their 3 most recently updated notes:\n" + recentNotes.map(note => `- "${note.title}"`).join('\n');
    }
    
    // Construct the detailed system prompt
    const systemPrompt = `You are a helpful assistant for the STUMDieY web app. Your name is Spidy. You should be friendly and helpful to students. Today's date is ${currentDate}.

You are currently assisting the following user:
- Username: ${currentUser.username}
- Email: ${currentUser.email}
- Last Login: ${currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : 'N/A'}
- PDF Downloads: ${currentUser.pdfDownloads || 0}

User's recent notes activity:
${noteSummary}

Use this information to provide personalized assistance. For example, you can greet the user by their name or mention their recent activity if relevant. You have access to a web search tool.`;

    const messages = [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": userMessage }
    ];

    const tools = [
        {
            "type": "function",
            "function": {
                "name": "tavily_search",
                "description": "Get information on recent events from the web.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": { "type": "string", "description": "The search query to use. For example: 'Latest news on AI'" }
                    },
                    "required": ["query"]
                }
            }
        }
    ];

    try {
        // First, let the model decide if it needs to use a tool
        let response = await openrouter.post('/chat/completions', {
            model: 'openai/gpt-4o',
            messages: messages,
            tools: tools,
            tool_choice: "auto",
            max_tokens: 1024
        });

        const responseMessage = response.data.choices[0].message;

        // Check if the model wants to call a tool
        if (responseMessage.tool_calls) {
            const toolCall = responseMessage.tool_calls[0];
            if (toolCall.function.name === 'tavily_search') {
                const searchArgs = JSON.parse(toolCall.function.arguments);
                const searchResults = await tavilyClient.search(searchArgs.query, { max_results: 5 });
                
                // Add the tool call and its result to the message history
                messages.push(responseMessage);
                messages.push({
                    "role": "tool",
                    "tool_call_id": toolCall.id,
                    "content": JSON.stringify(searchResults.results)
                });

                // Call the model again with the search results
                response = await openrouter.post('/chat/completions', {
                    model: 'openai/gpt-4o',
                    messages: messages,
                    max_tokens: 1024
                });
            }
        }
        
        const botResponse = response.data.choices[0].message.content;
        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error with API:', error.response ? error.response.data : error.message);
        res.status(500).json({ response: 'Sorry, I am having trouble connecting to my brain right now. Please try again later.' });
    }
});


// ===== PERSONAL NOTES ROUTES =====

// Get user's personal notes
router.get('/profile/notes', isLoggedIn, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.render('profile', { user: req.user, notes: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.render('profile', { user: req.user, notes: [], error: 'Failed to load notes' });
  }
});

// Create new note (GET)
router.get('/profile/notes/new', isLoggedIn, (req, res) => {
  res.render('note_form', { user: req.user, note: null, mode: 'create' });
});

// Create new note (POST)
router.post('/profile/notes', isLoggedIn, noteUpload.single('noteFile'), async (req, res) => {
  try {
    const { title, description, content, tags, isPublic } = req.body;
    
    const noteData = {
      title,
      description,
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic: isPublic === 'true',
      user: req.user._id
    };

    if (req.file) {
      noteData.filePath = '/notes/' + req.file.filename;
      noteData.fileName = req.file.originalname;
      noteData.fileType = req.file.mimetype;
      noteData.fileSize = req.file.size;
    }

    const note = new Note(noteData);
    await note.save();
    
    res.redirect('/profile/notes');
  } catch (error) {
    console.error('Error creating note:', error);
    res.render('note_form', { 
      user: req.user, 
      note: req.body, 
      mode: 'create', 
      error: 'Failed to create note. Please try again.' 
    });
  }
});

// Edit note (GET)
router.get('/profile/notes/:id/edit', isLoggedIn, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.redirect('/profile/notes');
    }
    res.render('note_form', { user: req.user, note: note, mode: 'edit' });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.redirect('/profile/notes');
  }
});

// Update note (POST)
router.post('/profile/notes/:id', isLoggedIn, noteUpload.single('noteFile'), async (req, res) => {
  try {
    const { title, description, content, tags, isPublic } = req.body;
    
    const updateData = {
      title,
      description,
      content,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic: isPublic === 'true'
    };

    if (req.file) {
      updateData.filePath = '/notes/' + req.file.filename;
      updateData.fileName = req.file.originalname;
      updateData.fileType = req.file.mimetype;
      updateData.fileSize = req.file.size;
    }

    await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );
    
    res.redirect('/profile/notes');
  } catch (error) {
    console.error('Error updating note:', error);
    res.render('note_form', { 
      user: req.user, 
      note: req.body, 
      mode: 'edit', 
      error: 'Failed to update note. Please try again.' 
    });
  }
});

// Delete note
router.post('/profile/notes/:id/delete', isLoggedIn, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (note && note.filePath) {
      // Delete the file from storage
      const fs = require('fs');
      const filePath = path.join(__dirname, '../public', note.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.redirect('/profile/notes');
  } catch (error) {
    console.error('Error deleting note:', error);
    res.redirect('/profile/notes');
  }
});

// Download note file
router.get('/profile/notes/:id/download', isLoggedIn, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note || !note.filePath) {
      return res.status(404).send('File not found');
    }
    
    const filePath = path.join(__dirname, '../public', note.filePath);
    res.download(filePath, note.fileName || 'note_file');
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(404).send('File not found');
  }
});

// Update personal info
router.post('/profile/info', isLoggedIn, async (req, res) => {
  try {
    const { fullName, bio, location } = req.body;
    await userModel.findByIdAndUpdate(req.user._id, { fullName, bio, location });
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.redirect('/profile'); // Or render an error message
  }
});

// Update mobile number
router.post('/profile/update-mobile', isLoggedIn, async (req, res) => {
  try {
    const { newPhoneNumber } = req.body;
    await userModel.findByIdAndUpdate(req.user._id, { phoneNumber: newPhoneNumber });
    res.redirect('/profile?success=mobile_updated');
  } catch (error) {
    console.error('Error updating mobile number:', error);
    res.redirect('/profile?error=mobile_update_failed');
  }
});

// Update email
router.post('/profile/update-email', isLoggedIn, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const existingUser = await userModel.findOne({ email: newEmail });
    if (existingUser && !existingUser._id.equals(req.user._id)) {
      return res.redirect('/profile?error=email_in_use');
    }
    await userModel.findByIdAndUpdate(req.user._id, { email: newEmail });
    res.redirect('/profile?success=email_updated');
  } catch (error) {
    console.error('Error updating email:', error);
    res.redirect('/profile?error=email_update_failed');
  }
});

// Change password
router.post('/profile/change-password', isLoggedIn, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.redirect('/profile?error=password_mismatch');
  }

  req.user.changePassword(currentPassword, newPassword, (err) => {
    if (err) {
      console.error('Error changing password:', err);
      // Passport-local-mongoose returns a 'IncorrectPasswordError' for wrong current password
      if (err.name === 'IncorrectPasswordError') {
        return res.redirect('/profile?error=current_password_incorrect');
      } else {
        return res.redirect('/profile?error=password_change_failed');
      }
    }
    res.redirect('/profile?success=password_changed');
  });
});


// Delete account
router.post('/profile/delete', isLoggedIn, async (req, res) => {
  try {
    // First, delete all notes associated with the user
    await Note.deleteMany({ user: req.user._id });

    // Then, delete the user
    await userModel.findByIdAndDelete(req.user._id);

    // Finally, log the user out
    req.logout(function(err) {
      if (err) {
        return res.status(500).send('Error logging out.');
      }
      res.sendStatus(200);
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).send('Failed to delete account.');
  }
});

router.get('/contact', function(req, res, next) {
  res.render('contact', { title: 'Express' });
});

router.get('/team', function(req, res, next) {
  res.render('team', { title: 'Express' });
});

router.get('/pyq', function(req, res, next) {
  res.render('pyq', { title: 'Express' });
});

module.exports = router;
