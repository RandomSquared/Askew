-- Attendance System Database Setup
-- Run this in your Supabase SQL Editor to create the required tables

-- Create teachers table
CREATE TABLE teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    teacher_id TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Create classes table
CREATE TABLE classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_code TEXT UNIQUE NOT NULL,
    teacher_id TEXT NOT NULL,
    class_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- Create marking_sessions table
CREATE TABLE marking_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL,
    teacher_lat FLOAT,
    teacher_lng FLOAT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Create attendance_records table
CREATE TABLE attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL,
    session_id UUID NOT NULL,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (session_id) REFERENCES marking_sessions(id)
);

-- Create enrollments table to track students enrolled in classes
CREATE TABLE enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- Enable Realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE marking_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;

-- Disable RLS for MVP simplicity (enable with policies for production)
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE marking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;

-- Insert a test teacher account (you can change these values)
INSERT INTO teachers (name, teacher_id, password) 
VALUES ('Test Teacher', 'TEACHER001', 'password123');
