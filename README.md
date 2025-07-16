# DriveOn – Smart Garage Platform
  A MERN-based platform that connects car owners with reputable maintenance and repair garages. DriveOn allows users to book appointments, request emergency roadside assistance, and helps garages manage services and increase customer visibility.
  **Tech Used**: MERN stack (MongoDB, Express.js, React.js, Node.js), Cloudinary API, OpenStreetMap, Gmail API, Redis, Distancematrix.ai, Socket.io, PayOS API, Firebase Cloud Messaging (FCM)

# Target Users:
- Car owners in Vietnam needing reliable vehicle service
- Garages looking to expand their customer base and streamline operations

# Key Features:
**For Car Owners**
- User Profile Management: Update personal and vehicle information
- Service History Tracking: View past repair and maintenance records
- Reminders: Receive service reminders for scheduled maintenance
- Garage Search & Booking: Find garages by distance, rating, availability and book appointments
- Emergency Roadside Assistance: Request quick rescue services in case of vehicle breakdown
- Favorites: Save preferred garages for faster future bookings
- Feedback & Ratings: Leave reviews after using garage services

**For Garages**
- Garage Profile Management: Update service offerings, images, location, contact details
- Staff Account Management: Create and manage multiple staff accounts
- Booking Management: View, confirm, or reject customer appointments
- Emergency Service Activation: Enable or disable emergency support offerings
- Promotional Upgrades: Upgrade to premium packages for better platform visibility

**For Admin**
- User & Garage Management: Monitor and approve garage accounts, manage user access
- System Configurations: Add car brands and service categories
- Transaction Monitoring: Track payments and service usage
- Dashboard Analytics: View system stats: users, garages, bookings

# Demo/Screenshots
- Production: https://drive-on-frontend.vercel.app
- Booking appointment with AI workflow demo: https://youtu.be/YmXF5PBdFTo?si=91_E4PV6j3WtqbVv
- Project demo: https://drive.google.com/file/d/1qslYEVJZIbCciN4ITRUfSGJ8vAhS7H49/view?usp=drive_link
- 
<img width="2363" height="2366" alt="image" src="https://github.com/user-attachments/assets/b9d93663-2789-4510-a024-cc2f124b4b40" />

# Installation Instructions:
  Video: https://drive.google.com/file/d/1p8RlaaNmGkLyvIGfjnkuHQYyksC--pxT/view?usp=drive_link
  
  **Installation instructions for the Application Server:**
  Step 1. Install necessary tools
  IDE/Text editor: Install a development tool (e.g., Visual Studio Code).
	  1. Visit the following URL to download: Download Visual Studio Code - Mac, Linux, Windows
	  2. Select the appropriate version for your operating system (Windows, Linux, or macOS).
    3. Wait for the download to complete. Once finished, run the installer and follow the on-screen instructions to complete the installation.
    
  Install Node.js
    1. Visit the following URL to download: Node.js — Download Node.js®
    2. Choose the appropriate version for your operating system (LTS recommended for stability).
    3. Once the download is complete, run the installer and follow the on-screen instructions to complete the installation.
    
  Install Git
    1. Visit the official Git website: Git - Downloads
    2. Select your operating system (Windows, macOS, or Linux).
    3. Download the installer and run it. Follow the installation instructions (default settings are recommended).
    4. After installation, open Terminal (macOS/Linux) or Git Bash / Command Prompt (Windows), and run the following command to verify the installation:
    git --version
    
  Install MongoDB and connect to MongoDB Atlas
    1. Visit Download MongoDB Community Server | MongoDB
    2. Select your operating system and click "Download."
    3. Run the installer and follow the on-screen instructions to complete the installation.
    4. Install MongoDB Compass from MongoDB Compass Download (GUI) | MongoDB
    5. After installation, open MongoDB Compass and use your Atlas connection string to connect to MongoDB Atlas.
    
  Step 2. Clone the back-end project repository
  	1. Open a terminal in Visual Studio Code
  	2. Navigate to the desired directory using:
    cd
  	3. Run the following command to clone the repository:
  	git clone https://github.com/nguyenanhtu37/DriveOn_Backend.git
   
  Step 3. Run the application server
  	1. Continue by changing into the cloned project directory:
  	cd <repository_folder>
  	2. Install the required dependencies:
  	npm install or npm i
    3. Create a .env file in the root directory and add necessary environment variables (included in source code)
  	4. Start the server using:
  	npm run dev
	After running the command, the application will be available in your browser at
	http://localhost:5000
 
  Step 4. Create a new repository on Github and deploy the application server (optional)
  To allow others to access your application without local setup, deploy it using Railway/Render. First, create a new GitHub repository and push your source code to it.
  Create a new repository on Github:
    1. Open GitHub and log in to your account.
    2. Create a new repository:
    On your GitHub homepage, click on the + sign in the top-right corner and select New repository.
    Name your repository (e.g., DriveOn_Backend)
    Add a description (optional).
    Set the repository to Public or Private (based on your preference).
    Do not initialize with a README, .gitignore, or License (since you already have these locally).
    Click Create repository.
    3. Delete the old .git folder (if any). This is necessary to remove the existing git history from the old repository:
    rm -rf .git
  	4. Initialize a new git repository: 
    git init
  	5. Add all the project files to the staging area: 
    git add .
  	6. Commit the changes with a message:
    git commit -m "Initial commit"
  	7. Add the new GitHub repository as the remote origin: 
    git remote add origin <new_repo_url>
    8. Push the local code to GitHub:
    git push -u origin master
    
  Deploy the application server:
    1. Create an account at Railway/Render and log in.
    2. Click New Project → Deploy from GitHub repo.
    3. Connect your GitHub account and select the project repository.
    4. Add environment variables in the Variables section (same values as in your local .env, included in source code).
    5. Railway/Render will automatically detect and install dependencies.
    6. Once deployed, Railway/Render will provide you with a public URL where your backend is accessible.

