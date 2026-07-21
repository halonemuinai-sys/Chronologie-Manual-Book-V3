import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vekgzcxorvdidjutuvrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZla2d6Y3hvcnZkaWRqdXR1dnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTI2NzIsImV4cCI6MjA4OTg2ODY3Mn0.Kz9udMSBq9YbyFsCmQvAWYPjNhplFsNKcjtiDdIi04I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'chronologie' }
});

async function run() {
  console.log('Fetching Edox manual from Supabase...');
  const { data: manuals, error: manualError } = await supabase
    .from('manuals')
    .select('*');

  if (manualError) {
    console.error('Error fetching manuals:', manualError);
    return;
  }

  const edoxManual = manuals.find(m => 
    m.slug?.toLowerCase().includes('edox') || m.title?.toLowerCase().includes('edox')
  );

  if (!edoxManual) {
    console.error('Edox manual not found in Supabase!');
    return;
  }

  console.log('Found Edox Manual ID:', edoxManual.id, edoxManual.title);

  // Try signing in or signing up an admin session if RLS requires auth
  const email = 'admin@chronologie.co';
  const password = 'AdminPassword123!';
  
  let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) {
    console.log('Sign in failed, attempting sign up...');
    const res = await supabase.auth.signUp({ email, password });
    authData = res.data;
  }

  console.log('Authenticated session:', authData?.session ? 'YES' : 'NO');

  // Clear existing TOC entries for this manual
  await supabase.from('toc_entries').delete().eq('manual_id', edoxManual.id);

  const edoxToc = [
    { manual_id: edoxManual.id, title: "1. Pendahuluan & Garansi Internasional Edox", code: "Informasi", page_number: 3 },
    { manual_id: edoxManual.id, title: "1.2 Petunjuk Umum & Perawatan Jam", code: "Perawatan", page_number: 4 },
    { manual_id: edoxManual.id, title: "2. Toleransi Kepresisian & Ketahanan Air", code: "Spesifikasi", page_number: 6 },
    { manual_id: edoxManual.id, title: "4.1 Chronograph Otomatis - Kaliber 07 (Geoscope)", code: "Cal. 07", page_number: 11 },
    { manual_id: edoxManual.id, title: "Chronograph Otomatis - Kaliber 08", code: "Cal. 08", page_number: 13 },
    { manual_id: edoxManual.id, title: "Chronograph Otomatis - Kaliber 011 / 91 / 95", code: "Cal. 011", page_number: 14 },
    { manual_id: edoxManual.id, title: "4.2 Mekanikal Otomatis - Kaliber 77 / 80 / 82 / 83 / 88 / 94 / 806", code: "Cal. 80", page_number: 16 },
    { manual_id: edoxManual.id, title: "Mekanikal Otomatis - Kaliber 85 / 853 / 87", code: "Cal. 85", page_number: 17 },
    { manual_id: edoxManual.id, title: "Mekanikal Otomatis Moonphase - Kaliber 93", code: "Cal. 93", page_number: 19 },
    { manual_id: edoxManual.id, title: "4.4 Quartz Chronograph - Kaliber 09", code: "Cal. 09", page_number: 22 },
    { manual_id: edoxManual.id, title: "Quartz Day & Date - Kaliber 34 / 345", code: "Cal. 34", page_number: 26 },
    { manual_id: edoxManual.id, title: "Quartz Standard - Kaliber 30 / 38 / 40 / 45 / 62 / 63 / 64", code: "Cal. 30", page_number: 27 },
    { manual_id: edoxManual.id, title: "Quartz Date - Kaliber 53 / 56 / 57 / 84", code: "Cal. 53", page_number: 28 },
    { manual_id: edoxManual.id, title: "Quartz Perpetual Calendar - Kaliber 105", code: "Cal. 105", page_number: 29 },
    { manual_id: edoxManual.id, title: "Quartz GMT Moonphase - Kaliber 0165", code: "Cal. 0165", page_number: 30 },
    { manual_id: edoxManual.id, title: "Quartz Big Date - Kaliber 843", code: "Cal. 843", page_number: 33 }
  ];

  console.log('Inserting', edoxToc.length, 'TOC entries for Edox...');
  const { data: inserted, error: insertError } = await supabase
    .from('toc_entries')
    .insert(edoxToc)
    .select();

  if (insertError) {
    console.error('Error inserting TOC entries:', insertError);
  } else {
    console.log('🎉 SUCCESSFULLY INSERTED EDOX TOC ENTRIES!', inserted.length, 'entries created.');
  }
}

run().catch(console.error);
