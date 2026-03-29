// ----------------------------------------------------
// TODO: Replace these with your actual Supabase details!
// 1. Go to https://supabase.com and create a project.
// 2. Go to Project Settings -> API
// 3. Copy the Project URL and anon/public Key below.
// ----------------------------------------------------

const SUPABASE_URL = 'https://rybwjbrtjkzyknvdxpjy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5YndqYnJ0amt6eWtudmR4cGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzM1OTYsImV4cCI6MjA5MDI0OTU5Nn0.2oAwiBnT82vskcK7NpkUvdozAZD-qjZ4_3ZdKUpoyuk';

// Initialize the Supabase client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
