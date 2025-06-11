-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (Supabase auth handles this, but we need a profiles table)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'parent', 'child')) DEFAULT 'child',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (family_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done', 'pending')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  is_family_task BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_logs table
CREATE TABLE IF NOT EXISTS task_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check and update overdue tasks
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS void AS $$
BEGIN
  UPDATE tasks 
  SET status = 'pending', updated_at = NOW() 
  WHERE status IN ('todo', 'in_progress') 
  AND due_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Families policies
CREATE POLICY "Users can view families they belong to" ON families FOR SELECT 
USING (id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create families" ON families FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Family admins can update families" ON families FOR UPDATE 
USING (id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Family admins can delete families" ON families FOR DELETE 
USING (id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Family members policies
CREATE POLICY "Users can view family members of their families" ON family_members FOR SELECT 
USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "Family admins can manage members" ON family_members FOR ALL 
USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('admin', 'parent')));

-- Tasks policies
CREATE POLICY "Users can view tasks they have access to" ON tasks FOR SELECT 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR 
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create tasks" ON tasks FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their tasks or family tasks" ON tasks FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR 
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their tasks or family admins can delete family tasks" ON tasks FOR DELETE 
USING (
  created_by = auth.uid() OR 
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('admin', 'parent'))
);

-- Task logs policies
CREATE POLICY "Users can view logs for accessible tasks" ON task_logs FOR SELECT 
USING (task_id IN (SELECT id FROM tasks WHERE 
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR 
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
));
