# FinanceFlow - Production Ready Financial Tracker

FinanceFlow is a full-stack personal finance management application built with React, Express, and MongoDB. It features a Neo-Brutalist design, robust authentication, and real-time financial tracking.

## 🚀 Phase 1: Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Motion, Recharts.
- **Backend**: Node.js, Express, JWT Authentication.
- **Database**: MongoDB (Atlas for production, Local/JSON fallback for dev).

---

## 🛠️ Phase 4: MongoDB Atlas Setup
To move from development to production, follow these steps to set up your database:

1. **Create Account**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Project & Cluster**: Create a new Project and a Free Shared Cluster (M0).
3. **Database User**: Create a database user (e.g., `finance_admin`) with a strong password. **Note the password.**
4. **Network Access**: Add `0.0.0.0/0` to your IP Access List (Whitelist) for global access, or add your specific IP for security.
5. **Connection String**: 
   - Click "Connect" -> "Drivers" -> Node.js.
   - Copy the connection string. It looks like: `mongodb+srv://<username>:<password>@cluster.xxxx.mongodb.net/?retryWrites=true&w=majority`
6. **Environment Variable**: Replace `<password>` with your user password and add it to your `.env` file (see below).

---

## 💻 Phase 5: Local VS Code Setup
After exporting the project, follow these steps:

1. **Open Project**: Open the folder in VS Code.
2. **Install Dependencies**: Run `npm install` in your terminal.
3. **Environment Variables**: Create a `.env` file in the root:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=choose_a_random_secure_string
   PORT=3000
   ```
4. **Run Application**:
   - **Development**: `npm run dev` (starts the Express server with Vite middleware).
   - **Production Build**: `npm run build` then `npm start`.
5. **Verify**: Open `http://localhost:3000`.

---

## 🐙 Phase 6: GitHub Operations
To push your project to a new repository:

```bash
git init
git add .
git commit -m "feat: Initial production release"
git branch -M main
git remote add origin https://github.com/yourusername/financeflow.git
git push -u origin main
```

---

## 🌐 Phase 7: Deployment (Vercel / Railway / Render)

### Backend (Node.js/Express)
1. **Choose Provider**: Railway or Render are recommended for Express servers.
2. **Connect Repo**: Select your GitHub repository.
3. **Set Variables**: Add `MONGODB_URI` and `JWT_SECRET` in the provider's dashboard.
4. **Build Command**: `npm run build`
5. **Start Command**: `npm start`

### Frontend (Optional Separate Hosting)
If you wish to host the frontend separately (e.g., Vercel), ensure you update the API base URL in `src/data/apiService.ts` to point to your deployed backend.

---

## 📋 Phase 8: Production Checklist
- [ ] Signup/Login flows verified.
- [ ] Transaction CRUD (Create, Edit, Delete) tested.
- [ ] Goal progress logic verified.
- [ ] Monthly budget calculations checked.
- [ ] Responsive design tested on Mobile & Desktop.
- [ ] MongoDB connection string secured in env variables.
- [ ] JWT tokens using HttpOnly cookies for security.

---

## 📂 Folder Structure
```
/
├── dist/                # Compiled production files
├── src/
│   ├── components/      # Reusable UI elements
│   ├── data/            # API services & types
│   ├── db/              # MongoDB connection & schemas
│   ├── pages/           # Main view components
│   ├── App.tsx          # Main routing & state
│   └── index.css        # Global styles & theme
├── server.ts            # Express backend entry point
├── package.json         # Dependencies & scripts
└── .env.example         # Template for environment variables
```
