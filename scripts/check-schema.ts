import postgres from 'postgres';

const connectionString = 'postgresql://postgres:3812740@localhost:5432/word_search';

async function checkSchema() {
  const client = postgres(connectionString);
  
  try {
    const result = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'game_sessions';
    `;
    
    console.log('Структура таблицы game_sessions:');
    for (const row of result) {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    }
    
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

checkSchema();
