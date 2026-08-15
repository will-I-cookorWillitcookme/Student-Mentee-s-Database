# FirstLink Chat System - Implementation Guide

## Overview
The chat system has been fully integrated into the FirstLink mentoring platform, creating a modern messaging experience similar to popular chat applications like WhatsApp, Telegram, or Discord.

## What's Been Done

### 1. **HTML Pages Enhanced**

#### MentorsPage.html
- **New Features:**
  - Student search bar for filtering mentees
  - Current student name display in chat header
  - Online status indicator next to student name
  - Refresh button for manual message reload
  - Modern header with structured layout

#### mentees_message.html
- **New Features:**
  - Mentor name displayed dynamically in header
  - Online status indicator
  - Clean, mobile-responsive layout
  - Proper initialization of chat.js
  - Navigation bar with active states

### 2. **CSS Styling - Modern Messaging Platform Look**

#### mentorChat.css Enhancements:
- **Search Bar:** Rounded search input with focus effects
- **Student List:** 
  - Active student highlighting with left border indicator
  - Hover effects with smooth transitions
  - Scrollable list for many students
  - Left-aligned text for better readability
- **Message Bubbles:**
  - Mentor messages: Red/burgundy tint (left-aligned)
  - User messages: Light gray/white (right-aligned)
  - Hover effects for visual feedback
  - Smooth animations on message appearance
- **Input Area:**
  - Better padding and spacing
  - Rounded corners (8px) for modern look
  - Hover and focus states on buttons
  - Improved button styling

#### mentees_chat.css Enhancements:
- **Message Animations:** Smooth slide-in effect for new messages
- **Interactive Elements:** Hover states on buttons and chat
- **Status Indicators:** Visual online/offline status
- **Mobile Responsive:** Optimized for phones and tablets
- **Dark Theme:** Consistent with existing design

### 3. **JavaScript (chat.js) Improvements**

#### New Features:
1. **Timestamp Support:**
   - Relative time display (e.g., "5m ago", "2h ago")
   - Automatic formatting based on message age
   - Clean integration with message display

2. **Mentor Side (initMentorChat):**
   - Student search functionality
   - Active student highlighting
   - Current student name in header
   - Better error handling

3. **Mentee Side (initMenteeChat):**
   - Dynamic mentor name display
   - Online status indicator management
   - Better error handling and user feedback

4. **Enhanced Message Rendering:**
   - Timestamps under each message
   - Proper message classification (yours vs theirs)
   - Animation support for smooth appearance

### 4. **Backend Integration (chat_server.py)**

The chat server already includes:
- ✅ SQLite database for message storage
- ✅ API endpoints for:
  - `/api/mentees/<mentor_username>` - Get student list
  - `/api/mentors/<mentee_username>` - Get mentor assignments
  - `/api/messages` - Send and retrieve messages
- ✅ Timestamp recording for all messages
- ✅ Static file serving for the entire website

## How to Use

### Starting the Chat Server

1. **Open Terminal/Command Prompt**
2. **Navigate to the project root:**
   ```bash
   cd c:\Users\Daddy_Senpai\Documents\JSU\FirstLink
   ```

3. **Install Flask (if not already installed):**
   ```bash
   pip install flask
   ```

4. **Run the server:**
   ```bash
   python Python/chat_server.py
   ```

5. **Open browser:**
   ```
   http://127.0.0.1:5000/
   ```

### For Mentors
- Navigate to **Chat** section
- See all your assigned students in the left sidebar
- Use the search bar to find specific students
- Click on a student to view conversation history
- Type messages and hit Send or press Enter
- Click Refresh to manually reload messages

### For Mentees
- Navigate to **Messages** (from student dashboard)
- See your assigned mentor's name at the top
- View chat history with your mentor
- Type messages and send
- Messages appear immediately on send

## Important Configuration

### Login/Authentication
The chat system uses localStorage to get the logged-in user. Make sure your `Authetication.js` stores:

```javascript
localStorage.setItem("username", userUsername);
localStorage.setItem("role", "mentor"); // or "mentee"
```

If your authentication system stores this differently, update the `getCurrentUser()` function in `chat.js`:

```javascript
function getCurrentUser() {
  return {
    username: localStorage.getItem("username"), // Adjust key as needed
    role: localStorage.getItem("role"), // Adjust key as needed
  };
}
```

## Database

- **Location:** `Python/chat.db` (created automatically on first run)
- **Tables:**
  - `mentor_mentees` - Relationships between mentors and students
  - `messages` - All chat messages with timestamps

### Seeding Default Data
On first run, the database is populated with demo data:
- Mentor: `mentor1`
- Students: `John Doe`, `Sarah`, `Mike`

To add real mentor-mentee pairings, update the database or modify the seed section in `chat_server.py`.

## File Paths Summary

### HTML Pages
- [MentorsPage.html](Pages/Mentors/MentorsPage.html)
- [mentees_message.html](Pages/Mentees/mentees_message.html)

### CSS Stylesheets  
- [CSS/mentor/mentorChat.css](CSS/mentor/mentorChat.css)
- [CSS/mentees/mentees_chat.css](CSS/mentees/mentees_chat.css)

### JavaScript
- [Javascript/chat.js](Javascript/chat.js)

### Python Backend
- [Python/chat_server.py](Python/chat_server.py)

## Features Included

✅ **Modern Messaging Platform Design**
- Clean, intuitive interface
- Smooth animations and transitions
- Consistent dark theme

✅ **Mentor Features**
- View all assigned students
- Search/filter students
- Message history with each student
- Active student indicator
- Refresh messages manually

✅ **Mentee Features**
- Direct chat with assigned mentor
- See mentor name and status
- Message history
- Clean, mobile-friendly interface

✅ **Messaging Features**
- Send/receive messages
- Message timestamps (relative time)
- Auto-scroll to latest messages
- Enter to send support
- Manual refresh option

✅ **Responsive Design**
- Desktop: Full sidebar + chat layout
- Tablet: Optimized layout
- Mobile: Single column with navigation bar

## Future Enhancement Ideas

1. **Real-time Updates:** Add WebSocket support for instant message delivery
2. **Typing Indicators:** Show "User is typing..."
3. **Read Receipts:** Track when messages are read
4. **Message Reactions:** Add emoji reactions to messages
5. **File/Image Sharing:** Send attachments
6. **Notification System:** Toast alerts for new messages
7. **Online Status:** Show who's currently online
8. **Message Search:** Search through message history
9. **Archived Chats:** Archive conversations
10. **Message Forwarding:** Forward messages to other contacts

## Troubleshooting

### Messages Not Loading
- Check browser console for errors (F12)
- Verify username and role are in localStorage
- Ensure chat_server.py is running

### Can't Send Messages
- Verify mentor-mentee relationship exists in database
- Check chat_server.py console for error messages
- Ensure the input field is not empty

### Server Won't Start
- Make sure Flask is installed: `pip install flask`
- Check if port 5000 is already in use
- Run from the project root directory

### CSS Not Applying
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh the page (Ctrl+Shift+R)
- Check CSS file paths are correct

## Support & Questions

For issues with:
- **Authentication:** Check Authetication.js
- **Database:** Look at Python/chat.db or chat_server.py
- **Frontend:** Check browser console for JavaScript errors
- **Styling:** Verify CSS file imports in HTML heads

---

**Last Updated:** August 2026
**Version:** 1.0
