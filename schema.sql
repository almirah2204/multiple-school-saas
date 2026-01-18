-- PostgreSQL schema for School Management SaaS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- schools
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- plans
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT,
  price_cents INT,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- students
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  roll_no TEXT,
  class_name TEXT,
  parent_contact JSONB,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- teachers
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  email TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- staff
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role_title TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- attendance
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  date DATE NOT NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- fees
CREATE TABLE IF NOT EXISTS fees (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE,
  status TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- timetable
CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  day TEXT,
  slot TEXT,
  subject TEXT,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- results
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT,
  marks NUMERIC,
  term TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- noticeboard
CREATE TABLE IF NOT EXISTS noticeboard (
  id SERIAL PRIMARY KEY,
  title TEXT,
  body TEXT,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- initial seed rows for plans (Free trial, Basic, Pro)
INSERT INTO plans (name, slug, price_cents, features, created_at)
VALUES
  ('Free Trial','free_trial',0,'{}',now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plans (name, slug, price_cents, features, created_at)
VALUES
  ('Basic','basic',9999,'{"max_students":500}',now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO plans (name, slug, price_cents, features, created_at)
VALUES
  ('Pro','pro',29999,'{"max_students":5000,"priority_support":true}',now())
ON CONFLICT (slug) DO NOTHING;