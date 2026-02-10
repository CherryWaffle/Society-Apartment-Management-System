# Test Users Guide

Since this application uses Supabase Auth, there are **no default credentials**. You need to register users first.

## Quick Start - Creating Test Users

### Option 1: Register via Web/Mobile App (Recommended)

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the web frontend:**
   ```bash
   cd frontend-web
   npm run dev
   ```

3. **Open** `http://localhost:5173` in your browser

4. **Click "Register"** and create accounts with different roles:
   - **Super Admin**: Select role "Super Admin" during registration
   - **Board Member**: Select role "Board Member" during registration  
   - **Member**: Select role "Member" during registration (default)

### Option 2: Register via Mobile App

1. **Start the mobile app:**
   ```bash
   cd frontend-mobile
   npm start
   ```

2. **Open Expo Go** on your phone and scan the QR code

3. **Tap "Register"** and create a member account

## Recommended Test Users

Create these test accounts for testing different features:

### 1. Super Admin Account
- **Email**: `admin@society.com`
- **Password**: `Admin123!`
- **Full Name**: `Super Admin`
- **Phone**: `+1234567890`
- **Role**: `SUPER_ADMIN`

**Use this account to:**
- Create societies
- Assign board members to societies

### 2. Board Member Account
- **Email**: `oard@society.com`
- **Password**: `Board123!`
- **Full Name**: `Board Member`
- **Phone**: `+1234567891`
- **Role**: `BOARD_MEMBER`

**After creating:**
- Super Admin must assign this user to a society via Admin Dashboard
- Then this account can manage members, maintenance, visitors, notices, and complaints

### 3. Member Account
- **Email**: `member@society.com`
- **Password**: `Member123!`
- **Full Name**: `John Doe`
- **Phone**: `+1234567892`
- **Role**: `MEMBER`

**After creating:**
- Board Member must add this user to a society unit via Board Dashboard
- Then this account can view bills, request visitor passes, view notices, and raise complaints

## Testing Workflow

1. **Register Super Admin** → Login → Create a Society
2. **Register Board Member** → Super Admin assigns Board Member to Society
3. **Register Member** → Board Member adds Member to a Unit
4. **Login as Member** → View bills, request visitors, etc.

## Notes

- All passwords must be at least 6 characters long
- Email addresses must be valid format
- Users are created in Supabase Auth automatically
- User profiles are stored in the `user_profiles` table

## Troubleshooting

**Can't login after registration?**
- Check that the backend server is running
- Verify Supabase credentials in `backend/.env`
- Check browser console for errors

**Role not working?**
- Make sure you selected the correct role during registration
- For Board Members: They must be assigned to a society by Super Admin
- For Members: They must be added to a unit by Board Member
