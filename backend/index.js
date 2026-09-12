require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials are not set in .env");
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Smart Bus API is running' });
});

// Example route for fetching active buses
app.get('/api/buses', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
  const { data, error } = await supabase.from('buses').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Example route for fetching routes
app.get('/api/routes', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
  const { data, error } = await supabase.from('routes').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Example route for fetching boarding points
app.get('/api/boarding-points', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
  const { data, error } = await supabase.from('boarding_points').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