**Installation instruction for the Front-end Application:**
  Step 1. Clone the Frontend repository
  	1. Launch Visual Studio Code.
  	2. Open Terminal in Visual Studio Code: Terminal -> New Terminal
  	3. Navigate to the desired directory where you want the project files using:
  	cd
  	4. Clone the repository:
  	git clone https://github.com/nguyenanhtu37/DriveOn_Frontend.git
    5. Install dependencies:
    npm install or npm i
    6. Create a .env file in the root directory and add necessary environment variables (included in source code)
    
Step 2. Run the Front-end application
	Start the server using:
	npm run dev
	After running the command, the application will be available in your browser at
	http://localhost:5173
 
Step 3. Create a new repository on Github (optional)
To allow others to access your application without local setup, deploy it using Vercel. First, create a new GitHub repository and push your source code to it.
Create a new repository on Github:
  1. Open GitHub and log in to your account.
  2. Create a new repository:
  On your GitHub homepage, click on the + sign in the top-right corner and select New repository.
  Name your repository (e.g., DriveOn_Frontend)
  Add a description (optional).
  Set the repository to Public or Private (based on your preference).
  Do not initialize with a README, .gitignore, or License (since you already have these locally).
  Click Create repository.
  3. Delete the old .git folder (if any). This is necessary to remove the existing git history from the old repository:
  rm -rf .git
	4. Initialize a new git repository: 
  git init
	5. Add all the project files to the staging area: 
  git add .
	6. Commit the changes with a message:
  git commit -m "Initial commit"
	7. Add the new GitHub repository as the remote origin: 
  git remote add origin <new_repo_url>
  8. Push the local code to GitHub:
  git push -u origin master

Step 4. Deploy the Front-end Application using Vercel
	1. Visit Vercel
	2. Sign in or sign up (You can sign in with your GitHub account for easier integration).
	3. Import your GitHub project:
	Click "Add New" → "Project"
	Authorize Vercel to access your GitHub account if prompted.
	Select the repository you just pushed (e.g., DriveOn_Frontend)
	4. Configure project settings:
	In the framework preset, choose Vite depending on your project.
	5. Set environment variables:
  Click "Environment Variables" tab and add variables from your .env file (included in source code)
	6. Click "Deploy":
	Vercel will build and deploy your project automatically.
	After deployment, Vercel will provide a live link to your hosted frontend application.
 
Finally, update environment variables in both productions:
Update BACKEND_URL and FRONTEND_URL in both Vercel and Railway/Render, then click Re-deploy.

Good luck! 👍
