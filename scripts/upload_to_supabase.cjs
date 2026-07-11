const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Baca file .env secara manual
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('File .env tidak ditemukan!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Kredensial Supabase tidak ditemukan di file .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const docsDir = path.join(__dirname, '../public/assets/docs');
const bucketName = 'chronologie-manuals';

async function uploadAll() {
  try {
    if (!fs.existsSync(docsDir)) {
      console.error(`Direktori dokumen tidak ditemukan di: ${docsDir}`);
      process.exit(1);
    }

    const files = ['raymond-weil-manual-guide'];
    console.log(`Menyiapkan unggah ${files.length} file ke bucket '${bucketName}'...`);

    for (const file of files) {
      const filePath = path.join(docsDir, file);
      
      // Lewati jika merupakan direktori
      if (fs.statSync(filePath).isDirectory()) continue;

      const fileBuffer = fs.readFileSync(filePath);
      
      console.log(`Mengunggah: ${file}...`);
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(file, fileBuffer, {
          upsert: true,
          contentType: 'application/pdf'
        });

      if (error) {
        console.error(`Gagal mengunggah ${file}:`, error.message);
      } else {
        console.log(`✓ Berhasil mengunggah ${file}`);
      }
    }
    console.log('\nSeluruh proses unggah berkas selesai!');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  }
}

uploadAll();
