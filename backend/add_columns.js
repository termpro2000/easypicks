const { pool } = require('./config/database');

async function addMissingColumns() {
  try {
    console.log('Checking and adding missing columns...');
    
    // 테이블 구조 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'miraekorea' AND TABLE_NAME = 'users'
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', existingColumns);
    
    // 필요한 컬럼들 확인 및 추가
    const requiredColumns = [
      { name: 'email', type: 'VARCHAR(255)', nullable: 'NULL' },
      { name: 'default_sender_address', type: 'TEXT', nullable: 'NULL' },
      { name: 'default_sender_detail_address', type: 'TEXT', nullable: 'NULL' },
      { name: 'default_sender_zipcode', type: 'VARCHAR(10)', nullable: 'NULL' }
    ];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding missing column: ${column.name}`);
        await pool.execute(`
          ALTER TABLE users 
          ADD COLUMN ${column.name} ${column.type} ${column.nullable}
        `);
        console.log(`✓ Added column: ${column.name}`);
      } else {
        console.log(`✓ Column already exists: ${column.name}`);
      }
    }
    
    console.log('✅ All required columns are now present');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
  } finally {
    process.exit();
  }
}

addMissingColumns();