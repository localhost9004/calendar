
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchEvents() {
  try {
    const { data, error } = await supabase.from('events').select('*');
    if (error) {
      throw error;
    }
    fs.writeFileSync('events.json', JSON.stringify(data, null, 2));
    console.log('Successfully fetched and saved events to events.json');
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

fetchEvents();
